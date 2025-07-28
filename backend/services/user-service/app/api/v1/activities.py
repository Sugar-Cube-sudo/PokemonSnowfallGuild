#!/usr/bin/env python3
"""
User Activity API Routes

API endpoints for user activity tracking and management.
"""

import uuid
from typing import List, Optional
from datetime import datetime, date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from ...core.database import get_db
from ...core.security import get_current_user, get_current_active_user
from ...models.user import User
from ...schemas.user_activity import (
    UserActivityCreate,
    UserActivityUpdate,
    UserActivityResponse,
    UserActivitySummaryResponse,
    ActivitySearchRequest,
    ActivitySearchResponse,
    ActivityStatsRequest,
    ActivityStatsResponse,
    BulkActivityCreateRequest,
    BulkActivityCreateResponse
)
from ...schemas.enums import ActivityType, ActivityStatus, SortOrder, UserRole
from ...services.activity_service import ActivityService
from ...core.exceptions import (
    UserNotFoundError,
    ActivityNotFoundError,
    PermissionDeniedError,
    ValidationError
)

router = APIRouter()


@router.post(
    "/",
    response_model=UserActivityResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create user activity",
    description="Create a new user activity record."
)
async def create_activity(
    activity_data: UserActivityCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create user activity."""
    try:
        activity_service = ActivityService(db)
        activity = await activity_service.create_activity(
            user_id=current_user.id,
            activity_data=activity_data
        )
        return activity
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create activity"
        )


@router.get(
    "/me",
    response_model=List[UserActivityResponse],
    summary="Get current user activities",
    description="Get activities for the current authenticated user."
)
async def get_current_user_activities(
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=100, description="Items per page"),
    activity_type: Optional[ActivityType] = Query(None, description="Filter by activity type"),
    status_filter: Optional[ActivityStatus] = Query(None, description="Filter by status"),
    start_date: Optional[date] = Query(None, description="Start date filter"),
    end_date: Optional[date] = Query(None, description="End date filter"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get current user activities."""
    try:
        activity_service = ActivityService(db)
        activities = await activity_service.get_user_activities(
            user_id=current_user.id,
            page=page,
            per_page=per_page,
            activity_type=activity_type,
            status_filter=status_filter,
            start_date=start_date,
            end_date=end_date
        )
        return activities
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve activities"
        )


@router.get(
    "/{activity_id}",
    response_model=UserActivityResponse,
    summary="Get activity by ID",
    description="Get a specific activity by its ID."
)
async def get_activity(
    activity_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get activity by ID."""
    try:
        activity_service = ActivityService(db)
        activity = await activity_service.get_activity_by_id(
            activity_id=activity_id,
            requester=current_user
        )
        
        if not activity:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Activity not found"
            )
        
        return activity
    except ActivityNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Activity not found"
        )
    except PermissionDeniedError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission denied"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve activity"
        )


@router.put(
    "/{activity_id}",
    response_model=UserActivityResponse,
    summary="Update activity",
    description="Update a specific activity."
)
async def update_activity(
    activity_id: uuid.UUID,
    activity_data: UserActivityUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update activity."""
    try:
        activity_service = ActivityService(db)
        updated_activity = await activity_service.update_activity(
            activity_id=activity_id,
            activity_data=activity_data,
            requester=current_user
        )
        return updated_activity
    except ActivityNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Activity not found"
        )
    except PermissionDeniedError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission denied"
        )
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update activity"
        )


@router.delete(
    "/{activity_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete activity",
    description="Delete a specific activity."
)
async def delete_activity(
    activity_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete activity."""
    try:
        activity_service = ActivityService(db)
        await activity_service.delete_activity(
            activity_id=activity_id,
            requester=current_user
        )
    except ActivityNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Activity not found"
        )
    except PermissionDeniedError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission denied"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete activity"
        )


@router.get(
    "/user/{user_id}",
    response_model=List[UserActivityResponse],
    summary="Get user activities by user ID",
    description="Get public activities for a specific user."
)
async def get_user_activities(
    user_id: uuid.UUID,
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=100, description="Items per page"),
    activity_type: Optional[ActivityType] = Query(None, description="Filter by activity type"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    """Get user activities by user ID."""
    try:
        activity_service = ActivityService(db)
        activities = await activity_service.get_public_user_activities(
            user_id=user_id,
            page=page,
            per_page=per_page,
            activity_type=activity_type,
            requester=current_user
        )
        return activities
    except UserNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    except PermissionDeniedError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User activities are private"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve user activities"
        )


@router.get(
    "/me/summary",
    response_model=UserActivitySummaryResponse,
    summary="Get activity summary",
    description="Get activity summary for the current user."
)
async def get_activity_summary(
    start_date: Optional[date] = Query(None, description="Start date for summary"),
    end_date: Optional[date] = Query(None, description="End date for summary"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get activity summary."""
    try:
        activity_service = ActivityService(db)
        summary = await activity_service.get_activity_summary(
            user_id=current_user.id,
            start_date=start_date,
            end_date=end_date
        )
        return summary
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get activity summary"
        )


@router.post(
    "/search",
    response_model=ActivitySearchResponse,
    summary="Search activities",
    description="Search activities based on various criteria."
)
async def search_activities(
    search_request: ActivitySearchRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Search activities."""
    try:
        activity_service = ActivityService(db)
        results = await activity_service.search_activities(
            search_request=search_request,
            requester=current_user
        )
        return results
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to search activities"
        )


@router.post(
    "/stats",
    response_model=ActivityStatsResponse,
    summary="Get activity statistics",
    description="Get detailed activity statistics based on criteria."
)
async def get_activity_stats(
    stats_request: ActivityStatsRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get activity statistics."""
    try:
        activity_service = ActivityService(db)
        stats = await activity_service.get_activity_stats(
            stats_request=stats_request,
            requester=current_user
        )
        return stats
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except PermissionDeniedError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission denied"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get activity statistics"
        )


@router.post(
    "/bulk",
    response_model=BulkActivityCreateResponse,
    summary="Create bulk activities",
    description="Create multiple activities in a single request."
)
async def create_bulk_activities(
    bulk_request: BulkActivityCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create bulk activities."""
    try:
        activity_service = ActivityService(db)
        result = await activity_service.create_bulk_activities(
            bulk_request=bulk_request,
            user_id=current_user.id
        )
        return result
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create bulk activities"
        )


@router.get(
    "/recent",
    response_model=List[UserActivityResponse],
    summary="Get recent activities",
    description="Get recent activities across all users (public activities only)."
)
async def get_recent_activities(
    limit: int = Query(20, ge=1, le=100, description="Number of activities to return"),
    activity_type: Optional[ActivityType] = Query(None, description="Filter by activity type"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    """Get recent activities."""
    try:
        activity_service = ActivityService(db)
        activities = await activity_service.get_recent_activities(
            limit=limit,
            activity_type=activity_type,
            requester=current_user
        )
        return activities
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get recent activities"
        )


@router.get(
    "/trending",
    response_model=List[UserActivityResponse],
    summary="Get trending activities",
    description="Get trending activities based on engagement and popularity."
)
async def get_trending_activities(
    limit: int = Query(20, ge=1, le=100, description="Number of activities to return"),
    time_range: str = Query("24h", regex="^(1h|6h|24h|7d|30d)$", description="Time range for trending"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    """Get trending activities."""
    try:
        activity_service = ActivityService(db)
        activities = await activity_service.get_trending_activities(
            limit=limit,
            time_range=time_range,
            requester=current_user
        )
        return activities
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get trending activities"
        )


@router.post(
    "/{activity_id}/like",
    status_code=status.HTTP_200_OK,
    summary="Like activity",
    description="Like or unlike a specific activity."
)
async def toggle_activity_like(
    activity_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Toggle activity like."""
    try:
        activity_service = ActivityService(db)
        result = await activity_service.toggle_activity_like(
            activity_id=activity_id,
            user_id=current_user.id
        )
        return result
    except ActivityNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Activity not found"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to toggle activity like"
        )


@router.get(
    "/{activity_id}/likes",
    summary="Get activity likes",
    description="Get users who liked a specific activity."
)
async def get_activity_likes(
    activity_id: uuid.UUID,
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    """Get activity likes."""
    try:
        activity_service = ActivityService(db)
        likes = await activity_service.get_activity_likes(
            activity_id=activity_id,
            page=page,
            per_page=per_page,
            requester=current_user
        )
        return likes
    except ActivityNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Activity not found"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get activity likes"
        )


@router.delete(
    "/me/cleanup",
    status_code=status.HTTP_200_OK,
    summary="Cleanup old activities",
    description="Clean up old activities for the current user."
)
async def cleanup_old_activities(
    days_old: int = Query(90, ge=30, le=365, description="Delete activities older than this many days"),
    activity_types: Optional[List[ActivityType]] = Query(None, description="Specific activity types to clean up"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Cleanup old activities."""
    try:
        activity_service = ActivityService(db)
        result = await activity_service.cleanup_old_activities(
            user_id=current_user.id,
            days_old=days_old,
            activity_types=activity_types
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to cleanup activities"
        )


@router.get(
    "/admin/overview",
    summary="Get activities overview",
    description="Get overview statistics for all activities (admin only)."
)
async def get_activities_overview(
    start_date: Optional[date] = Query(None, description="Start date for overview"),
    end_date: Optional[date] = Query(None, description="End date for overview"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get activities overview (admin only)."""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission denied"
        )
    
    try:
        activity_service = ActivityService(db)
        overview = await activity_service.get_activities_overview(
            start_date=start_date,
            end_date=end_date
        )
        return overview
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get activities overview"
        )