#!/usr/bin/env python3
"""
User Statistics API Routes

API endpoints for user statistics management and analytics.
"""

import uuid
from typing import List, Optional
from datetime import datetime, date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from ...core.database import get_db
from ...core.security import get_current_user, get_current_active_user
from ...models.user import User
from ...schemas.user_stats import (
    UserStatsCreate,
    UserStatsUpdate,
    UserStatsResponse,
    UserStatsIncrementRequest,
    UserStatsDecrementRequest,
    UserStatsComparisonResponse,
    UserStatsLeaderboardRequest,
    UserStatsLeaderboardResponse,
    UserStatsHistoryRequest,
    UserStatsHistoryResponse,
    BulkStatsUpdateRequest,
    BulkStatsUpdateResponse
)
from ...schemas.enums import SortOrder, UserRole
from ...services.stats_service import StatsService
from ...core.exceptions import (
    UserNotFoundError,
    StatsNotFoundError,
    PermissionDeniedError,
    ValidationError
)

router = APIRouter()


@router.post(
    "/",
    response_model=UserStatsResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create user statistics",
    description="Create initial statistics for a user."
)
async def create_user_stats(
    stats_data: UserStatsCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create user statistics."""
    try:
        stats_service = StatsService(db)
        stats = await stats_service.create_user_stats(
            user_id=current_user.id,
            stats_data=stats_data
        )
        return stats
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create user statistics"
        )


@router.get(
    "/me",
    response_model=UserStatsResponse,
    summary="Get current user statistics",
    description="Get statistics for the current authenticated user."
)
async def get_current_user_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get current user statistics."""
    try:
        stats_service = StatsService(db)
        stats = await stats_service.get_user_stats(current_user.id)
        
        if not stats:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Statistics not found"
            )
        
        return stats
    except StatsNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Statistics not found"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve statistics"
        )


@router.get(
    "/{user_id}",
    response_model=UserStatsResponse,
    summary="Get user statistics by ID",
    description="Get public statistics for a specific user."
)
async def get_user_stats(
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    """Get user statistics by ID."""
    try:
        stats_service = StatsService(db)
        stats = await stats_service.get_public_user_stats(
            user_id=user_id,
            requester=current_user
        )
        
        if not stats:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Statistics not found"
            )
        
        return stats
    except UserNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    except StatsNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Statistics not found"
        )
    except PermissionDeniedError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Statistics are private"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve statistics"
        )


@router.put(
    "/me",
    response_model=UserStatsResponse,
    summary="Update current user statistics",
    description="Update statistics for the current authenticated user."
)
async def update_current_user_stats(
    stats_data: UserStatsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update current user statistics."""
    try:
        stats_service = StatsService(db)
        updated_stats = await stats_service.update_user_stats(
            user_id=current_user.id,
            stats_data=stats_data
        )
        return updated_stats
    except StatsNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Statistics not found"
        )
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update statistics"
        )


@router.post(
    "/me/increment",
    response_model=UserStatsResponse,
    summary="Increment user statistics",
    description="Increment specific statistics fields for the current user."
)
async def increment_user_stats(
    increment_data: UserStatsIncrementRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Increment user statistics."""
    try:
        stats_service = StatsService(db)
        updated_stats = await stats_service.increment_user_stats(
            user_id=current_user.id,
            increment_data=increment_data
        )
        return updated_stats
    except StatsNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Statistics not found"
        )
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to increment statistics"
        )


@router.post(
    "/me/decrement",
    response_model=UserStatsResponse,
    summary="Decrement user statistics",
    description="Decrement specific statistics fields for the current user."
)
async def decrement_user_stats(
    decrement_data: UserStatsDecrementRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Decrement user statistics."""
    try:
        stats_service = StatsService(db)
        updated_stats = await stats_service.decrement_user_stats(
            user_id=current_user.id,
            decrement_data=decrement_data
        )
        return updated_stats
    except StatsNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Statistics not found"
        )
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to decrement statistics"
        )


@router.get(
    "/me/compare/{user_id}",
    response_model=UserStatsComparisonResponse,
    summary="Compare statistics",
    description="Compare current user's statistics with another user."
)
async def compare_user_stats(
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Compare user statistics."""
    try:
        stats_service = StatsService(db)
        comparison = await stats_service.compare_user_stats(
            user1_id=current_user.id,
            user2_id=user_id
        )
        return comparison
    except UserNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    except StatsNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Statistics not found for one or both users"
        )
    except PermissionDeniedError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot compare with private statistics"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to compare statistics"
        )


@router.post(
    "/leaderboard",
    response_model=UserStatsLeaderboardResponse,
    summary="Get statistics leaderboard",
    description="Get leaderboard for specific statistics."
)
async def get_stats_leaderboard(
    leaderboard_request: UserStatsLeaderboardRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    """Get statistics leaderboard."""
    try:
        stats_service = StatsService(db)
        leaderboard = await stats_service.get_stats_leaderboard(
            leaderboard_request=leaderboard_request,
            requester=current_user
        )
        return leaderboard
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get leaderboard"
        )


@router.post(
    "/me/history",
    response_model=UserStatsHistoryResponse,
    summary="Get statistics history",
    description="Get historical statistics data for the current user."
)
async def get_user_stats_history(
    history_request: UserStatsHistoryRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get user statistics history."""
    try:
        stats_service = StatsService(db)
        history = await stats_service.get_user_stats_history(
            user_id=current_user.id,
            history_request=history_request
        )
        return history
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get statistics history"
        )


@router.post(
    "/bulk-update",
    response_model=BulkStatsUpdateResponse,
    summary="Bulk update statistics",
    description="Update statistics for multiple users (admin only)."
)
async def bulk_update_stats(
    bulk_request: BulkStatsUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Bulk update statistics (admin only)."""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission denied"
        )
    
    try:
        stats_service = StatsService(db)
        result = await stats_service.bulk_update_stats(bulk_request)
        return result
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to bulk update statistics"
        )


@router.get(
    "/top-performers",
    summary="Get top performers",
    description="Get top performing users across different statistics."
)
async def get_top_performers(
    metric: str = Query(..., description="Metric to rank by (e.g., 'total_posts', 'total_likes')"),
    limit: int = Query(10, ge=1, le=100, description="Number of top performers to return"),
    time_range: Optional[str] = Query(None, regex="^(24h|7d|30d|90d|1y|all)$", description="Time range for ranking"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    """Get top performers."""
    try:
        stats_service = StatsService(db)
        top_performers = await stats_service.get_top_performers(
            metric=metric,
            limit=limit,
            time_range=time_range,
            requester=current_user
        )
        return top_performers
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get top performers"
        )


@router.get(
    "/me/achievements",
    summary="Get statistics-based achievements",
    description="Get achievements earned based on statistics milestones."
)
async def get_stats_achievements(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get statistics-based achievements."""
    try:
        stats_service = StatsService(db)
        achievements = await stats_service.get_stats_achievements(current_user.id)
        return achievements
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get statistics achievements"
        )


@router.get(
    "/me/trends",
    summary="Get statistics trends",
    description="Get trending statistics for the current user."
)
async def get_user_stats_trends(
    days: int = Query(30, ge=7, le=365, description="Number of days to analyze trends"),
    metrics: Optional[List[str]] = Query(None, description="Specific metrics to analyze"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get user statistics trends."""
    try:
        stats_service = StatsService(db)
        trends = await stats_service.get_user_stats_trends(
            user_id=current_user.id,
            days=days,
            metrics=metrics
        )
        return trends
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get statistics trends"
        )


@router.post(
    "/me/reset",
    status_code=status.HTTP_200_OK,
    summary="Reset user statistics",
    description="Reset specific statistics for the current user."
)
async def reset_user_stats(
    fields: List[str] = Query(..., description="Statistics fields to reset"),
    confirm: bool = Query(..., description="Confirmation flag"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Reset user statistics."""
    if not confirm:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Confirmation required to reset statistics"
        )
    
    try:
        stats_service = StatsService(db)
        await stats_service.reset_user_stats(
            user_id=current_user.id,
            fields=fields
        )
        return {"message": f"Successfully reset {len(fields)} statistics fields"}
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to reset statistics"
        )


@router.get(
    "/global/summary",
    summary="Get global statistics summary",
    description="Get summary of global statistics across all users."
)
async def get_global_stats_summary(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    """Get global statistics summary."""
    try:
        stats_service = StatsService(db)
        summary = await stats_service.get_global_stats_summary()
        return summary
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get global statistics summary"
        )


@router.get(
    "/admin/overview",
    summary="Get statistics overview",
    description="Get detailed statistics overview for admin dashboard."
)
async def get_stats_overview(
    start_date: Optional[date] = Query(None, description="Start date for overview"),
    end_date: Optional[date] = Query(None, description="End date for overview"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get statistics overview (admin only)."""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission denied"
        )
    
    try:
        stats_service = StatsService(db)
        overview = await stats_service.get_stats_overview(
            start_date=start_date,
            end_date=end_date
        )
        return overview
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get statistics overview"
        )


@router.post(
    "/admin/recalculate",
    status_code=status.HTTP_200_OK,
    summary="Recalculate statistics",
    description="Recalculate statistics for all users (admin only)."
)
async def recalculate_all_stats(
    force: bool = Query(False, description="Force recalculation even if recent"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Recalculate all statistics (admin only)."""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission denied"
        )
    
    try:
        stats_service = StatsService(db)
        result = await stats_service.recalculate_all_stats(force=force)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to recalculate statistics"
        )