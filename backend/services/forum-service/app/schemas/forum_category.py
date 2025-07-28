#!/usr/bin/env python3
"""
Forum Category Pydantic Schemas

Defines Pydantic schemas for forum categories.
"""

from typing import List, Optional

from pydantic import BaseModel, Field, ConfigDict, field_validator

from .common import BaseTimestampSchema, PaginatedResponse


class ForumCategoryBase(BaseModel):
    """Base forum category schema."""
    name: str = Field(..., min_length=1, max_length=100, description="Category name")
    description: Optional[str] = Field(None, max_length=1000, description="Category description")
    slug: str = Field(..., min_length=1, max_length=100, description="URL-friendly category identifier")
    color: Optional[str] = Field(None, regex=r"^#[0-9A-Fa-f]{6}$", description="Hex color code")
    icon: Optional[str] = Field(None, max_length=50, description="Icon name or URL")
    sort_order: int = Field(default=0, description="Display order")
    is_active: bool = Field(default=True, description="Whether category is active")
    is_visible: bool = Field(default=True, description="Whether category is visible")
    require_auth_to_view: bool = Field(default=False, description="Require authentication to view")
    require_auth_to_post: bool = Field(default=True, description="Require authentication to post")
    
    @field_validator('slug')
    @classmethod
    def validate_slug(cls, v: str) -> str:
        """Validate slug format."""
        import re
        if not re.match(r'^[a-z0-9-]+$', v):
            raise ValueError('Slug must contain only lowercase letters, numbers, and hyphens')
        return v
    
    @field_validator('name')
    @classmethod
    def validate_name(cls, v: str) -> str:
        """Validate category name."""
        return v.strip()


class ForumCategoryCreate(ForumCategoryBase):
    """Schema for creating a forum category."""
    pass


class ForumCategoryUpdate(BaseModel):
    """Schema for updating a forum category."""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=1000)
    slug: Optional[str] = Field(None, min_length=1, max_length=100)
    color: Optional[str] = Field(None, regex=r"^#[0-9A-Fa-f]{6}$")
    icon: Optional[str] = Field(None, max_length=50)
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None
    is_visible: Optional[bool] = None
    require_auth_to_view: Optional[bool] = None
    require_auth_to_post: Optional[bool] = None
    
    @field_validator('slug')
    @classmethod
    def validate_slug(cls, v: Optional[str]) -> Optional[str]:
        """Validate slug format."""
        if v is None:
            return v
        import re
        if not re.match(r'^[a-z0-9-]+$', v):
            raise ValueError('Slug must contain only lowercase letters, numbers, and hyphens')
        return v
    
    @field_validator('name')
    @classmethod
    def validate_name(cls, v: Optional[str]) -> Optional[str]:
        """Validate category name."""
        return v.strip() if v else v


class ForumCategoryResponse(ForumCategoryBase, BaseTimestampSchema):
    """Schema for forum category response."""
    id: int
    post_count: int = 0
    reply_count: int = 0
    
    model_config = ConfigDict(from_attributes=True)


class ForumCategoryWithStats(ForumCategoryResponse):
    """Schema for forum category with additional statistics."""
    latest_post_id: Optional[int] = None
    latest_post_title: Optional[str] = None
    latest_post_author: Optional[str] = None
    latest_post_created_at: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)


class ForumCategoryListResponse(PaginatedResponse[ForumCategoryResponse]):
    """Schema for paginated forum category list response."""
    pass


class ForumCategoryStatsResponse(BaseModel):
    """Schema for forum category statistics."""
    category_id: int
    post_count: int
    reply_count: int
    total_views: int
    active_users: int
    latest_activity: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)