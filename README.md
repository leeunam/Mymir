# Mymir — AI Editorial Assistant

Mymir is an editorial assistant designed to curate and interact with the latest news, trends and AI projects from the last 7 days.

## Key Features

- **Smart Editorial Chat:** Interact with a specialized AI agent for high-quality content curation.
- **Intelligent Caching:** Boosted performance using Redis to serve identical requests in milliseconds.
- **n8n Orchestration:** Complex logic flows and tool execution powered by n8n.
- **Multi-Source Research:** Real-time data from Tavily Search, MediaStack, and GNews APIs.
- **Contextual Memory:** Persistent conversation history managed by session IDs.

## How it Works

Mymir uses a decision-based architecture. When a request arrives, the system first checks if a valid cache exists for that specific user and path. If it's a new or unique query, the AI agent takes over, deciding which research tools to trigger to provide the most accurate editorial response.

## Technology Stack

| Layer | Technology |
|---|---|
| Backend | FastAPI (Python 3.11+) |
| Database | PostgreSQL (SQLAlchemy ORM) |
| Cache & Memory | Redis 7.0 |
| AI Model | Google Gemini / Groq |
| Workflow Engine | n8n |
| Frontend | React + Vite + TypeScript |
| Research APIs | Tavily, MediaStack, GNews |

## Architecture

![Mymir Architecture](./assets/arquitetura-mymir.svg)

### Step-by-Step Flow

1. **Webhook Entry:** The backend sends a POST request with `user_id`, `session_id`, and `path`.
2. **Cache Check:** Redis verifies if `cache:user_id:path` exists (TTL 1h).
3. **Agent Execution:** If no cache, the AI Agent analyzes the query.
4. **Tool Trigger:** The agent calls Tavily, MediaStack, or GNews as needed.
5. **Memory Retrieval:** Chat context is fetched from Redis Chat Memory.
6. **Response & Cache:** The response is sent, and if it's a primary path, it's stored in Redis.

---

## Running Locally

### Prerequisites

Make sure you have the following installed:

- [Docker](https://docs.docker.com/get-docker/) & [Docker Compose](https://docs.docker.com/compose/install/)
- [Python 3.11+](https://www.python.org/downloads/)
- [Node.js 18+](https://nodejs.org/) and npm

---

### Step 1 — Clone the repository

```bash
git clone https://github.com/your-user/mymir.git
cd mymir
```

---

### Step 2 — Start infrastructure (Redis + n8n) with Docker Compose

```bash
docker compose up -d
```

This will start:

| Service | URL | Credentials |
|---|---|---|
| **n8n** | http://localhost:5678 | user: `admin` / password: `admin123` |
| **Redis** | localhost:6379 | password: `redis_secret` |

> ⚠️ PostgreSQL is **not** included in docker-compose. You must have it installed locally or use a managed service (e.g. Supabase, Railway).

To check running containers:

```bash
docker compose ps
```

---

### Step 3 — Configure the Backend

```bash
cd backend
```

Create the `.env` file:

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/mymir_db

# Redis (matches docker-compose)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=redis_secret

# Auth
JWT_SECRET=your-super-secret-key-here

# n8n webhook (use webhook-test for development)
N8N_WEBHOOK_URL=http://localhost:5678/webhook-test/chat
N8N_WEBHOOK_SECRET=

# Frontend origin (for CORS)
FRONTEND_URL=http://localhost:5173
```

Create and activate the virtual environment:

```bash
python -m venv venv
source venv/bin/activate        # Linux/macOS
# venv\Scripts\activate         # Windows
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Run database migrations:

```bash
alembic upgrade head
```

Start the backend server:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 3001 --reload
```

The API will be available at: **http://localhost:3001**
Interactive docs: **http://localhost:3001/docs**

---

### Step 4 — Configure the Frontend

```bash
cd ../frontend
```

Create the `.env` file:

```bash
# frontend/.env
VITE_API_URL=http://localhost:3001
```

Install dependencies and start the dev server:

```bash
npm install
npm run dev
```

The frontend will be available at: **http://localhost:5173**

---

### Step 5 — Configure n8n

1. Access n8n at **http://localhost:5678** (credentials: `admin` / `admin123`)
2. Import your workflow JSON (if you have one exported)
3. Configure credentials for:
   - **Redis** — host: `localhost`, port: `6379`, password: `redis_secret`
   - **Google Gemini API** — add your API key
   - **Groq API** — add your API key
   - **Tavily / MediaStack / GNews** — add your API keys
4. In the **Webhook** trigger node, set **Respond** to `Using Respond to Webhook Node`
5. Click **Execute Workflow** on the canvas before making the first request

> **Development tip:** Use `webhook-test` URL in `.env` for development. Switch to `webhook` (without `-test`) and activate the workflow toggle for production.

---

### Step 6 — Test the full flow

```bash
curl -s -X POST http://localhost:5678/webhook-test/chat \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "test-001",
    "user_id": "test-user",
    "path": "news",
    "message": "What are the latest AI news?",
    "model_pref": null,
    "source_pref": null
  }'
```

---

### Inspecting Redis

```bash
# Enter interactive redis-cli
docker exec -it mymir_redis redis-cli -a redis_secret

# Useful commands
KEYS *               # list all keys
GET cache:user:path  # get cached value
TTL cache:user:path  # check expiration time
FLUSHALL             # clear everything (careful!)
```

---

## Folder Structure

```text
mymir/
├── backend/
│   ├── app/
│   │   ├── controllers/  # Route handlers
│   │   ├── core/         # Config, Database & Redis setup
│   │   ├── middleware/   # JWT Auth
│   │   ├── models/       # SQLAlchemy Entities
│   │   ├── schemas/      # Pydantic Models
│   │   ├── services/     # n8n & External integrations
│   │   └── main.py       # App entry point
│   ├── .env              # Environment Variables
│   └── requirements.txt  # Python Dependencies
├── frontend/
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── pages/        # Page components
│   │   ├── store/        # Zustand state management
│   │   ├── services/     # API client
│   │   └── types/        # TypeScript types
│   └── .env              # Frontend environment
├── assets/               # Architecture diagrams & icons
├── docker-compose.yml    # Infrastructure (Redis, n8n)
└── README.md
```

## License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

<div align="center">
  <br />
  <h1>🇧🇷 Versão em Português</h1>
  <br />
</div>

# Mymir — Assistente Editorial de IA

O Mymir é um assistente editorial projetado para curar e interagir com as últimas notícias, tendências e projetos de IA dos últimos 7 dias.

## Funcionalidades Principais

- **Chat Editorial Inteligente:** Interação com um agente de IA especializado em curadoria de conteúdo.
- **Cache Inteligente:** Performance otimizada usando Redis para servir requisições idênticas em milissegundos.
- **Orquestração n8n:** Fluxos de lógica complexos e execução de ferramentas alimentados pelo n8n.
- **Pesquisa Multi-Fonte:** Dados em tempo real das APIs Tavily Search, MediaStack e GNews.
- **Memória Contextual:** Histórico de conversa persistente gerenciado por IDs de sessão.

## Como Funciona

O Mymir utiliza uma arquitetura baseada em decisão. Quando uma requisição chega, o sistema verifica primeiro se existe um cache válido para aquele usuário e caminho. Se for uma consulta nova, o agente de IA assume o controle, decidindo quais ferramentas de pesquisa acionar para fornecer a melhor resposta editorial.

## Stack de Tecnologia

| Camada | Tecnologia |
|---|---|
| Backend | FastAPI (Python 3.11+) |
| Banco de Dados | PostgreSQL (SQLAlchemy ORM) |
| Cache e Memória | Redis 7.0 |
| Modelo de IA | Google Gemini / Groq |
| Orquestrador | n8n |
| Frontend | React + Vite + TypeScript |
| APIs de Pesquisa | Tavily, MediaStack, GNews |

## Arquitetura

![Arquitetura Mymir](./assets/arquitetura-mymir.svg)

### Fluxo Passo a Passo

1. **Entrada Webhook:** O backend envia um POST com `user_id`, `session_id` e `path`.
2. **Verificação de Cache:** O Redis verifica se `cache:user_id:path` existe (TTL 1h).
3. **Execução do Agente:** Caso não haja cache, o agente de IA analisa a consulta.
4. **Acionamento de Tools:** O agente chama Tavily, MediaStack ou GNews conforme necessário.
5. **Recuperação de Memória:** O contexto do chat é buscado na Redis Chat Memory.
6. **Resposta e Cache:** A resposta é enviada e, se for um caminho primário, é salva no Redis.

---

## 🚀 Rodando Localmente

### Pré-requisitos

Certifique-se de ter instalado:

- [Docker](https://docs.docker.com/get-docker/) e [Docker Compose](https://docs.docker.com/compose/install/)
- [Python 3.11+](https://www.python.org/downloads/)
- [Node.js 18+](https://nodejs.org/) e npm

---

### Passo 1 — Clone o repositório

```bash
git clone https://github.com/seu-usuario/mymir.git
cd mymir
```

---

### Passo 2 — Suba a infraestrutura (Redis + n8n) com Docker Compose

```bash
docker compose up -d
```

Isso irá iniciar:

| Serviço | URL | Credenciais |
|---|---|---|
| **n8n** | http://localhost:5678 | usuário: `admin` / senha: `admin123` |
| **Redis** | localhost:6379 | senha: `redis_secret` |

> ⚠️ O PostgreSQL **não** está incluído no docker-compose. Você deve tê-lo instalado localmente ou usar um serviço gerenciado (ex: Supabase, Railway, Neon).

Para verificar os containers em execução:

```bash
docker compose ps
```

---

### Passo 3 — Configure o Backend

```bash
cd backend
```

Crie o arquivo `.env`:

```env
# Banco de Dados
DATABASE_URL=postgresql://usuario:senha@localhost:5432/mymir_db

# Redis (igual ao docker-compose)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=redis_secret

# Autenticação
JWT_SECRET=sua-chave-secreta-aqui

# Webhook n8n (use webhook-test para desenvolvimento)
N8N_WEBHOOK_URL=http://localhost:5678/webhook-test/chat
N8N_WEBHOOK_SECRET=

# Origem do frontend (para CORS)
FRONTEND_URL=http://localhost:5173
```

Crie e ative o ambiente virtual:

```bash
python -m venv venv
source venv/bin/activate        # Linux/macOS
# venv\Scripts\activate         # Windows
```

Instale as dependências:

```bash
pip install -r requirements.txt
```

Execute as migrations do banco:

```bash
alembic upgrade head
```

Inicie o servidor backend:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 3001 --reload
```

A API estará disponível em: **http://localhost:3001**
Documentação interativa: **http://localhost:3001/docs**

---

### Passo 4 — Configure o Frontend

```bash
cd ../frontend
```

Crie o arquivo `.env`:

```bash
# frontend/.env
VITE_API_URL=http://localhost:3001
```

Instale as dependências e inicie o servidor de desenvolvimento:

```bash
npm install
npm run dev
```

O frontend estará disponível em: **http://localhost:5173**

---

### Passo 5 — Configure o n8n

1. Acesse o n8n em **http://localhost:5678** (credenciais: `admin` / `admin123`)
2. Importe o JSON do seu workflow (se tiver um exportado)
3. Configure as credenciais para:
   - **Redis** — host: `localhost`, porta: `6379`, senha: `redis_secret`
   - **Google Gemini API** — adicione sua chave de API
   - **Groq API** — adicione sua chave de API
   - **Tavily / MediaStack / GNews** — adicione suas chaves de API
4. No nó de trigger **Webhook**, defina **Respond** como `Using Respond to Webhook Node`
5. Clique em **Execute Workflow** no canvas antes de fazer a primeira requisição

> **Dica de desenvolvimento:** Use a URL `webhook-test` no `.env` para desenvolvimento. Troque para `webhook` (sem o `-test`) e ative o toggle do workflow para produção.

---

### Passo 6 — Teste o fluxo completo

```bash
curl -s -X POST http://localhost:5678/webhook-test/chat \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "test-001",
    "user_id": "test-user",
    "path": "news",
    "message": "Quais são as últimas notícias de IA?",
    "model_pref": null,
    "source_pref": null
  }'
```

---

### Inspecionando o Redis

```bash
# Entrar no redis-cli interativo
docker exec -it mymir_redis redis-cli -a redis_secret

# Comandos úteis dentro do cli
KEYS *               # lista todas as chaves
GET cache:user:path  # ver o valor cacheado
TTL cache:user:path  # ver tempo restante para expirar
FLUSHALL             # limpar tudo (cuidado!)
```

---

## Estrutura de Pastas

```text
mymir/
├── backend/
│   ├── app/
│   │   ├── controllers/  # Handlers de rotas
│   │   ├── core/         # Config, Database e Redis
│   │   ├── middleware/   # Autenticação JWT
│   │   ├── models/       # Entidades SQLAlchemy
│   │   ├── schemas/      # Modelos Pydantic
│   │   ├── services/     # Integrações (n8n, etc)
│   │   └── main.py       # Ponto de entrada
│   ├── .env              # Variáveis de ambiente
│   └── requirements.txt  # Dependências Python
├── frontend/
│   ├── src/
│   │   ├── components/   # Componentes React
│   │   ├── pages/        # Páginas
│   │   ├── store/        # Estado global (Zustand)
│   │   ├── services/     # Cliente API
│   │   └── types/        # Tipos TypeScript
│   └── .env              # Ambiente do frontend
├── assets/               # Diagramas e ícones
├── docker-compose.yml    # Infraestrutura (Redis, n8n)
└── README.md
```

## Licença

Distribuído sob a **Licença MIT**. Veja o arquivo `LICENSE` para mais informações.
