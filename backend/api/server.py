from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from api.routes import auth, ingest, repo

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
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


app.include_router(auth.router)
app.include_router(ingest.router)
app.include_router(repo.router)
