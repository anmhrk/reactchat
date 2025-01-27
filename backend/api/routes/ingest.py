from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
import asyncio
from pydantic import BaseModel
from gitingest import ingest
import re
import requests
import uuid
from sqlalchemy.orm import Session
from db.config import get_db, SessionLocal
from db.models import Chat, Embedding
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
import json
import logging
import tiktoken
from threading import Lock

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
            include_patterns=[
                "package.json",
            ],
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

        # Rough estimate of token count
        encoding = tiktoken.get_encoding("cl100k_base")
        token_count = len(encoding.encode(content))
        if token_count > 300000:
            raise HTTPException(
                status_code=400,
                detail="Sorry, repository is too large (>300k tokens)",
            )

        existing_chat = (
            db.query(Chat)
            .filter(Chat.github_url == clean_url, Chat.user_id == request.userId)
            .first()
        )

        chat_id = existing_chat.id if existing_chat else str(uuid.uuid4().hex[:8])

        if not existing_chat:
            chat = Chat(
                id=chat_id,
                github_url=clean_url,
                is_public=False,
                user_id=request.userId,
                file_tree=tree,
                indexing_status="not_started",
            )
            db.add(chat)
            db.commit()

        return {"message": f"/chat/{chat_id}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


async def create_embeddings(db: Session, chat_id: str, content: str):
    try:
        logger.info(f"Starting embedding creation for chat {chat_id}")
        chat = db.query(Chat).filter(Chat.id == chat_id).first()
        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found")

        def tiktoken_len(text: str):
            encoding = tiktoken.get_encoding("cl100k_base")
            return len(encoding.encode(text))

        logger.info("Splitting text into chunks...")
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=8000,
            chunk_overlap=1600,
            length_function=tiktoken_len,
            separators=["\n\n", "\n", " ", ""],
        )
        chunks = text_splitter.split_text(content)
        logger.info(f"Created {len(chunks)} chunks")

        embeddings = OpenAIEmbeddings(
            model="text-embedding-3-large",
        )

        # Saves all embeddings in a list
        all_embeddings = list()
        logger.info("Processing chunks and creating embeddings...")
        for i, chunk in enumerate(chunks):
            logger.info(f"Processing chunk {i+1}/{len(chunks)}")
            try:
                embedding_vector = await embeddings.aembed_query(chunk)
                all_embeddings.append(embedding_vector)
                logger.info(f"Saved embedding for chunk {i+1}")
            except Exception as chunk_error:
                logger.error(f"Error processing chunk {i+1}: {str(chunk_error)}")
                raise

        embedding = Embedding(
            id=str(uuid.uuid4()),
            github_url=chat.github_url,
            chunks=json.dumps(chunks),
            embedding=json.dumps(all_embeddings),
        )
        db.add(embedding)
        setattr(chat, "indexing_status", "completed")
        db.commit()

        logger.info("Embeddings created successfully")
        return True
    except Exception as e:
        logger.error(f"Error in create_embeddings: {str(e)}")
        chat = db.query(Chat).filter(Chat.id == chat_id).first()
        if chat:
            setattr(chat, "indexing_status", "failed")
            db.commit()
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
        return {"status": "indexing_started"}

    try:
        chat = db.query(Chat).filter(Chat.id == chat_id).first()
        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found")

        existing_embeddings = (
            db.query(Embedding).filter(Embedding.github_url == chat.github_url).first()
        )
        if existing_embeddings:
            setattr(chat, "indexing_status", "completed")
            db.commit()
            return {"status": "completed"}

        setattr(chat, "indexing_status", "in_progress")
        db.commit()

        try:
            _, _, content = await asyncio.to_thread(
                ingest,
                str(chat.github_url),
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

    return {"status": chat.indexing_status}
