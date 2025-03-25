FROM python:3.13-slim

WORKDIR /app

COPY pyproject.toml .
COPY .env.example .env

RUN pip install --no-cache-dir uv

RUN uv venv .venv

RUN uv pip install --no-cache-dir -r pyproject.toml

COPY . .

ENV PATH="/app/.venv/bin:${PATH}"

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
