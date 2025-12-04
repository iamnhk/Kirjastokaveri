# Kirjastokaveri Backend

FastAPI service powering the Kirjastokaveri application - a Finnish Library Companion for searching books, tracking wishlists, and getting availability notifications.

## Prerequisites

- Python 3.12+
- Recommended: virtual environment manager such as `venv`, `uv`, or `conda`
- Docker Desktop (for PostgreSQL and Redis)

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

## API Endpoints

### Authentication (`/api/auth`)
- `POST /auth/signup` - Register a new user
- `POST /auth/login` - Login and get JWT tokens
- `POST /auth/refresh` - Refresh access token
- `GET /auth/me` - Get current user profile
- `POST /auth/logout` - Logout (placeholder)

### Search (`/api/search`)
- `GET /search` - Search for books via Finna API
  - Query params: `query`, `type`, `limit`, `author[]`, `subject[]`, `format[]`
- `GET /search/availability/{record_id}` - Get book availability across libraries

### Wishlist (`/api/wishlist`)
- `GET /wishlist` - Get user's wishlist items
- `POST /wishlist` - Add a book to wishlist
- `GET /wishlist/{item_id}` - Get specific wishlist item
- `PATCH /wishlist/{item_id}` - Update wishlist item settings
- `DELETE /wishlist/{item_id}` - Remove from wishlist
- `DELETE /wishlist` - Clear entire wishlist

### Reservations (`/api/reservations`)
- `GET /reservations` - Get user's reservations
- `POST /reservations` - Create a reservation record
- `GET /reservations/{reservation_id}` - Get specific reservation
- `PATCH /reservations/{reservation_id}` - Update reservation status
- `DELETE /reservations/{reservation_id}` - Cancel reservation

### Notifications (`/api/notifications`)
- `GET /notifications` - Get user notifications
- `GET /notifications/unread-count` - Get unread notification count
- `GET /notifications/{notification_id}` - Get specific notification
- `PATCH /notifications/{notification_id}` - Update notification (mark read)
- `POST /notifications/mark-all-read` - Mark all as read
- `DELETE /notifications/{notification_id}` - Delete notification
- `DELETE /notifications` - Clear notifications

### Libraries (`/api/libraries`)
- `GET /libraries` - Get libraries (with optional proximity search)
- `GET /libraries/{library_id}` - Get specific library
- `GET /libraries/nearby/search` - Search nearby libraries by coordinates

### Health (`/api/health`)
- `GET /health` - Service health status

## Project layout

```text
backend/
├── app/
│   ├── api/
│   │   ├── routes/
│   │   │   ├── auth.py
│   │   │   ├── health.py
│   │   │   ├── libraries.py
│   │   │   ├── notifications.py
│   │   │   ├── reservations.py
│   │   │   ├── search.py
│   │   │   └── wishlist.py
│   │   ├── dependencies.py
│   │   └── __init__.py
│   ├── core/
│   │   ├── cache.py
│   │   ├── config.py
│   │   ├── dependencies.py
│   │   └── security.py
│   ├── db/
│   │   ├── base.py
│   │   └── session.py
│   ├── models/
│   │   ├── library.py
│   │   ├── notification.py
│   │   ├── reservation.py
│   │   ├── user.py
│   │   └── wishlist.py
│   ├── schemas/
│   │   ├── auth.py
│   │   ├── availability.py
│   │   ├── library.py
│   │   ├── notification.py
│   │   ├── reservation.py
│   │   ├── search.py
│   │   └── wishlist.py
│   ├── services/
│   │   ├── finna.py
│   │   └── library_service.py
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

## Environment Variables

Key environment variables (see `.env.example`):

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql+psycopg://kirjastokaveri:kirjastokaveri@localhost:5434/kirjastokaveri` |
| `SECRET_KEY` | JWT signing secret | (auto-generated if not set) |
| `FINNA_BASE_URL` | Finna API base URL | `https://api.finna.fi` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379/0` |
| `CORS_ALLOW_ORIGINS` | Allowed CORS origins | `http://localhost:5173` |

## Useful commands

- `uvicorn app.main:app --reload` – start the development server
- `uvicorn app.main:app --host 0.0.0.0 --port 8000` – bind to all interfaces
- `docker compose up -d` – start Postgres (port 5434) and pgAdmin (port 5050)
- `docker compose down` – stop the local database stack
- `alembic revision --autogenerate -m "msg"` – create a migration based on model diffs
- `alembic upgrade head` – apply the latest database migrations

## External APIs

### Finna API
The backend integrates with [Finna API](https://api.finna.fi) for:
- Book search across Finnish libraries
- Cover image retrieval
- Availability status checking

### Kirjastot.fi
Library metadata and location information (for populating the libraries table).
