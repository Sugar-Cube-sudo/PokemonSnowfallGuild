"""API v1 package for forum service."""

from fastapi import APIRouter

from .categories import router as categories_router
from .posts import router as posts_router
from .replies import router as replies_router
from .rentals import router as rentals_router
from .moderation import router as moderation_router
from .search import router as search_router

# Create main API router
api_router = APIRouter(prefix="/api/v1")

# Include sub-routers
api_router.include_router(categories_router, prefix="/categories", tags=["categories"])
api_router.include_router(posts_router, prefix="/posts", tags=["posts"])
api_router.include_router(replies_router, prefix="/replies", tags=["replies"])
api_router.include_router(rentals_router, prefix="/rentals", tags=["rentals"])
api_router.include_router(moderation_router, prefix="/moderation", tags=["moderation"])
api_router.include_router(search_router, prefix="/search", tags=["search"])

__all__ = ["api_router"]