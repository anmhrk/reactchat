a chat app that allows users to understand and chat with any open source React app. input a GitHub repo URL, wait for it to finish indexing, then start asking questions about the codebase.

## features

- 📂 interactive file tree
- 💻 syntax-highlighted code viewer
- 💬 RAG chat
- 🔖 bookmark chats
- 🔄 recent chats history
- 🌙 dark mode
- 📚 public/private chat sharing
- 📝 quote code snippets as context

## tech stack

- **frontend**: next.js 15 + app router, tailwind css, shadcn/ui
- **backend**: fastapi, uvicorn
- **auth**: clerk
- **database**: sqlalchemy, neon postgres, alembic for migrations
- **llm**: openai gpt-4o, claude 3.5 sonnet
- **rag**: langchain
- **embeddings**: openai text-embedding-3-large

## how to run locally

1. clone the repo

```bash
git clone https://github.com/anmhrk/reactchat.git
cd reactchat
```

2. setup backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

3. copy .env.example to .env and set the env variables in backend/.env

4. start backend server

```bash
uvicorn main:app --reload
```

5. setup frontend

```bash
cd frontend
bun install
```

6. copy .env.example to .env and set the env variables in frontend/.env

7. start frontend server

```bash
bun dev
```

8. open http://localhost:3000 and see the app live in your browser
