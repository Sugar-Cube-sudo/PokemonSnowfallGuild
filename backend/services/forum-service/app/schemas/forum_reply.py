#!/usr/bin/env python3
"""
Forum Reply Pydantic Schemas

Defines Pydantic schemas for forum replies.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, ConfigDict, field_validator

from .common import BaseTimestampSchema, PaginatedResponse, UserInfo, AttachmentInfo


class ForumReplyBase(BaseModel):
    """Base forum reply schema."""
    content: str = Field(..., min_length=1, description="Reply content")
    post_id: int = Field(..., description="Post ID")
    parent_reply_id: Optional[int] = Field(None, description="Parent reply ID for nested replies")
    
    @field_validator('content')
    @classmethod
    def validate_content(cls, v: str) -> str:
        """Validate reply content."""
        return v.strip()


class ForumReplyCreate(ForumReplyBase):
    """Schema for creating a forum reply."""
    attachments: Optional[List[Dict[str, Any]]] = Field(default=None, description="Reply attachments")
    mentions: Optional[List[int]] = Field(default=None, description="User IDs mentioned in reply")
    rental_response: Optional[Dict[str, Any]] = Field(default=None, description="Rental response data")
    
    @field_validator('mentions')
    @classmethod
    def validate_mentions(cls, v: Optional[List[int]]) -> Optional[List[int]]:
        """Validate mentioned user IDs."""
        if v is None:
            return v
        # Remove duplicates
        return list(set(v)) if v else None


class ForumReplyUpdate(BaseModel):
    """Schema for updating a forum reply."""
    content: Optional[str] = Field(None, min_length=1)
    status: Optional[str] = None
    attachments: Optional[List[Dict[str, Any]]] = None
    mentions: Optional[List[int]] = None
    
    @field_validator('content')
    @classmethod
    def validate_content(cls, v: Optional[str]) -> Optional[str]:
        """Validate reply content."""
        return v.strip() if v else v
    
    @field_validator('status')
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        """Validate reply status."""
        if v is None:
            return v
        allowed_statuses = ["published", "hidden", "deleted", "pending_review"]
        if v not in allowed_statuses:
            raise ValueError(f"Status must be one of: {', '.join(allowed_statuses)}")
        return v
    
    @field_validator('mentions')
    @classmethod
    def validate_mentions(cls, v: Optional[List[int]]) -> Optional[List[int]]:
        """Validate mentioned user IDs."""
        if v is None:
            return v
        return list(set(v)) if v else None


class ForumReplyResponse(ForumReplyBase, BaseTimestampSchema):
    """Schema for forum reply response."""
    id: int
    author_id: int
    status: str
    like_count: int = 0
    reply_count: int = 0
    depth: int = 0
    path: Optional[str] = None
    
    # Optional related data
    author: Optional[UserInfo] = None
    attachments: Optional[List[AttachmentInfo]] = None
    mentions: Optional[List[UserInfo]] = None
    rental_response: Optional[Dict[str, Any]] = None
    
    # Nested replies (for threaded display)
    child_replies: Optional[List["ForumReplyResponse"]] = None
    
    # User interaction data (if authenticated)
    is_liked_by_user: Optional[bool] = None
    user_can_edit: Optional[bool] = None
    user_can_delete: Optional[bool] = None
    user_can_moderate: Optional[bool] = None
    
    model_config = ConfigDict(from_attributes=True)


class ForumReplySummary(BaseModel):
    """Schema for forum reply summary (for lists)."""
    id: int
    content: str
    author_id: int
    author: Optional[UserInfo] = None
    post_id: int
    parent_reply_id: Optional[int] = None
    status: str
    like_count: int = 0
    reply_count: int = 0
    depth: int = 0
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class ForumReplyListResponse(PaginatedResponse[ForumReplySummary]):
    """Schema for paginated forum reply list response."""
    pass


class ReplyQueryParams(BaseModel):
    """Schema for reply query parameters."""
    post_id: Optional[int] = Field(None, description="Filter by post")
    author_id: Optional[int] = Field(None, description="Filter by author")
    parent_reply_id: Optional[int] = Field(None, description="Filter by parent reply")
    status: Optional[str] = Field(None, description="Filter by status")
    search: Optional[str] = Field(None, description="Search in content")
    max_depth: int = Field(default=3, ge=0, le=10, description="Maximum nesting depth")
    include_children: bool = Field(default=True, description="Include child replies")
    date_from: Optional[datetime] = Field(None, description="Filter from date")
    date_to: Optional[datetime] = Field(None, description="Filter to date")
    sort_by: str = Field(default="created_at", description="Sort field")
    sort_order: str = Field(default="asc", regex="^(asc|desc)$", description="Sort order")
    
    @field_validator('sort_by')
    @classmethod
    def validate_sort_by(cls, v: str) -> str:
        """Validate sort field."""
        allowed_fields = ["created_at", "updated_at", "like_count", "reply_count"]
        if v not in allowed_fields:
            raise ValueError(f"Sort field must be one of: {', '.join(allowed_fields)}")
        return v


class ReplyLikeResponse(BaseModel):
    """Schema for reply like response."""
    reply_id: int
    is_liked: bool
    like_count: int
    
    model_config = ConfigDict(from_attributes=True)


class ReplyModerationRequest(BaseModel):
    """Schema for reply moderation request."""
    action: str = Field(..., description="Moderation action")
    reason: str = Field(..., min_length=1, description="Moderation reason")
    details: Optional[str] = Field(None, description="Additional details")
    
    @field_validator('action')
    @classmethod
    def validate_action(cls, v: str) -> str:
        """Validate moderation action."""
        allowed_actions = ["approve", "reject", "hide", "show", "delete", "restore"]
        if v not in allowed_actions:
            raise ValueError(f"Action must be one of: {', '.join(allowed_actions)}")
        return v


class ReplyThreadResponse(BaseModel):
    """Schema for reply thread response."""
    post_id: int
    total_replies: int
    max_depth: int
    replies: List[ForumReplyResponse]
    
    model_config = ConfigDict(from_attributes=True)


class ReplyStatsResponse(BaseModel):
    """Schema for reply statistics."""
    reply_id: int
    like_count: int
    child_reply_count: int
    engagement_score: float
    
    model_config = ConfigDict(from_attributes=True)


# Enable forward references for nested replies
ForumReplyResponse.model_rebuild()