"""Unified Books API routes for all book lists."""

from __future__ import annotations

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db import get_db
from app.models.user import User
from app.models.user_book import ListType, ReservationStatus, UserBook
from app.schemas.user_book import (
    CompletedItemCreate,
    ReadingItemCreate,
    ReservationCreate,
    UserBookCreate,
    UserBookResponse,
    UserBookUpdate,
    WishlistItemCreate,
)

router = APIRouter(prefix="/books")

logger = logging.getLogger(__name__)


@router.get("", response_model=list[UserBookResponse])
async def get_books(
    list_type: Optional[ListType] = Query(
        None, alias="list", description="Filter by list type (wishlist, reading, completed, reserved)"
    ),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[UserBookResponse]:
    """
    Get all books for the current user, optionally filtered by list type.

    Args:
        list_type: Optional filter by list type

    Returns:
        List of user's books
    """
    query = select(UserBook).filter(UserBook.user_id == current_user.id)

    if list_type:
        query = query.filter(UserBook.list_type == list_type)

    query = query.order_by(UserBook.created_at.desc())

    books = db.execute(query).scalars().all()
    return [UserBookResponse.model_validate(book) for book in books]


@router.post("", response_model=UserBookResponse, status_code=status.HTTP_201_CREATED)
async def add_book(
    book: UserBookCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserBookResponse:
    """
    Add a book to one of the user's lists.

    Args:
        book: Book data with list_type

    Returns:
        Created book entry
    """
    # Check for existing entry in the same list
    existing = db.execute(
        select(UserBook).filter(
            UserBook.user_id == current_user.id,
            UserBook.finna_id == book.finna_id,
            UserBook.list_type == book.list_type,
        )
    ).scalar_one_or_none()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Book already in {book.list_type.value} list",
        )

    # Create new book entry
    user_book = UserBook(
        user_id=current_user.id,
        list_type=book.list_type,
        finna_id=book.finna_id,
        title=book.title,
        author=book.author,
        cover_image=book.cover_image,
        year=book.year,
        isbn=book.isbn,
        library_id=book.library_id,
        library_name=book.library_name,
        start_date=book.start_date,
        due_date=book.due_date,
        completed_date=book.completed_date,
        reservation_date=book.reservation_date,
        pickup_deadline=book.pickup_deadline,
        progress=book.progress,
        rating=book.rating,
        review=book.review,
        status=book.status,
        queue_position=book.queue_position,
        estimated_wait_days=book.estimated_wait_days,
        notify_on_available=book.notify_on_available,
        user_notes=book.user_notes,
    )

    db.add(user_book)
    db.commit()
    db.refresh(user_book)

    logger.info(f"User {current_user.id} added '{book.title}' to {book.list_type.value}")

    return UserBookResponse.model_validate(user_book)


@router.get("/{book_id}", response_model=UserBookResponse)
async def get_book(
    book_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserBookResponse:
    """
    Get a specific book by ID.

    Args:
        book_id: Book entry ID

    Returns:
        Book details
    """
    book = db.execute(
        select(UserBook).filter(
            UserBook.id == book_id,
            UserBook.user_id == current_user.id,
        )
    ).scalar_one_or_none()

    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Book not found",
        )

    return UserBookResponse.model_validate(book)


@router.patch("/{book_id}", response_model=UserBookResponse)
async def update_book(
    book_id: int,
    update: UserBookUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserBookResponse:
    """
    Update a book entry. Can also move between lists by changing list_type.

    Args:
        book_id: Book entry ID
        update: Fields to update

    Returns:
        Updated book entry
    """
    book = db.execute(
        select(UserBook).filter(
            UserBook.id == book_id,
            UserBook.user_id == current_user.id,
        )
    ).scalar_one_or_none()

    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Book not found",
        )

    update_data = update.model_dump(exclude_unset=True)

    # If changing list_type, check for duplicate in target list
    if "list_type" in update_data and update_data["list_type"] != book.list_type:
        new_list_type = update_data["list_type"]
        existing_in_target = db.execute(
            select(UserBook).filter(
                UserBook.user_id == current_user.id,
                UserBook.finna_id == book.finna_id,
                UserBook.list_type == new_list_type,
                UserBook.id != book_id,
            )
        ).scalar_one_or_none()

        if existing_in_target:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Book already exists in {new_list_type.value} list",
            )

        logger.info(
            f"User {current_user.id} moving '{book.title}' from {book.list_type.value} to {new_list_type.value}"
        )

    # Validate status transitions for reservations
    if "status" in update_data and book.list_type == ListType.RESERVED:
        new_status = update_data["status"]
        valid_transitions = _get_valid_status_transitions(book.status)
        if new_status not in valid_transitions:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status transition from {book.status.value if book.status else 'None'} to {new_status.value}",
            )

    for field, value in update_data.items():
        setattr(book, field, value)

    db.commit()
    db.refresh(book)

    logger.info(f"User {current_user.id} updated book {book_id}")

    return UserBookResponse.model_validate(book)


@router.delete("/{book_id}", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
async def remove_book(
    book_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Remove a book from the user's lists.

    Args:
        book_id: Book entry ID
    """
    book = db.execute(
        select(UserBook).filter(
            UserBook.id == book_id,
            UserBook.user_id == current_user.id,
        )
    ).scalar_one_or_none()

    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Book not found",
        )

    # Prevent deletion of picked-up or returned reservations
    if book.list_type == ListType.RESERVED and book.status in [
        ReservationStatus.PICKED_UP,
        ReservationStatus.RETURNED,
    ]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete a completed reservation",
        )

    db.delete(book)
    db.commit()

    logger.info(f"User {current_user.id} removed book {book_id} from {book.list_type.value}")


@router.delete("", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
async def clear_list(
    list_type: ListType = Query(..., alias="list", description="List type to clear"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Clear all books from a specific list.

    Args:
        list_type: Which list to clear
    """
    books = db.execute(
        select(UserBook).filter(
            UserBook.user_id == current_user.id,
            UserBook.list_type == list_type,
        )
    ).scalars().all()

    for book in books:
        db.delete(book)

    db.commit()

    logger.info(f"User {current_user.id} cleared their {list_type.value} list")


# === Convenience endpoints for backward compatibility ===

@router.post("/wishlist", response_model=UserBookResponse, status_code=status.HTTP_201_CREATED)
async def add_to_wishlist(
    item: WishlistItemCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserBookResponse:
    """Add a book to wishlist (convenience endpoint)."""
    return await add_book(item.to_user_book_create(), current_user, db)


@router.post("/reading", response_model=UserBookResponse, status_code=status.HTTP_201_CREATED)
async def add_to_reading(
    item: ReadingItemCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserBookResponse:
    """Add a book to reading list (convenience endpoint)."""
    return await add_book(item.to_user_book_create(), current_user, db)


@router.post("/completed", response_model=UserBookResponse, status_code=status.HTTP_201_CREATED)
async def add_to_completed(
    item: CompletedItemCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserBookResponse:
    """Add a book to completed list (convenience endpoint)."""
    return await add_book(item.to_user_book_create(), current_user, db)


@router.post("/reservations", response_model=UserBookResponse, status_code=status.HTTP_201_CREATED)
async def add_reservation(
    item: ReservationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserBookResponse:
    """Create a reservation (convenience endpoint)."""
    return await add_book(item.to_user_book_create(), current_user, db)


def _get_valid_status_transitions(current_status: Optional[ReservationStatus]) -> list[ReservationStatus]:
    """Get valid status transitions from current status."""
    if current_status is None:
        return list(ReservationStatus)
    
    transitions = {
        ReservationStatus.PENDING: [
            ReservationStatus.CONFIRMED,
            ReservationStatus.CANCELLED,
        ],
        ReservationStatus.CONFIRMED: [
            ReservationStatus.READY_FOR_PICKUP,
            ReservationStatus.CANCELLED,
        ],
        ReservationStatus.READY_FOR_PICKUP: [
            ReservationStatus.PICKED_UP,
            ReservationStatus.CANCELLED,
        ],
        ReservationStatus.PICKED_UP: [
            ReservationStatus.RETURNED,
        ],
        ReservationStatus.RETURNED: [],
        ReservationStatus.CANCELLED: [],
    }
    return transitions.get(current_status, [])
