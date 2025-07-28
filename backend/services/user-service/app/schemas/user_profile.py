#!/usr/bin/env python3
"""
User Profile Schemas

Pydantic models for user profile-related API requests and responses.
"""

import uuid
from datetime import datetime, date
from typing import Optional, Dict, List, Any

from pydantic import BaseModel, Field, validator, HttpUrl

from .enums import Gender, Timezone, PrivacyLevel


class SocialLinksBase(BaseModel):
    """Base schema for social media links."""
    
    twitter: Optional[str] = Field(None, max_length=100, description="Twitter username")
    instagram: Optional[str] = Field(None, max_length=100, description="Instagram username")
    youtube: Optional[str] = Field(None, max_length=100, description="YouTube channel")
    twitch: Optional[str] = Field(None, max_length=100, description="Twitch username")
    discord: Optional[str] = Field(None, max_length=100, description="Discord username")
    github: Optional[str] = Field(None, max_length=100, description="GitHub username")
    website: Optional[HttpUrl] = Field(None, description="Personal website URL")
    
    @validator('twitter', 'instagram', 'youtube', 'twitch', 'discord', 'github')
    def validate_social_username(cls, v):
        """Validate social media usernames."""
        if v is not None and v.strip():
            # Remove @ symbol if present
            v = v.strip().lstrip('@')
            # Basic validation for username format
            if not v.replace('_', '').replace('-', '').replace('.', '').isalnum():
                raise ValueError("Invalid username format")
        return v


class GamePreferencesBase(BaseModel):
    """Base schema for game preferences."""
    
    favorite_pokemon: Optional[List[str]] = Field(
        default_factory=list,
        max_items=6,
        description="List of favorite Pokémon names"
    )
    
    favorite_types: Optional[List[str]] = Field(
        default_factory=list,
        max_items=18,
        description="List of favorite Pokémon types"
    )
    
    favorite_regions: Optional[List[str]] = Field(
        default_factory=list,
        description="List of favorite Pokémon regions"
    )
    
    play_style: Optional[str] = Field(
        None,
        max_length=50,
        description="Preferred play style (e.g., 'competitive', 'casual', 'collector')"
    )
    
    experience_level: Optional[str] = Field(
        None,
        max_length=20,
        description="Experience level (e.g., 'beginner', 'intermediate', 'expert')"
    )
    
    interests: Optional[List[str]] = Field(
        default_factory=list,
        description="List of gaming interests"
    )


class UserProfileBase(BaseModel):
    """Base user profile schema with common fields."""
    
    bio: Optional[str] = Field(
        None,
        max_length=500,
        description="User biography/description"
    )
    
    location: Optional[str] = Field(
        None,
        max_length=100,
        description="User location"
    )
    
    birth_date: Optional[date] = Field(
        None,
        description="User birth date"
    )
    
    gender: Optional[Gender] = Field(
        None,
        description="User gender"
    )
    
    timezone: Optional[Timezone] = Field(
        None,
        description="User timezone"
    )
    
    language: Optional[str] = Field(
        None,
        max_length=10,
        description="Preferred language (ISO 639-1 code)"
    )
    
    phone: Optional[str] = Field(
        None,
        max_length=20,
        description="Phone number"
    )
    
    website: Optional[HttpUrl] = Field(
        None,
        description="Personal website URL"
    )
    
    occupation: Optional[str] = Field(
        None,
        max_length=100,
        description="User occupation"
    )
    
    education: Optional[str] = Field(
        None,
        max_length=200,
        description="Educational background"
    )
    
    interests: Optional[List[str]] = Field(
        default_factory=list,
        max_items=20,
        description="List of user interests"
    )
    
    skills: Optional[List[str]] = Field(
        default_factory=list,
        max_items=20,
        description="List of user skills"
    )
    
    @validator('birth_date')
    def validate_birth_date(cls, v):
        """Validate birth date is not in the future and user is at least 13 years old."""
        if v is not None:
            today = date.today()
            if v > today:
                raise ValueError("Birth date cannot be in the future")
            
            # Calculate age
            age = today.year - v.year - ((today.month, today.day) < (v.month, v.day))
            if age < 13:
                raise ValueError("User must be at least 13 years old")
        
        return v
    
    @validator('phone')
    def validate_phone(cls, v):
        """Basic phone number validation."""
        if v is not None and v.strip():
            # Remove common separators and spaces
            cleaned = ''.join(c for c in v if c.isdigit() or c in '+-')
            if len(cleaned) < 10 or len(cleaned) > 15:
                raise ValueError("Phone number must be between 10 and 15 digits")
        return v
    
    @validator('language')
    def validate_language(cls, v):
        """Validate language code format."""
        if v is not None and v.strip():
            # Basic validation for ISO 639-1 codes
            if len(v) != 2 or not v.isalpha():
                raise ValueError("Language must be a valid ISO 639-1 code (2 letters)")
            return v.lower()
        return v


class UserProfileCreate(UserProfileBase):
    """Schema for creating a user profile."""
    
    social_links: Optional[SocialLinksBase] = Field(
        default_factory=SocialLinksBase,
        description="Social media links"
    )
    
    game_preferences: Optional[GamePreferencesBase] = Field(
        default_factory=GamePreferencesBase,
        description="Gaming preferences"
    )
    
    custom_fields: Optional[Dict[str, Any]] = Field(
        default_factory=dict,
        description="Custom profile fields"
    )
    
    privacy_settings: Optional[Dict[str, PrivacyLevel]] = Field(
        default_factory=dict,
        description="Privacy settings for profile fields"
    )


class UserProfileUpdate(BaseModel):
    """Schema for updating user profile."""
    
    bio: Optional[str] = Field(
        None,
        max_length=500,
        description="Updated biography"
    )
    
    location: Optional[str] = Field(
        None,
        max_length=100,
        description="Updated location"
    )
    
    birth_date: Optional[date] = Field(
        None,
        description="Updated birth date"
    )
    
    gender: Optional[Gender] = Field(
        None,
        description="Updated gender"
    )
    
    timezone: Optional[Timezone] = Field(
        None,
        description="Updated timezone"
    )
    
    language: Optional[str] = Field(
        None,
        max_length=10,
        description="Updated language preference"
    )
    
    phone: Optional[str] = Field(
        None,
        max_length=20,
        description="Updated phone number"
    )
    
    website: Optional[HttpUrl] = Field(
        None,
        description="Updated website URL"
    )
    
    occupation: Optional[str] = Field(
        None,
        max_length=100,
        description="Updated occupation"
    )
    
    education: Optional[str] = Field(
        None,
        max_length=200,
        description="Updated education"
    )
    
    interests: Optional[List[str]] = Field(
        None,
        max_items=20,
        description="Updated interests"
    )
    
    skills: Optional[List[str]] = Field(
        None,
        max_items=20,
        description="Updated skills"
    )
    
    social_links: Optional[SocialLinksBase] = Field(
        None,
        description="Updated social media links"
    )
    
    game_preferences: Optional[GamePreferencesBase] = Field(
        None,
        description="Updated gaming preferences"
    )
    
    custom_fields: Optional[Dict[str, Any]] = Field(
        None,
        description="Updated custom fields"
    )
    
    privacy_settings: Optional[Dict[str, PrivacyLevel]] = Field(
        None,
        description="Updated privacy settings"
    )
    
    # Apply same validators as base class
    _validate_birth_date = validator('birth_date', allow_reuse=True)(UserProfileBase.validate_birth_date)
    _validate_phone = validator('phone', allow_reuse=True)(UserProfileBase.validate_phone)
    _validate_language = validator('language', allow_reuse=True)(UserProfileBase.validate_language)


class UserProfileResponse(BaseModel):
    """Schema for user profile API responses."""
    
    id: uuid.UUID = Field(..., description="Profile unique identifier")
    user_id: uuid.UUID = Field(..., description="Associated user ID")
    bio: Optional[str] = Field(None, description="User biography")
    location: Optional[str] = Field(None, description="User location")
    birth_date: Optional[date] = Field(None, description="User birth date")
    gender: Optional[Gender] = Field(None, description="User gender")
    timezone: Optional[Timezone] = Field(None, description="User timezone")
    language: Optional[str] = Field(None, description="Preferred language")
    phone: Optional[str] = Field(None, description="Phone number")
    website: Optional[HttpUrl] = Field(None, description="Personal website")
    occupation: Optional[str] = Field(None, description="User occupation")
    education: Optional[str] = Field(None, description="Educational background")
    interests: List[str] = Field(default_factory=list, description="User interests")
    skills: List[str] = Field(default_factory=list, description="User skills")
    social_links: Dict[str, str] = Field(default_factory=dict, description="Social media links")
    game_preferences: Dict[str, Any] = Field(default_factory=dict, description="Gaming preferences")
    custom_fields: Dict[str, Any] = Field(default_factory=dict, description="Custom fields")
    achievements: List[str] = Field(default_factory=list, description="User achievements")
    badges: List[str] = Field(default_factory=list, description="User badges")
    profile_views: int = Field(0, description="Number of profile views")
    completion_percentage: float = Field(0.0, description="Profile completion percentage")
    created_at: datetime = Field(..., description="Profile creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")
    
    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            date: lambda v: v.isoformat(),
            uuid.UUID: lambda v: str(v),
        }


class UserProfilePublicResponse(BaseModel):
    """Schema for public user profile information (respects privacy settings)."""
    
    user_id: uuid.UUID = Field(..., description="Associated user ID")
    bio: Optional[str] = Field(None, description="User biography")
    location: Optional[str] = Field(None, description="User location")
    website: Optional[HttpUrl] = Field(None, description="Personal website")
    interests: List[str] = Field(default_factory=list, description="User interests")
    skills: List[str] = Field(default_factory=list, description="User skills")
    social_links: Dict[str, str] = Field(default_factory=dict, description="Public social links")
    achievements: List[str] = Field(default_factory=list, description="Public achievements")
    badges: List[str] = Field(default_factory=list, description="Public badges")
    profile_views: int = Field(0, description="Number of profile views")
    created_at: datetime = Field(..., description="Profile creation timestamp")
    
    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            uuid.UUID: lambda v: str(v),
        }


class ProfileCompletionResponse(BaseModel):
    """Schema for profile completion status."""
    
    completion_percentage: float = Field(..., description="Completion percentage (0-100)")
    completed_fields: List[str] = Field(..., description="List of completed fields")
    missing_fields: List[str] = Field(..., description="List of missing fields")
    suggestions: List[str] = Field(..., description="Suggestions for improvement")
    
    class Config:
        json_encoders = {
            float: lambda v: round(v, 2),
        }


class ProfilePrivacyUpdate(BaseModel):
    """Schema for updating profile privacy settings."""
    
    field_name: str = Field(
        ...,
        description="Name of the field to update privacy for"
    )
    
    privacy_level: PrivacyLevel = Field(
        ...,
        description="New privacy level for the field"
    )


class ProfilePrivacyResponse(BaseModel):
    """Schema for profile privacy settings response."""
    
    privacy_settings: Dict[str, PrivacyLevel] = Field(
        ...,
        description="Current privacy settings for all fields"
    )
    
    last_updated: datetime = Field(
        ...,
        description="Last privacy settings update timestamp"
    )
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat(),
        }


class AchievementResponse(BaseModel):
    """Schema for achievement information."""
    
    id: str = Field(..., description="Achievement identifier")
    name: str = Field(..., description="Achievement name")
    description: str = Field(..., description="Achievement description")
    icon_url: Optional[str] = Field(None, description="Achievement icon URL")
    category: str = Field(..., description="Achievement category")
    rarity: str = Field(..., description="Achievement rarity")
    points: int = Field(..., description="Points awarded for this achievement")
    earned_at: datetime = Field(..., description="When the achievement was earned")
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat(),
        }


class BadgeResponse(BaseModel):
    """Schema for badge information."""
    
    id: str = Field(..., description="Badge identifier")
    name: str = Field(..., description="Badge name")
    description: str = Field(..., description="Badge description")
    icon_url: Optional[str] = Field(None, description="Badge icon URL")
    color: Optional[str] = Field(None, description="Badge color (hex code)")
    level: int = Field(1, description="Badge level")
    earned_at: datetime = Field(..., description="When the badge was earned")
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat(),
        }


class ProfileSearchRequest(BaseModel):
    """Schema for profile search requests."""
    
    query: Optional[str] = Field(
        None,
        max_length=100,
        description="Search query (username, display name, bio)"
    )
    
    location: Optional[str] = Field(
        None,
        max_length=100,
        description="Filter by location"
    )
    
    interests: Optional[List[str]] = Field(
        None,
        max_items=10,
        description="Filter by interests"
    )
    
    skills: Optional[List[str]] = Field(
        None,
        max_items=10,
        description="Filter by skills"
    )
    
    min_age: Optional[int] = Field(
        None,
        ge=13,
        le=120,
        description="Minimum age filter"
    )
    
    max_age: Optional[int] = Field(
        None,
        ge=13,
        le=120,
        description="Maximum age filter"
    )
    
    gender: Optional[Gender] = Field(
        None,
        description="Filter by gender"
    )
    
    has_achievements: Optional[bool] = Field(
        None,
        description="Filter users with achievements"
    )
    
    has_badges: Optional[bool] = Field(
        None,
        description="Filter users with badges"
    )
    
    sort_by: Optional[str] = Field(
        "created_at",
        description="Sort field (created_at, updated_at, profile_views, completion_percentage)"
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
    
    @validator('max_age')
    def validate_age_range(cls, v, values):
        """Validate that max_age is greater than min_age."""
        if v is not None and 'min_age' in values and values['min_age'] is not None:
            if v < values['min_age']:
                raise ValueError("max_age must be greater than or equal to min_age")
        return v


class ProfileSearchResponse(BaseModel):
    """Schema for profile search results."""
    
    profiles: List[UserProfilePublicResponse] = Field(
        ...,
        description="List of matching profiles"
    )
    
    total: int = Field(
        ...,
        description="Total number of matching profiles"
    )
    
    page: int = Field(
        ...,
        description="Current page number"
    )
    
    per_page: int = Field(
        ...,
        description="Number of profiles per page"
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