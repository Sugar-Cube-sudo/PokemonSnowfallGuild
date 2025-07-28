#!/usr/bin/env python3
"""
User Stats Schemas

Pydantic models for user statistics-related API requests and responses.
"""

import uuid
from datetime import datetime
from typing import Optional, Dict, Any, List

from pydantic import BaseModel, Field, validator


class UserStatsBase(BaseModel):
    """Base user statistics schema with common fields."""
    
    # Profile statistics
    profile_views: int = Field(
        0,
        ge=0,
        description="Number of profile views"
    )
    
    # Social statistics
    followers_count: int = Field(
        0,
        ge=0,
        description="Number of followers"
    )
    
    following_count: int = Field(
        0,
        ge=0,
        description="Number of users being followed"
    )
    
    # Content statistics
    posts_count: int = Field(
        0,
        ge=0,
        description="Number of posts created"
    )
    
    comments_count: int = Field(
        0,
        ge=0,
        description="Number of comments made"
    )
    
    likes_given: int = Field(
        0,
        ge=0,
        description="Number of likes given"
    )
    
    likes_received: int = Field(
        0,
        ge=0,
        description="Number of likes received"
    )
    
    # Interaction statistics
    reactions_given: int = Field(
        0,
        ge=0,
        description="Number of reactions given"
    )
    
    reactions_received: int = Field(
        0,
        ge=0,
        description="Number of reactions received"
    )
    
    shares_given: int = Field(
        0,
        ge=0,
        description="Number of shares given"
    )
    
    shares_received: int = Field(
        0,
        ge=0,
        description="Number of shares received"
    )
    
    mentions_given: int = Field(
        0,
        ge=0,
        description="Number of mentions given"
    )
    
    mentions_received: int = Field(
        0,
        ge=0,
        description="Number of mentions received"
    )
    
    # Activity statistics
    login_count: int = Field(
        0,
        ge=0,
        description="Total number of logins"
    )
    
    login_streak: int = Field(
        0,
        ge=0,
        description="Current consecutive login streak"
    )
    
    max_login_streak: int = Field(
        0,
        ge=0,
        description="Maximum login streak achieved"
    )
    
    total_online_time_minutes: int = Field(
        0,
        ge=0,
        description="Total time spent online in minutes"
    )
    
    # Game statistics
    pokemon_caught: int = Field(
        0,
        ge=0,
        description="Number of Pokémon caught"
    )
    
    battles_won: int = Field(
        0,
        ge=0,
        description="Number of battles won"
    )
    
    battles_lost: int = Field(
        0,
        ge=0,
        description="Number of battles lost"
    )
    
    achievements_earned: int = Field(
        0,
        ge=0,
        description="Number of achievements earned"
    )
    
    badges_earned: int = Field(
        0,
        ge=0,
        description="Number of badges earned"
    )
    
    # Reputation and experience
    reputation_score: int = Field(
        0,
        description="User reputation score"
    )
    
    experience_points: int = Field(
        0,
        ge=0,
        description="Total experience points"
    )
    
    level: int = Field(
        1,
        ge=1,
        description="User level"
    )
    
    # Custom statistics
    custom_stats: Optional[Dict[str, Any]] = Field(
        default_factory=dict,
        description="Custom statistics fields"
    )


class UserStatsCreate(UserStatsBase):
    """Schema for creating user statistics."""
    
    user_id: uuid.UUID = Field(
        ...,
        description="ID of the user these statistics belong to"
    )


class UserStatsUpdate(BaseModel):
    """Schema for updating user statistics."""
    
    # Profile statistics
    profile_views: Optional[int] = Field(
        None,
        ge=0,
        description="Updated profile views count"
    )
    
    # Social statistics
    followers_count: Optional[int] = Field(
        None,
        ge=0,
        description="Updated followers count"
    )
    
    following_count: Optional[int] = Field(
        None,
        ge=0,
        description="Updated following count"
    )
    
    # Content statistics
    posts_count: Optional[int] = Field(
        None,
        ge=0,
        description="Updated posts count"
    )
    
    comments_count: Optional[int] = Field(
        None,
        ge=0,
        description="Updated comments count"
    )
    
    likes_given: Optional[int] = Field(
        None,
        ge=0,
        description="Updated likes given count"
    )
    
    likes_received: Optional[int] = Field(
        None,
        ge=0,
        description="Updated likes received count"
    )
    
    # Interaction statistics
    reactions_given: Optional[int] = Field(
        None,
        ge=0,
        description="Updated reactions given count"
    )
    
    reactions_received: Optional[int] = Field(
        None,
        ge=0,
        description="Updated reactions received count"
    )
    
    shares_given: Optional[int] = Field(
        None,
        ge=0,
        description="Updated shares given count"
    )
    
    shares_received: Optional[int] = Field(
        None,
        ge=0,
        description="Updated shares received count"
    )
    
    mentions_given: Optional[int] = Field(
        None,
        ge=0,
        description="Updated mentions given count"
    )
    
    mentions_received: Optional[int] = Field(
        None,
        ge=0,
        description="Updated mentions received count"
    )
    
    # Activity statistics
    login_count: Optional[int] = Field(
        None,
        ge=0,
        description="Updated login count"
    )
    
    login_streak: Optional[int] = Field(
        None,
        ge=0,
        description="Updated login streak"
    )
    
    max_login_streak: Optional[int] = Field(
        None,
        ge=0,
        description="Updated max login streak"
    )
    
    total_online_time_minutes: Optional[int] = Field(
        None,
        ge=0,
        description="Updated total online time"
    )
    
    # Game statistics
    pokemon_caught: Optional[int] = Field(
        None,
        ge=0,
        description="Updated Pokémon caught count"
    )
    
    battles_won: Optional[int] = Field(
        None,
        ge=0,
        description="Updated battles won count"
    )
    
    battles_lost: Optional[int] = Field(
        None,
        ge=0,
        description="Updated battles lost count"
    )
    
    achievements_earned: Optional[int] = Field(
        None,
        ge=0,
        description="Updated achievements count"
    )
    
    badges_earned: Optional[int] = Field(
        None,
        ge=0,
        description="Updated badges count"
    )
    
    # Reputation and experience
    reputation_score: Optional[int] = Field(
        None,
        description="Updated reputation score"
    )
    
    experience_points: Optional[int] = Field(
        None,
        ge=0,
        description="Updated experience points"
    )
    
    level: Optional[int] = Field(
        None,
        ge=1,
        description="Updated user level"
    )
    
    # Custom statistics
    custom_stats: Optional[Dict[str, Any]] = Field(
        None,
        description="Updated custom statistics"
    )


class UserStatsResponse(BaseModel):
    """Schema for user statistics API responses."""
    
    id: uuid.UUID = Field(..., description="Statistics record unique identifier")
    user_id: uuid.UUID = Field(..., description="Associated user ID")
    
    # Profile statistics
    profile_views: int = Field(..., description="Profile views count")
    
    # Social statistics
    followers_count: int = Field(..., description="Followers count")
    following_count: int = Field(..., description="Following count")
    
    # Content statistics
    posts_count: int = Field(..., description="Posts count")
    comments_count: int = Field(..., description="Comments count")
    likes_given: int = Field(..., description="Likes given count")
    likes_received: int = Field(..., description="Likes received count")
    
    # Interaction statistics
    reactions_given: int = Field(..., description="Reactions given count")
    reactions_received: int = Field(..., description="Reactions received count")
    shares_given: int = Field(..., description="Shares given count")
    shares_received: int = Field(..., description="Shares received count")
    mentions_given: int = Field(..., description="Mentions given count")
    mentions_received: int = Field(..., description="Mentions received count")
    
    # Activity statistics
    login_count: int = Field(..., description="Login count")
    login_streak: int = Field(..., description="Current login streak")
    max_login_streak: int = Field(..., description="Maximum login streak")
    total_online_time_minutes: int = Field(..., description="Total online time in minutes")
    
    # Game statistics
    pokemon_caught: int = Field(..., description="Pokémon caught count")
    battles_won: int = Field(..., description="Battles won count")
    battles_lost: int = Field(..., description="Battles lost count")
    achievements_earned: int = Field(..., description="Achievements earned count")
    badges_earned: int = Field(..., description="Badges earned count")
    
    # Reputation and experience
    reputation_score: int = Field(..., description="Reputation score")
    experience_points: int = Field(..., description="Experience points")
    level: int = Field(..., description="User level")
    
    # Custom statistics
    custom_stats: Dict[str, Any] = Field(default_factory=dict, description="Custom statistics")
    
    # Timestamps
    created_at: datetime = Field(..., description="Statistics creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")
    
    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            uuid.UUID: lambda v: str(v),
        }


class UserStatsIncrementRequest(BaseModel):
    """Schema for incrementing specific statistics."""
    
    field_name: str = Field(
        ...,
        description="Name of the statistic field to increment"
    )
    
    increment_by: int = Field(
        1,
        description="Amount to increment by (default: 1)"
    )
    
    @validator('field_name')
    def validate_field_name(cls, v):
        """Validate that the field name is allowed for incrementation."""
        allowed_fields = {
            'profile_views', 'followers_count', 'following_count',
            'posts_count', 'comments_count', 'likes_given', 'likes_received',
            'reactions_given', 'reactions_received', 'shares_given', 'shares_received',
            'mentions_given', 'mentions_received', 'login_count',
            'total_online_time_minutes', 'pokemon_caught', 'battles_won', 'battles_lost',
            'achievements_earned', 'badges_earned', 'experience_points'
        }
        
        if v not in allowed_fields:
            raise ValueError(f"Field '{v}' is not allowed for incrementation")
        
        return v


class UserStatsDecrementRequest(BaseModel):
    """Schema for decrementing specific statistics."""
    
    field_name: str = Field(
        ...,
        description="Name of the statistic field to decrement"
    )
    
    decrement_by: int = Field(
        1,
        ge=1,
        description="Amount to decrement by (default: 1)"
    )
    
    @validator('field_name')
    def validate_field_name(cls, v):
        """Validate that the field name is allowed for decrementation."""
        allowed_fields = {
            'followers_count', 'following_count', 'posts_count', 'comments_count',
            'likes_given', 'likes_received', 'reactions_given', 'reactions_received',
            'shares_given', 'shares_received', 'mentions_given', 'mentions_received'
        }
        
        if v not in allowed_fields:
            raise ValueError(f"Field '{v}' is not allowed for decrementation")
        
        return v


class UserStatsComparisonResponse(BaseModel):
    """Schema for comparing user statistics."""
    
    user_id: uuid.UUID = Field(..., description="User ID")
    comparison_user_id: uuid.UUID = Field(..., description="Comparison user ID")
    
    comparisons: Dict[str, Dict[str, Any]] = Field(
        ...,
        description="Field-by-field comparison results"
    )
    
    summary: Dict[str, Any] = Field(
        ...,
        description="Summary of comparison results"
    )
    
    class Config:
        json_encoders = {
            uuid.UUID: lambda v: str(v),
        }


class UserStatsLeaderboardRequest(BaseModel):
    """Schema for leaderboard requests."""
    
    field_name: str = Field(
        ...,
        description="Statistic field to rank by"
    )
    
    limit: int = Field(
        10,
        ge=1,
        le=100,
        description="Number of top users to return"
    )
    
    include_user_id: Optional[uuid.UUID] = Field(
        None,
        description="Include specific user in results even if not in top N"
    )
    
    @validator('field_name')
    def validate_field_name(cls, v):
        """Validate that the field name is valid for leaderboards."""
        allowed_fields = {
            'profile_views', 'followers_count', 'following_count',
            'posts_count', 'comments_count', 'likes_received',
            'reactions_received', 'shares_received', 'mentions_received',
            'login_count', 'login_streak', 'max_login_streak',
            'total_online_time_minutes', 'pokemon_caught', 'battles_won',
            'achievements_earned', 'badges_earned', 'reputation_score',
            'experience_points', 'level'
        }
        
        if v not in allowed_fields:
            raise ValueError(f"Field '{v}' is not valid for leaderboards")
        
        return v


class UserStatsLeaderboardEntry(BaseModel):
    """Schema for leaderboard entry."""
    
    rank: int = Field(..., description="User rank in leaderboard")
    user_id: uuid.UUID = Field(..., description="User ID")
    username: str = Field(..., description="Username")
    display_name: str = Field(..., description="Display name")
    avatar_url: Optional[str] = Field(None, description="Avatar URL")
    value: int = Field(..., description="Statistic value")
    
    class Config:
        json_encoders = {
            uuid.UUID: lambda v: str(v),
        }


class UserStatsLeaderboardResponse(BaseModel):
    """Schema for leaderboard response."""
    
    field_name: str = Field(..., description="Statistic field used for ranking")
    total_users: int = Field(..., description="Total number of users with this statistic")
    entries: List[UserStatsLeaderboardEntry] = Field(..., description="Leaderboard entries")
    user_rank: Optional[int] = Field(None, description="Requesting user's rank (if applicable)")
    
    class Config:
        json_encoders = {
            uuid.UUID: lambda v: str(v),
        }


class UserStatsHistoryRequest(BaseModel):
    """Schema for statistics history requests."""
    
    user_id: uuid.UUID = Field(
        ...,
        description="User ID to get history for"
    )
    
    field_names: Optional[List[str]] = Field(
        None,
        description="Specific fields to include (all if not specified)"
    )
    
    date_from: Optional[datetime] = Field(
        None,
        description="Start date for history"
    )
    
    date_to: Optional[datetime] = Field(
        None,
        description="End date for history"
    )
    
    granularity: str = Field(
        "day",
        description="Data granularity (hour, day, week, month)"
    )
    
    @validator('granularity')
    def validate_granularity(cls, v):
        """Validate granularity value."""
        allowed_values = {'hour', 'day', 'week', 'month'}
        if v not in allowed_values:
            raise ValueError(f"Granularity must be one of: {', '.join(allowed_values)}")
        return v
    
    @validator('date_to')
    def validate_date_range(cls, v, values):
        """Validate that date_to is after date_from."""
        if v is not None and 'date_from' in values and values['date_from'] is not None:
            if v < values['date_from']:
                raise ValueError("date_to must be after date_from")
        return v


class UserStatsHistoryEntry(BaseModel):
    """Schema for statistics history entry."""
    
    timestamp: datetime = Field(..., description="Timestamp for this data point")
    values: Dict[str, int] = Field(..., description="Statistic values at this timestamp")
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat(),
        }


class UserStatsHistoryResponse(BaseModel):
    """Schema for statistics history response."""
    
    user_id: uuid.UUID = Field(..., description="User ID")
    field_names: List[str] = Field(..., description="Fields included in history")
    granularity: str = Field(..., description="Data granularity")
    period_start: datetime = Field(..., description="History period start")
    period_end: datetime = Field(..., description="History period end")
    entries: List[UserStatsHistoryEntry] = Field(..., description="History data points")
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            uuid.UUID: lambda v: str(v),
        }


class BulkStatsUpdateRequest(BaseModel):
    """Schema for bulk statistics updates."""
    
    updates: List[Dict[str, Any]] = Field(
        ...,
        min_items=1,
        max_items=1000,
        description="List of statistics updates"
    )
    
    batch_id: Optional[str] = Field(
        None,
        max_length=100,
        description="Optional batch identifier"
    )


class BulkStatsUpdateResponse(BaseModel):
    """Schema for bulk statistics update response."""
    
    success_count: int = Field(
        ...,
        description="Number of successful updates"
    )
    
    failure_count: int = Field(
        ...,
        description="Number of failed updates"
    )
    
    errors: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="List of errors for failed updates"
    )
    
    batch_id: Optional[str] = Field(
        None,
        description="Batch identifier if provided"
    )