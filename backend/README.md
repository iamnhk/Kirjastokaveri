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

## Project layout

```text
backend/
├── app/
│   ├── api/
│   │   └── health.py
│   ├── core/
│   │   └── config.py
│   ├── __init__.py
│   └── main.py
├── .env.example
├── .gitignore
├── README.md
└── requirements.txt
```

## Useful commands

- `uvicorn app.main:app --reload` – start the development server
- `uvicorn app.main:app --host 0.0.0.0 --port 8000` – bind to all interfaces
