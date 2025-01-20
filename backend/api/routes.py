from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class GithubUrl(BaseModel):
    url: str


@router.post("/ingest")
async def ingest(request: GithubUrl):
    try:
        return {"message": "Server reached", "url": request.url}
    except Exception as e:
        return {"message": str(e)}
