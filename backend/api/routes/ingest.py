from fastapi import APIRouter, HTTPException, Depends
import asyncio
from pydantic import BaseModel
from gitingest import ingest
import re
import requests
import uuid
from sqlalchemy.orm import Session
from db.config import get_db
from db.models import Chat


router = APIRouter()


class IngestRequest(BaseModel):
    url: str
    userId: str


@router.post("/ingest/validate")
async def validate(request: IngestRequest, db: Session = Depends(get_db)):
    try:
        # Validating request URL
        pattern = r"^https://github\.com/([a-zA-Z0-9-]+)/([a-zA-Z0-9-._]+)"
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


@router.post("/ingest")
async def ingest_repo(request: IngestRequest, db: Session = Depends(get_db)):
    pass
