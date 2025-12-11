# Kirjastokaveri

A full-stack library companion application for Finnish libraries. Search books, find availability at nearby libraries, track your reading, and get notified when books become available.

## Features

- 🔍 **Book Search** - Search Finnish library catalogs via Finna API
- 📍 **Nearby Libraries** - Find libraries near you with real-time availability
- 📚 **Reading Lists** - Track books you want to read, are reading, or have completed
- 🔔 **Notifications** - Get notified when tracked books become available
- 🗺️ **Library Map** - Interactive map showing library locations and distances

## Tech Stack

### Frontend Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS 4
- Leaflet (maps)

### Backend Stack

- FastAPI
- Python 3.12+
- PostgreSQL 16
- SQLAlchemy 2.0
- Alembic (migrations)
- APScheduler (background jobs)

## Quick Start with Docker

```bash
# Full stack (database + backend + frontend + library seeding)
docker compose --profile full up --build

# First run will:
# 1. Start PostgreSQL database
# 2. Run database migrations
# 3. Fetch 900+ Finnish libraries from Kirjastot.fi API
# 4. Start backend API at http://localhost:8000
# 5. Start frontend at http://localhost:5173
```

**Access the application:**

- Frontend: <http://localhost:5173>
- Backend API: <http://localhost:8000/docs>
- Database: `postgresql://kirjastokaveri:kirjastokaveri@localhost:5434/kirjastokaveri`

**Other options:**

```bash
# Just database (for manual backend/frontend dev)
docker compose up

# Database + pgAdmin
docker compose --profile tools up

# pgAdmin: http://localhost:5050 (admin@example.com / admin)
```

**Stop everything:**

```bash
docker compose down

# To also remove database data:
docker compose down -v
```

## Manual Setup

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The application will be available at `http://localhost:5173`.

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment variables
cp .env.example .env  # Edit as needed

# Run migrations
alembic upgrade head

# Seed library data (first time only)
python scripts/fetch_kirjastot_fi.py

# Start the API
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000` with docs at `/docs`.

### Database Setup (without Docker Compose)

1. Ensure Docker Desktop is running.
2. Start just the database:

```bash
docker compose up -d db
```

Database URL: `postgresql+psycopg://kirjastokaveri:kirjastokaveri@localhost:5434/kirjastokaveri`

## Available Scripts

### Frontend Commands

- `npm run dev` – start development server
- `npm run build` – build for production
- `npm run preview` – preview production build
- `npm run lint` – run ESLint

### Backend Commands

- `uvicorn app.main:app --reload` – start development server with auto-reload
- `alembic upgrade head` – run database migrations
- `python scripts/fetch_kirjastot_fi.py` – seed library data from Kirjastot.fi API

## Project Structure

```text
Kirjastokaveri/
├── docker-compose.yml         # Docker setup (db, backend, frontend)
├── backend/                   # FastAPI service
│   ├── app/
│   │   ├── api/              # API routes
│   │   ├── core/             # Config, security
│   │   ├── db/               # Database session
│   │   ├── models/           # SQLAlchemy models
│   │   ├── schemas/          # Pydantic schemas
│   │   └── services/         # Business logic
│   ├── migrations/           # Alembic migrations
│   └── scripts/              # Data seeding scripts
├── frontend/                  # React TypeScript frontend
│   ├── src/
│   │   ├── components/       # UI components
│   │   ├── contexts/         # React contexts
│   │   ├── hooks/            # Custom hooks
│   │   ├── pages/            # Page components
│   │   └── services/         # API services
│   └── package.json
└── README.md
```

## API Documentation

Once the backend is running, visit:

- Swagger UI: <http://localhost:8000/docs>
- ReDoc: <http://localhost:8000/redoc>

## Environment Variables

See `backend/.env.example` for required environment variables.
