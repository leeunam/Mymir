from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta
from app.core.database import get_db
from app.core.config import settings
from app.models.models import User, UserPreferences, NewsletterSubscription
from app.schemas.auth import SignupRequest, LoginRequest
from app.middleware.auth import get_current_user
import uuid

router = APIRouter(prefix="/api/auth", tags=["auth"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_token(user_id: str, email: str) -> str:
    expire = datetime.utcnow() + timedelta(days=settings.JWT_EXPIRE_DAYS)
    return jwt.encode(
        {"user_id": user_id, "email": email, "exp": expire},
        settings.JWT_SECRET,
        algorithm=settings.JWT_ALGORITHM,
    )

@router.post("/signup")
def signup(data: SignupRequest, db: Session = Depends(get_db)):
    if not data.accept_terms:
        raise HTTPException(status_code=400, detail="Aceite os termos para continuar")
    if len(data.password) < 8:
        raise HTTPException(status_code=400, detail="Senha deve ter no mínimo 8 caracteres")

    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=409, detail="E-mail já cadastrado")

    user = User(
        id=str(uuid.uuid4()),
        email=data.email,
        password_hash=pwd_context.hash(data.password),
        name=data.name,
        terms_accepted_at=datetime.utcnow(),
    )
    db.add(user)
    db.flush()

    db.add(UserPreferences(id=str(uuid.uuid4()), user_id=user.id))

    if data.newsletter_opt_in:
        db.add(NewsletterSubscription(id=str(uuid.uuid4()), user_id=user.id))

    db.commit()
    db.refresh(user)

    token = create_token(user.id, user.email)
    return {"success": True, "data": {"token": token, "user": {"id": user.id, "name": user.name, "email": user.email}}}

@router.post("/login")
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not pwd_context.verify(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="E-mail ou senha incorretos")

    token = create_token(user.id, user.email)
    return {"success": True, "data": {"token": token, "user": {"id": user.id, "name": user.name, "email": user.email}}}

@router.get("/me")
def me(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == current_user["user_id"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    return {"success": True, "data": {"id": user.id, "name": user.name, "email": user.email}}
