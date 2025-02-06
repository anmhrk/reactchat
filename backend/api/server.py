from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
from api.middleware import ClerkAuthMiddleware
from dotenv import load_dotenv
import os

load_dotenv()

from api.routes import auth, ingest, repo, chat

app = FastAPI()

cors_origins = os.getenv("CORS_ORIGINS")
if cors_origins:
    cors_origins = cors_origins.split(",")
else:
    cors_origins = []

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    error_message = exc.detail
    if ": " in error_message:
        error_message = error_message.split(": ")[1]

    return JSONResponse(
        status_code=exc.status_code,
        content={"error": error_message},
    )


app.add_middleware(ClerkAuthMiddleware)

app.include_router(auth.router)
app.include_router(ingest.router)
app.include_router(repo.router)
app.include_router(chat.router)
