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

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()


class IngestValidateRequest(BaseModel):
    url: str
    userId: str


async def create_embeddings(db: Session, chat_id: str, content: str, tree: str):
    try:
        logger.info(f"Starting embedding creation for chat {chat_id}")
        chat = db.query(Chat).filter(Chat.id == chat_id).first()
        if not chat:
            logger.error(f"Chat {chat_id} not found")
            raise HTTPException(status_code=404, detail="Chat not found")

        logger.info("Splitting text into chunks...")
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len,
            separators=["\n\n", "\n", " ", ""],
        )
        chunks = text_splitter.split_text(content)
        logger.info(f"Created {len(chunks)} chunks")

        logger.info("Initializing OpenAI embeddings...")
        embeddings = OpenAIEmbeddings(
            model="text-embedding-3-large",
        )

        logger.info("Processing chunks and creating embeddings...")
        for i, chunk in enumerate(chunks):
            logger.info(f"Processing chunk {i+1}/{len(chunks)}")
            try:
                embedding_vector = await embeddings.aembed_query(chunk)
                embedding = Embedding(
                    id=str(uuid.uuid4()),
                    github_url=chat.github_url,
                    content=chunk,
                    embedding=json.dumps(embedding_vector),
                    chunk_metadata={
                        "chunk_index": i,
                        "total_chunks": len(chunks),
                    },
                )
                db.add(embedding)
                # Commit after each chunk to ensure partial progress is saved
                db.commit()
                logger.info(f"Saved embedding for chunk {i+1}")
            except Exception as chunk_error:
                logger.error(f"Error processing chunk {i+1}: {str(chunk_error)}")
                raise

        logger.info("Updating chat with file tree and status...")
        setattr(chat, "file_tree", json.loads(tree))
        setattr(chat, "indexing_status", "completed")
        db.commit()
        logger.info("Embedding creation completed successfully")
        return True
    except Exception as e:
        logger.error(f"Error in create_embeddings: {str(e)}")
        chat = db.query(Chat).filter(Chat.id == chat_id).first()
        if chat:
            setattr(chat, "indexing_status", "failed")
            db.commit()
        raise HTTPException(status_code=500, detail=str(e))


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
                status_code=400, detail="Repository either doesn't exist or is private"
            )

        clean_url = f"https://github.com/{match.group(1)}/{match.group(2)}"

        # Check if React app
        _, _, content = await asyncio.to_thread(
            ingest,
            clean_url,
            include_patterns=[
                "package.json",
            ],
        )

        if '"react":' not in content and "'react':" not in content:
            raise HTTPException(
                status_code=400,
                detail="Not a React app",
            )

        # Todo: Check for repo token count and if it's too large, return error
        # Todo: Check for monorepo too and only count frontend

        existing_repo = (
            db.query(Chat)
            .filter(Chat.github_url == clean_url, Chat.user_id == request.userId)
            .first()
        )

        id = existing_repo.id if existing_repo else str(uuid.uuid4().hex[:8])

        if not existing_repo:
            chat = Chat(
                id=id,
                github_url=clean_url,
                user_id=request.userId,
            )
            db.add(chat)
            db.commit()

        return {"message": f"/chat/{id}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/ingest/{chat_id}")
async def ingest_repo(
    chat_id: str, background_tasks: BackgroundTasks, db: Session = Depends(get_db)
):
    logger.info(f"Starting ingest for chat {chat_id}")
    chat = db.query(Chat).filter(Chat.id == chat_id).first()
    if not chat:
        logger.error(f"Chat {chat_id} not found")
        raise HTTPException(status_code=404, detail="Chat not found")

    existing_embeddings = (
        db.query(Embedding).filter(Embedding.github_url == chat.github_url).first()
    )
    if existing_embeddings:
        logger.info(f"Found existing embeddings for {chat.github_url}")
        _, tree, _ = await asyncio.to_thread(
            ingest,
            str(chat.github_url),
        )
        setattr(chat, "file_tree", json.loads(tree))
        setattr(chat, "indexing_status", "completed")
        db.commit()
        return {"status": "already_indexed"}

    logger.info("Setting indexing status to in_progress")
    setattr(chat, "indexing_status", "in_progress")
    db.commit()

    try:
        logger.info("Fetching repository content...")
        _, tree, content = await asyncio.to_thread(
            ingest,
            str(chat.github_url),
        )
        logger.info("Content fetched successfully")

        # Create a new session for the background task
        new_db = SessionLocal()

        async def background_task():
            try:
                await create_embeddings(new_db, chat_id, content, tree)
            except Exception as e:
                logger.error(f"Background task failed: {str(e)}")
            finally:
                new_db.close()

        background_tasks.add_task(background_task)
        logger.info("Background task started")

        return {"status": "indexing_started"}
    except Exception as e:
        logger.error(f"Error in ingest_repo: {str(e)}")
        setattr(chat, "indexing_status", "failed")
        db.commit()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/ingest/{chat_id}/status")
async def check_indexing_status(chat_id: str, db: Session = Depends(get_db)):
    chat = db.query(Chat).filter(Chat.id == chat_id).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")

    return {"status": chat.indexing_status}
