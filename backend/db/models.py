from sqlalchemy import Column, String, DateTime, ForeignKey, JSON
from sqlalchemy.sql import func
from .config import Base


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    name = Column(String)


class Chat(Base):
    __tablename__ = "chats"

    id = Column(String, primary_key=True, index=True)
    github_url = Column(String, unique=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    user_id = Column(String, ForeignKey("users.id"))
    file_tree = Column(JSON)
    indexing_status = Column(
        String, default="not_started"
    )  # not_started, in_progress, completed, failed


class Embedding(Base):
    __tablename__ = "embeddings"

    id = Column(String, primary_key=True, index=True)
    github_url = Column(String, ForeignKey("chats.github_url"), index=True)
    content = Column(JSON)
    embedding = Column(JSON)
    chunk_metadata = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
