"""
Background availability monitoring and notification service.

This service periodically checks book availability for users' wishlist items
and creates notifications when books become available.
"""

from __future__ import annotations

import asyncio
import logging
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from typing import Any, Callable, Sequence

from sqlalchemy.orm import Session

from app.core.config import Settings
from app.models.notification import Notification, NotificationType
from app.models.user import User
from app.models.user_book import UserBook, ListType
from app.schemas.availability import AvailabilityResponse
from app.services.finna import FinnaService

SessionFactory = Callable[[], Session]
_logger = logging.getLogger(__name__)


@dataclass(slots=True)
class WishlistTarget:
    """Persisted wishlist item to be checked for availability."""

    id: int
    user_id: int
    finna_id: str
    title: str
    is_available: bool
    preferred_library_name: str | None


@dataclass(slots=True)
class AvailabilityUpdate:
    """Updated availability state for a wishlist item."""

    target: WishlistTarget
    available: bool
    availability_payload: list[dict[str, Any]]
    checked_at: datetime
    notify: bool
    preferred_hit: dict[str, Any] | None = None


@dataclass(slots=True)
class AvailabilityJobResult:
    """Outcome metrics for one monitoring run."""

    items_checked: int = 0
    updates_persisted: int = 0
    notifications_created: int = 0
    errors: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass(slots=True)
class AvailabilityJobState:
    """Internal state used for status reporting."""

    last_started_at: datetime | None = None
    last_completed_at: datetime | None = None
    last_success_at: datetime | None = None
    last_error_at: datetime | None = None
    last_error_message: str | None = None
    last_duration_seconds: float | None = None
    last_result: AvailabilityJobResult | None = None

    def to_dict(self) -> dict[str, Any]:
        def _serialize(value: datetime | None) -> str | None:
            if value is None:
                return None
            return value.isoformat(timespec="seconds")

        return {
            "last_started_at": _serialize(self.last_started_at),
            "last_completed_at": _serialize(self.last_completed_at),
            "last_success_at": _serialize(self.last_success_at),
            "last_error_at": _serialize(self.last_error_at),
            "last_error_message": self.last_error_message,
            "last_duration_seconds": self.last_duration_seconds,
            "last_result": self.last_result.to_dict() if self.last_result else None,
        }


class JobAlreadyRunningError(RuntimeError):
    """Raised when attempting to run while a previous run is still active."""


class AvailabilityMonitorService:
    """Runs scheduled availability checks and stores notification results."""

    def __init__(
        self,
        *,
        settings: Settings,
        session_factory: SessionFactory,
        finna_service: FinnaService,
    ) -> None:
        self._settings = settings
        self._session_factory = session_factory
        self._finna_service = finna_service
        self._lock = asyncio.Lock()
        self._state = AvailabilityJobState()
        # Default batch size if not in settings
        self._batch_size = getattr(settings, 'availability_check_batch_size', 50)

    @property
    def settings(self) -> Settings:
        return self._settings

    def status(self) -> dict[str, Any]:
        """Return the current status of the availability monitor."""
        return {
            "running": self._lock.locked(),
            "state": self._state.to_dict(),
        }

    async def run(self, triggered_by: str = "scheduler") -> AvailabilityJobResult:
        """Run the availability check for all wishlist items with notifications enabled."""
        if self._lock.locked():
            raise JobAlreadyRunningError("Availability monitor task already running")

        async with self._lock:
            start_time = datetime.now(timezone.utc)
            _logger.info("Starting availability monitor run", extra={"triggered_by": triggered_by})
            self._state.last_started_at = start_time
            result = AvailabilityJobResult()
            
            try:
                updates, total_targets = await self._collect_updates(result)
                notifications_created = 0
                
                if updates:
                    updated_count, notifications_created = await asyncio.to_thread(
                        self._persist_updates,
                        updates,
                    )
                    result.updates_persisted = updated_count
                    result.notifications_created = notifications_created
                else:
                    result.updates_persisted = 0
                    result.notifications_created = 0
                
                end_time = datetime.now(timezone.utc)
                result.items_checked = total_targets
                self._state.last_completed_at = end_time
                self._state.last_success_at = end_time
                self._state.last_duration_seconds = (end_time - start_time).total_seconds()
                self._state.last_result = result
                self._state.last_error_at = None
                self._state.last_error_message = None
                
                _logger.info(
                    "Availability monitor run finished",
                    extra={
                        "triggered_by": triggered_by,
                        "items_checked": result.items_checked,
                        "notifications_created": result.notifications_created,
                    },
                )
                return result
                
            except Exception as exc:
                end_time = datetime.now(timezone.utc)
                self._state.last_completed_at = end_time
                self._state.last_error_at = end_time
                self._state.last_duration_seconds = (end_time - start_time).total_seconds()
                self._state.last_error_message = str(exc)
                _logger.exception("Availability monitor run failed")
                raise

    async def trigger_manual_run(self, triggered_by: str = "manual") -> AvailabilityJobResult:
        """Trigger a manual availability check run."""
        return await self.run(triggered_by=triggered_by)

    async def _collect_updates(
        self, result: AvailabilityJobResult
    ) -> tuple[list[AvailabilityUpdate], int]:
        """Collect availability updates for all wishlist targets."""
        now = datetime.now(timezone.utc)
        targets = await asyncio.to_thread(self._load_targets)
        updates: list[AvailabilityUpdate] = []
        
        if not targets:
            return updates, 0

        for target in targets:
            try:
                payload = await self._finna_service.availability(record_id=target.finna_id)
                # Use the AvailabilityResponse schema to properly parse HTML content
                availability = AvailabilityResponse.from_finna(target.finna_id, payload)
                availability_list = [item.model_dump() for item in availability.items]
                available = self._is_available(availability_list)
                
                # Identify the best library hit for notifications
                preferred_hit = self._select_preferred_hit(
                    availability_list, target.preferred_library_name
                )
                
                # Should notify if book became available (was unavailable, now available)
                should_notify = available and not target.is_available
                
                updates.append(
                    AvailabilityUpdate(
                        target=target,
                        available=available,
                        availability_payload=availability_list,
                        checked_at=now,
                        notify=should_notify,
                        preferred_hit=preferred_hit,
                    )
                )
            except Exception as exc:
                message = f"Failed to fetch availability for {target.finna_id}: {exc}".rstrip()
                _logger.warning(message)
                result.errors.append(message)
                
        return updates, len(targets)

    def _load_targets(self) -> list[WishlistTarget]:
        """Load wishlist items that have notifications enabled."""
        with self._session_factory() as session:
            query = (
                session.query(UserBook)
                .join(User)
                .filter(
                    User.is_active.is_(True),
                    UserBook.list_type == ListType.WISHLIST,
                    UserBook.notify_on_available.is_(True),
                )
                .order_by(UserBook.updated_at.desc())
                .limit(self._batch_size)
            )
            items: Sequence[UserBook] = query.all()
            
            return [
                WishlistTarget(
                    id=item.id,
                    user_id=item.user_id,
                    finna_id=item.finna_id,
                    title=item.title,
                    is_available=item.is_available,
                    preferred_library_name=item.library_name,
                )
                for item in items
            ]

    def _persist_updates(
        self, updates: list[AvailabilityUpdate]
    ) -> tuple[int, int]:
        """Persist availability updates and create notifications."""
        if not updates:
            return 0, 0

        updated_count = 0
        notifications_created = 0
        
        with self._session_factory() as session:
            item_index = {update.target.id: update for update in updates}
            db_items: Sequence[UserBook] = (
                session.query(UserBook)
                .filter(UserBook.id.in_(item_index.keys()))
                .all()
            )

            now = datetime.now(timezone.utc).isoformat(timespec="seconds")

            for db_item in db_items:
                update = item_index.get(db_item.id)
                if update is None:
                    continue
                    
                db_item.is_available = update.available
                db_item.last_availability_check = update.checked_at.isoformat(timespec="seconds")
                db_item.availability_data = {
                    "items": update.availability_payload,
                    "checked_at": update.checked_at.isoformat(timespec="seconds"),
                }
                updated_count += 1

                if update.notify:
                    notification = Notification(
                        user_id=db_item.user_id,
                        notification_type=NotificationType.BOOK_AVAILABLE,
                        title=f"{db_item.title} is now available",
                        message=self._build_notification_message(
                            db_item.title, update.preferred_hit
                        ),
                        book_title=db_item.title,
                        library_name=(update.preferred_hit or {}).get("library"),
                        finna_id=db_item.finna_id,
                        sent_at=now,
                        delivery_method="system",
                        delivery_status="sent",
                    )
                    session.add(notification)
                    notifications_created += 1

            session.commit()
            
        return updated_count, notifications_created

    @staticmethod
    def _is_available(entries: list[dict[str, Any]]) -> bool:
        """Check if any entry indicates availability."""
        for entry in entries:
            status = str(entry.get("status") or "").lower()
            # Check for "available" in status text (e.g., "Available", "available")
            if "available" in status and "unavailable" not in status and "on loan" not in status:
                return True
        return False

    @staticmethod
    def _select_preferred_hit(
        entries: list[dict[str, Any]],
        preferred_library: str | None,
    ) -> dict[str, Any] | None:
        """Select the best availability hit, preferring the user's preferred library."""
        if not entries:
            return None

        def _score(entry: dict[str, Any]) -> tuple[int, str]:
            library = str(entry.get("library") or "").lower()
            preferred = preferred_library.lower() if preferred_library else None
            match_score = 1 if preferred and preferred in library else 0
            status = str(entry.get("status") or "")
            return (match_score, status)

        # Filter for available entries
        available_entries = [
            entry for entry in entries 
            if "available" in str(entry.get("status") or "").lower()
            and "unavailable" not in str(entry.get("status") or "").lower()
            and "on loan" not in str(entry.get("status") or "").lower()
        ]
        
        if not available_entries:
            return None

        return max(available_entries, key=_score)

    @staticmethod
    def _build_notification_message(
        title: str, entry: dict[str, Any] | None
    ) -> str:
        """Build a human-readable notification message."""
        if not entry:
            return f"Good news! {title} is available."
            
        library = entry.get("library") or "your library"
        location = entry.get("location")
        
        if location:
            return f"Good news! {title} is available at {library} ({location})."
        return f"Good news! {title} is available at {library}."
