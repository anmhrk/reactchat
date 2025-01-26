from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from db.config import get_db
from db.models import Chat

router = APIRouter()


class UserRequestBody(BaseModel):
    user_id: str


class ChatMessageRequest(BaseModel):
    message: str


@router.post("/chat/recents")
async def get_recents(request: UserRequestBody, db: Session = Depends(get_db)):
    chats = db.query(Chat).filter(Chat.user_id == request.user_id).all()
    return {
        "chats": [
            {
                "id": chat.id,
                "github_url": chat.github_url,
                "created_at": chat.created_at,
            }
            for chat in chats
        ]
    }


@router.post("/chat/{chat_id}/validate")
async def validate_chat(
    chat_id: str, request: UserRequestBody, db: Session = Depends(get_db)
):
    chat = db.query(Chat).filter(Chat.id == chat_id).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    if str(chat.user_id) != str(request.user_id):
        raise HTTPException(status_code=403, detail="Forbidden")

    return {"message": "Chat validated", "status": 200}


@router.post("/chat/{chat_id}/message")
async def send_chat_message(
    chat_id: str, request: ChatMessageRequest, db: Session = Depends(get_db)
):
    pass
