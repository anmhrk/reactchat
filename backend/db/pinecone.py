from pinecone import Pinecone, ServerlessSpec
import os
from dotenv import load_dotenv

load_dotenv()

PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
if not PINECONE_API_KEY:
    raise Exception("PINECONE_API_KEY is not set in the environment variables")

pc = Pinecone(api_key=PINECONE_API_KEY)


def init_index():
    if "reactchat" not in pc.list_indexes().names():
        pc.create_index(
            name="reactchat",
            dimension=3072,
            metric="cosine",
            spec=ServerlessSpec(cloud="aws", region="us-east-1"),
        )


def get_index():
    init_index()
    return pc.Index("reactchat")
