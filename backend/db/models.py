from sqlalchemy import Column, String, DateTime, ForeignKey, Boolean, Integer
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
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"))
    repo_info = Column(String)
    indexing_status = Column(String, default="not_started")
    total_chunks = Column(Integer, default=0)
    indexed_chunks = Column(Integer, default=0)
    is_bookmarked = Column(Boolean, default=False)


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(String, primary_key=True, index=True)
    chat_id = Column(String, ForeignKey("chats.id", ondelete="CASCADE"), index=True)
    message = Column(String)
    role = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
