#!/usr/bin/env python3
"""
Follow Relationship API Routes

API endpoints for user follow/unfollow functionality and relationship management.
"""

import uuid
from typing import List, Optional
from datetime import datetime, date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from ...core.database import get_db
from ...core.security import get_current_user, get_current_active_user
from ...models.user import User
from ...schemas.follow_relationship import (
    FollowRelationshipCreate,
    FollowRelationshipUpdate,
    FollowRelationshipResponse,
    FollowRelationshipWithUserResponse,
    FollowRequest,
    UnfollowRequest,
    FollowStatusResponse,
    FollowersListRequest,
    FollowingListRequest,
    FollowListResponse,
    MutualFollowersRequest,
    MutualFollowersResponse,
    FollowSuggestionsRequest,
    FollowSuggestionsResponse,
    FollowStatsResponse,
    BulkFollowRequest,
    BulkUnfollowRequest,
    BulkFollowResponse,
    FollowActivityRequest,
    FollowActivityResponse
)
from ...schemas.enums import SortOrder, UserRole
from ...services.follow_service import FollowService
from ...core.exceptions import (
    UserNotFoundError,
    FollowRelationshipNotFoundError,
    PermissionDeniedError,
    ValidationError,
    DuplicateFollowError
)

router = APIRouter()


@router.post(
    "/follow",
    response_model=FollowRelationshipResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Follow a user",
    description="Follow another user."
)
async def follow_user(
    follow_request: FollowRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Follow a user."""
    try:
        follow_service = FollowService(db)
        relationship = await follow_service.follow_user(
            follower_id=current_user.id,
            following_id=follow_request.user_id
        )
        return relationship
    except UserNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    except DuplicateFollowError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Already following this user"
        )
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except PermissionDeniedError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot follow this user"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to follow user"
        )


@router.post(
    "/unfollow",
    status_code=status.HTTP_200_OK,
    summary="Unfollow a user",
    description="Unfollow a user."
)
async def unfollow_user(
    unfollow_request: UnfollowRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Unfollow a user."""
    try:
        follow_service = FollowService(db)
        await follow_service.unfollow_user(
            follower_id=current_user.id,
            following_id=unfollow_request.user_id
        )
        return {"message": "Successfully unfollowed user"}
    except UserNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    except FollowRelationshipNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Follow relationship not found"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to unfollow user"
        )


@router.get(
    "/status/{user_id}",
    response_model=FollowStatusResponse,
    summary="Get follow status",
    description="Check if current user is following another user."
)
async def get_follow_status(
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get follow status."""
    try:
        follow_service = FollowService(db)
        status_info = await follow_service.get_follow_status(
            follower_id=current_user.id,
            following_id=user_id
        )
        return status_info
    except UserNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get follow status"
        )


@router.post(
    "/me/followers",
    response_model=FollowListResponse,
    summary="Get current user's followers",
    description="Get list of users following the current user."
)
async def get_my_followers(
    request: FollowersListRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get current user's followers."""
    try:
        follow_service = FollowService(db)
        followers = await follow_service.get_user_followers(
            user_id=current_user.id,
            request=request,
            requester=current_user
        )
        return followers
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get followers"
        )


@router.post(
    "/me/following",
    response_model=FollowListResponse,
    summary="Get current user's following",
    description="Get list of users the current user is following."
)
async def get_my_following(
    request: FollowingListRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get current user's following."""
    try:
        follow_service = FollowService(db)
        following = await follow_service.get_user_following(
            user_id=current_user.id,
            request=request,
            requester=current_user
        )
        return following
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get following"
        )


@router.post(
    "/{user_id}/followers",
    response_model=FollowListResponse,
    summary="Get user's followers",
    description="Get list of users following a specific user."
)
async def get_user_followers(
    user_id: uuid.UUID,
    request: FollowersListRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    """Get user's followers."""
    try:
        follow_service = FollowService(db)
        followers = await follow_service.get_user_followers(
            user_id=user_id,
            request=request,
            requester=current_user
        )
        return followers
    except UserNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    except PermissionDeniedError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Followers list is private"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get followers"
        )


@router.post(
    "/{user_id}/following",
    response_model=FollowListResponse,
    summary="Get user's following",
    description="Get list of users a specific user is following."
)
async def get_user_following(
    user_id: uuid.UUID,
    request: FollowingListRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    """Get user's following."""
    try:
        follow_service = FollowService(db)
        following = await follow_service.get_user_following(
            user_id=user_id,
            request=request,
            requester=current_user
        )
        return following
    except UserNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    except PermissionDeniedError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Following list is private"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get following"
        )


@router.post(
    "/mutual/{user_id}",
    response_model=MutualFollowersResponse,
    summary="Get mutual followers",
    description="Get mutual followers between current user and another user."
)
async def get_mutual_followers(
    user_id: uuid.UUID,
    request: MutualFollowersRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get mutual followers."""
    try:
        follow_service = FollowService(db)
        mutual = await follow_service.get_mutual_followers(
            user1_id=current_user.id,
            user2_id=user_id,
            request=request
        )
        return mutual
    except UserNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get mutual followers"
        )


@router.post(
    "/suggestions",
    response_model=FollowSuggestionsResponse,
    summary="Get follow suggestions",
    description="Get suggested users to follow."
)
async def get_follow_suggestions(
    request: FollowSuggestionsRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get follow suggestions."""
    try:
        follow_service = FollowService(db)
        suggestions = await follow_service.get_follow_suggestions(
            user_id=current_user.id,
            request=request
        )
        return suggestions
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get follow suggestions"
        )


@router.get(
    "/me/stats",
    response_model=FollowStatsResponse,
    summary="Get follow statistics",
    description="Get follow statistics for the current user."
)
async def get_my_follow_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get current user's follow statistics."""
    try:
        follow_service = FollowService(db)
        stats = await follow_service.get_follow_stats(current_user.id)
        return stats
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get follow statistics"
        )


@router.get(
    "/{user_id}/stats",
    response_model=FollowStatsResponse,
    summary="Get user's follow statistics",
    description="Get follow statistics for a specific user."
)
async def get_user_follow_stats(
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    """Get user's follow statistics."""
    try:
        follow_service = FollowService(db)
        stats = await follow_service.get_public_follow_stats(
            user_id=user_id,
            requester=current_user
        )
        return stats
    except UserNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    except PermissionDeniedError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Follow statistics are private"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get follow statistics"
        )


@router.post(
    "/bulk/follow",
    response_model=BulkFollowResponse,
    summary="Bulk follow users",
    description="Follow multiple users at once."
)
async def bulk_follow_users(
    bulk_request: BulkFollowRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Bulk follow users."""
    try:
        follow_service = FollowService(db)
        result = await follow_service.bulk_follow_users(
            follower_id=current_user.id,
            bulk_request=bulk_request
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
            detail="Failed to bulk follow users"
        )


@router.post(
    "/bulk/unfollow",
    response_model=BulkFollowResponse,
    summary="Bulk unfollow users",
    description="Unfollow multiple users at once."
)
async def bulk_unfollow_users(
    bulk_request: BulkUnfollowRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Bulk unfollow users."""
    try:
        follow_service = FollowService(db)
        result = await follow_service.bulk_unfollow_users(
            follower_id=current_user.id,
            bulk_request=bulk_request
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
            detail="Failed to bulk unfollow users"
        )


@router.post(
    "/me/activity",
    response_model=FollowActivityResponse,
    summary="Get follow activity",
    description="Get follow activity for the current user."
)
async def get_my_follow_activity(
    request: FollowActivityRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get current user's follow activity."""
    try:
        follow_service = FollowService(db)
        activity = await follow_service.get_follow_activity(
            user_id=current_user.id,
            request=request
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
            detail="Failed to get follow activity"
        )


@router.get(
    "/me/recent-followers",
    summary="Get recent followers",
    description="Get users who recently followed the current user."
)
async def get_recent_followers(
    limit: int = Query(10, ge=1, le=50, description="Number of recent followers to return"),
    hours: int = Query(24, ge=1, le=168, description="Hours to look back for recent followers"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get recent followers."""
    try:
        follow_service = FollowService(db)
        recent_followers = await follow_service.get_recent_followers(
            user_id=current_user.id,
            limit=limit,
            hours=hours
        )
        return recent_followers
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get recent followers"
        )


@router.get(
    "/trending-users",
    summary="Get trending users",
    description="Get users with trending follow activity."
)
async def get_trending_users(
    limit: int = Query(20, ge=1, le=100, description="Number of trending users to return"),
    time_range: str = Query("24h", regex="^(1h|6h|24h|7d|30d)$", description="Time range for trending calculation"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    """Get trending users."""
    try:
        follow_service = FollowService(db)
        trending = await follow_service.get_trending_users(
            limit=limit,
            time_range=time_range,
            requester=current_user
        )
        return trending
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get trending users"
        )


@router.delete(
    "/me/remove-follower/{user_id}",
    status_code=status.HTTP_200_OK,
    summary="Remove follower",
    description="Remove a user from followers list."
)
async def remove_follower(
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Remove a follower."""
    try:
        follow_service = FollowService(db)
        await follow_service.remove_follower(
            user_id=current_user.id,
            follower_id=user_id
        )
        return {"message": "Successfully removed follower"}
    except UserNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    except FollowRelationshipNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Follow relationship not found"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to remove follower"
        )


@router.get(
    "/admin/overview",
    summary="Get follow relationships overview",
    description="Get overview of follow relationships for admin dashboard."
)
async def get_follow_overview(
    start_date: Optional[date] = Query(None, description="Start date for overview"),
    end_date: Optional[date] = Query(None, description="End date for overview"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get follow relationships overview (admin only)."""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission denied"
        )
    
    try:
        follow_service = FollowService(db)
        overview = await follow_service.get_follow_overview(
            start_date=start_date,
            end_date=end_date
        )
        return overview
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get follow overview"
        )


@router.post(
    "/admin/cleanup",
    status_code=status.HTTP_200_OK,
    summary="Cleanup follow relationships",
    description="Clean up inactive or invalid follow relationships (admin only)."
)
async def cleanup_follow_relationships(
    dry_run: bool = Query(True, description="Perform dry run without actual cleanup"),
    days_inactive: int = Query(365, ge=30, description="Days of inactivity before cleanup"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Cleanup follow relationships (admin only)."""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission denied"
        )
    
    try:
        follow_service = FollowService(db)
        result = await follow_service.cleanup_follow_relationships(
            dry_run=dry_run,
            days_inactive=days_inactive
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to cleanup follow relationships"
        )