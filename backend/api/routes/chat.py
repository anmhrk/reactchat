from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from db.config import get_db
from db.models import Chat, ChatMessage
import uuid
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_anthropic import ChatAnthropic
import json
from typing import AsyncGenerator, Dict, Any, cast, List
from api.rag import format_context, search_embeddings
from db.pinecone import get_index
import asyncio

router = APIRouter()


class UserRequestBody(BaseModel):
    user_id: str


class ChatMessageRequest(BaseModel):
    user_id: str
    message: str
    model: str
    selected_context: dict | None


@router.post("/chat/recents")
async def get_recents(request: UserRequestBody, db: Session = Depends(get_db)):
    chats = db.query(Chat).filter(Chat.user_id == request.user_id).all()
    return {
        "chats": [
            {
                "id": chat.id,
                "github_url": chat.github_url,
                "created_at": chat.created_at,
                "is_bookmarked": chat.is_bookmarked,
            }
            for chat in chats
        ]
    }


@router.get("/chat/{chat_id}/validate")
async def validate_chat(chat_id: str, user_id: str, db: Session = Depends(get_db)):
    chat = db.query(Chat).filter(Chat.id == chat_id, Chat.user_id == user_id).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    if str(chat.user_id) != str(user_id):
        raise HTTPException(status_code=403, detail="Forbidden")

    return {
        "is_bookmarked": chat.is_bookmarked,
    }


@router.post("/chat/{chat_id}/message")
async def send_chat_message(
    chat_id: str, request: ChatMessageRequest, db: Session = Depends(get_db)
):
    chat = (
        db.query(Chat)
        .filter(Chat.id == chat_id, Chat.user_id == request.user_id)
        .first()
    )
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")

    # Check if vectors exist in Pinecone
    index = get_index()
    existing_vectors = await asyncio.to_thread(
        index.query,
        vector=[0.0] * 3072,
        filter={"github_url": str(chat.github_url)},
        top_k=1,
    )
    existing_vectors = cast(Dict[str, Any], existing_vectors)

    if not existing_vectors["matches"]:
        raise HTTPException(status_code=400, detail="Chat repository not indexed")

    embeddings = OpenAIEmbeddings(model="text-embedding-3-large")
    question_embedding = await embeddings.aembed_query(request.message)

    try:
        relevant_chunks = await search_embeddings(question_embedding)
        context = format_context(relevant_chunks, request.message)

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
        or it just doesn't make sense, respond with: "I'm sorry, I can only help with questions about the codebase."
        Thank you and similar phrases are valid and you should respond appropriately.

        VERY IMPORTANT:
        If the user provides a code snippet, use it as context OVER the codebase context. For example, if the user asks "what is the purpose of the `useEffect` hook in this code?", 
        and the user provides a code snippet, use it as context. If the user doesn't provide a code snippet, use the codebase context.

        If the user asks "what can you do?" or something similar, respond with: "I can help you understand this codebase. Ask me anything about it!"
        Keep responses clear and well-structured, but don't be overly restrictive in your interpretations.
        
        Never mention "available code context" or "codebase context", "filetree", "code snippets" or anything along those lines in your response.
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
                User-selected code snippet(s): {request.selected_context if request.selected_context else "None"}

                User's question: {request.message}

                This is extra information about the codebase which contains the filetree, package.json, and README.md: {chat.repo_info}

                Please provide an answer based on the available context. If it's insufficient for a 
                complete answer, say something like "Please be more specific with your query".
                Refer to the extra information also when answering questions as it should help you form
                a more comprehensive answer.
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

            # assistant_token_count = tiktoken.encoding_for_model("gpt-4o").encode(
            #     assistant_message_content
            # )
            # user_token_count = tiktoken.encoding_for_model("gpt-4o").encode(
            #     request.message
            # )
            # print("assistant token count: ", len(assistant_token_count))
            # print("user token count: ", len(user_token_count))

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


@router.post("/chat/{chat_id}/bookmark")
async def bookmark_chat(
    chat_id: str, request: UserRequestBody, db: Session = Depends(get_db)
):
    chat = (
        db.query(Chat)
        .filter(Chat.id == chat_id, Chat.user_id == request.user_id)
        .first()
    )
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")

    setattr(chat, "is_bookmarked", not getattr(chat, "is_bookmarked"))
    db.commit()

    action = "unbookmarked" if not getattr(chat, "is_bookmarked") else "bookmarked"
    return {"message": f"Chat {action}", "status": 200}


@router.post("/chat/{chat_id}/delete")
async def delete_chat(
    chat_id: str, request: UserRequestBody, db: Session = Depends(get_db)
):
    try:
        chat = (
            db.query(Chat)
            .filter(Chat.id == chat_id, Chat.user_id == request.user_id)
            .first()
        )

        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found")

        # Delete vectors from Pinecone
        index = get_index()
        list_gen = await asyncio.to_thread(index.list, prefix=str(chat.github_url))
        list_result = list(list_gen)
        vector_ids: List[str] = []
        if list_result:
            vector_ids = [item for sublist in list_result for item in sublist]

        await asyncio.to_thread(index.delete, ids=vector_ids)

        # Delete chat from database once vectors are deleted
        db.delete(chat)
        db.commit()
        return {"success": True, "message": "Chat deleted", "status": 200}
    except Exception as e:
        print(f"Error deleting chat: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/chat/{chat_id}/repo-name")
async def fetch_repo_name(chat_id: str, db: Session = Depends(get_db)):
    chat = db.query(Chat).filter(Chat.id == chat_id).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")

    return {"repo_name": chat.github_url.split("/")[-1]}
