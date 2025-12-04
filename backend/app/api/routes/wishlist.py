"""Wishlist API routes."""

from __future__ import annotations

import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db import get_db
from app.models.user import User
from app.models.wishlist import WishlistItem
from app.schemas.wishlist import WishlistItemCreate, WishlistItemResponse, WishlistItemUpdate

router = APIRouter(prefix="/wishlist")

logger = logging.getLogger(__name__)


@router.get("", response_model=list[WishlistItemResponse])
async def get_wishlist(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[WishlistItemResponse]:
    """
    Get all items in the current user's wishlist.

    Returns:
        List of wishlist items
    """
    query = (
        select(WishlistItem)
        .filter(WishlistItem.user_id == current_user.id)
        .order_by(WishlistItem.created_at.desc())
    )
    items = db.execute(query).scalars().all()
    return [WishlistItemResponse.model_validate(item) for item in items]


@router.post("", response_model=WishlistItemResponse, status_code=status.HTTP_201_CREATED)
async def add_to_wishlist(
    item: WishlistItemCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> WishlistItemResponse:
    """
    Add a book to the current user's wishlist.

    Args:
        item: Wishlist item data with Finna ID and book metadata

    Returns:
        Created wishlist item
    """
    # Check if item already exists
    existing = db.execute(
        select(WishlistItem).filter(
            WishlistItem.user_id == current_user.id,
            WishlistItem.finna_id == item.finna_id,
        )
    ).scalar_one_or_none()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Book already in wishlist",
        )

    # Create new wishlist item
    wishlist_item = WishlistItem(
        user_id=current_user.id,
        finna_id=item.finna_id,
        title=item.title,
        author=item.author,
        year=item.year,
        isbn=item.isbn,
        cover_image=item.cover_image,
        notify_on_available=item.notify_on_available,
        preferred_library_id=item.preferred_library_id,
        preferred_library_name=item.preferred_library_name,
        user_notes=item.user_notes,
    )

    db.add(wishlist_item)
    db.commit()
    db.refresh(wishlist_item)

    logger.info(f"User {current_user.id} added book {item.finna_id} to wishlist")

    return WishlistItemResponse.model_validate(wishlist_item)


@router.get("/{item_id}", response_model=WishlistItemResponse)
async def get_wishlist_item(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> WishlistItemResponse:
    """
    Get a specific wishlist item by ID.

    Args:
        item_id: Wishlist item ID

    Returns:
        Wishlist item details
    """
    item = db.execute(
        select(WishlistItem).filter(
            WishlistItem.id == item_id,
            WishlistItem.user_id == current_user.id,
        )
    ).scalar_one_or_none()

    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wishlist item not found",
        )

    return WishlistItemResponse.model_validate(item)


@router.patch("/{item_id}", response_model=WishlistItemResponse)
async def update_wishlist_item(
    item_id: int,
    update: WishlistItemUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> WishlistItemResponse:
    """
    Update a wishlist item's settings.

    Args:
        item_id: Wishlist item ID
        update: Fields to update

    Returns:
        Updated wishlist item
    """
    item = db.execute(
        select(WishlistItem).filter(
            WishlistItem.id == item_id,
            WishlistItem.user_id == current_user.id,
        )
    ).scalar_one_or_none()

    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wishlist item not found",
        )

    # Update fields
    update_data = update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(item, field, value)

    db.commit()
    db.refresh(item)

    logger.info(f"User {current_user.id} updated wishlist item {item_id}")

    return WishlistItemResponse.model_validate(item)


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
async def remove_from_wishlist(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Remove a book from the current user's wishlist.

    Args:
        item_id: Wishlist item ID
    """
    item = db.execute(
        select(WishlistItem).filter(
            WishlistItem.id == item_id,
            WishlistItem.user_id == current_user.id,
        )
    ).scalar_one_or_none()

    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wishlist item not found",
        )

    db.delete(item)
    db.commit()

    logger.info(f"User {current_user.id} removed wishlist item {item_id}")


@router.delete("", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
async def clear_wishlist(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Clear all items from the current user's wishlist.
    """
    items = db.execute(
        select(WishlistItem).filter(WishlistItem.user_id == current_user.id)
    ).scalars().all()

    for item in items:
        db.delete(item)

    db.commit()

    logger.info(f"User {current_user.id} cleared their wishlist")
