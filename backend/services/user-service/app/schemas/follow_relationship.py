#!/usr/bin/env python3
"""
Follow Relationship Schemas

Pydantic models for follow relationship-related API requests and responses.
"""

import uuid
from datetime import datetime
from typing import Optional, Dict, Any, List

from pydantic import BaseModel, Field, validator

from .enums import FollowStatus


class FollowRelationshipBase(BaseModel):
    """Base follow relationship schema with common fields."""
    
    status: FollowStatus = Field(
        FollowStatus.ACTIVE,
        description="Status of the follow relationship"
    )
    
    is_muted: bool = Field(
        False,
        description="Whether the follower has muted the followed user"
    )
    
    notifications_enabled: bool = Field(
        True,
        description="Whether notifications are enabled for this relationship"
    )
    
    follow_source: Optional[str] = Field(
        None,
        max_length=50,
        description="Source of the follow (e.g., 'search', 'suggestion', 'profile')"
    )
    
    metadata: Optional[Dict[str, Any]] = Field(
        default_factory=dict,
        description="Additional relationship metadata"
    )


class FollowRelationshipCreate(FollowRelationshipBase):
    """Schema for creating a follow relationship."""
    
    follower_id: uuid.UUID = Field(
        ...,
        description="ID of the user who is following"
    )
    
    followed_id: uuid.UUID = Field(
        ...,
        description="ID of the user being followed"
    )
    
    @validator('followed_id')
    def validate_not_self_follow(cls, v, values):
        """Validate that users cannot follow themselves."""
        if 'follower_id' in values and v == values['follower_id']:
            raise ValueError("Users cannot follow themselves")
        return v


class FollowRelationshipUpdate(BaseModel):
    """Schema for updating follow relationship."""
    
    status: Optional[FollowStatus] = Field(
        None,
        description="Updated relationship status"
    )
    
    is_muted: Optional[bool] = Field(
        None,
        description="Updated mute status"
    )
    
    notifications_enabled: Optional[bool] = Field(
        None,
        description="Updated notification preference"
    )
    
    metadata: Optional[Dict[str, Any]] = Field(
        None,
        description="Updated metadata"
    )


class FollowRelationshipResponse(BaseModel):
    """Schema for follow relationship API responses."""
    
    id: uuid.UUID = Field(..., description="Relationship unique identifier")
    follower_id: uuid.UUID = Field(..., description="Follower user ID")
    followed_id: uuid.UUID = Field(..., description="Followed user ID")
    status: FollowStatus = Field(..., description="Relationship status")
    is_muted: bool = Field(..., description="Mute status")
    notifications_enabled: bool = Field(..., description="Notification preference")
    follow_source: Optional[str] = Field(None, description="Follow source")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Relationship metadata")
    created_at: datetime = Field(..., description="Relationship creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")
    
    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            uuid.UUID: lambda v: str(v),
        }


class FollowRelationshipWithUserResponse(BaseModel):
    """Schema for follow relationship with user information."""
    
    id: uuid.UUID = Field(..., description="Relationship unique identifier")
    follower_id: uuid.UUID = Field(..., description="Follower user ID")
    followed_id: uuid.UUID = Field(..., description="Followed user ID")
    status: FollowStatus = Field(..., description="Relationship status")
    is_muted: bool = Field(..., description="Mute status")
    notifications_enabled: bool = Field(..., description="Notification preference")
    follow_source: Optional[str] = Field(None, description="Follow source")
    created_at: datetime = Field(..., description="Relationship creation timestamp")
    
    # User information (either follower or followed depending on context)
    user: Dict[str, Any] = Field(..., description="User information")
    
    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            uuid.UUID: lambda v: str(v),
        }


class FollowRequest(BaseModel):
    """Schema for follow requests."""
    
    followed_id: uuid.UUID = Field(
        ...,
        description="ID of the user to follow"
    )
    
    follow_source: Optional[str] = Field(
        None,
        max_length=50,
        description="Source of the follow action"
    )
    
    notifications_enabled: bool = Field(
        True,
        description="Whether to enable notifications for this user"
    )


class UnfollowRequest(BaseModel):
    """Schema for unfollow requests."""
    
    followed_id: uuid.UUID = Field(
        ...,
        description="ID of the user to unfollow"
    )
    
    reason: Optional[str] = Field(
        None,
        max_length=200,
        description="Optional reason for unfollowing"
    )


class FollowStatusResponse(BaseModel):
    """Schema for follow status responses."""
    
    is_following: bool = Field(..., description="Whether the current user is following the target user")
    is_followed_by: bool = Field(..., description="Whether the current user is followed by the target user")
    is_mutual: bool = Field(..., description="Whether the relationship is mutual")
    relationship_id: Optional[uuid.UUID] = Field(None, description="Relationship ID if following")
    reverse_relationship_id: Optional[uuid.UUID] = Field(None, description="Reverse relationship ID if followed by")
    can_follow: bool = Field(..., description="Whether the current user can follow the target user")
    follow_status: Optional[FollowStatus] = Field(None, description="Current follow status")
    
    class Config:
        json_encoders = {
            uuid.UUID: lambda v: str(v),
        }


class FollowersListRequest(BaseModel):
    """Schema for followers list requests."""
    
    user_id: uuid.UUID = Field(
        ...,
        description="User ID to get followers for"
    )
    
    status: Optional[FollowStatus] = Field(
        None,
        description="Filter by relationship status"
    )
    
    include_muted: bool = Field(
        True,
        description="Whether to include muted relationships"
    )
    
    search_query: Optional[str] = Field(
        None,
        max_length=100,
        description="Search query for follower usernames/display names"
    )
    
    sort_by: Optional[str] = Field(
        "created_at",
        description="Sort field (created_at, username, display_name)"
    )
    
    sort_order: Optional[str] = Field(
        "desc",
        description="Sort order (asc, desc)"
    )
    
    page: int = Field(
        1,
        ge=1,
        description="Page number"
    )
    
    per_page: int = Field(
        20,
        ge=1,
        le=100,
        description="Items per page"
    )


class FollowingListRequest(BaseModel):
    """Schema for following list requests."""
    
    user_id: uuid.UUID = Field(
        ...,
        description="User ID to get following list for"
    )
    
    status: Optional[FollowStatus] = Field(
        None,
        description="Filter by relationship status"
    )
    
    include_muted: bool = Field(
        True,
        description="Whether to include muted relationships"
    )
    
    search_query: Optional[str] = Field(
        None,
        max_length=100,
        description="Search query for followed usernames/display names"
    )
    
    sort_by: Optional[str] = Field(
        "created_at",
        description="Sort field (created_at, username, display_name)"
    )
    
    sort_order: Optional[str] = Field(
        "desc",
        description="Sort order (asc, desc)"
    )
    
    page: int = Field(
        1,
        ge=1,
        description="Page number"
    )
    
    per_page: int = Field(
        20,
        ge=1,
        le=100,
        description="Items per page"
    )


class FollowListResponse(BaseModel):
    """Schema for follow list responses (followers/following)."""
    
    relationships: List[FollowRelationshipWithUserResponse] = Field(
        ...,
        description="List of follow relationships with user info"
    )
    
    total: int = Field(
        ...,
        description="Total number of relationships"
    )
    
    page: int = Field(
        ...,
        description="Current page number"
    )
    
    per_page: int = Field(
        ...,
        description="Number of items per page"
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


class MutualFollowersRequest(BaseModel):
    """Schema for mutual followers requests."""
    
    user_id: uuid.UUID = Field(
        ...,
        description="User ID to find mutual followers with"
    )
    
    page: int = Field(
        1,
        ge=1,
        description="Page number"
    )
    
    per_page: int = Field(
        20,
        ge=1,
        le=100,
        description="Items per page"
    )


class MutualFollowersResponse(BaseModel):
    """Schema for mutual followers response."""
    
    mutual_followers: List[Dict[str, Any]] = Field(
        ...,
        description="List of mutual followers with user info"
    )
    
    total: int = Field(
        ...,
        description="Total number of mutual followers"
    )
    
    page: int = Field(
        ...,
        description="Current page number"
    )
    
    per_page: int = Field(
        ...,
        description="Number of items per page"
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


class FollowSuggestionsRequest(BaseModel):
    """Schema for follow suggestions requests."""
    
    limit: int = Field(
        10,
        ge=1,
        le=50,
        description="Number of suggestions to return"
    )
    
    exclude_following: bool = Field(
        True,
        description="Whether to exclude users already being followed"
    )
    
    include_mutual_connections: bool = Field(
        True,
        description="Whether to prioritize users with mutual connections"
    )
    
    include_similar_interests: bool = Field(
        True,
        description="Whether to include users with similar interests"
    )


class FollowSuggestionResponse(BaseModel):
    """Schema for individual follow suggestion."""
    
    user_id: uuid.UUID = Field(..., description="Suggested user ID")
    username: str = Field(..., description="Suggested user username")
    display_name: str = Field(..., description="Suggested user display name")
    avatar_url: Optional[str] = Field(None, description="Suggested user avatar")
    is_verified: bool = Field(..., description="Whether the user is verified")
    
    # Suggestion metadata
    suggestion_reason: str = Field(..., description="Reason for suggestion")
    mutual_followers_count: int = Field(0, description="Number of mutual followers")
    common_interests: List[str] = Field(default_factory=list, description="Common interests")
    suggestion_score: float = Field(..., description="Suggestion relevance score")
    
    class Config:
        json_encoders = {
            uuid.UUID: lambda v: str(v),
        }


class FollowSuggestionsResponse(BaseModel):
    """Schema for follow suggestions response."""
    
    suggestions: List[FollowSuggestionResponse] = Field(
        ...,
        description="List of follow suggestions"
    )
    
    total_available: int = Field(
        ...,
        description="Total number of available suggestions"
    )
    
    refresh_available: bool = Field(
        ...,
        description="Whether more suggestions can be generated"
    )


class FollowStatsResponse(BaseModel):
    """Schema for follow statistics response."""
    
    user_id: uuid.UUID = Field(..., description="User ID")
    followers_count: int = Field(..., description="Total followers count")
    following_count: int = Field(..., description="Total following count")
    mutual_follows_count: int = Field(..., description="Mutual follows count")
    pending_requests_count: int = Field(..., description="Pending follow requests count")
    blocked_count: int = Field(..., description="Blocked relationships count")
    
    # Breakdown by status
    followers_by_status: Dict[str, int] = Field(..., description="Followers grouped by status")
    following_by_status: Dict[str, int] = Field(..., description="Following grouped by status")
    
    # Recent activity
    new_followers_today: int = Field(..., description="New followers today")
    new_followers_week: int = Field(..., description="New followers this week")
    new_following_today: int = Field(..., description="New following today")
    new_following_week: int = Field(..., description="New following this week")
    
    class Config:
        json_encoders = {
            uuid.UUID: lambda v: str(v),
        }


class BulkFollowRequest(BaseModel):
    """Schema for bulk follow operations."""
    
    user_ids: List[uuid.UUID] = Field(
        ...,
        min_items=1,
        max_items=100,
        description="List of user IDs to follow"
    )
    
    follow_source: Optional[str] = Field(
        None,
        max_length=50,
        description="Source of the bulk follow operation"
    )
    
    notifications_enabled: bool = Field(
        True,
        description="Whether to enable notifications for all follows"
    )


class BulkUnfollowRequest(BaseModel):
    """Schema for bulk unfollow operations."""
    
    user_ids: List[uuid.UUID] = Field(
        ...,
        min_items=1,
        max_items=100,
        description="List of user IDs to unfollow"
    )
    
    reason: Optional[str] = Field(
        None,
        max_length=200,
        description="Reason for bulk unfollow"
    )


class BulkFollowResponse(BaseModel):
    """Schema for bulk follow operation response."""
    
    success_count: int = Field(
        ...,
        description="Number of successful follow operations"
    )
    
    failure_count: int = Field(
        ...,
        description="Number of failed follow operations"
    )
    
    errors: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="List of errors for failed operations"
    )
    
    successful_follows: List[uuid.UUID] = Field(
        default_factory=list,
        description="List of successfully followed user IDs"
    )
    
    class Config:
        json_encoders = {
            uuid.UUID: lambda v: str(v),
        }


class FollowActivityRequest(BaseModel):
    """Schema for follow activity requests."""
    
    user_id: Optional[uuid.UUID] = Field(
        None,
        description="Filter by specific user ID"
    )
    
    activity_types: Optional[List[str]] = Field(
        None,
        description="Filter by activity types (follow, unfollow, block, etc.)"
    )
    
    date_from: Optional[datetime] = Field(
        None,
        description="Filter activities from this date"
    )
    
    date_to: Optional[datetime] = Field(
        None,
        description="Filter activities until this date"
    )
    
    page: int = Field(
        1,
        ge=1,
        description="Page number"
    )
    
    per_page: int = Field(
        20,
        ge=1,
        le=100,
        description="Items per page"
    )
    
    @validator('date_to')
    def validate_date_range(cls, v, values):
        """Validate that date_to is after date_from."""
        if v is not None and 'date_from' in values and values['date_from'] is not None:
            if v < values['date_from']:
                raise ValueError("date_to must be after date_from")
        return v


class FollowActivityResponse(BaseModel):
    """Schema for follow activity response."""
    
    activities: List[Dict[str, Any]] = Field(
        ...,
        description="List of follow-related activities"
    )
    
    total: int = Field(
        ...,
        description="Total number of activities"
    )
    
    page: int = Field(
        ...,
        description="Current page number"
    )
    
    per_page: int = Field(
        ...,
        description="Number of items per page"
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