from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from db.config import get_db
from db.models import Chat, Embedding, ChatMessage
import uuid
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_anthropic import ChatAnthropic
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

        def cosine_similarity(a: List[float], b: List[float]) -> float:
            return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

        similarities = [
            cosine_similarity(question_embedding, chunk_embedding)
            for chunk_embedding in stored_embeddings
        ]

        top_k = 3
        top_indices = np.argsort(similarities)[-top_k:][::-1]

        similarity_threshold = 0.1
        relevant_chunks = []

        for i in top_indices:
            if similarities[i] >= similarity_threshold:
                chunk = stored_chunks[i]
                if len(chunk) > 500:
                    chunk = chunk[:500] + "..."
                relevant_chunks.append(chunk)

        context = "\n---\n".join(relevant_chunks)
        max_context_length = 4000
        if len(context) > max_context_length:
            context = context[:max_context_length] + "..."

        print(f"Context length: {len(context)}")

        user_message = ChatMessage(
            id=str(uuid.uuid4()), chat_id=chat_id, message=request.message, role="user"
        )
        db.add(user_message)
        db.commit()

        system_prompt = """
        You are an expert React developer helping other developers understand open source React codebases. 
        
        When answering questions:
        1. For specific code questions: Provide detailed answers based on the code.
        2. For high-level questions: Synthesize information from the code to provide comprehensive overviews.
        3. For architectural questions: Explain patterns and structures you can identify.
        4. If you can't see enough context: Ask the user to be more specific while sharing what you do know.

        Important: You can make reasonable inferences about the codebase structure and patterns based on 
        the code you see. When doing so, clearly indicate what is directly observed versus what is inferred.

        If the user's question is completely unrelated to development or the codebase (like weather, general knowledge, etc), 
        respond with: "I'm sorry, I can only help with questions about the codebase."
        Thank you and similar phrases are valid and you should respond appropriately.

        Keep responses clear and well-structured, but don't be overly restrictive in your interpretations.
        Never mention "available code context" or "codebase context", "filetree" or anything along those lines in your response.
        """

        if "claude" in request.model.lower():
            chat_model = ChatAnthropic(
                model_name=request.model,
                temperature=0,
                streaming=True,
                timeout=10,
                stop=None,
            )
        else:
            chat_model = ChatOpenAI(model=request.model, temperature=0, streaming=True)
        messages = [
            {"role": "system", "content": system_prompt},
            {
                "role": "user",
                "content": f"""Available code context from the codebase: {context}

                User's question: {request.message}

                This is the codebase filetree: {chat.file_tree}

                Please provide an answer based on the available context. If it's insufficient for a 
                complete answer, say something like "Please be more specific with your query".
                Refer to the filetree also when answering questions.
                Questions like routing, components, pages, etc should refer to the filetree to help you form
                a comprehensive answer.
                """,
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
