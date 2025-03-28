a chat app that allows users to understand and chat with any open source React app. input a GitHub repo URL, wait for it to finish indexing, then start asking questions about the codebase.

## features

- 📂 interactive file tree
- 💻 syntax-highlighted code viewer
- 💬 RAG chat
- 🔖 bookmark chats
- 🔄 recent chats history
- 🌙 dark mode
- 📝 quote code snippets as context

## tech stack

- **frontend**: next.js 15 + app router, tailwind css, shadcn/ui
- **backend**: fastapi, uvicorn
- **auth**: clerk
- **database**: sqlalchemy, neon postgres, alembic for migrations
- **llm**: openai gpt-4o, claude 3.5 sonnet
- **rag**: langchain, pinecone as vector store
- **embeddings**: openai text-embedding-3-large

## how to run locally

1. make sure you have [bun](https://bun.sh), [uv](https://docs.astral.sh/uv/), and [ngrok](https://ngrok.com/) installed

2. clone the repo

```bash
git clone https://github.com/anmhrk/reactchat.git
cd reactchat
```

2. setup backend

```bash
cd backend
uv venv .venv
source .venv/bin/activate
uv sync
```

3. copy .env.example to .env and set the env variables

```bash
cp .env.example .env # leave the CLERK_WEBHOOK_SECRET empty for now
```

4. database setup

```bash
alembic revision --autogenerate -m "initial migration" # delete backend/db/alembic/versions first
alembic upgrade head
```

5. start backend server

```bash
uvicorn main:app --reload
```

6. expose backend server so it can be used by the clerk webhook. add the ngrok url to the clerk webhook url in the clerk dashboard. then copy the webhook secret and add it to the .env file.

```bash
ngrok http 8000
```

7. setup frontend

```bash
cd frontend
bun install
```

8. copy .env.example to .env and set the env variables

```bash
cp .env.example .env
```

9. start frontend server

```bash
bun dev
```

10. navigate to http://localhost:3000 in your browser and see the app live
