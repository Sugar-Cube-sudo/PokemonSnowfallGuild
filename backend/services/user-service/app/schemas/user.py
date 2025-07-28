#!/usr/bin/env python3
"""
User Schemas

Pydantic models for user-related API requests and responses.
"""

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, validator

from .enums import UserRole, UserStatus


class UserBase(BaseModel):
    """Base user schema with common fields."""
    
    email: EmailStr = Field(..., description="User email address")
    username: str = Field(
        ...,
        min_length=3,
        max_length=50,
        regex=r"^[a-zA-Z0-9_-]+$",
        description="Unique username (alphanumeric, underscore, hyphen only)"
    )
    display_name: str = Field(
        ...,
        min_length=1,
        max_length=100,
        description="Display name for the user"
    )
    
    @validator("username")
    def validate_username(cls, v):
        """Validate username format and restrictions."""
        if not v:
            raise ValueError("Username cannot be empty")
        
        # Check for reserved usernames
        reserved = {
            "admin", "administrator", "root", "system", "api", "www",
            "mail", "email", "support", "help", "info", "contact",
            "user", "users", "profile", "account", "settings", "config",
            "null", "undefined", "anonymous", "guest", "test", "demo"
        }
        
        if v.lower() in reserved:
            raise ValueError(f"Username '{v}' is reserved")
        
        return v
    
    @validator("display_name")
    def validate_display_name(cls, v):
        """Validate display name."""
        if not v or not v.strip():
            raise ValueError("Display name cannot be empty")
        
        # Remove excessive whitespace
        return " ".join(v.split())


class UserCreate(UserBase):
    """Schema for creating a new user."""
    
    password: str = Field(
        ...,
        min_length=8,
        max_length=128,
        description="User password (will be hashed)"
    )
    
    role: Optional[UserRole] = Field(
        default=UserRole.USER,
        description="User role (defaults to 'user')"
    )
    
    avatar_url: Optional[str] = Field(
        default=None,
        max_length=500,
        description="URL to user's avatar image"
    )
    
    metadata: Optional[dict] = Field(
        default=None,
        description="Additional user metadata"
    )
    
    @validator("password")
    def validate_password(cls, v):
        """Validate password strength."""
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        
        # Check for at least one uppercase, lowercase, digit, and special character
        has_upper = any(c.isupper() for c in v)
        has_lower = any(c.islower() for c in v)
        has_digit = any(c.isdigit() for c in v)
        has_special = any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in v)
        
        if not (has_upper and has_lower and has_digit and has_special):
            raise ValueError(
                "Password must contain at least one uppercase letter, "
                "one lowercase letter, one digit, and one special character"
            )
        
        return v
    
    @validator("avatar_url")
    def validate_avatar_url(cls, v):
        """Validate avatar URL format."""
        if v is not None and v.strip():
            # Basic URL validation
            if not v.startswith(("http://", "https://")):
                raise ValueError("Avatar URL must start with http:// or https://")
        return v


class UserUpdate(BaseModel):
    """Schema for updating user information."""
    
    email: Optional[EmailStr] = Field(
        default=None,
        description="Updated email address"
    )
    
    username: Optional[str] = Field(
        default=None,
        min_length=3,
        max_length=50,
        regex=r"^[a-zA-Z0-9_-]+$",
        description="Updated username"
    )
    
    display_name: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=100,
        description="Updated display name"
    )
    
    avatar_url: Optional[str] = Field(
        default=None,
        max_length=500,
        description="Updated avatar URL"
    )
    
    status: Optional[UserStatus] = Field(
        default=None,
        description="Updated user status"
    )
    
    role: Optional[UserRole] = Field(
        default=None,
        description="Updated user role (admin only)"
    )
    
    is_verified: Optional[bool] = Field(
        default=None,
        description="Updated verification status"
    )
    
    metadata: Optional[dict] = Field(
        default=None,
        description="Updated metadata"
    )
    
    @validator("username")
    def validate_username(cls, v):
        """Validate username if provided."""
        if v is not None:
            return UserBase.validate_username(v)
        return v
    
    @validator("display_name")
    def validate_display_name(cls, v):
        """Validate display name if provided."""
        if v is not None:
            return UserBase.validate_display_name(v)
        return v
    
    @validator("avatar_url")
    def validate_avatar_url(cls, v):
        """Validate avatar URL if provided."""
        if v is not None:
            return UserCreate.validate_avatar_url(v)
        return v


class UserResponse(BaseModel):
    """Schema for user API responses."""
    
    id: uuid.UUID = Field(..., description="User unique identifier")
    email: EmailStr = Field(..., description="User email address")
    username: str = Field(..., description="User username")
    display_name: str = Field(..., description="User display name")
    status: UserStatus = Field(..., description="User status")
    role: UserRole = Field(..., description="User role")
    is_verified: bool = Field(..., description="Email verification status")
    avatar_url: Optional[str] = Field(None, description="Avatar image URL")
    created_at: datetime = Field(..., description="Account creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")
    last_login_at: Optional[datetime] = Field(None, description="Last login timestamp")
    metadata: Optional[dict] = Field(None, description="Additional user metadata")
    
    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            uuid.UUID: lambda v: str(v),
        }


class UserPublicResponse(BaseModel):
    """Schema for public user information (limited fields)."""
    
    id: uuid.UUID = Field(..., description="User unique identifier")
    username: str = Field(..., description="User username")
    display_name: str = Field(..., description="User display name")
    avatar_url: Optional[str] = Field(None, description="Avatar image URL")
    is_verified: bool = Field(..., description="Verification status")
    created_at: datetime = Field(..., description="Account creation timestamp")
    
    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            uuid.UUID: lambda v: str(v),
        }


class UserSearchResponse(BaseModel):
    """Schema for user search results."""
    
    id: uuid.UUID = Field(..., description="User unique identifier")
    username: str = Field(..., description="User username")
    display_name: str = Field(..., description="User display name")
    avatar_url: Optional[str] = Field(None, description="Avatar image URL")
    is_verified: bool = Field(..., description="Verification status")
    followers_count: int = Field(0, description="Number of followers")
    following_count: int = Field(0, description="Number of following")
    
    class Config:
        from_attributes = True
        json_encoders = {
            uuid.UUID: lambda v: str(v),
        }


class UserStatsResponse(BaseModel):
    """Schema for user statistics."""
    
    user_id: uuid.UUID = Field(..., description="User unique identifier")
    followers_count: int = Field(0, description="Number of followers")
    following_count: int = Field(0, description="Number of following")
    posts_count: int = Field(0, description="Number of posts")
    comments_count: int = Field(0, description="Number of comments")
    likes_received: int = Field(0, description="Number of likes received")
    reputation_score: int = Field(0, description="User reputation score")
    level: int = Field(1, description="User level")
    experience_points: int = Field(0, description="Experience points")
    
    class Config:
        from_attributes = True
        json_encoders = {
            uuid.UUID: lambda v: str(v),
        }


class PasswordChangeRequest(BaseModel):
    """Schema for password change requests."""
    
    current_password: str = Field(
        ...,
        description="Current password for verification"
    )
    
    new_password: str = Field(
        ...,
        min_length=8,
        max_length=128,
        description="New password"
    )
    
    confirm_password: str = Field(
        ...,
        description="Confirmation of new password"
    )
    
    @validator("confirm_password")
    def passwords_match(cls, v, values):
        """Validate that passwords match."""
        if "new_password" in values and v != values["new_password"]:
            raise ValueError("Passwords do not match")
        return v
    
    @validator("new_password")
    def validate_new_password(cls, v):
        """Validate new password strength."""
        return UserCreate.validate_password(v)


class EmailChangeRequest(BaseModel):
    """Schema for email change requests."""
    
    new_email: EmailStr = Field(
        ...,
        description="New email address"
    )
    
    password: str = Field(
        ...,
        description="Current password for verification"
    )


class UserDeactivateRequest(BaseModel):
    """Schema for user account deactivation."""
    
    password: str = Field(
        ...,
        description="Current password for verification"
    )
    
    reason: Optional[str] = Field(
        default=None,
        max_length=500,
        description="Reason for deactivation (optional)"
    )
    
    feedback: Optional[str] = Field(
        default=None,
        max_length=1000,
        description="Additional feedback (optional)"
    )


class UserListResponse(BaseModel):
    """Schema for paginated user list responses."""
    
    users: list[UserPublicResponse] = Field(
        ...,
        description="List of users"
    )
    
    total: int = Field(
        ...,
        description="Total number of users"
    )
    
    page: int = Field(
        ...,
        description="Current page number"
    )
    
    per_page: int = Field(
        ...,
        description="Number of users per page"
    )
    
    pages: int = Field(
        ...,
        description="Total number of pages"
    )
    
    has_next: bool = Field(
        ...,
        description="Whether there is a next page"
    )
    
    has_prev: bool = Field(
        ...,
        description="Whether there is a previous page"
    )


class UserBulkActionRequest(BaseModel):
    """Schema for bulk user actions."""
    
    user_ids: list[uuid.UUID] = Field(
        ...,
        min_items=1,
        max_items=100,
        description="List of user IDs to perform action on"
    )
    
    action: str = Field(
        ...,
        description="Action to perform (e.g., 'activate', 'deactivate', 'delete')"
    )
    
    reason: Optional[str] = Field(
        default=None,
        max_length=500,
        description="Reason for the action"
    )


class UserBulkActionResponse(BaseModel):
    """Schema for bulk user action responses."""
    
    success_count: int = Field(
        ...,
        description="Number of successful operations"
    )
    
    failure_count: int = Field(
        ...,
        description="Number of failed operations"
    )
    
    errors: list[dict] = Field(
        default_factory=list,
        description="List of errors for failed operations"
    )
    
    processed_ids: list[uuid.UUID] = Field(
        default_factory=list,
        description="List of successfully processed user IDs"
    )