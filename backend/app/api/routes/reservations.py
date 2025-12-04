"""Reservations API routes."""

from __future__ import annotations

import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db import get_db
from app.models.reservation import Reservation, ReservationStatus
from app.models.user import User
from app.schemas.reservation import (
    ReservationCreate,
    ReservationResponse,
    ReservationUpdate,
)

router = APIRouter(prefix="/reservations")

logger = logging.getLogger(__name__)


@router.get("", response_model=list[ReservationResponse])
async def get_reservations(
    status_filter: ReservationStatus | None = Query(
        None, alias="status", description="Filter by reservation status"
    ),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[ReservationResponse]:
    """
    Get all reservations for the current user.

    Args:
        status_filter: Optional filter by reservation status

    Returns:
        List of reservations
    """
    query = select(Reservation).filter(Reservation.user_id == current_user.id)

    if status_filter:
        query = query.filter(Reservation.status == status_filter)

    query = query.order_by(Reservation.created_at.desc())

    reservations = db.execute(query).scalars().all()
    return [ReservationResponse.model_validate(r) for r in reservations]


@router.post("", response_model=ReservationResponse, status_code=status.HTTP_201_CREATED)
async def create_reservation(
    reservation: ReservationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ReservationResponse:
    """
    Create a new reservation record.

    Note: This creates a local tracking record. The actual reservation
    should be made through the library's system (e.g., Finna).

    Args:
        reservation: Reservation data

    Returns:
        Created reservation
    """
    # Check for existing active reservation for same book
    existing = db.execute(
        select(Reservation).filter(
            Reservation.user_id == current_user.id,
            Reservation.finna_id == reservation.finna_id,
            Reservation.status.in_([
                ReservationStatus.PENDING,
                ReservationStatus.CONFIRMED,
                ReservationStatus.READY_FOR_PICKUP,
            ]),
        )
    ).scalar_one_or_none()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Active reservation already exists for this book",
        )

    new_reservation = Reservation(
        user_id=current_user.id,
        finna_id=reservation.finna_id,
        title=reservation.title,
        author=reservation.author,
        library_id=reservation.library_id,
        library_name=reservation.library_name,
        status=ReservationStatus.PENDING,
        queue_position=reservation.queue_position,
        estimated_wait_days=reservation.estimated_wait_days,
    )

    db.add(new_reservation)
    db.commit()
    db.refresh(new_reservation)

    logger.info(
        f"User {current_user.id} created reservation for {reservation.finna_id}"
    )

    return ReservationResponse.model_validate(new_reservation)


@router.get("/{reservation_id}", response_model=ReservationResponse)
async def get_reservation(
    reservation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ReservationResponse:
    """
    Get a specific reservation by ID.

    Args:
        reservation_id: Reservation ID

    Returns:
        Reservation details
    """
    reservation = db.execute(
        select(Reservation).filter(
            Reservation.id == reservation_id,
            Reservation.user_id == current_user.id,
        )
    ).scalar_one_or_none()

    if not reservation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reservation not found",
        )

    return ReservationResponse.model_validate(reservation)


@router.patch("/{reservation_id}", response_model=ReservationResponse)
async def update_reservation(
    reservation_id: int,
    update: ReservationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ReservationResponse:
    """
    Update a reservation's status or details.

    Args:
        reservation_id: Reservation ID
        update: Fields to update

    Returns:
        Updated reservation
    """
    reservation = db.execute(
        select(Reservation).filter(
            Reservation.id == reservation_id,
            Reservation.user_id == current_user.id,
        )
    ).scalar_one_or_none()

    if not reservation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reservation not found",
        )

    # Validate status transitions
    update_data = update.model_dump(exclude_unset=True)

    if "status" in update_data:
        new_status = update_data["status"]
        valid_transitions = _get_valid_transitions(reservation.status)
        if new_status not in valid_transitions:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status transition from {reservation.status.value} to {new_status.value}",
            )

    for field, value in update_data.items():
        setattr(reservation, field, value)

    db.commit()
    db.refresh(reservation)

    logger.info(
        f"User {current_user.id} updated reservation {reservation_id}"
    )

    return ReservationResponse.model_validate(reservation)


@router.delete("/{reservation_id}", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
async def cancel_reservation(
    reservation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Cancel (delete) a reservation.

    Note: This removes the local tracking record. The actual cancellation
    should be done through the library's system.

    Args:
        reservation_id: Reservation ID
    """
    reservation = db.execute(
        select(Reservation).filter(
            Reservation.id == reservation_id,
            Reservation.user_id == current_user.id,
        )
    ).scalar_one_or_none()

    if not reservation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reservation not found",
        )

    # Only allow cancellation for certain statuses
    if reservation.status in [
        ReservationStatus.PICKED_UP,
        ReservationStatus.RETURNED,
    ]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot cancel a completed reservation",
        )

    db.delete(reservation)
    db.commit()

    logger.info(
        f"User {current_user.id} cancelled reservation {reservation_id}"
    )


def _get_valid_transitions(current_status: ReservationStatus) -> list[ReservationStatus]:
    """Get valid status transitions from current status."""
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
