"""Completed books API routes."""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db import get_db
from app.models.user import User
from app.models.completed import CompletedItem
from app.schemas.completed import CompletedItemCreate, CompletedItemResponse, CompletedItemUpdate

router = APIRouter(prefix="/completed")

logger = logging.getLogger(__name__)


@router.get("", response_model=list[CompletedItemResponse])
async def get_completed_list(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[CompletedItemResponse]:
    """
    Get all items in the current user's completed books list.

    Returns:
        List of completed books
    """
    query = (
        select(CompletedItem)
        .filter(CompletedItem.user_id == current_user.id)
        .order_by(CompletedItem.completed_date.desc())
    )
    items = db.execute(query).scalars().all()
    return [CompletedItemResponse.model_validate(item) for item in items]


@router.post("", response_model=CompletedItemResponse, status_code=status.HTTP_201_CREATED)
async def add_to_completed_list(
    item: CompletedItemCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CompletedItemResponse:
    """
    Add a book to the current user's completed list.

    Args:
        item: Completed item data with book metadata and rating

    Returns:
        Created completed item
    """
    # Check if item already exists (by finna_id if provided)
    if item.finna_id:
        existing = db.execute(
            select(CompletedItem).filter(
                CompletedItem.user_id == current_user.id,
                CompletedItem.finna_id == item.finna_id,
            )
        ).scalar_one_or_none()
        
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Book already in completed list",
            )

    # Create new completed item
    completed_item = CompletedItem(
        user_id=current_user.id,
        finna_id=item.finna_id,
        title=item.title,
        author=item.author,
        cover_image=item.cover_image,
        completed_date=item.completed_date,
        rating=item.rating,
        start_date=item.start_date,
        user_notes=item.user_notes,
        review=item.review,
    )

    db.add(completed_item)
    db.commit()
    db.refresh(completed_item)

    logger.info(f"User {current_user.id} added book '{item.title}' to completed list")

    return CompletedItemResponse.model_validate(completed_item)


@router.get("/{item_id}", response_model=CompletedItemResponse)
async def get_completed_item(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CompletedItemResponse:
    """
    Get a specific completed item by ID.

    Args:
        item_id: Completed item ID

    Returns:
        Completed item details
    """
    item = db.execute(
        select(CompletedItem).filter(
            CompletedItem.id == item_id,
            CompletedItem.user_id == current_user.id,
        )
    ).scalar_one_or_none()

    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Completed item not found",
        )

    return CompletedItemResponse.model_validate(item)


@router.patch("/{item_id}", response_model=CompletedItemResponse)
async def update_completed_item(
    item_id: int,
    update: CompletedItemUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CompletedItemResponse:
    """
    Update a completed item's rating or review.

    Args:
        item_id: Completed item ID
        update: Fields to update

    Returns:
        Updated completed item
    """
    item = db.execute(
        select(CompletedItem).filter(
            CompletedItem.id == item_id,
            CompletedItem.user_id == current_user.id,
        )
    ).scalar_one_or_none()

    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Completed item not found",
        )

    # Update fields
    update_data = update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(item, field, value)

    db.commit()
    db.refresh(item)

    logger.info(f"User {current_user.id} updated completed item {item_id}")

    return CompletedItemResponse.model_validate(item)


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
async def remove_from_completed_list(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Remove a book from the current user's completed list.

    Args:
        item_id: Completed item ID
    """
    item = db.execute(
        select(CompletedItem).filter(
            CompletedItem.id == item_id,
            CompletedItem.user_id == current_user.id,
        )
    ).scalar_one_or_none()

    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Completed item not found",
        )

    db.delete(item)
    db.commit()

    logger.info(f"User {current_user.id} removed completed item {item_id}")


@router.delete("", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
async def clear_completed_list(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Clear all items from the current user's completed list.
    """
    items = db.execute(
        select(CompletedItem).filter(CompletedItem.user_id == current_user.id)
    ).scalars().all()

    for item in items:
        db.delete(item)

    db.commit()

    logger.info(f"User {current_user.id} cleared their completed list")
