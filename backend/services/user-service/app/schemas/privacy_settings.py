#!/usr/bin/env python3
"""
Privacy Settings Schemas

Pydantic models for privacy settings-related API requests and responses.
"""

import uuid
from datetime import datetime
from typing import Optional, Dict, Any, List

from pydantic import BaseModel, Field, validator

from .enums import PrivacyLevel, ProfileVisibility, NotificationType


class PrivacySettingsBase(BaseModel):
    """Base privacy settings schema with common fields."""
    
    # Profile visibility settings
    profile_visibility: ProfileVisibility = Field(
        ProfileVisibility.PUBLIC,
        description="Overall profile visibility"
    )
    
    show_email: PrivacyLevel = Field(
        PrivacyLevel.PRIVATE,
        description="Email visibility level"
    )
    
    show_phone: PrivacyLevel = Field(
        PrivacyLevel.PRIVATE,
        description="Phone number visibility level"
    )
    
    show_birth_date: PrivacyLevel = Field(
        PrivacyLevel.FRIENDS,
        description="Birth date visibility level"
    )
    
    show_location: PrivacyLevel = Field(
        PrivacyLevel.PUBLIC,
        description="Location visibility level"
    )
    
    show_social_links: PrivacyLevel = Field(
        PrivacyLevel.PUBLIC,
        description="Social media links visibility level"
    )
    
    # Activity visibility settings
    show_online_status: PrivacyLevel = Field(
        PrivacyLevel.FRIENDS,
        description="Online status visibility level"
    )
    
    show_last_seen: PrivacyLevel = Field(
        PrivacyLevel.FRIENDS,
        description="Last seen timestamp visibility level"
    )
    
    show_activity_feed: PrivacyLevel = Field(
        PrivacyLevel.PUBLIC,
        description="Activity feed visibility level"
    )
    
    show_followers: PrivacyLevel = Field(
        PrivacyLevel.PUBLIC,
        description="Followers list visibility level"
    )
    
    show_following: PrivacyLevel = Field(
        PrivacyLevel.PUBLIC,
        description="Following list visibility level"
    )
    
    # Game privacy settings
    show_game_stats: PrivacyLevel = Field(
        PrivacyLevel.PUBLIC,
        description="Game statistics visibility level"
    )
    
    show_achievements: PrivacyLevel = Field(
        PrivacyLevel.PUBLIC,
        description="Achievements visibility level"
    )
    
    show_pokemon_collection: PrivacyLevel = Field(
        PrivacyLevel.PUBLIC,
        description="Pokémon collection visibility level"
    )
    
    show_battle_history: PrivacyLevel = Field(
        PrivacyLevel.FRIENDS,
        description="Battle history visibility level"
    )
    
    # Contact and discovery settings
    allow_friend_requests: bool = Field(
        True,
        description="Whether to allow friend/follow requests"
    )
    
    allow_messages_from_strangers: bool = Field(
        False,
        description="Whether to allow messages from non-friends"
    )
    
    discoverable_by_email: bool = Field(
        False,
        description="Whether profile can be found by email"
    )
    
    discoverable_by_phone: bool = Field(
        False,
        description="Whether profile can be found by phone number"
    )
    
    show_in_search: bool = Field(
        True,
        description="Whether to appear in search results"
    )
    
    # Notification settings
    email_notifications: bool = Field(
        True,
        description="Whether to receive email notifications"
    )
    
    push_notifications: bool = Field(
        True,
        description="Whether to receive push notifications"
    )
    
    notification_types: List[NotificationType] = Field(
        default_factory=lambda: [nt for nt in NotificationType],
        description="Enabled notification types"
    )
    
    # Data and analytics settings
    allow_analytics: bool = Field(
        True,
        description="Whether to allow analytics data collection"
    )
    
    allow_personalization: bool = Field(
        True,
        description="Whether to allow personalized content"
    )
    
    allow_third_party_data_sharing: bool = Field(
        False,
        description="Whether to allow third-party data sharing"
    )
    
    # Security settings
    require_approval_for_tags: bool = Field(
        False,
        description="Whether to require approval for being tagged"
    )
    
    two_factor_enabled: bool = Field(
        False,
        description="Whether two-factor authentication is enabled"
    )
    
    login_alerts: bool = Field(
        True,
        description="Whether to receive login alerts"
    )
    
    # Content filtering
    blocked_users: List[uuid.UUID] = Field(
        default_factory=list,
        description="List of blocked user IDs"
    )
    
    blocked_keywords: List[str] = Field(
        default_factory=list,
        description="List of blocked keywords"
    )
    
    content_filter_level: str = Field(
        "moderate",
        description="Content filtering level (none, low, moderate, strict)"
    )
    
    @validator('content_filter_level')
    def validate_content_filter_level(cls, v):
        """Validate content filter level."""
        allowed_levels = {'none', 'low', 'moderate', 'strict'}
        if v not in allowed_levels:
            raise ValueError(f"Content filter level must be one of: {', '.join(allowed_levels)}")
        return v
    
    @validator('blocked_keywords')
    def validate_blocked_keywords(cls, v):
        """Validate blocked keywords list."""
        if v is not None:
            # Remove duplicates and empty strings
            cleaned = list(set(keyword.strip().lower() for keyword in v if keyword.strip()))
            if len(cleaned) > 100:
                raise ValueError("Cannot block more than 100 keywords")
            return cleaned
        return v


class PrivacySettingsCreate(PrivacySettingsBase):
    """Schema for creating privacy settings."""
    
    user_id: uuid.UUID = Field(
        ...,
        description="ID of the user these settings belong to"
    )


class PrivacySettingsUpdate(BaseModel):
    """Schema for updating privacy settings."""
    
    # Profile visibility settings
    profile_visibility: Optional[ProfileVisibility] = Field(
        None,
        description="Updated profile visibility"
    )
    
    show_email: Optional[PrivacyLevel] = Field(
        None,
        description="Updated email visibility"
    )
    
    show_phone: Optional[PrivacyLevel] = Field(
        None,
        description="Updated phone visibility"
    )
    
    show_birth_date: Optional[PrivacyLevel] = Field(
        None,
        description="Updated birth date visibility"
    )
    
    show_location: Optional[PrivacyLevel] = Field(
        None,
        description="Updated location visibility"
    )
    
    show_social_links: Optional[PrivacyLevel] = Field(
        None,
        description="Updated social links visibility"
    )
    
    # Activity visibility settings
    show_online_status: Optional[PrivacyLevel] = Field(
        None,
        description="Updated online status visibility"
    )
    
    show_last_seen: Optional[PrivacyLevel] = Field(
        None,
        description="Updated last seen visibility"
    )
    
    show_activity_feed: Optional[PrivacyLevel] = Field(
        None,
        description="Updated activity feed visibility"
    )
    
    show_followers: Optional[PrivacyLevel] = Field(
        None,
        description="Updated followers visibility"
    )
    
    show_following: Optional[PrivacyLevel] = Field(
        None,
        description="Updated following visibility"
    )
    
    # Game privacy settings
    show_game_stats: Optional[PrivacyLevel] = Field(
        None,
        description="Updated game stats visibility"
    )
    
    show_achievements: Optional[PrivacyLevel] = Field(
        None,
        description="Updated achievements visibility"
    )
    
    show_pokemon_collection: Optional[PrivacyLevel] = Field(
        None,
        description="Updated Pokémon collection visibility"
    )
    
    show_battle_history: Optional[PrivacyLevel] = Field(
        None,
        description="Updated battle history visibility"
    )
    
    # Contact and discovery settings
    allow_friend_requests: Optional[bool] = Field(
        None,
        description="Updated friend request setting"
    )
    
    allow_messages_from_strangers: Optional[bool] = Field(
        None,
        description="Updated stranger message setting"
    )
    
    discoverable_by_email: Optional[bool] = Field(
        None,
        description="Updated email discoverability"
    )
    
    discoverable_by_phone: Optional[bool] = Field(
        None,
        description="Updated phone discoverability"
    )
    
    show_in_search: Optional[bool] = Field(
        None,
        description="Updated search visibility"
    )
    
    # Notification settings
    email_notifications: Optional[bool] = Field(
        None,
        description="Updated email notifications setting"
    )
    
    push_notifications: Optional[bool] = Field(
        None,
        description="Updated push notifications setting"
    )
    
    notification_types: Optional[List[NotificationType]] = Field(
        None,
        description="Updated notification types"
    )
    
    # Data and analytics settings
    allow_analytics: Optional[bool] = Field(
        None,
        description="Updated analytics setting"
    )
    
    allow_personalization: Optional[bool] = Field(
        None,
        description="Updated personalization setting"
    )
    
    allow_third_party_data_sharing: Optional[bool] = Field(
        None,
        description="Updated third-party data sharing setting"
    )
    
    # Security settings
    require_approval_for_tags: Optional[bool] = Field(
        None,
        description="Updated tag approval setting"
    )
    
    two_factor_enabled: Optional[bool] = Field(
        None,
        description="Updated two-factor authentication setting"
    )
    
    login_alerts: Optional[bool] = Field(
        None,
        description="Updated login alerts setting"
    )
    
    # Content filtering
    blocked_users: Optional[List[uuid.UUID]] = Field(
        None,
        description="Updated blocked users list"
    )
    
    blocked_keywords: Optional[List[str]] = Field(
        None,
        description="Updated blocked keywords list"
    )
    
    content_filter_level: Optional[str] = Field(
        None,
        description="Updated content filter level"
    )
    
    # Apply same validators as base class
    _validate_content_filter_level = validator('content_filter_level', allow_reuse=True)(PrivacySettingsBase.validate_content_filter_level)
    _validate_blocked_keywords = validator('blocked_keywords', allow_reuse=True)(PrivacySettingsBase.validate_blocked_keywords)


class PrivacySettingsResponse(BaseModel):
    """Schema for privacy settings API responses."""
    
    id: uuid.UUID = Field(..., description="Settings unique identifier")
    user_id: uuid.UUID = Field(..., description="Associated user ID")
    
    # Profile visibility settings
    profile_visibility: ProfileVisibility = Field(..., description="Profile visibility")
    show_email: PrivacyLevel = Field(..., description="Email visibility")
    show_phone: PrivacyLevel = Field(..., description="Phone visibility")
    show_birth_date: PrivacyLevel = Field(..., description="Birth date visibility")
    show_location: PrivacyLevel = Field(..., description="Location visibility")
    show_social_links: PrivacyLevel = Field(..., description="Social links visibility")
    
    # Activity visibility settings
    show_online_status: PrivacyLevel = Field(..., description="Online status visibility")
    show_last_seen: PrivacyLevel = Field(..., description="Last seen visibility")
    show_activity_feed: PrivacyLevel = Field(..., description="Activity feed visibility")
    show_followers: PrivacyLevel = Field(..., description="Followers visibility")
    show_following: PrivacyLevel = Field(..., description="Following visibility")
    
    # Game privacy settings
    show_game_stats: PrivacyLevel = Field(..., description="Game stats visibility")
    show_achievements: PrivacyLevel = Field(..., description="Achievements visibility")
    show_pokemon_collection: PrivacyLevel = Field(..., description="Pokémon collection visibility")
    show_battle_history: PrivacyLevel = Field(..., description="Battle history visibility")
    
    # Contact and discovery settings
    allow_friend_requests: bool = Field(..., description="Friend request setting")
    allow_messages_from_strangers: bool = Field(..., description="Stranger message setting")
    discoverable_by_email: bool = Field(..., description="Email discoverability")
    discoverable_by_phone: bool = Field(..., description="Phone discoverability")
    show_in_search: bool = Field(..., description="Search visibility")
    
    # Notification settings
    email_notifications: bool = Field(..., description="Email notifications")
    push_notifications: bool = Field(..., description="Push notifications")
    notification_types: List[NotificationType] = Field(..., description="Enabled notification types")
    
    # Data and analytics settings
    allow_analytics: bool = Field(..., description="Analytics setting")
    allow_personalization: bool = Field(..., description="Personalization setting")
    allow_third_party_data_sharing: bool = Field(..., description="Third-party data sharing")
    
    # Security settings
    require_approval_for_tags: bool = Field(..., description="Tag approval setting")
    two_factor_enabled: bool = Field(..., description="Two-factor authentication")
    login_alerts: bool = Field(..., description="Login alerts")
    
    # Content filtering
    blocked_users: List[uuid.UUID] = Field(..., description="Blocked users")
    blocked_keywords: List[str] = Field(..., description="Blocked keywords")
    content_filter_level: str = Field(..., description="Content filter level")
    
    # Timestamps
    created_at: datetime = Field(..., description="Settings creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")
    privacy_review_at: Optional[datetime] = Field(None, description="Last privacy review timestamp")
    
    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            uuid.UUID: lambda v: str(v),
        }


class PrivacySettingsPublicResponse(BaseModel):
    """Schema for public privacy settings (limited fields)."""
    
    user_id: uuid.UUID = Field(..., description="Associated user ID")
    profile_visibility: ProfileVisibility = Field(..., description="Profile visibility")
    allow_friend_requests: bool = Field(..., description="Friend request setting")
    show_in_search: bool = Field(..., description="Search visibility")
    
    class Config:
        from_attributes = True
        json_encoders = {
            uuid.UUID: lambda v: str(v),
        }


class BlockUserRequest(BaseModel):
    """Schema for blocking a user."""
    
    user_id: uuid.UUID = Field(
        ...,
        description="ID of the user to block"
    )
    
    reason: Optional[str] = Field(
        None,
        max_length=200,
        description="Reason for blocking (optional)"
    )


class UnblockUserRequest(BaseModel):
    """Schema for unblocking a user."""
    
    user_id: uuid.UUID = Field(
        ...,
        description="ID of the user to unblock"
    )


class BlockedUsersResponse(BaseModel):
    """Schema for blocked users list response."""
    
    blocked_users: List[Dict[str, Any]] = Field(
        ...,
        description="List of blocked users with basic info"
    )
    
    total: int = Field(
        ...,
        description="Total number of blocked users"
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


class AddBlockedKeywordRequest(BaseModel):
    """Schema for adding blocked keywords."""
    
    keywords: List[str] = Field(
        ...,
        min_items=1,
        max_items=20,
        description="List of keywords to block"
    )
    
    @validator('keywords')
    def validate_keywords(cls, v):
        """Validate keywords format."""
        cleaned = []
        for keyword in v:
            if isinstance(keyword, str) and keyword.strip():
                cleaned_keyword = keyword.strip().lower()
                if len(cleaned_keyword) > 50:
                    raise ValueError("Keywords cannot be longer than 50 characters")
                if cleaned_keyword not in cleaned:
                    cleaned.append(cleaned_keyword)
        
        if not cleaned:
            raise ValueError("At least one valid keyword is required")
        
        return cleaned


class RemoveBlockedKeywordRequest(BaseModel):
    """Schema for removing blocked keywords."""
    
    keywords: List[str] = Field(
        ...,
        min_items=1,
        description="List of keywords to unblock"
    )


class NotificationSettingsUpdate(BaseModel):
    """Schema for updating notification settings."""
    
    email_notifications: Optional[bool] = Field(
        None,
        description="Email notifications setting"
    )
    
    push_notifications: Optional[bool] = Field(
        None,
        description="Push notifications setting"
    )
    
    notification_types: Optional[List[NotificationType]] = Field(
        None,
        description="Enabled notification types"
    )
    
    notification_frequency: Optional[str] = Field(
        None,
        description="Notification frequency (immediate, hourly, daily, weekly)"
    )
    
    quiet_hours_start: Optional[str] = Field(
        None,
        regex=r"^([01]?[0-9]|2[0-3]):[0-5][0-9]$",
        description="Quiet hours start time (HH:MM format)"
    )
    
    quiet_hours_end: Optional[str] = Field(
        None,
        regex=r"^([01]?[0-9]|2[0-3]):[0-5][0-9]$",
        description="Quiet hours end time (HH:MM format)"
    )
    
    @validator('notification_frequency')
    def validate_notification_frequency(cls, v):
        """Validate notification frequency."""
        if v is not None:
            allowed_frequencies = {'immediate', 'hourly', 'daily', 'weekly'}
            if v not in allowed_frequencies:
                raise ValueError(f"Notification frequency must be one of: {', '.join(allowed_frequencies)}")
        return v


class PrivacyAuditResponse(BaseModel):
    """Schema for privacy audit response."""
    
    user_id: uuid.UUID = Field(..., description="User ID")
    audit_date: datetime = Field(..., description="Audit timestamp")
    
    # Privacy score and recommendations
    privacy_score: float = Field(..., description="Overall privacy score (0-100)")
    recommendations: List[str] = Field(..., description="Privacy improvement recommendations")
    
    # Settings analysis
    public_fields_count: int = Field(..., description="Number of public fields")
    private_fields_count: int = Field(..., description="Number of private fields")
    friends_only_fields_count: int = Field(..., description="Number of friends-only fields")
    
    # Security analysis
    security_issues: List[str] = Field(..., description="Identified security issues")
    security_score: float = Field(..., description="Security score (0-100)")
    
    # Data sharing analysis
    data_sharing_enabled: bool = Field(..., description="Whether data sharing is enabled")
    analytics_enabled: bool = Field(..., description="Whether analytics is enabled")
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            uuid.UUID: lambda v: str(v),
        }


class PrivacyExportRequest(BaseModel):
    """Schema for privacy data export requests."""
    
    include_settings: bool = Field(
        True,
        description="Include privacy settings in export"
    )
    
    include_blocked_users: bool = Field(
        True,
        description="Include blocked users list in export"
    )
    
    include_blocked_keywords: bool = Field(
        True,
        description="Include blocked keywords in export"
    )
    
    include_audit_history: bool = Field(
        False,
        description="Include privacy audit history in export"
    )
    
    format: str = Field(
        "json",
        description="Export format (json, csv)"
    )
    
    @validator('format')
    def validate_format(cls, v):
        """Validate export format."""
        allowed_formats = {'json', 'csv'}
        if v not in allowed_formats:
            raise ValueError(f"Export format must be one of: {', '.join(allowed_formats)}")
        return v


class PrivacyExportResponse(BaseModel):
    """Schema for privacy data export response."""
    
    export_id: uuid.UUID = Field(..., description="Export unique identifier")
    user_id: uuid.UUID = Field(..., description="User ID")
    status: str = Field(..., description="Export status (pending, completed, failed)")
    download_url: Optional[str] = Field(None, description="Download URL when ready")
    expires_at: Optional[datetime] = Field(None, description="Download URL expiration")
    created_at: datetime = Field(..., description="Export creation timestamp")
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            uuid.UUID: lambda v: str(v),
        }