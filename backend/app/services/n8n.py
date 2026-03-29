import httpx
from app.core.config import settings

async def send_to_n8n(payload: dict) -> dict:
    headers = {"Content-Type": "application/json"}
    if settings.N8N_WEBHOOK_SECRET:
        headers["Authorization"] = f"Bearer {settings.N8N_WEBHOOK_SECRET}"

    async with httpx.AsyncClient(timeout=120.0) as client:
        response = await client.post(
            settings.N8N_WEBHOOK_URL,
            json=payload,
            headers=headers,
        )
        response.raise_for_status()
        return response.json()
