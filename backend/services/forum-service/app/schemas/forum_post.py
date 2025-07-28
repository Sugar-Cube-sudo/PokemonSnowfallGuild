#!/usr/bin/env python3
"""
Forum Post Pydantic Schemas

Defines Pydantic schemas for forum posts.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, ConfigDict, field_validator

from .common import BaseTimestampSchema, PaginatedResponse, UserInfo, AttachmentInfo, TagInfo, StatsInfo
from .rental import RentalInfoResponse


class ForumPostBase(BaseModel):
    """Base forum post schema."""
    title: str = Field(..., min_length=1, max_length=200, description="Post title")
    content: str = Field(..., min_length=1, description="Post content")
    summary: Optional[str] = Field(None, max_length=500, description="Post summary")
    post_type: str = Field(default="discussion", description="Post type")
    category_id: int = Field(..., description="Category ID")
    tags: Optional[List[str]] = Field(default=None, description="Post tags")
    is_pinned: bool = Field(default=False, description="Whether post is pinned")
    is_featured: bool = Field(default=False, description="Whether post is featured")
    allow_replies: bool = Field(default=True, description="Whether replies are allowed")
    
    @field_validator('title')
    @classmethod
    def validate_title(cls, v: str) -> str:
        """Validate post title."""
        return v.strip()
    
    @field_validator('content')
    @classmethod
    def validate_content(cls, v: str) -> str:
        """Validate post content."""
        return v.strip()
    
    @field_validator('tags')
    @classmethod
    def validate_tags(cls, v: Optional[List[str]]) -> Optional[List[str]]:
        """Validate post tags."""
        if v is None:
            return v
        # Remove duplicates and empty tags
        tags = [tag.strip().lower() for tag in v if tag.strip()]
        return list(set(tags)) if tags else None
    
    @field_validator('post_type')
    @classmethod
    def validate_post_type(cls, v: str) -> str:
        """Validate post type."""
        allowed_types = [
            "discussion", "question", "announcement", "guide", 
            "rental", "trade", "showcase", "event"
        ]
        if v not in allowed_types:
            raise ValueError(f"Post type must be one of: {', '.join(allowed_types)}")
        return v


class ForumPostCreate(ForumPostBase):
    """Schema for creating a forum post."""
    attachments: Optional[List[Dict[str, Any]]] = Field(default=None, description="Post attachments")
    rental_info: Optional[Dict[str, Any]] = Field(default=None, description="Rental information for rental posts")
    
    @field_validator('rental_info')
    @classmethod
    def validate_rental_info(cls, v: Optional[Dict[str, Any]], info) -> Optional[Dict[str, Any]]:
        """Validate rental info is provided for rental posts."""
        post_type = info.data.get('post_type')
        if post_type == 'rental' and not v:
            raise ValueError('Rental information is required for rental posts')
        elif post_type != 'rental' and v:
            raise ValueError('Rental information should only be provided for rental posts')
        return v


class ForumPostUpdate(BaseModel):
    """Schema for updating a forum post."""
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    content: Optional[str] = Field(None, min_length=1)
    summary: Optional[str] = Field(None, max_length=500)
    category_id: Optional[int] = None
    tags: Optional[List[str]] = None
    is_pinned: Optional[bool] = None
    is_featured: Optional[bool] = None
    allow_replies: Optional[bool] = None
    status: Optional[str] = None
    attachments: Optional[List[Dict[str, Any]]] = None
    
    @field_validator('title')
    @classmethod
    def validate_title(cls, v: Optional[str]) -> Optional[str]:
        """Validate post title."""
        return v.strip() if v else v
    
    @field_validator('content')
    @classmethod
    def validate_content(cls, v: Optional[str]) -> Optional[str]:
        """Validate post content."""
        return v.strip() if v else v
    
    @field_validator('tags')
    @classmethod
    def validate_tags(cls, v: Optional[List[str]]) -> Optional[List[str]]:
        """Validate post tags."""
        if v is None:
            return v
        tags = [tag.strip().lower() for tag in v if tag.strip()]
        return list(set(tags)) if tags else None
    
    @field_validator('status')
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        """Validate post status."""
        if v is None:
            return v
        allowed_statuses = ["draft", "published", "hidden", "locked", "deleted", "pending_review"]
        if v not in allowed_statuses:
            raise ValueError(f"Status must be one of: {', '.join(allowed_statuses)}")
        return v


class ForumPostResponse(ForumPostBase, BaseTimestampSchema):
    """Schema for forum post response."""
    id: int
    author_id: int
    status: str
    slug: Optional[str] = None
    view_count: int = 0
    like_count: int = 0
    reply_count: int = 0
    is_locked: bool = False
    published_at: Optional[datetime] = None
    last_activity_at: datetime
    
    # Optional related data
    author: Optional[UserInfo] = None
    category: Optional[Dict[str, Any]] = None
    attachments: Optional[List[AttachmentInfo]] = None
    tag_list: Optional[List[TagInfo]] = None
    rental_info: Optional[RentalInfoResponse] = None
    
    # User interaction data (if authenticated)
    is_liked_by_user: Optional[bool] = None
    user_can_edit: Optional[bool] = None
    user_can_delete: Optional[bool] = None
    user_can_moderate: Optional[bool] = None
    
    model_config = ConfigDict(from_attributes=True)


class ForumPostSummary(BaseModel):
    """Schema for forum post summary (for lists)."""
    id: int
    title: str
    summary: Optional[str] = None
    author_id: int
    author: Optional[UserInfo] = None
    category_id: int
    category: Optional[Dict[str, Any]] = None
    post_type: str
    status: str
    is_pinned: bool = False
    is_featured: bool = False
    is_locked: bool = False
    view_count: int = 0
    like_count: int = 0
    reply_count: int = 0
    tags: Optional[List[str]] = None
    created_at: datetime
    last_activity_at: datetime
    
    # Rental specific fields
    rental_status: Optional[str] = None
    rental_price: Optional[float] = None
    
    model_config = ConfigDict(from_attributes=True)


class ForumPostListResponse(PaginatedResponse[ForumPostSummary]):
    """Schema for paginated forum post list response."""
    pass


class PostQueryParams(BaseModel):
    """Schema for post query parameters."""
    category_id: Optional[int] = Field(None, description="Filter by category")
    author_id: Optional[int] = Field(None, description="Filter by author")
    post_type: Optional[str] = Field(None, description="Filter by post type")
    status: Optional[str] = Field(None, description="Filter by status")
    tags: Optional[List[str]] = Field(None, description="Filter by tags")
    search: Optional[str] = Field(None, description="Search in title and content")
    is_pinned: Optional[bool] = Field(None, description="Filter pinned posts")
    is_featured: Optional[bool] = Field(None, description="Filter featured posts")
    rental_status: Optional[str] = Field(None, description="Filter by rental status")
    date_from: Optional[datetime] = Field(None, description="Filter from date")
    date_to: Optional[datetime] = Field(None, description="Filter to date")
    sort_by: str = Field(default="last_activity_at", description="Sort field")
    sort_order: str = Field(default="desc", regex="^(asc|desc)$", description="Sort order")
    
    @field_validator('sort_by')
    @classmethod
    def validate_sort_by(cls, v: str) -> str:
        """Validate sort field."""
        allowed_fields = [
            "created_at", "updated_at", "last_activity_at", "title", 
            "view_count", "like_count", "reply_count"
        ]
        if v not in allowed_fields:
            raise ValueError(f"Sort field must be one of: {', '.join(allowed_fields)}")
        return v


class PostLikeResponse(BaseModel):
    """Schema for post like response."""
    post_id: int
    is_liked: bool
    like_count: int
    
    model_config = ConfigDict(from_attributes=True)


class PostStatsResponse(BaseModel):
    """Schema for post statistics."""
    post_id: int
    view_count: int
    like_count: int
    reply_count: int
    unique_viewers: int
    engagement_rate: float
    
    model_config = ConfigDict(from_attributes=True)


class PostModerationRequest(BaseModel):
    """Schema for post moderation request."""
    action: str = Field(..., description="Moderation action")
    reason: str = Field(..., min_length=1, description="Moderation reason")
    details: Optional[str] = Field(None, description="Additional details")
    
    @field_validator('action')
    @classmethod
    def validate_action(cls, v: str) -> str:
        """Validate moderation action."""
        allowed_actions = [
            "approve", "reject", "hide", "show", "lock", "unlock", 
            "pin", "unpin", "delete", "restore", "feature", "unfeature"
        ]
        if v not in allowed_actions:
            raise ValueError(f"Action must be one of: {', '.join(allowed_actions)}")
        return v