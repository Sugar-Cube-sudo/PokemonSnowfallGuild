#!/usr/bin/env python3
"""
Common Pydantic Schemas

Defines common schemas used across the forum service.
"""

from datetime import datetime
from typing import Any, Dict, Generic, List, Optional, TypeVar

from pydantic import BaseModel, Field, ConfigDict


T = TypeVar('T')


class PaginationParams(BaseModel):
    """Pagination parameters."""
    page: int = Field(default=1, ge=1, description="Page number (1-based)")
    size: int = Field(default=20, ge=1, le=100, description="Items per page")
    
    @property
    def offset(self) -> int:
        """Calculate offset for database queries."""
        return (self.page - 1) * self.size


class PaginatedResponse(BaseModel, Generic[T]):
    """Paginated response wrapper."""
    success: bool = True
    data: List[T]
    pagination: Dict[str, Any]
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    
    model_config = ConfigDict(from_attributes=True)
    
    @classmethod
    def create(
        cls,
        data: List[T],
        page: int,
        size: int,
        total: int,
        **kwargs
    ) -> "PaginatedResponse[T]":
        """Create paginated response."""
        total_pages = (total + size - 1) // size
        has_next = page < total_pages
        has_prev = page > 1
        
        pagination = {
            "page": page,
            "size": size,
            "total": total,
            "total_pages": total_pages,
            "has_next": has_next,
            "has_prev": has_prev,
            "next_page": page + 1 if has_next else None,
            "prev_page": page - 1 if has_prev else None,
        }
        
        return cls(
            data=data,
            pagination=pagination,
            **kwargs
        )


class SuccessResponse(BaseModel):
    """Standard success response."""
    success: bool = True
    message: str
    data: Optional[Dict[str, Any]] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    
    model_config = ConfigDict(from_attributes=True)


class ErrorResponse(BaseModel):
    """Standard error response."""
    success: bool = False
    error: Dict[str, Any]
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    request_id: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)


class BaseTimestampSchema(BaseModel):
    """Base schema with timestamp fields."""
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class SortParams(BaseModel):
    """Sorting parameters."""
    sort_by: str = Field(default="created_at", description="Field to sort by")
    sort_order: str = Field(default="desc", regex="^(asc|desc)$", description="Sort order")


class SearchParams(BaseModel):
    """Search parameters."""
    q: Optional[str] = Field(default=None, description="Search query")
    category_id: Optional[int] = Field(default=None, description="Filter by category")
    author_id: Optional[int] = Field(default=None, description="Filter by author")
    tags: Optional[List[str]] = Field(default=None, description="Filter by tags")
    post_type: Optional[str] = Field(default=None, description="Filter by post type")
    status: Optional[str] = Field(default=None, description="Filter by status")
    date_from: Optional[datetime] = Field(default=None, description="Filter from date")
    date_to: Optional[datetime] = Field(default=None, description="Filter to date")


class UserInfo(BaseModel):
    """Basic user information schema."""
    id: int
    username: str
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None
    is_verified: bool = False
    
    model_config = ConfigDict(from_attributes=True)


class AttachmentInfo(BaseModel):
    """Attachment information schema."""
    id: str
    filename: str
    content_type: str
    size: int
    url: str
    thumbnail_url: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)


class TagInfo(BaseModel):
    """Tag information schema."""
    name: str
    color: Optional[str] = None
    count: Optional[int] = None
    
    model_config = ConfigDict(from_attributes=True)


class ModerationInfo(BaseModel):
    """Moderation information schema."""
    status: Optional[str] = None
    reason: Optional[str] = None
    moderated_by: Optional[int] = None
    moderated_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)


class StatsInfo(BaseModel):
    """Statistics information schema."""
    view_count: int = 0
    like_count: int = 0
    reply_count: int = 0
    
    model_config = ConfigDict(from_attributes=True)