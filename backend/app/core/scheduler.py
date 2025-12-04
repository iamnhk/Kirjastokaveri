"""Application-level scheduler management using APScheduler."""

from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timedelta
from typing import TYPE_CHECKING

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

if TYPE_CHECKING:
    from .config import Settings
    from ..services.availability_monitor import AvailabilityMonitorService

_logger = logging.getLogger(__name__)


class SchedulerManager:
    """Wraps APScheduler configuration and lifecycle management."""

    def __init__(
        self,
        *,
        settings: "Settings",
        availability_monitor: "AvailabilityMonitorService | None" = None,
    ) -> None:
        self._settings = settings
        self._scheduler = AsyncIOScheduler()
        self._availability_monitor = availability_monitor
        self._started = False

    @property
    def scheduler(self) -> AsyncIOScheduler:
        return self._scheduler

    def start(self) -> None:
        if self._started:
            return
        self._schedule_availability_monitor()
        self._scheduler.start()
        self._started = True
        _logger.info("Scheduler started")

    async def shutdown(self) -> None:
        if not self._started:
            return
        await asyncio.to_thread(self._scheduler.shutdown, wait=False)
        self._started = False
        _logger.info("Scheduler shut down")

    def _schedule_availability_monitor(self) -> None:
        service = self._availability_monitor
        if service is None:
            return
        if not self._settings.scheduler_enabled:
            _logger.info("Scheduler disabled via configuration; availability monitor not scheduled")
            return

        interval_minutes = max(1, self._settings.availability_check_interval_minutes)
        interval = IntervalTrigger(minutes=interval_minutes)
        initial_delay = max(0, self._settings.availability_check_initial_delay_seconds)
        next_run_time = datetime.now() + timedelta(seconds=initial_delay)

        self._scheduler.add_job(
            service.run,
            trigger=interval,
            id="availability-monitor",
            name="Wishlist availability monitor",
            max_instances=1,
            coalesce=True,
            next_run_time=next_run_time,
        )
        _logger.info(
            "Scheduled availability monitor",
            extra={
                "interval_minutes": interval_minutes,
                "initial_delay_seconds": initial_delay,
            },
        )
