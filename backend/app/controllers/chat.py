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

    session_id = data.session_id
    if not session_id:
        session_id = str(uuid.uuid4())

    if data.path != "followup":
        existing_session = db.query(ChatSession).filter_by(id=session_id).first()
        if not existing_session:
            session = ChatSession(id=session_id, user_id=user_id, path=data.path)
            db.add(session)
            db.commit()

    payload = {
        "session_id": session_id,
        "user_id": user_id,
        "path": data.path,
        "message": data.message,
        "model_pref": data.model_pref,
        "source_pref": data.source_pref,
    }

    # Salva mensagem do usuário IMEDIATAMENTE (antes de chamar n8n)
    # Garante que a sessão aparece no histórico mesmo se n8n falhar
    if data.message and data.path != "followup":
        try:
            db.add(ChatMessage(
                id=str(uuid.uuid4()),
                session_id=session_id,
                role="user",
                content=data.message
            ))
            db.commit()
        except Exception as e:
            print(f"[chat] Erro ao salvar msg do usuário: {e}")

    try:
        n8n_response = await send_to_n8n(payload)
    except Exception as e:
        print(f"[chat] Erro ao chamar n8n: {type(e).__name__}: {e}")
        # Salva mensagem de erro no histórico para a sessão aparecer na sidebar
        try:
            db.add(ChatMessage(
                id=str(uuid.uuid4()),
                session_id=session_id,
                role="assistant",
                content="O assistente não respondeu. Tente novamente.",
                model_used=None
            ))
            db.commit()
        except Exception:
            pass
        raise HTTPException(status_code=504, detail="O assistente não respondeu. Tente novamente.")

    # Persiste só a resposta do assistente (usuário já foi salvo acima)
    asyncio.create_task(persist_assistant_message(
        db, session_id,
        n8n_response.get("response", ""),
        n8n_response.get("source") or n8n_response.get("model_used"),
    ))

    response_text = (
        n8n_response.get("response") or
        n8n_response.get("output") or
        n8n_response.get("message") or
        ""
    )
    model_used = (
        n8n_response.get("model_used") or
        n8n_response.get("source") or
        "groq"
    )

    print(f"[chat] resposta recebida: {len(response_text)} chars, model={model_used}")

    return {
        "success": True,
        "session_id": session_id,
        "path": data.path,
        "response": response_text,
        "model_used": model_used,
        "timestamp": n8n_response.get("timestamp", datetime.utcnow().isoformat()),
    }

async def persist_assistant_message(db, session_id, assistant_msg, model_used):
    try:
        db.add(ChatMessage(
            id=str(uuid.uuid4()),
            session_id=session_id,
            role="assistant",
            content=assistant_msg,
            model_used=model_used
        ))
        db.commit()
    except Exception as e:
        print(f"Erro ao persistir resposta do assistente: {e}")

# Mantido por compatibilidade
async def persist_messages(db, session_id, user_msg, assistant_msg, model_used):
    try:
        if user_msg:
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

@router.get("/sessions")
def get_sessions(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    sessions = db.query(ChatSession).filter(
        ChatSession.user_id == current_user["user_id"]
    ).order_by(ChatSession.created_at.desc()).limit(20).all()

    return {"success": True, "data": [
        {"id": s.id, "path": s.path, "created_at": str(s.created_at)}
        for s in sessions if len(s.messages) > 0
    ]}

@router.delete("/sessions/{session_id}")
def delete_session(
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

    db.delete(session)
    db.commit()
    return {"success": True, "message": "Sessão excluída"}
