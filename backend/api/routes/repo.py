from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from db.models import Chat
from db.config import get_db
import os
import tempfile
from git import Repo
import shutil

router = APIRouter()


@router.get("/repo/{chat_id}")
async def get_repo(chat_id: str, user_id: str, db: Session = Depends(get_db)):
    chat = db.query(Chat).filter(Chat.id == chat_id, Chat.user_id == user_id).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")

    temp_dir = tempfile.mkdtemp()

    try:
        # Clone the repository and store it in temp_dir
        Repo.clone_from(str(chat.github_url), temp_dir)

        # Get all files recursively
        files = []
        for root, _, filenames in os.walk(temp_dir):
            for filename in filenames:
                full_path = os.path.join(root, filename)
                relative_path = os.path.relpath(full_path, temp_dir)

                # Skip .git directory, lock files, LICENSE, and common binary files
                if (
                    not relative_path.startswith(".git/")
                    and not relative_path.lower() == "license"
                    and not any(
                        relative_path.endswith(ext)
                        for ext in [
                            ".jpg",
                            ".png",
                            ".gif",
                            ".jpeg",
                            ".webp",
                            ".svg",
                            ".ico",
                            "package-lock.json",
                            "yarn.lock",
                            "pnpm-lock.yaml",
                            "bun.lock",
                            ".lock",
                        ]
                    )
                ):
                    try:
                        with open(full_path, "r") as f:
                            content = f.read()
                            files.append({"path": relative_path, "content": content})
                    except UnicodeDecodeError:
                        # Skip binary files
                        continue

        return {"files": files, "github_url": chat.github_url}

    finally:
        # Cleanup temp directory after all files are sent to client
        shutil.rmtree(temp_dir)
