from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from .config import Base


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    name = Column(String)


class Repo(Base):
    __tablename__ = "repos"

    id = Column(String, primary_key=True, index=True)
    github_url = Column(String, unique=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    user_id = Column(String, ForeignKey("users.id"))
