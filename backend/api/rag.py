from langchain.text_splitter import RecursiveCharacterTextSplitter
import numpy as np
from typing import List
from fastapi import HTTPException
import uuid
from sqlalchemy.orm import Session
from db.models import Chat, Embedding
from langchain_openai import OpenAIEmbeddings
import json
import logging
import asyncio

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def determine_file_type(file_path: str) -> str:
    extensions = {
        "ts": "typescript",
        "tsx": "react",
        "js, mjs, cjs": "javascript",
        "jsx": "react",
        "json": "config",
        "md": "documentation",
        "css": "styles",
        "html": "markup",
        # this does not handle backend codebases in python for example. just js/ts/react
    }
    ext = file_path.split(".")[-1].lower()
    return extensions.get(ext, "other")


def split_into_logical_sections(content: str) -> List[str]:
    sections = []
    current_section = []

    for line in content.split("\n"):
        if (
            line.strip().startswith("function ")
            or line.strip().startswith("class ")
            or line.strip().startswith("const ")
            or line.strip().startswith("export ")
        ):

            if current_section:
                sections.append("\n".join(current_section))
            current_section = []

        current_section.append(line)

    if current_section:
        sections.append("\n".join(current_section))

    return sections


def chunk_code_file(content: str, file_path: str) -> List[dict]:
    chunks = []
    sections = split_into_logical_sections(content)

    for section in sections:
        chunks.append(
            {
                "content": section,
                "metadata": {
                    "file_path": file_path,
                    "type": "code",
                    "category": categorize_code(section, file_path),
                },
            }
        )

    return chunks


def categorize_code(content: str, file_path: str) -> str:
    categories = {
        "route": ["router", "api", "endpoint", "handler", "app", "routes", "pages"],
        "component": ["component", "jsx", "tsx"],
        "styling": ["shadcn", "components/ui", "tailwind", "css", "styles"],
        "model": ["model", "schema", "type", "interface"],
        "util": ["util", "helper", "lib", "utils", "hooks", "context"],
        "config": ["config", "env"],
    }

    for category, keywords in categories.items():
        if any(
            keyword in content.lower() or keyword in file_path.lower()
            for keyword in keywords
        ):
            return category

    return "other"


def create_chunks(content: str):
    files = content.split("File:")[1:]
    chunks_with_metadata = []

    important_dirs = [
        "/src/",
        "/app/",
        "/pages/",
        "/components/",
        "/lib/",
        "/utils/",
        "/hooks/",
        "/api/",
    ]

    for file_content in files:
        file_lines = file_content.split("\n")
        file_path = file_lines[0].strip()

        is_important = any(imp_dir in file_path for imp_dir in important_dirs)
        if not is_important and not file_path.endswith((".tsx", ".ts", ".jsx", ".js")):
            continue

        actual_content = "\n".join(file_lines[2:])
        file_type = determine_file_type(file_path)

        if file_type in ["typescript", "react", "javascript"]:
            chunks = chunk_code_file(actual_content, file_path)
        else:
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
                        "type": "text",
                        "category": (
                            "documentation" if file_type == "documentation" else "other"
                        ),
                    },
                }
                for chunk in text_chunks
            ]

        chunks_with_metadata.extend(chunks)

    return chunks_with_metadata


def cosine_similarity(a: List[float], b: List[float]) -> float:
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))


def calculate_path_relevance(file_path: str, question: str) -> float:
    path_parts = set(file_path.lower().replace("/", " ").replace(".", " ").split())
    question_parts = set(question.lower().split())

    if "routing" in question.lower() and any(
        x in file_path for x in ["route", "router"]
    ):
        return 1.0
    if "component" in question.lower() and "/components/" in file_path:
        return 1.0
    if "api" in question.lower() and "/api/" in file_path:
        return 1.0

    return len(path_parts.intersection(question_parts)) / len(question_parts)


def calculate_category_match(category: str, question: str) -> float:
    category_keywords = {
        "route": ["routing", "api", "endpoint", "handler", "router"],
        "component": ["component", "ui", "interface", "render", "jsx", "tsx"],
        "model": ["model", "schema", "type", "data"],
        "util": ["utility", "helper", "format", "transform", "hook", "context"],
        "config": ["configuration", "setup", "environment"],
    }

    if category in category_keywords:
        keywords = category_keywords[category]
        if any(keyword in question.lower() for keyword in keywords):
            return 1.0

    return 0.0


async def hybrid_search(
    question: str,
    chunks: List[dict],
    embeddings: List[List[float]],
    question_embedding: List[float],
) -> List[dict]:
    semantic_scores = [
        cosine_similarity(question_embedding, chunk_embedding)
        for chunk_embedding in embeddings
    ]

    keywords = question.lower().split()
    keyword_scores = [
        sum(keyword in chunk["content"].lower() for keyword in keywords) / len(keywords)
        for chunk in chunks
    ]

    path_scores = [
        calculate_path_relevance(chunk["metadata"]["file_path"], question)
        for chunk in chunks
    ]

    category_scores = [
        calculate_category_match(chunk["metadata"]["category"], question)
        for chunk in chunks
    ]

    combined_scores = [
        (0.4 * sem_score + 0.3 * key_score + 0.2 * path_score + 0.1 * cat_score)
        for sem_score, key_score, path_score, cat_score in zip(
            semantic_scores, keyword_scores, path_scores, category_scores
        )
    ]

    top_k = 5
    top_indices = np.argsort(combined_scores)[-top_k:][::-1]

    relevant_chunks = []
    for idx in top_indices:
        if combined_scores[idx] >= 0.2:
            chunk = chunks[idx]
            chunk["score"] = combined_scores[idx]
            relevant_chunks.append(chunk)

    return relevant_chunks


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
        all_embeddings = list()
        logger.info("Processing chunks and creating embeddings...")

        for i in range(0, len(chunks), batch_size):
            batch = chunks[i : i + batch_size]
            batch_contents = [chunk["content"] for chunk in batch]

            try:
                batch_embeddings = await asyncio.gather(
                    *[embeddings.aembed_query(content) for content in batch_contents]
                )
                all_embeddings.extend(batch_embeddings)
                setattr(chat, "indexed_chunks", min(i + batch_size, len(chunks)))
                db.commit()

                logger.info(
                    f"Processed chunks {i+1} to {min(i+batch_size, len(chunks))}/{len(chunks)}"
                )
            except Exception as chunk_error:
                logger.error(f"Error processing chunk {i+1}: {str(chunk_error)}")
                raise

        embedding = Embedding(
            id=str(uuid.uuid4()),
            github_url=chat.github_url,
            chunks=json.dumps(chunks),
            embedding=json.dumps(all_embeddings),
        )
        db.add(embedding)
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
