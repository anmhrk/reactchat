from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
import asyncio
from pydantic import BaseModel
from gitingest import ingest
import re
import requests
import uuid
from sqlalchemy.orm import Session
from db.config import get_db, SessionLocal
from db.models import Chat
import logging
import tiktoken
from threading import Lock
from api.rag import create_embeddings
from db.pinecone import get_index
from typing import Dict, Any, cast

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

# Global lock to prevent multiple requests from being processed at the same time
indexing_locks = {}


class IngestValidateRequest(BaseModel):
    url: str
    userId: str


@router.post("/ingest/validate")
async def validate(request: IngestValidateRequest, db: Session = Depends(get_db)):
    try:
        chat = (
            db.query(Chat)
            .filter(Chat.github_url == request.url, Chat.user_id == request.userId)
            .first()
        )
        if chat:
            return {"message": f"/chat/{chat.id}"}

        # Validating request URL
        pattern = r"^(?:https://)?github\.com/([a-zA-Z0-9-]+)/([a-zA-Z0-9-._]+)"
        match = re.match(pattern, request.url)
        if not match:
            raise HTTPException(status_code=400, detail="Invalid GitHub repository URL")

        # Check if repo is public
        api_url = f"https://api.github.com/repos/{match.group(1)}/{match.group(2)}"
        response = requests.get(api_url)
        if response.status_code == 404:
            raise HTTPException(
                status_code=400, detail="Repository doesn't exist or is private"
            )

        clean_url = f"https://github.com/{match.group(1)}/{match.group(2)}"

        # First check if React app through package.json
        _, _, package_content = await asyncio.to_thread(
            ingest,
            clean_url,
            include_patterns=["package.json", "README.md"],
        )

        if '"react":' not in package_content and "'react':" not in package_content:
            raise HTTPException(
                status_code=400,
                detail="Not a React app",
            )

        # Now get the full repo content and file tree and check if token count is too high
        _, tree, content = await asyncio.to_thread(
            ingest,
            clean_url,
        )

        encoding = tiktoken.get_encoding("cl100k_base")
        token_count = len(encoding.encode(content))
        # 100k tokens limit for entire repo but adjust as needed
        if token_count > 100000:
            raise HTTPException(
                status_code=400,
                detail="Sorry, repository is too large (>100k tokens)",
            )

        existing_chat = (
            db.query(Chat)
            .filter(Chat.github_url == clean_url, Chat.user_id == request.userId)
            .first()
        )

        chat_id = existing_chat.id if existing_chat else str(uuid.uuid4().hex[:8])
        repo_info = tree + package_content

        if not existing_chat:
            chat = Chat(
                id=chat_id,
                github_url=clean_url,
                user_id=request.userId,
                repo_info=repo_info,
            )
            db.add(chat)
            db.commit()

        return {"message": f"/chat/{chat_id}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/ingest/{chat_id}")
async def ingest_repo(
    chat_id: str, background_tasks: BackgroundTasks, db: Session = Depends(get_db)
):
    # Get or create lock for this chat_id
    if chat_id not in indexing_locks:
        indexing_locks[chat_id] = Lock()

    # Try to acquire lock, return if already locked
    if not indexing_locks[chat_id].acquire(blocking=False):
        return {"status": "in_progress"}

    try:
        chat = db.query(Chat).filter(Chat.id == chat_id).first()
        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found")

        # Check if vectors already exist in Pinecone
        index = get_index()
        existing_vectors = await asyncio.to_thread(
            index.query,
            vector=[0.0] * 3072,
            filter={"github_url": str(chat.github_url)},
            top_k=1,
        )

        existing_vectors = cast(Dict[str, Any], existing_vectors)

        if existing_vectors["matches"]:
            setattr(chat, "indexing_status", "completed")
            db.commit()
            return {"status": "completed"}

        setattr(chat, "indexing_status", "in_progress")
        db.commit()

        skip_files = [
            "yarn.lock",
            "bun.lockb",
            "package-lock.json",
            "pnpm-lock.yaml",
            ".gitignore",
            ".env*",
            "tsconfig.json",
            "prettier.config.js",
            "postcss.config.js",
            "next.config.js",
            ".eslintrc",
            "tailwind.config",
        ]

        try:
            _, _, content = await asyncio.to_thread(
                ingest,
                str(chat.github_url),
                exclude_patterns=skip_files,
            )

            # Create a new session for the background task
            new_db = SessionLocal()

            async def background_task():
                try:
                    await create_embeddings(new_db, chat_id, content)
                except Exception as e:
                    logger.error(f"Background task failed: {str(e)}")
                    setattr(chat, "indexing_status", "failed")
                    db.commit()
                finally:
                    new_db.close()

            background_tasks.add_task(background_task)
            return {"status": "in_progress"}
        except Exception as e:
            logger.error(f"Error in ingest_repo: {str(e)}")
            setattr(chat, "indexing_status", "failed")
            db.commit()
            raise HTTPException(status_code=500, detail=str(e))
    finally:
        indexing_locks[chat_id].release()


@router.get("/ingest/{chat_id}/status")
async def check_indexing_status(chat_id: str, db: Session = Depends(get_db)):
    chat = db.query(Chat).filter(Chat.id == chat_id).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")

    progress = 0
    if str(chat.indexing_status) == "in_progress" and chat.total_chunks is not None:
        progress = (chat.indexed_chunks / chat.total_chunks) * 100

    return {"status": chat.indexing_status, "progress": progress}
