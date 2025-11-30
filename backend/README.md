# Kirjastokaveri Backend

FastAPI service powering the Kirjastokaveri application.

## Prerequisites

- Python 3.12+
- Recommended: virtual environment manager such as `venv`, `uv`, or `conda`

## Quick start

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows use: .venv\Scripts\activate
pip install --upgrade pip
pip install -r requirements.txt
# macOS/Linux
cp .env.example .env
# Windows (PowerShell)
copy .env.example .env
uvicorn app.main:app --reload
```

The API runs at `http://localhost:8000`. Documentation is available at `/docs` and `/redoc`.

### Local database stack

- Requires Docker Desktop running locally.
- `docker compose up -d` (from repo root) boots Postgres on `localhost:5434` and pgAdmin at `http://localhost:5050` (login `admin@example.com` / `admin`).
- Helper script: `./scripts/start-stack.sh` (bash/zsh).
- Flags: `--rebuild` rebuilds images, `--force` restarts from scratch.
- The default connection string in `.env.example` is `postgresql+psycopg://kirjastokaveri:kirjastokaveri@localhost:5434/kirjastokaveri`.
- Stop the containers with `docker compose down` when finished.

## Project layout

```text
backend/
├── app/
│   ├── api/
│   │   ├── routes/
│   │   │   └── health.py
│   │   └── __init__.py
│   ├── core/
│   │   └── config.py
│   ├── db/
│   │   ├── base.py
│   │   └── session.py
│   ├── __init__.py
│   └── main.py
├── migrations/
│   ├── README.md
│   ├── env.py
│   └── versions/
├── .env.example
├── README.md
└── requirements.txt
```

## Useful commands

- `uvicorn app.main:app --reload` – start the development server
- `uvicorn app.main:app --host 0.0.0.0 --port 8000` – bind to all interfaces
- `docker compose up -d` – start Postgres (port 5434) and pgAdmin (port 5050)
- `docker compose down` – stop the local database stack
- `alembic revision --autogenerate -m "msg"` – create a migration based on model diffs
- `alembic upgrade head` – apply the latest database migrations
