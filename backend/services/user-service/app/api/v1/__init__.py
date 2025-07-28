#!/usr/bin/env python3
"""
User Service API v1

Version 1 of the user service API routes.
"""

from fastapi import APIRouter

from .users import router as users_router
from .profiles import router as profiles_router
from .activities import router as activities_router
from .stats import router as stats_router
from .follows import router as follows_router
from .privacy import router as privacy_router

# Create main API router
api_router = APIRouter(prefix="/api/v1")

# Include all sub-routers
api_router.include_router(
    users_router,
    prefix="/users",
    tags=["users"]
)

api_router.include_router(
    profiles_router,
    prefix="/profiles",
    tags=["profiles"]
)

api_router.include_router(
    activities_router,
    prefix="/activities",
    tags=["activities"]
)

api_router.include_router(
    stats_router,
    prefix="/stats",
    tags=["stats"]
)

api_router.include_router(
    follows_router,
    prefix="/follows",
    tags=["follows"]
)

api_router.include_router(
    privacy_router,
    prefix="/privacy",
    tags=["privacy"]
)

__all__ = ["api_router"]