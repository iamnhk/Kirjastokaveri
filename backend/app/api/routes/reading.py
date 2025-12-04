"""Reading list API routes."""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db import get_db
from app.models.user import User
from app.models.reading import ReadingItem
from app.schemas.reading import ReadingItemCreate, ReadingItemResponse, ReadingItemUpdate

router = APIRouter(prefix="/reading")

logger = logging.getLogger(__name__)


@router.get("", response_model=list[ReadingItemResponse])
async def get_reading_list(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[ReadingItemResponse]:
    """
    Get all items in the current user's reading list.

    Returns:
        List of currently reading items
    """
    query = (
        select(ReadingItem)
        .filter(ReadingItem.user_id == current_user.id)
        .order_by(ReadingItem.created_at.desc())
    )
    items = db.execute(query).scalars().all()
    return [ReadingItemResponse.model_validate(item) for item in items]


@router.post("", response_model=ReadingItemResponse, status_code=status.HTTP_201_CREATED)
async def add_to_reading_list(
    item: ReadingItemCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ReadingItemResponse:
    """
    Add a book to the current user's reading list.

    Args:
        item: Reading item data with book metadata

    Returns:
        Created reading item
    """
    # Check if item already exists (by finna_id if provided, otherwise by title)
    if item.finna_id:
        existing = db.execute(
            select(ReadingItem).filter(
                ReadingItem.user_id == current_user.id,
                ReadingItem.finna_id == item.finna_id,
            )
        ).scalar_one_or_none()
        
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Book already in reading list",
            )

    # Create new reading item
    reading_item = ReadingItem(
        user_id=current_user.id,
        finna_id=item.finna_id,
        title=item.title,
        author=item.author,
        cover_image=item.cover_image,
        progress=item.progress,
        library_id=item.library_id,
        library_name=item.library_name,
        due_date=item.due_date,
        start_date=item.start_date,
        user_notes=item.user_notes,
    )

    db.add(reading_item)
    db.commit()
    db.refresh(reading_item)

    logger.info(f"User {current_user.id} added book '{item.title}' to reading list")

    return ReadingItemResponse.model_validate(reading_item)


@router.get("/{item_id}", response_model=ReadingItemResponse)
async def get_reading_item(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ReadingItemResponse:
    """
    Get a specific reading item by ID.

    Args:
        item_id: Reading item ID

    Returns:
        Reading item details
    """
    item = db.execute(
        select(ReadingItem).filter(
            ReadingItem.id == item_id,
            ReadingItem.user_id == current_user.id,
        )
    ).scalar_one_or_none()

    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reading item not found",
        )

    return ReadingItemResponse.model_validate(item)


@router.patch("/{item_id}", response_model=ReadingItemResponse)
async def update_reading_item(
    item_id: int,
    update: ReadingItemUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ReadingItemResponse:
    """
    Update a reading item's progress or settings.

    Args:
        item_id: Reading item ID
        update: Fields to update

    Returns:
        Updated reading item
    """
    item = db.execute(
        select(ReadingItem).filter(
            ReadingItem.id == item_id,
            ReadingItem.user_id == current_user.id,
        )
    ).scalar_one_or_none()

    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reading item not found",
        )

    # Update fields
    update_data = update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(item, field, value)

    db.commit()
    db.refresh(item)

    logger.info(f"User {current_user.id} updated reading item {item_id}")

    return ReadingItemResponse.model_validate(item)


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
async def remove_from_reading_list(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Remove a book from the current user's reading list.

    Args:
        item_id: Reading item ID
    """
    item = db.execute(
        select(ReadingItem).filter(
            ReadingItem.id == item_id,
            ReadingItem.user_id == current_user.id,
        )
    ).scalar_one_or_none()

    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reading item not found",
        )

    db.delete(item)
    db.commit()

    logger.info(f"User {current_user.id} removed reading item {item_id}")


@router.delete("", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
async def clear_reading_list(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Clear all items from the current user's reading list.
    """
    items = db.execute(
        select(ReadingItem).filter(ReadingItem.user_id == current_user.id)
    ).scalars().all()

    for item in items:
        db.delete(item)

    db.commit()

    logger.info(f"User {current_user.id} cleared their reading list")
