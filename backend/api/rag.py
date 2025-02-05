from langchain.text_splitter import RecursiveCharacterTextSplitter
from typing import List
from fastapi import HTTPException
from sqlalchemy.orm import Session
from db.models import Chat
from langchain_openai import OpenAIEmbeddings
from db.pinecone import get_index
import logging
import asyncio
from typing import Dict, Any, cast

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def create_chunks(content: str):
    files = content.split("File:")[1:]
    chunks_with_metadata = []

    for file_content in files:
        file_lines = file_content.split("\n")
        file_path = file_lines[0].strip()
        actual_content = "\n".join(file_lines[2:])

        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=2000,
            chunk_overlap=100,
            length_function=len,
        )
        text_chunks = text_splitter.split_text(actual_content)
        chunks = [
            {
                "content": chunk,
                "metadata": {
                    "file_path": file_path,
                    "type": "code",
                },
            }
            for chunk in text_chunks
        ]
        chunks_with_metadata.extend(chunks)

    return chunks_with_metadata


async def search_embeddings(question_embedding: List[float]) -> List[dict]:
    index = get_index()

    query = await asyncio.to_thread(
        index.query,
        vector=question_embedding,
        top_k=5,
        include_metadata=True,
    )

    query_response = cast(Dict[str, Any], query)
    print(query_response)

    chunks = []
    for match in query_response["matches"]:
        chunk = {
            "content": match["metadata"]["content"],
            "metadata": {
                "file_path": match["metadata"]["file_path"],
                "type": match["metadata"]["type"],
            },
            "score": float(match["score"]),
        }
        chunks.append(chunk)
    return chunks


def format_context(chunks: List[dict], question: str) -> str:
    sorted_chunks = sorted(chunks, key=lambda x: x["score"], reverse=True)
    chunks_by_file = {}

    for chunk in sorted_chunks:
        file_path = chunk["metadata"]["file_path"]
        if file_path not in chunks_by_file:
            chunks_by_file[file_path] = []
        chunks_by_file[file_path].append(chunk)

    context_parts = []
    total_length = 0
    max_length = 5000

    for file_path, file_chunks in chunks_by_file.items():
        file_context = f"\nFile: {file_path}\n"
        for chunk in file_chunks:
            chunk_text = f"```{chunk['metadata']['type']}\n{chunk['content']}\n```\n"
            if total_length + len(chunk_text) > max_length:
                break
            file_context += chunk_text
            total_length += len(chunk_text)

        if total_length > max_length:
            break

        context_parts.append(file_context)

    return "\n".join(context_parts)


async def create_embeddings(db: Session, chat_id: str, content: str):
    try:
        logger.info(f"Starting embedding creation for chat {chat_id}")
        chat = db.query(Chat).filter(Chat.id == chat_id).first()
        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found")

        chunks = create_chunks(content)
        logger.info(f"Created {len(chunks)} chunks")
        setattr(chat, "total_chunks", len(chunks))
        setattr(chat, "indexed_chunks", 0)
        db.commit()

        embeddings = OpenAIEmbeddings(
            model="text-embedding-3-large",
        )

        batch_size = 20
        index = get_index()
        logger.info("Processing chunks and creating embeddings...")

        for i in range(0, len(chunks), batch_size):
            batch = chunks[i : i + batch_size]
            batch_contents = [chunk["content"] for chunk in batch]

            try:
                batch_embeddings = await asyncio.gather(
                    *[embeddings.aembed_query(content) for content in batch_contents]
                )

                # Prepare vectors for Pinecone upsert
                vectors = []
                for j, embedding in enumerate(batch_embeddings):
                    chunk = batch[j]
                    vectors.append(
                        {
                            "id": f"{chat.github_url}_{i+j}",
                            "values": embedding,
                            "metadata": {
                                "content": chunk["content"],
                                "file_path": chunk["metadata"]["file_path"],
                                "type": chunk["metadata"]["type"],
                                "github_url": chat.github_url,
                            },
                        }
                    )

                # Upsert vectors to Pinecone
                index.upsert(vectors=vectors)

                setattr(chat, "indexed_chunks", min(i + batch_size, len(chunks)))
                db.commit()

                logger.info(
                    f"Processed chunks {i+1} to {min(i+batch_size, len(chunks))}/{len(chunks)}"
                )
            except Exception as chunk_error:
                logger.error(f"Error processing chunk {i+1}: {str(chunk_error)}")
                raise

        setattr(chat, "indexing_status", "completed")
        db.commit()

        logger.info("Embeddings created successfully")
        return True
    except Exception as e:
        logger.error(f"Error in create_embeddings: {str(e)}")
        chat = db.query(Chat).filter(Chat.id == chat_id).first()
        if chat:
            setattr(chat, "indexing_status", "failed")
            db.commit()
        raise HTTPException(status_code=500, detail=str(e))
