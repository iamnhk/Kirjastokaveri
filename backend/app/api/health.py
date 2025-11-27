from fastapi import APIRouter

router = APIRouter()


@router.get("/", summary="Service health status")
async def get_health() -> dict[str, str]:
    """Return basic service health information."""
    return {"status": "ok"}
