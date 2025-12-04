"""Kirjastokaveri FastAPI application entry point."""

from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import api_router
from app.api.dependencies import shutdown_cache_backend
from app.core.cache import create_cache_backend
from app.core.config import get_settings
from app.db import SessionLocal

# Optional scheduler imports - may not be available if APScheduler not installed
try:
    from app.core.scheduler import SchedulerManager
    from app.services.availability_monitor import AvailabilityMonitorService
    from app.services.finna import FinnaService
    SCHEDULER_AVAILABLE = True
except ImportError:
    SchedulerManager = None
    AvailabilityMonitorService = None
    FinnaService = None
    SCHEDULER_AVAILABLE = False

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan context manager for startup/shutdown."""
    logger.info("Starting Kirjastokaveri API...")
    logger.info(f"Environment: {settings.environment}")
    logger.info(f"Finna API base URL: {settings.finna_base_url}")
    
    # Initialize cache on startup
    cache = await create_cache_backend(settings.redis_url)
    logger.info(f"Cache backend initialized: {cache.__class__.__name__}")
    
    # Initialize scheduler for availability monitoring
    scheduler_manager = None
    availability_monitor = None
    
    if settings.scheduler_enabled and SCHEDULER_AVAILABLE:
        logger.info("Initializing availability monitor scheduler...")
        finna_service = FinnaService(settings=settings)
        availability_monitor = AvailabilityMonitorService(
            settings=settings,
            session_factory=SessionLocal,
            finna_service=finna_service,
        )
        scheduler_manager = SchedulerManager(
            settings=settings,
            availability_monitor=availability_monitor,
        )
        scheduler_manager.start()
        logger.info(f"Scheduler started - checking availability every {settings.availability_check_interval_minutes} minutes")
    elif settings.scheduler_enabled and not SCHEDULER_AVAILABLE:
        logger.warning("Scheduler enabled but APScheduler not installed - skipping")
    else:
        logger.info("Scheduler disabled via configuration")
    
    # Store references in app state for potential API access
    app.state.availability_monitor = availability_monitor
    app.state.scheduler_manager = scheduler_manager
    
    yield
    
    # Cleanup on shutdown
    logger.info("Shutting down Kirjastokaveri API...")
    
    # Shutdown scheduler
    if scheduler_manager is not None:
        await scheduler_manager.shutdown()
        logger.info("Scheduler shut down")
    
    await shutdown_cache_backend()
    logger.info("Cache backend closed")


app = FastAPI(
    title=settings.app_name,
    description="Finnish Library Companion - Search books, track wishlists, get notifications",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware - use settings for allowed origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


@app.get("/", summary="API metadata")
async def read_root() -> dict[str, str]:
    """Root endpoint with API information."""
    return {
        "message": "Welcome to the Kirjastokaveri API",
        "environment": settings.environment,
        "docs": "/docs",
        "health": "/api/health",
    }
