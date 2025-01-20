from fastapi import APIRouter, Request, HTTPException
from dotenv import load_dotenv
from svix.webhooks import Webhook, WebhookVerificationError
import os
import json

load_dotenv()

router = APIRouter()

CLERK_WEBHOOK_SECRET = os.getenv("CLERK_WEBHOOK_SECRET")
if not CLERK_WEBHOOK_SECRET:
    raise Exception("CLERK_WEBHOOK_SECRET is not set in the environment variables")


@router.post("/auth/webhook")
async def handle_auth_webhook(request: Request):
    body = await request.body()

    headers = request.headers
    svix_id = headers.get("svix-id")
    svix_timestamp = headers.get("svix-timestamp")
    svix_signature = headers.get("svix-signature")

    if not svix_id or not svix_timestamp or not svix_signature:
        raise HTTPException(status_code=400, detail="Missing svix headers")

    wh = Webhook(str(CLERK_WEBHOOK_SECRET))

    try:
        evt = wh.verify(
            body.decode(),
            {
                "svix-id": svix_id,
                "svix-timestamp": svix_timestamp,
                "svix-signature": svix_signature,
            },
        )
    except WebhookVerificationError as e:
        raise HTTPException(
            status_code=400, detail=f"Webhook verification failed: {str(e)}"
        )

    event_type = evt["type"]
    event_data = evt["data"]

    print(f"Received webhook with type: {event_type}")
    print("Webhook payload:", json.dumps(event_data, indent=2))

    if event_type == "user.created":
        user_id = event_data["id"]
        print(f"User created: {user_id}")

    return {"message": "Webhook processed successfully"}
