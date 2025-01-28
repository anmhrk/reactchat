from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from db.config import get_db
from db.models import Chat, Embedding, ChatMessage
import uuid
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
import json
import numpy as np
from typing import List, AsyncGenerator

router = APIRouter()


class UserRequestBody(BaseModel):
    user_id: str


class ChatMessageRequest(BaseModel):
    message: str
    model: str


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


def cosine_similarity(a: List[float], b: List[float]) -> float:
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))


# implement custom model later
@router.post("/chat/{chat_id}/message")
async def send_chat_message(
    chat_id: str, request: ChatMessageRequest, db: Session = Depends(get_db)
):
    chat = db.query(Chat).filter(Chat.id == chat_id).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")

    embeddings_record = (
        db.query(Embedding).filter(Embedding.github_url == chat.github_url).first()
    )
    if not embeddings_record:
        raise HTTPException(status_code=400, detail="Chat repository not indexed")

    embeddings = OpenAIEmbeddings(model="text-embedding-3-large")
    question_embedding = await embeddings.aembed_query(request.message)

    try:
        stored_embeddings = json.loads(getattr(embeddings_record, "embedding"))
        stored_chunks = json.loads(getattr(embeddings_record, "chunks"))

        if stored_embeddings is None or stored_chunks is None:
            raise HTTPException(
                status_code=500, detail="Missing embeddings or chunks data"
            )

        similarities = [
            cosine_similarity(question_embedding, chunk_embedding)
            for chunk_embedding in stored_embeddings
        ]

        top_k = 5
        top_indices = np.argsort(similarities)[-top_k:][::-1]
        context = "\n\n".join([stored_chunks[i] for i in top_indices])

        user_message = ChatMessage(
            id=str(uuid.uuid4()), chat_id=chat_id, message=request.message, role="user"
        )
        db.add(user_message)
        db.commit()

        system_prompt = """
        You are an expert React developer. You are helping other developers understand open sourceReact codebases. 
        Answer questions based on the provided code context. Be specific and reference relevant code when appropriate.
        If you're not sure about something, say so rather than making assumptions.
        """

        chat_model = ChatOpenAI(model="gpt-4o-mini", temperature=0, streaming=True)
        messages = [
            {"role": "system", "content": system_prompt},
            {
                "role": "user",
                "content": f"""Context from codebase: {context}
                Question: {request.message}

                Please provide a detailed answer based on the code context above.""",
            },
        ]

        async def stream_response_content() -> AsyncGenerator[str, None]:
            assistant_message_content = ""
            async for chunk in chat_model.astream(messages):
                content = chunk.content
                assistant_message_content += str(content)
                yield f"data: {json.dumps({'content': assistant_message_content})}\n\n"

            assistant_message = ChatMessage(
                id=str(uuid.uuid4()),
                chat_id=chat_id,
                message=str(assistant_message_content),
                role="assistant",
            )
            db.add(assistant_message)
            db.commit()

        return StreamingResponse(
            stream_response_content(), media_type="text/event-stream"
        )
    except Exception as e:
        print(f"Error: {str(e)}")
        raise HTTPException(status_code=500, detail="Streaming error")


@router.get("/chat/{chat_id}/fetch/messages")
async def get_chat_messages(chat_id: str, db: Session = Depends(get_db)):
    messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.chat_id == chat_id)
        .order_by(ChatMessage.created_at)
        .all()
    )
    return {
        "messages": [{"content": msg.message, "role": msg.role} for msg in messages]
    }
