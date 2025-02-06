from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
import os
import httpx
from dotenv import load_dotenv
from clerk_backend_api import Clerk
from clerk_backend_api.jwks_helpers import AuthenticateRequestOptions

load_dotenv()

CLERK_SECRET_KEY = os.getenv("CLERK_SECRET_KEY")
if not CLERK_SECRET_KEY:
    raise Exception("CLERK_SECRET_KEY is not set in environment variables")


class ClerkAuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.method == "OPTIONS":
            return await call_next(request)

        # Public paths to skip
        public_paths = ["/auth/webhook"]
        if request.url.path in public_paths:
            return await call_next(request)

        try:
            body = await request.body()
            # Convert Starlette Request to an httpx.Request as required by the Clerk SDK
            httpx_request = httpx.Request(
                method=request.method,
                url=str(request.url),
                headers=dict(request.headers),
                content=body,
            )

            sdk = Clerk(bearer_auth=CLERK_SECRET_KEY)
            cors_origins = os.getenv("CORS_ORIGINS")
            if cors_origins:
                cors_origins = cors_origins.split(",")
            else:
                cors_origins = []

            # Authenticate the request using Clerk's authenticate_request method.
            # https://github.com/clerk/clerk-sdk-python/blob/main/README.md
            request_state = sdk.authenticate_request(
                httpx_request,
                AuthenticateRequestOptions(
                    authorized_parties=cors_origins,
                ),
            )

            if not request_state.is_signed_in:
                raise HTTPException(status_code=401, detail="Unauthorized")

            payload = request_state.payload
            if payload is None or payload.get("sub") is None:
                raise HTTPException(
                    status_code=401, detail="User payload is missing or invalid"
                )

            # Save the user ID to the request state for later usage in route handlers.
            request.state.user_id = payload.get("sub")
        except Exception as e:
            return JSONResponse(status_code=401, content={"error": str(e)})

        # Continue processing the request if authentication was successful.
        response = await call_next(request)
        return response
