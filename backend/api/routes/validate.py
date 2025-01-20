from fastapi import APIRouter, HTTPException
import asyncio
from pydantic import BaseModel
from gitingest import ingest
import re
import requests


router = APIRouter()


class GithubUrl(BaseModel):
    url: str


@router.post("/validate")
async def validate(request: GithubUrl):
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

        return {"message": f"/repo/{match.group(1)}/{match.group(2)}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
