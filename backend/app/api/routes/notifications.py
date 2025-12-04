"""Notifications API routes."""

from __future__ import annotations

import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db import get_db
from app.models.notification import Notification, NotificationType
from app.models.user import User
from app.schemas.notification import NotificationResponse, NotificationUpdate

router = APIRouter(prefix="/notifications")

logger = logging.getLogger(__name__)


@router.get("", response_model=list[NotificationResponse])
async def get_notifications(
    unread_only: bool = Query(False, description="Only return unread notifications"),
    limit: int = Query(50, ge=1, le=100, description="Maximum notifications to return"),
    notification_type: NotificationType | None = Query(
        None, alias="type", description="Filter by notification type"
    ),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[NotificationResponse]:
    """
    Get notifications for the current user.

    Args:
        unread_only: If true, only return unread notifications
        limit: Maximum number of notifications to return
        notification_type: Filter by notification type

    Returns:
        List of notifications
    """
    query = select(Notification).filter(Notification.user_id == current_user.id)

    if unread_only:
        query = query.filter(Notification.read == False)

    if notification_type:
        query = query.filter(Notification.notification_type == notification_type)

    query = query.order_by(Notification.created_at.desc()).limit(limit)

    notifications = db.execute(query).scalars().all()
    return [NotificationResponse.model_validate(n) for n in notifications]


@router.get("/unread-count")
async def get_unread_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict[str, int]:
    """
    Get the count of unread notifications.

    Returns:
        Dictionary with unread count
    """
    from sqlalchemy import func

    count = db.execute(
        select(func.count(Notification.id)).filter(
            Notification.user_id == current_user.id,
            Notification.read == False,
        )
    ).scalar()

    return {"unread_count": count or 0}


@router.get("/{notification_id}", response_model=NotificationResponse)
async def get_notification(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> NotificationResponse:
    """
    Get a specific notification by ID.

    Args:
        notification_id: Notification ID

    Returns:
        Notification details
    """
    notification = db.execute(
        select(Notification).filter(
            Notification.id == notification_id,
            Notification.user_id == current_user.id,
        )
    ).scalar_one_or_none()

    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found",
        )

    return NotificationResponse.model_validate(notification)


@router.patch("/{notification_id}", response_model=NotificationResponse)
async def update_notification(
    notification_id: int,
    update_data: NotificationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> NotificationResponse:
    """
    Update a notification (e.g., mark as read).

    Args:
        notification_id: Notification ID
        update_data: Fields to update

    Returns:
        Updated notification
    """
    notification = db.execute(
        select(Notification).filter(
            Notification.id == notification_id,
            Notification.user_id == current_user.id,
        )
    ).scalar_one_or_none()

    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found",
        )

    data = update_data.model_dump(exclude_unset=True)
    for field, value in data.items():
        setattr(notification, field, value)

    db.commit()
    db.refresh(notification)

    return NotificationResponse.model_validate(notification)


@router.post("/mark-all-read", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
async def mark_all_as_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Mark all notifications as read for the current user.
    """
    db.execute(
        update(Notification)
        .where(
            Notification.user_id == current_user.id,
            Notification.read == False,
        )
        .values(read=True)
    )
    db.commit()

    logger.info(f"User {current_user.id} marked all notifications as read")


@router.delete("/{notification_id}", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
async def delete_notification(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Delete a notification.

    Args:
        notification_id: Notification ID
    """
    notification = db.execute(
        select(Notification).filter(
            Notification.id == notification_id,
            Notification.user_id == current_user.id,
        )
    ).scalar_one_or_none()

    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found",
        )

    db.delete(notification)
    db.commit()

    logger.info(f"User {current_user.id} deleted notification {notification_id}")


@router.delete("", status_code=status.HTTP_204_NO_CONTENT, response_class=Response)
async def clear_notifications(
    read_only: bool = Query(
        True, description="Only delete read notifications (default: true)"
    ),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Clear notifications for the current user.

    Args:
        read_only: If true, only clear read notifications
    """
    query = select(Notification).filter(Notification.user_id == current_user.id)

    if read_only:
        query = query.filter(Notification.read == True)

    notifications = db.execute(query).scalars().all()

    for notification in notifications:
        db.delete(notification)

    db.commit()

    logger.info(
        f"User {current_user.id} cleared notifications (read_only={read_only})"
    )
