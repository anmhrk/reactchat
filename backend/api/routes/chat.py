from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from db.config import get_db
from db.models import Chat

router = APIRouter()


class ValidateRequest(BaseModel):
    user_id: str


@router.post("/chat/validate/{chat_id}")
async def chat(chat_id: str, request: ValidateRequest, db: Session = Depends(get_db)):
    chat = db.query(Chat).filter(Chat.id == chat_id).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    if str(chat.user_id) != str(request.user_id):
        raise HTTPException(status_code=403, detail="Forbidden")

    return {"message": "Chat validated", "status": 200}
