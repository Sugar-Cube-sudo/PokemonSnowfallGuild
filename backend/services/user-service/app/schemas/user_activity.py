#!/usr/bin/env python3
"""
User Activity Schemas

Pydantic models for user activity-related API requests and responses.
"""

import uuid
from datetime import datetime
from typing import Optional, Dict, Any, List

from pydantic import BaseModel, Field, validator, IPvAnyAddress

from .enums import ActivityType, ActivityStatus


class UserActivityBase(BaseModel):
    """Base user activity schema with common fields."""
    
    activity_type: ActivityType = Field(
        ...,
        description="Type of activity performed"
    )
    
    activity_name: str = Field(
        ...,
        max_length=100,
        description="Name/title of the activity"
    )
    
    description: Optional[str] = Field(
        None,
        max_length=500,
        description="Detailed description of the activity"
    )
    
    resource_type: Optional[str] = Field(
        None,
        max_length=50,
        description="Type of resource involved (e.g., 'user', 'post', 'comment')"
    )
    
    resource_id: Optional[str] = Field(
        None,
        max_length=100,
        description="ID of the resource involved"
    )
    
    metadata: Optional[Dict[str, Any]] = Field(
        default_factory=dict,
        description="Additional activity metadata"
    )


class UserActivityCreate(UserActivityBase):
    """Schema for creating a new user activity record."""
    
    user_id: uuid.UUID = Field(
        ...,
        description="ID of the user performing the activity"
    )
    
    ip_address: Optional[IPvAnyAddress] = Field(
        None,
        description="IP address from which the activity was performed"
    )
    
    user_agent: Optional[str] = Field(
        None,
        max_length=500,
        description="User agent string from the request"
    )
    
    session_id: Optional[str] = Field(
        None,
        max_length=100,
        description="Session ID associated with the activity"
    )
    
    location_country: Optional[str] = Field(
        None,
        max_length=2,
        description="Country code (ISO 3166-1 alpha-2)"
    )
    
    location_city: Optional[str] = Field(
        None,
        max_length=100,
        description="City name"
    )
    
    location_coordinates: Optional[Dict[str, float]] = Field(
        None,
        description="Geographic coordinates (lat, lng)"
    )
    
    @validator('location_country')
    def validate_country_code(cls, v):
        """Validate country code format."""
        if v is not None and v.strip():
            if len(v) != 2 or not v.isalpha():
                raise ValueError("Country code must be a valid ISO 3166-1 alpha-2 code")
            return v.upper()
        return v
    
    @validator('location_coordinates')
    def validate_coordinates(cls, v):
        """Validate geographic coordinates."""
        if v is not None:
            if not isinstance(v, dict) or 'lat' not in v or 'lng' not in v:
                raise ValueError("Coordinates must contain 'lat' and 'lng' keys")
            
            lat, lng = v['lat'], v['lng']
            if not isinstance(lat, (int, float)) or not isinstance(lng, (int, float)):
                raise ValueError("Latitude and longitude must be numeric")
            
            if not (-90 <= lat <= 90):
                raise ValueError("Latitude must be between -90 and 90")
            
            if not (-180 <= lng <= 180):
                raise ValueError("Longitude must be between -180 and 180")
        
        return v


class UserActivityUpdate(BaseModel):
    """Schema for updating user activity records."""
    
    status: Optional[ActivityStatus] = Field(
        None,
        description="Updated activity status"
    )
    
    description: Optional[str] = Field(
        None,
        max_length=500,
        description="Updated description"
    )
    
    metadata: Optional[Dict[str, Any]] = Field(
        None,
        description="Updated metadata"
    )
    
    error_message: Optional[str] = Field(
        None,
        max_length=1000,
        description="Error message if activity failed"
    )
    
    error_code: Optional[str] = Field(
        None,
        max_length=50,
        description="Error code if activity failed"
    )
    
    duration_ms: Optional[int] = Field(
        None,
        ge=0,
        description="Activity duration in milliseconds"
    )
    
    response_size: Optional[int] = Field(
        None,
        ge=0,
        description="Response size in bytes"
    )


class UserActivityResponse(BaseModel):
    """Schema for user activity API responses."""
    
    id: uuid.UUID = Field(..., description="Activity unique identifier")
    user_id: uuid.UUID = Field(..., description="User who performed the activity")
    activity_type: ActivityType = Field(..., description="Type of activity")
    activity_name: str = Field(..., description="Activity name")
    description: Optional[str] = Field(None, description="Activity description")
    status: ActivityStatus = Field(..., description="Activity status")
    resource_type: Optional[str] = Field(None, description="Resource type")
    resource_id: Optional[str] = Field(None, description="Resource ID")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Activity metadata")
    
    # Request information
    ip_address: Optional[str] = Field(None, description="IP address")
    user_agent: Optional[str] = Field(None, description="User agent")
    session_id: Optional[str] = Field(None, description="Session ID")
    
    # Location information
    location_country: Optional[str] = Field(None, description="Country code")
    location_city: Optional[str] = Field(None, description="City name")
    location_coordinates: Optional[Dict[str, float]] = Field(None, description="Coordinates")
    
    # Performance metrics
    duration_ms: Optional[int] = Field(None, description="Duration in milliseconds")
    response_size: Optional[int] = Field(None, description="Response size in bytes")
    
    # Error information
    error_message: Optional[str] = Field(None, description="Error message")
    error_code: Optional[str] = Field(None, description="Error code")
    
    # Timestamps
    created_at: datetime = Field(..., description="Activity creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")
    completed_at: Optional[datetime] = Field(None, description="Activity completion timestamp")
    
    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            uuid.UUID: lambda v: str(v),
        }


class UserActivitySummaryResponse(BaseModel):
    """Schema for user activity summary."""
    
    user_id: uuid.UUID = Field(..., description="User ID")
    total_activities: int = Field(..., description="Total number of activities")
    activities_by_type: Dict[str, int] = Field(..., description="Activity count by type")
    activities_by_status: Dict[str, int] = Field(..., description="Activity count by status")
    last_activity_at: Optional[datetime] = Field(None, description="Last activity timestamp")
    most_common_activity: Optional[str] = Field(None, description="Most common activity type")
    average_session_duration: Optional[float] = Field(None, description="Average session duration in minutes")
    unique_sessions: int = Field(0, description="Number of unique sessions")
    unique_locations: int = Field(0, description="Number of unique locations")
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            uuid.UUID: lambda v: str(v),
        }


class ActivitySearchRequest(BaseModel):
    """Schema for activity search requests."""
    
    user_id: Optional[uuid.UUID] = Field(
        None,
        description="Filter by user ID"
    )
    
    activity_types: Optional[List[ActivityType]] = Field(
        None,
        description="Filter by activity types"
    )
    
    activity_status: Optional[List[ActivityStatus]] = Field(
        None,
        description="Filter by activity status"
    )
    
    resource_type: Optional[str] = Field(
        None,
        max_length=50,
        description="Filter by resource type"
    )
    
    resource_id: Optional[str] = Field(
        None,
        max_length=100,
        description="Filter by resource ID"
    )
    
    ip_address: Optional[str] = Field(
        None,
        description="Filter by IP address"
    )
    
    session_id: Optional[str] = Field(
        None,
        max_length=100,
        description="Filter by session ID"
    )
    
    location_country: Optional[str] = Field(
        None,
        max_length=2,
        description="Filter by country code"
    )
    
    location_city: Optional[str] = Field(
        None,
        max_length=100,
        description="Filter by city"
    )
    
    date_from: Optional[datetime] = Field(
        None,
        description="Filter activities from this date"
    )
    
    date_to: Optional[datetime] = Field(
        None,
        description="Filter activities until this date"
    )
    
    has_errors: Optional[bool] = Field(
        None,
        description="Filter activities with/without errors"
    )
    
    min_duration_ms: Optional[int] = Field(
        None,
        ge=0,
        description="Minimum duration filter (milliseconds)"
    )
    
    max_duration_ms: Optional[int] = Field(
        None,
        ge=0,
        description="Maximum duration filter (milliseconds)"
    )
    
    sort_by: Optional[str] = Field(
        "created_at",
        description="Sort field (created_at, updated_at, duration_ms)"
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
        50,
        ge=1,
        le=1000,
        description="Items per page"
    )
    
    @validator('date_to')
    def validate_date_range(cls, v, values):
        """Validate that date_to is after date_from."""
        if v is not None and 'date_from' in values and values['date_from'] is not None:
            if v < values['date_from']:
                raise ValueError("date_to must be after date_from")
        return v
    
    @validator('max_duration_ms')
    def validate_duration_range(cls, v, values):
        """Validate that max_duration_ms is greater than min_duration_ms."""
        if v is not None and 'min_duration_ms' in values and values['min_duration_ms'] is not None:
            if v < values['min_duration_ms']:
                raise ValueError("max_duration_ms must be greater than or equal to min_duration_ms")
        return v


class ActivitySearchResponse(BaseModel):
    """Schema for activity search results."""
    
    activities: List[UserActivityResponse] = Field(
        ...,
        description="List of matching activities"
    )
    
    total: int = Field(
        ...,
        description="Total number of matching activities"
    )
    
    page: int = Field(
        ...,
        description="Current page number"
    )
    
    per_page: int = Field(
        ...,
        description="Number of activities per page"
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


class ActivityStatsRequest(BaseModel):
    """Schema for activity statistics requests."""
    
    user_id: Optional[uuid.UUID] = Field(
        None,
        description="Filter by user ID"
    )
    
    date_from: Optional[datetime] = Field(
        None,
        description="Statistics from this date"
    )
    
    date_to: Optional[datetime] = Field(
        None,
        description="Statistics until this date"
    )
    
    group_by: Optional[str] = Field(
        "day",
        description="Group statistics by (hour, day, week, month)"
    )
    
    activity_types: Optional[List[ActivityType]] = Field(
        None,
        description="Include only these activity types"
    )
    
    @validator('date_to')
    def validate_date_range(cls, v, values):
        """Validate that date_to is after date_from."""
        if v is not None and 'date_from' in values and values['date_from'] is not None:
            if v < values['date_from']:
                raise ValueError("date_to must be after date_from")
        return v
    
    @validator('group_by')
    def validate_group_by(cls, v):
        """Validate group_by value."""
        allowed_values = {'hour', 'day', 'week', 'month'}
        if v not in allowed_values:
            raise ValueError(f"group_by must be one of: {', '.join(allowed_values)}")
        return v


class ActivityStatsResponse(BaseModel):
    """Schema for activity statistics response."""
    
    period_start: datetime = Field(..., description="Statistics period start")
    period_end: datetime = Field(..., description="Statistics period end")
    total_activities: int = Field(..., description="Total activities in period")
    unique_users: int = Field(..., description="Number of unique users")
    activities_by_type: Dict[str, int] = Field(..., description="Activities grouped by type")
    activities_by_status: Dict[str, int] = Field(..., description="Activities grouped by status")
    activities_by_period: List[Dict[str, Any]] = Field(..., description="Activities grouped by time period")
    top_activities: List[Dict[str, Any]] = Field(..., description="Most common activities")
    error_rate: float = Field(..., description="Error rate percentage")
    average_duration_ms: Optional[float] = Field(None, description="Average activity duration")
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat(),
        }


class BulkActivityCreateRequest(BaseModel):
    """Schema for bulk activity creation."""
    
    activities: List[UserActivityCreate] = Field(
        ...,
        min_items=1,
        max_items=1000,
        description="List of activities to create"
    )
    
    batch_id: Optional[str] = Field(
        None,
        max_length=100,
        description="Optional batch identifier"
    )


class BulkActivityCreateResponse(BaseModel):
    """Schema for bulk activity creation response."""
    
    success_count: int = Field(
        ...,
        description="Number of successfully created activities"
    )
    
    failure_count: int = Field(
        ...,
        description="Number of failed activity creations"
    )
    
    errors: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="List of errors for failed creations"
    )
    
    created_ids: List[uuid.UUID] = Field(
        default_factory=list,
        description="List of successfully created activity IDs"
    )
    
    batch_id: Optional[str] = Field(
        None,
        description="Batch identifier if provided"
    )
    
    class Config:
        json_encoders = {
            uuid.UUID: lambda v: str(v),
        }