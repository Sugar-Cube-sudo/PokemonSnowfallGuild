"""Pydantic schemas for forum service."""

from .forum_category import (
    ForumCategoryBase,
    ForumCategoryCreate,
    ForumCategoryUpdate,
    ForumCategoryResponse,
    ForumCategoryListResponse,
)
from .forum_post import (
    ForumPostBase,
    ForumPostCreate,
    ForumPostUpdate,
    ForumPostResponse,
    ForumPostListResponse,
    PostQueryParams,
)
from .forum_reply import (
    ForumReplyBase,
    ForumReplyCreate,
    ForumReplyUpdate,
    ForumReplyResponse,
    ForumReplyListResponse,
)
from .rental import (
    RentalInfoBase,
    RentalInfoCreate,
    RentalInfoUpdate,
    RentalInfoResponse,
    RentalRequestCreate,
    RentalRequestResponse,
)
from .common import (
    PaginationParams,
    PaginatedResponse,
    SuccessResponse,
    ErrorResponse,
)

__all__ = [
    # Category schemas
    "ForumCategoryBase",
    "ForumCategoryCreate",
    "ForumCategoryUpdate",
    "ForumCategoryResponse",
    "ForumCategoryListResponse",
    # Post schemas
    "ForumPostBase",
    "ForumPostCreate",
    "ForumPostUpdate",
    "ForumPostResponse",
    "ForumPostListResponse",
    "PostQueryParams",
    # Reply schemas
    "ForumReplyBase",
    "ForumReplyCreate",
    "ForumReplyUpdate",
    "ForumReplyResponse",
    "ForumReplyListResponse",
    # Rental schemas
    "RentalInfoBase",
    "RentalInfoCreate",
    "RentalInfoUpdate",
    "RentalInfoResponse",
    "RentalRequestCreate",
    "RentalRequestResponse",
    # Common schemas
    "PaginationParams",
    "PaginatedResponse",
    "SuccessResponse",
    "ErrorResponse",
]