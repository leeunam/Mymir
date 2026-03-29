# Mymir — Prompt completo de desenvolvimento

## Contexto do projeto

Você é um engenheiro sênior fullstack. Sua tarefa é construir do zero a aplicação web **Mymir**, um assistente editorial de inteligência artificial com interface de chat. A aplicação se conecta a um fluxo no n8n via webhook e exibe curadoria de notícias, tendências e projetos de IA dos últimos 7 dias.

Você tem acesso completo ao terminal e à IDE. Construa tudo: banco de dados, backend, frontend. Siga cada instrução com precisão.

---

## Stack tecnológica obrigatória

### Frontend

- React 18 com Vite
- TypeScript
- Tailwind CSS v3
- shadcn/ui (componentes base)
- React Router v6
- Zustand (gerenciamento de estado global)
- React Query v5 (TanStack Query) para chamadas à API
- Axios para HTTP
- react-markdown para renderizar respostas do agente com markdown
- framer-motion para animações
- react-hot-toast para notificações

### Backend (Python)
- Python 3.11+ com FastAPI
- SQLAlchemy (ORM)
- PyJWT (autenticação JWT)
- Passlib com bcrypt (hash de senhas)
- HTTPX (cliente assíncrono para chamadas ao n8n)
- Pydantic Settings (gestão de env)
- Redis-py (cliente Redis)
- Uvicorn (servidor ASGI)

### Banco de dados
- PostgreSQL 15+ no Supabase (porta 6543 com Pooler)
- Redis 7+ (cache e sessões)

### Infraestrutura local (desenvolvimento)
- Docker Compose para Redis e n8n
- Arquivo .env com todas as variáveis

---

## Passo 1 — Estrutura de pastas

Crie a seguinte estrutura:

```
mymir/
├── backend/
│   ├── app/
│   │   ├── controllers/  # auth.py, chat.py
│   │   ├── core/         # config.py, database.py, redis.py
│   │   ├── middleware/   # auth.py
│   │   ├── models/       # models.py
│   │   ├── schemas/      # auth.py, chat.py
│   │   ├── services/     # n8n.py
│   │   └── main.py       # Ponto de entrada FastAPI
│   ├── .env
│   └── requirements.txt
├── frontend/             # Projeto React (conforme passos abaixo)
└── docker-compose.yml
```
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts
│   │   │   ├── chat.controller.ts
│   │   │   ├── user.controller.ts
│   │   │   └── newsletter.controller.ts
│   │   ├── middleware/
```

---

## Passo 2 — Docker Compose

Crie o arquivo `docker-compose.yml` na raiz:

```yaml
version: '3.8'
services:
  n8n:
    image: docker.n8n.io/n8nio/n8n
    container_name: mymir_n8n
    restart: unless-stopped
    ports:
      - '5678:5678'
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=admin123
    volumes:
      - n8n_data:/home/node/.n8n
    depends_on:
      - redis

  redis:
    image: redis:7-alpine
    container_name: mymir_redis
    command: redis-server --requirepass redis_secret
    ports:
      - '6379:6379'
    volumes:
      - redis_data:/data

volumes:
  n8n_data:
  redis_data:
```

Execute: `docker-compose up -d`


---

## Passo 3 — Backend: variáveis de ambiente

Crie `backend/.env`:

```env
DATABASE_URL=postgresql://[user]:[pass]@[host].pooler.supabase.com:6543/postgres?pgbouncer=true
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=redis_secret

JWT_SECRET=sua_chave_secreta_aqui
JWT_ALGORITHM=HS256
JWT_EXPIRE_DAYS=7

N8N_WEBHOOK_URL=http://localhost:5678/webhook/chat
N8N_WEBHOOK_SECRET=

FRONTEND_URL=http://localhost:5173
PORT=3001
```


---

## Passo 4 — Modelos do banco de dados (SQLAlchemy)

Crie `backend/app/models/models.py`:

```python
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from app.core.database import Base

def gen_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, default=gen_uuid)
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    name = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    is_active = Column(Boolean, default=True)

    sessions = relationship("ChatSession", back_populates="user", cascade="all, delete")

class ChatSession(Base):
    __tablename__ = "chat_sessions"
    id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"))
    path = Column(String, nullable=False)
    messages = relationship("ChatMessage", back_populates="session", cascade="all, delete")
    user = relationship("User", back_populates="sessions")

class ChatMessage(Base):
    __tablename__ = "chat_messages"
    id = Column(String, primary_key=True, default=gen_uuid)
    session_id = Column(String, ForeignKey("chat_sessions.id", ondelete="CASCADE"))
    role = Column(String, nullable=False)
    content = Column(String, nullable=False)
    model_used = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    session = relationship("ChatSession", back_populates="messages")
```


---

## Passo 5 — Backend: tipos TypeScript

Crie `backend/src/types/index.ts`:

```typescript
export interface JWTPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

export interface AuthRequest extends Request {
  user?: JWTPayload;
}

export interface ChatPayload {
  session_id: string;
  user_id: string;
  path: 'news' | 'trends' | 'projects' | 'followup';
  message: string;
  model_pref?: string;
  source_pref?: string[];
}

export interface N8NResponse {
  success: boolean;
  session_id: string;
  path: string;
  response: string;
  model_used?: string;
  timestamp: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
```

---

## Passo 6 — Backend: lib/redis.ts

```typescript
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD,
  retryStrategy: (times) => Math.min(times * 50, 2000),
});

redis.on('error', (err) => console.error('Redis error:', err));
redis.on('connect', () => console.log('Redis connected'));

export default redis;
```

---

## Passo 7 — Backend: services/n8n.service.ts

Este é o serviço mais crítico. Ele monta o payload exato que o n8n espera e processa a resposta:

```typescript
import axios from 'axios';
import { ChatPayload, N8NResponse } from '../types';
import redis from '../lib/redis';

const N8N_URL = process.env.N8N_WEBHOOK_URL!;
const N8N_SECRET = process.env.N8N_WEBHOOK_SECRET!;

export async function sendToN8N(payload: ChatPayload): Promise<N8NResponse> {
  // Verifica cache antes de chamar o n8n
  // Só cacheia paths principais, não follow-ups
  if (payload.path !== 'followup') {
    const cacheKey = `cache:${payload.user_id}:${payload.path}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return {
        success: true,
        session_id: payload.session_id,
        path: payload.path,
        response: cached,
        model_used: 'cache',
        timestamp: new Date().toISOString(),
      };
    }
  }

  const response = await axios.post<N8NResponse>(N8N_URL, payload, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${N8N_SECRET}`,
    },
    timeout: 60000, // 60s — o agente precisa de tempo para buscar e processar
  });

  return response.data;
}
```

---

## Passo 8 — Backend: controllers/chat.controller.ts

```typescript
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
## Passo 5 — Backend: Core (Database & Redis)

Crie `backend/app/core/database.py`:

```python
from sqlalchemy import create_all
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
import os

DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

Crie `backend/app/core/redis.py`:

```python
import redis
import os

redis_client = redis.Redis(
    host=os.getenv("REDIS_HOST", "localhost"),
    port=int(os.getenv("REDIS_PORT", 6379)),
    password=os.getenv("REDIS_PASSWORD"),
    decode_responses=True
)
```

---

## Passo 6 — Backend: Schemas (Pydantic)

Crie `backend/app/schemas/auth.py`:

```python
from pydantic import BaseModel, EmailStr
from typing import Optional

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
```

---

## Passo 7 — Backend: Controllers (Auth)

Crie `backend/app/controllers/auth.py`:

```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import User
from app.schemas.auth import UserCreate, UserLogin, Token
from passlib.context import CryptContext
import jwt
import datetime
import os

router = APIRouter(prefix="/api/auth", tags=["auth"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password):
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

@router.post("/signup", response_model=Token)
def signup(user_data: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user_data.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    new_user = User(
        email=user_data.email,
        name=user_data.name,
        password_hash=get_password_hash(user_data.password)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    token = jwt.encode({"sub": new_user.id}, os.getenv("JWT_SECRET"), algorithm="HS256")
    return {"access_token": token, "token_type": "bearer"}
```

---

## Passo 8 — Backend: Main (FastAPI)

Crie `backend/app/main.py`:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.controllers import auth, chat
from app.core.database import engine, Base

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Mymir API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(chat.router)
```

app.include_router(auth.router)
app.include_router(chat.router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3001)
```

---

## Passo 12 — Frontend: tipos

Crie `frontend/src/types/index.ts`:

```typescript
export interface User {
  id: string;
  name: string;
  email: string;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  modelPref: string;
  sourcePref: string[];
}

export type ChatPath = 'news' | 'trends' | 'projects' | 'followup';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  modelUsed?: string;
  isLoading?: boolean;
}
```

---

## Passo 13 — Frontend: store/auth.store.ts

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../types';

interface AuthStore {
  token: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
    }),
    { name: 'mymir-auth' }
  )
);
```

---

## Passo 14 — Frontend: services/api.ts

```typescript
import axios from 'axios';
import { useAuthStore } from '../store/auth.store';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
});

// Injeta token automaticamente
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Redireciona para login em 401
api.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export default api;

// Funções de API
export const authApi = {
  signup: (data: object) => api.post('/auth/signup', data),
  login: (data: object) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
};

export const chatApi = {
  send: (data: object) => api.post('/chat', data),
  getHistory: (sessionId: string) => api.get(`/chat/history/${sessionId}`),
};

export const userApi = {
  updatePreferences: (data: object) => api.put('/user/preferences', data),
};

export const newsletterApi = {
  updatePreferences: (data: object) => api.put('/newsletter/preferences', data),
};
```

---

## Passo 15 — Frontend: store/chat.store.ts

```typescript
import { create } from 'zustand';
import { ChatMessage, ChatPath } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface ChatStore {
  sessionId: string | null;
  path: ChatPath | null;
  messages: ChatMessage[];
  isLoading: boolean;
  setPath: (path: ChatPath) => void;
  addMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  setLoading: (v: boolean) => void;
  replaceLoadingMessage: (content: string, modelUsed?: string) => void;
  resetSession: () => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  sessionId: null,
  path: null,
  messages: [],
  isLoading: false,

  setPath: (path) => set({ path, sessionId: uuidv4(), messages: [] }),

  addMessage: (msg) =>
    set((s) => ({
      messages: [
        ...s.messages,
        { ...msg, id: uuidv4(), timestamp: new Date().toISOString() },
      ],
    })),

  setLoading: (isLoading) => set({ isLoading }),

  replaceLoadingMessage: (content, modelUsed) =>
    set((s) => ({
      messages: s.messages.map((m) =>
        m.isLoading ? { ...m, content, isLoading: false, modelUsed } : m,
      ),
      isLoading: false,
    })),

  resetSession: () =>
    set({ sessionId: null, path: null, messages: [], isLoading: false }),
}));
```

---

## Passo 16 — Frontend: hooks/useChat.ts

```typescript
import { useChatStore } from '../store/chat.store';
import { chatApi } from '../services/api';
import { useAuthStore } from '../store/auth.store';
import { ChatPath } from '../types';
import toast from 'react-hot-toast';

export function useChat() {
  const store = useChatStore();
  const { user } = useAuthStore();

  async function selectPath(path: ChatPath) {
    store.setPath(path);
    store.setLoading(true);

    // Adiciona mensagem de loading do assistente
    store.addMessage({ role: 'assistant', content: '', isLoading: true });

    try {
      const res = await chatApi.send({
        path,
        message: '',
        session_id: useChatStore.getState().sessionId,
        model_pref: user?.preferences?.modelPref || 'auto',
        source_pref: user?.preferences?.sourcePref || [],
      });

      store.replaceLoadingMessage(res.data.response, res.data.model_used);
    } catch (err: any) {
      store.replaceLoadingMessage('Erro ao buscar dados. Tente novamente.');
      toast.error('Falha ao conectar com o assistente');
    }
  }

  async function sendFollowUp(message: string) {
    if (!message.trim() || store.isLoading) return;

    store.addMessage({ role: 'user', content: message });
    store.addMessage({ role: 'assistant', content: '', isLoading: true });
    store.setLoading(true);

    try {
      const res = await chatApi.send({
        path: 'followup',
        message,
        session_id: store.sessionId,
        model_pref: user?.preferences?.modelPref || 'auto',
        source_pref: user?.preferences?.sourcePref || [],
      });

      store.replaceLoadingMessage(res.data.response, res.data.model_used);
    } catch {
      store.replaceLoadingMessage(
        'Erro ao processar sua pergunta. Tente novamente.',
      );
      toast.error('Falha ao enviar mensagem');
    }
  }

  return { selectPath, sendFollowUp, ...store };
}
```

---

## Passo 17 — Frontend: componente AssistantOrb.tsx

```tsx
import { motion } from 'framer-motion';

interface Props {
  onClick: () => void;
  isActive: boolean;
}

export function AssistantOrb({ onClick, isActive }: Props) {
  return (
    <div
      className="flex flex-col items-center gap-6 cursor-pointer"
      onClick={onClick}
    >
      <div className="relative">
        {/* Anéis pulsantes externos */}
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="absolute inset-0 rounded-full border border-violet-500/20"
            animate={{ scale: [1, 1.8 + i * 0.4], opacity: [0.4, 0] }}
            transition={{
              duration: 2.5,
              delay: i * 0.4,
              repeat: Infinity,
              ease: 'easeOut',
            }}
            style={{ margin: `-${i * 20}px` }}
          />
        ))}

        {/* Orbe central */}
        <motion.div
          className="relative w-24 h-24 rounded-full bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-violet-500/30"
          animate={isActive ? { scale: [1, 1.05, 1] } : {}}
          transition={{ duration: 2, repeat: Infinity }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
        >
          {/* Símbolo interno */}
          <motion.div
            className="w-8 h-8 border-2 border-white/80 rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          />
          <div className="absolute w-3 h-3 bg-white rounded-full" />
        </motion.div>
      </div>

      <motion.p
        className="text-sm text-gray-400 tracking-widest uppercase"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        {isActive ? 'processando' : 'Mymir'}
      </motion.p>
    </div>
  );
}
```

---

## Passo 18 — Frontend: componente PathSelector.tsx

```tsx
import { motion } from 'framer-motion';
import { ChatPath } from '../../types';

interface Props {
  onSelect: (path: ChatPath) => void;
}

const paths = [
  {
    id: 'news' as ChatPath,
    label: 'Notícias principais',
    description: 'Os fatos mais impactantes de IA dos últimos 7 dias',
    icon: '◉',
    color:
      'from-violet-600/20 to-violet-600/5 border-violet-500/30 hover:border-violet-400/60',
  },
  {
    id: 'trends' as ChatPath,
    label: 'Tendências e análise',
    description: 'Padrões emergentes, sinais e oportunidades no setor',
    icon: '◈',
    color:
      'from-indigo-600/20 to-indigo-600/5 border-indigo-500/30 hover:border-indigo-400/60',
  },
  {
    id: 'projects' as ChatPath,
    label: 'Projetos em destaque',
    description: 'Ferramentas, demos e repositórios que ganharam tração',
    icon: '◆',
    color:
      'from-blue-600/20 to-blue-600/5 border-blue-500/30 hover:border-blue-400/60',
  },
];

export function PathSelector({ onSelect }: Props) {
  return (
    <div className="grid grid-cols-1 gap-3 w-full max-w-md">
      {paths.map((p, i) => (
        <motion.button
          key={p.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          onClick={() => onSelect(p.id)}
          className={`w-full text-left p-4 rounded-xl border bg-gradient-to-br ${p.color} transition-all duration-200 group`}
        >
          <div className="flex items-start gap-3">
            <span className="text-xl mt-0.5 text-gray-400 group-hover:text-white transition-colors">
              {p.icon}
            </span>
            <div>
              <div className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors">
                {p.label}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                {p.description}
              </div>
            </div>
          </div>
        </motion.button>
      ))}
    </div>
  );
}
```

---

## Passo 19 — Frontend: componente MessageBubble.tsx

```tsx
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';
import { ChatMessage } from '../../types';
import { TypingIndicator } from './TypingIndicator';

interface Props {
  message: ChatMessage;
}

export function MessageBubble({ message }: Props) {
  const isUser = message.role === 'user';

  if (message.isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-start"
      >
        <div className="bg-gray-800/60 border border-gray-700/50 rounded-2xl rounded-tl-sm px-4 py-3">
          <TypingIndicator />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? 'bg-violet-600/80 text-white rounded-tr-sm'
            : 'bg-gray-800/60 border border-gray-700/50 text-gray-200 rounded-tl-sm'
        }`}
      >
        {isUser ? (
          <p>{message.content}</p>
        ) : (
          <ReactMarkdown
            components={{
              a: ({ href, children }) => (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-violet-400 underline underline-offset-2 hover:text-violet-300"
                >
                  {children}
                </a>
              ),
              strong: ({ children }) => (
                <strong className="text-white font-medium">{children}</strong>
              ),
              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
              ul: ({ children }) => (
                <ul className="list-disc list-inside mb-2 space-y-1">
                  {children}
                </ul>
              ),
              li: ({ children }) => (
                <li className="text-gray-300">{children}</li>
              ),
              h3: ({ children }) => (
                <h3 className="text-white font-medium text-base mb-1 mt-3 first:mt-0">
                  {children}
                </h3>
              ),
            }}
          >
            {message.content}
          </ReactMarkdown>
        )}
        {message.modelUsed && message.modelUsed !== 'cache' && (
          <div className="mt-2 text-xs text-gray-600">{message.modelUsed}</div>
        )}
      </div>
    </motion.div>
  );
}
```

---

## Passo 20 — Frontend: componente ChatInput.tsx

```tsx
import { useState } from 'react';
import { motion } from 'framer-motion';

interface Props {
  onSend: (message: string) => void;
  disabled: boolean;
}

export function ChatInput({ onSend, disabled }: Props) {
  const [value, setValue] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim() || disabled) return;
    onSend(value.trim());
    setValue('');
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="flex items-center gap-2 bg-gray-800/60 border border-gray-700/50 rounded-2xl px-4 py-2"
    >
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Aprofunde, compare ou pergunte mais..."
        disabled={disabled}
        className="flex-1 bg-transparent text-sm text-gray-200 placeholder-gray-600 outline-none disabled:opacity-40"
      />
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        className="w-8 h-8 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path
            d="M1 7h12M7 1l6 6-6 6"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </motion.form>
  );
}
```

---

## Passo 21 — Frontend: página Chat.tsx (principal)

```tsx
import { useState } from 'react';
import { useChat } from '../hooks/useChat';
import { AssistantOrb } from '../components/assistant/AssistantOrb';
import { PathSelector } from '../components/assistant/PathSelector';
import { MessageBubble } from '../components/chat/MessageBubble';
import { ChatInput } from '../components/chat/ChatInput';
import { ChatPath } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

export function ChatPage() {
  const [showPaths, setShowPaths] = useState(false);
  const { messages, isLoading, path, selectPath, sendFollowUp } = useChat();

  async function handlePathSelect(selectedPath: ChatPath) {
    setShowPaths(false);
    await selectPath(selectedPath);
  }

  const hasMessages = messages.length > 0;

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-800/50">
        <div className="text-sm font-medium text-gray-400 tracking-widest uppercase">
          Mymir
        </div>
        <div className="flex items-center gap-2">
          {path && (
            <button
              onClick={() => {
                setShowPaths(true);
              }}
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors px-3 py-1 rounded-lg border border-gray-800 hover:border-gray-600"
            >
              Mudar caminho
            </button>
          )}
        </div>
      </header>

      {/* Área principal */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-2xl mx-auto flex flex-col gap-4">
          <AnimatePresence mode="wait">
            {!hasMessages ? (
              <motion.div
                key="landing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center min-h-[60vh] gap-10"
              >
                <AssistantOrb
                  onClick={() => setShowPaths(!showPaths)}
                  isActive={showPaths}
                />
                <AnimatePresence>
                  {showPaths && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    >
                      <PathSelector onSelect={handlePathSelect} />
                    </motion.div>
                  )}
                </AnimatePresence>
                {!showPaths && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-gray-600 text-sm"
                  >
                    Clique no orbe para explorar
                  </motion.p>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="chat"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col gap-4"
              >
                {messages.map((msg) => (
                  <MessageBubble key={msg.id} message={msg} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Input — só aparece após o primeiro path */}
      <AnimatePresence>
        {hasMessages && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-4 pb-6 pt-2 max-w-2xl mx-auto w-full"
          >
            <ChatInput onSend={sendFollowUp} disabled={isLoading} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

---

## Passo 22 — Frontend: páginas de autenticação

### Login.tsx

```tsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../services/api';
import { useAuthStore } from '../store/auth.store';
import toast from 'react-hot-toast';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authApi.login({ email, password });
      setAuth(res.data.data.token, res.data.data.user);
      navigate('/');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-medium text-white">Mymir</h1>
          <p className="text-gray-500 text-sm mt-1">
            Inteligência editorial sobre IA
          </p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-gray-800/60 border border-gray-700/50 rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-600 outline-none focus:border-violet-500/50 transition-colors"
          />
          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full bg-gray-800/60 border border-gray-700/50 rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-600 outline-none focus:border-violet-500/50 transition-colors"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-medium py-3 rounded-xl transition-colors mt-1"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        <p className="text-center text-xs text-gray-600 mt-4">
          Não tem conta?{' '}
          <Link to="/signup" className="text-violet-400 hover:text-violet-300">
            Criar conta
          </Link>
        </p>
      </div>
    </div>
  );
}
```

### Signup.tsx

```tsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../services/api';
import { useAuthStore } from '../store/auth.store';
import toast from 'react-hot-toast';

export function SignupPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    acceptTerms: false,
    newsletterOptIn: false,
    newsletterNews: true,
    newsletterTrends: true,
    newsletterProjects: true,
  });
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.acceptTerms) {
      toast.error('Aceite os termos para continuar');
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.signup(form);
      setAuth(res.data.data.token, res.data.data.user);
      navigate('/');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    'w-full bg-gray-800/60 border border-gray-700/50 rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-600 outline-none focus:border-violet-500/50 transition-colors';

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-medium text-white">Criar conta</h1>
          <p className="text-gray-500 text-sm mt-1">
            Mymir — curadoria editorial de IA
          </p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            placeholder="Nome"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            required
            className={inputClass}
          />
          <input
            type="email"
            placeholder="E-mail"
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            required
            className={inputClass}
          />
          <input
            type="password"
            placeholder="Senha (mín. 8 caracteres)"
            value={form.password}
            onChange={(e) => set('password', e.target.value)}
            required
            minLength={8}
            className={inputClass}
          />

          <div className="flex flex-col gap-2 mt-1">
            <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
              <input
                type="checkbox"
                checked={form.acceptTerms}
                onChange={(e) => set('acceptTerms', e.target.checked)}
                className="accent-violet-500"
              />
              Aceito os{' '}
              <span className="text-violet-400 underline">termos de uso</span>
            </label>
            <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
              <input
                type="checkbox"
                checked={form.newsletterOptIn}
                onChange={(e) => set('newsletterOptIn', e.target.checked)}
                className="accent-violet-500"
              />
              Receber Pulse Weekly toda segunda-feira
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-medium py-3 rounded-xl transition-colors mt-1"
          >
            {loading ? 'Criando conta...' : 'Criar conta'}
          </button>
        </form>
        <p className="text-center text-xs text-gray-600 mt-4">
          Já tem conta?{' '}
          <Link to="/login" className="text-violet-400 hover:text-violet-300">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
```

---

## Passo 23 — Frontend: App.tsx com rotas protegidas

```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/auth.store';
import { LoginPage } from './pages/Login';
import { SignupPage } from './pages/Signup';
import { ChatPage } from './pages/Chat';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuthStore();
  return token ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#1f2937',
            color: '#e5e7eb',
            border: '1px solid #374151',
          },
        }}
      />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <ChatPage />
            </PrivateRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
```

---

## Passo 24 — Frontend: variáveis de ambiente e tailwind

Crie `frontend/.env`:

```env
VITE_API_URL=http://localhost:3001/api
```

Crie `frontend/tailwind.config.ts`:

```typescript
import type { Config } from 'tailwindcss';
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: { extend: {} },
  plugins: [],
} satisfies Config;
```

---

## Passo 25 — Componente TypingIndicator.tsx

```tsx
import { motion } from 'framer-motion';

export function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 py-1">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-1.5 h-1.5 bg-gray-500 rounded-full"
          animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
          transition={{ duration: 1, delay: i * 0.2, repeat: Infinity }}
        />
      ))}
    </div>
  );
}
```

---

## Passo 26 — Ordem de execução dos comandos

Execute exatamente nesta ordem no terminal:

```bash
# 1. Subir banco de dados
docker-compose up -d

# 2. Configurar backend
cd backend
npm install
npx prisma migrate dev --name init
npx prisma generate
npm run dev

# 3. Em outro terminal, configurar frontend
cd frontend
npm install
npm run dev
```

---

## Passo 27 — O que o n8n retorna e o que o backend espera

### Backend envia ao n8n (POST para o webhook):

```json
{
  "session_id": "uuid-v4",
  "user_id": "uuid-v4",
  "path": "news | trends | projects | followup",
  "message": "string — obrigatório, mínimo vazio string",
  "model_pref": "auto | gpt-4.1 | gemini-pro | groq",
  "source_pref": []
}
```

Header obrigatório: `Authorization: Bearer <N8N_WEBHOOK_SECRET>`

### n8n retorna ao backend:

```json
{
  "success": true,
  "session_id": "mesmo uuid enviado",
  "path": "mesmo path enviado",
  "response": "texto markdown com a resposta editorial",
  "model_used": "gpt-4.1",
  "timestamp": "ISO 8601"
}
```

### Backend retorna ao frontend:

```json
{
  "success": true,
  "session_id": "uuid",
  "path": "news",
  "response": "texto markdown",
  "model_used": "gpt-4.1",
  "timestamp": "ISO 8601"
}
```

---

## Regras de qualidade obrigatórias

1. Nunca use `any` no TypeScript sem justificativa — prefira tipos explícitos
2. Todo erro deve ser capturado e retornar mensagem amigável ao usuário
3. Nunca exponha stack traces ou mensagens de erro internas ao frontend
4. Todas as rotas privadas do backend devem usar o `authMiddleware`
5. O campo `response` do n8n sempre vem em markdown — sempre renderize com `react-markdown` no frontend, nunca como texto puro
6. O `session_id` é gerado no frontend para novos paths e reutilizado para follow-ups
7. O backend não deve bloquear a resposta ao usuário para salvar no banco — use `persistMessages().catch()` de forma assíncrona
8. Redis e PostgreSQL são obrigatórios — não substitua um pelo outro
9. O timeout do axios para chamadas ao n8n deve ser de no mínimo 60 segundos
10. O design segue obrigatoriamente: fundo `gray-950`, acentos `violet-600`, texto `gray-200`, bordas `gray-700/50`, bordas de foco `violet-500/50`
