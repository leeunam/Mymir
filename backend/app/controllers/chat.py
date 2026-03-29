from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
import uuid
import asyncio

from app.core.database import get_db
from app.middleware.auth import get_current_user
from app.models.models import ChatSession, ChatMessage
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.n8n import send_to_n8n

router = APIRouter(prefix="/api/chat", tags=["chat"])

@router.post("")
async def chat(
    data: ChatRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_id = current_user["user_id"]

    # Novo path = nova sessão. Follow-up reutiliza sessão existente
    session_id = data.session_id
    if not session_id or data.path != "followup":
        session_id = str(uuid.uuid4())
        session = ChatSession(id=session_id, user_id=user_id, path=data.path)
        db.add(session)
        db.commit()

    payload = {
        "session_id": session_id,
        "user_id": user_id,
        "path": data.path,
        "message": data.message or data.path,
        "model_pref": data.model_pref,
        "source_pref": data.source_pref,
    }

    try:
        n8n_response = await send_to_n8n(payload)
    except Exception as e:
        raise HTTPException(status_code=504, detail="O assistente não respondeu. Tente novamente.")

    # Persiste mensagens de forma assíncrona
    asyncio.create_task(persist_messages(
        db, session_id,
        data.message or data.path,
        n8n_response.get("response", ""),
        n8n_response.get("model_used"),
    ))

    return {
        "success": True,
        "session_id": session_id,
        "path": data.path,
        "response": n8n_response.get("response", ""),
        "model_used": n8n_response.get("model_used"),
        "timestamp": n8n_response.get("timestamp", datetime.utcnow().isoformat()),
    }

async def persist_messages(db, session_id, user_msg, assistant_msg, model_used):
    try:
        db.add(ChatMessage(id=str(uuid.uuid4()), session_id=session_id, role="user", content=user_msg))
        db.add(ChatMessage(id=str(uuid.uuid4()), session_id=session_id, role="assistant", content=assistant_msg, model_used=model_used))
        db.commit()
    except Exception as e:
        print(f"Erro ao persistir mensagens: {e}")

@router.get("/history/{session_id}")
def get_history(
    session_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == current_user["user_id"]
    ).first()

    if not session:
        raise HTTPException(status_code=404, detail="Sessão não encontrada")

    return {"success": True, "data": {
        "id": session.id,
        "path": session.path,
        "messages": [{"role": m.role, "content": m.content, "model_used": m.model_used, "created_at": str(m.created_at)} for m in session.messages]
    }}
