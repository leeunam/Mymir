import httpx
import json
from app.core.config import settings

async def send_to_n8n(payload: dict) -> dict:
    headers = {"Content-Type": "application/json"}
    if settings.N8N_WEBHOOK_SECRET:
        headers["Authorization"] = f"Bearer {settings.N8N_WEBHOOK_SECRET}"

    async with httpx.AsyncClient(timeout=300.0) as client:
        response = await client.post(
            settings.N8N_WEBHOOK_URL,
            json=payload,
            headers=headers,
        )

        print(f"[n8n] status={response.status_code} content_type={response.headers.get('content-type')}")
        print(f"[n8n] body preview: {response.text[:300]}")

        response.raise_for_status()

        content_type = response.headers.get("content-type", "")
        if "application/json" in content_type:
            return response.json()
        else:
            try:
                return json.loads(response.text)
            except Exception:
                return {"response": response.text, "model_used": "groq"}
