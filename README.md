# Kirjastokaveri

A full-stack library companion application.

## Tech Stack

### Frontend Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS

### Backend Stack

- FastAPI
- Uvicorn
- Python 3.12+

## Getting Started

### Frontend Setup

1. Navigate to the frontend directory:

```bash
cd frontend
```

1. Install dependencies:

```bash
npm install
```

1. Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173`.

### Backend Setup

1. Navigate to the backend directory:

```bash
cd backend
```

1. Create and activate a virtual environment (example with `venv`):

```bash
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
```

1. Install dependencies and copy environment variables:

```bash
pip install --upgrade pip
pip install -r requirements.txt
# macOS/Linux
cp .env.example .env
# Windows (PowerShell)
copy .env.example .env
```

1. Start the API with reload enabled:

```bash
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000` with docs at `/docs`.

### Database & pgAdmin

1. Ensure Docker Desktop is running.
2. From the repository root, start the stack:

```bash
docker compose up -d
```

- Postgres URL: `postgresql+psycopg://kirjastokaveri:kirjastokaveri@localhost:5434/kirjastokaveri`
- pgAdmin UI: `http://localhost:5050` (login `admin@example.com` / `admin`)

- Alternative helper script (auto-check and start):

```bash
./scripts/start-stack.sh            # bash/zsh
```

- `--force` stops any running stack first.

1. When finished, stop the containers:

```bash
docker compose down
```

## Available Scripts

### Frontend Commands

- `npm run dev` – start development server
- `npm run build` – build for production
- `npm run preview` – preview production build
- `npm run lint` – run ESLint

### Backend Commands

- `uvicorn app.main:app --reload` – start development server with auto-reload
- `uvicorn app.main:app --host 0.0.0.0 --port 8000` – run with custom host/port

## Project Structure

```text
Kirjastokaveri/
├── backend/           # FastAPI service
│   ├── app/
│   │   ├── api/
│   │   │   └── health.py
│   │   ├── core/
│   │   │   └── config.py
│   │   └── main.py
│   ├── requirements.txt
│   └── README.md
├── frontend/          # React TypeScript frontend
│   ├── src/
│   └── package.json
└── README.md
```
