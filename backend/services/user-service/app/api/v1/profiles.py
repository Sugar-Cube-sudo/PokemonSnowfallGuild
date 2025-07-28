#!/usr/bin/env python3
"""
User Profile API Routes

API endpoints for user profile management operations.
"""

import uuid
from typing import List, Optional
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status, UploadFile, File
from sqlalchemy.orm import Session

from ...core.database import get_db
from ...core.security import get_current_user, get_current_active_user
from ...models.user import User
from ...schemas.user_profile import (
    UserProfileCreate,
    UserProfileUpdate,
    UserProfileResponse,
    UserProfilePublicResponse,
    ProfileCompletionResponse,
    ProfilePrivacyUpdate,
    ProfilePrivacyResponse,
    AchievementResponse,
    BadgeResponse,
    ProfileSearchRequest,
    ProfileSearchResponse
)
from ...schemas.enums import PrivacyLevel, SortOrder, SortField
from ...services.profile_service import ProfileService
from ...core.exceptions import (
    UserNotFoundError,
    ProfileNotFoundError,
    PermissionDeniedError,
    ValidationError
)

router = APIRouter()


@router.post(
    "/",
    response_model=UserProfileResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create user profile",
    description="Create a new user profile with the provided information."
)
async def create_profile(
    profile_data: UserProfileCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create user profile."""
    try:
        profile_service = ProfileService(db)
        profile = await profile_service.create_profile(current_user.id, profile_data)
        return profile
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create profile"
        )


@router.get(
    "/me",
    response_model=UserProfileResponse,
    summary="Get current user profile",
    description="Get the current authenticated user's profile information."
)
async def get_current_user_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get current user profile."""
    try:
        profile_service = ProfileService(db)
        profile = await profile_service.get_profile_by_user_id(current_user.id)
        
        if not profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Profile not found"
            )
        
        return profile
    except ProfileNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve profile"
        )


@router.get(
    "/{user_id}",
    response_model=UserProfilePublicResponse,
    summary="Get user profile by ID",
    description="Get public profile information for a specific user."
)
async def get_user_profile(
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    """Get user profile by ID."""
    try:
        profile_service = ProfileService(db)
        profile = await profile_service.get_public_profile(
            user_id=user_id,
            requester=current_user
        )
        
        if not profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Profile not found"
            )
        
        return profile
    except ProfileNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    except PermissionDeniedError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Profile is private"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve profile"
        )


@router.put(
    "/me",
    response_model=UserProfileResponse,
    summary="Update current user profile",
    description="Update the current authenticated user's profile information."
)
async def update_current_user_profile(
    profile_data: UserProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update current user profile."""
    try:
        profile_service = ProfileService(db)
        updated_profile = await profile_service.update_profile(
            user_id=current_user.id,
            profile_data=profile_data
        )
        return updated_profile
    except ProfileNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update profile"
        )


@router.delete(
    "/me",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete current user profile",
    description="Delete the current authenticated user's profile."
)
async def delete_current_user_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete current user profile."""
    try:
        profile_service = ProfileService(db)
        await profile_service.delete_profile(current_user.id)
    except ProfileNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete profile"
        )


@router.get(
    "/me/completion",
    response_model=ProfileCompletionResponse,
    summary="Get profile completion status",
    description="Get the current user's profile completion percentage and missing fields."
)
async def get_profile_completion(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get profile completion status."""
    try:
        profile_service = ProfileService(db)
        completion = await profile_service.get_profile_completion(current_user.id)
        return completion
    except ProfileNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get profile completion"
        )


@router.post(
    "/me/avatar",
    status_code=status.HTTP_200_OK,
    summary="Upload profile avatar",
    description="Upload a new avatar image for the current user's profile."
)
async def upload_avatar(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Upload profile avatar."""
    try:
        profile_service = ProfileService(db)
        avatar_url = await profile_service.upload_avatar(
            user_id=current_user.id,
            file=file
        )
        return {"avatar_url": avatar_url, "message": "Avatar uploaded successfully"}
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upload avatar"
        )


@router.delete(
    "/me/avatar",
    status_code=status.HTTP_200_OK,
    summary="Remove profile avatar",
    description="Remove the current user's profile avatar."
)
async def remove_avatar(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Remove profile avatar."""
    try:
        profile_service = ProfileService(db)
        await profile_service.remove_avatar(current_user.id)
        return {"message": "Avatar removed successfully"}
    except ProfileNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to remove avatar"
        )


@router.get(
    "/me/privacy",
    response_model=ProfilePrivacyResponse,
    summary="Get profile privacy settings",
    description="Get the current user's profile privacy settings."
)
async def get_profile_privacy(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get profile privacy settings."""
    try:
        profile_service = ProfileService(db)
        privacy_settings = await profile_service.get_profile_privacy(current_user.id)
        return privacy_settings
    except ProfileNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get privacy settings"
        )


@router.put(
    "/me/privacy",
    response_model=ProfilePrivacyResponse,
    summary="Update profile privacy settings",
    description="Update the current user's profile privacy settings."
)
async def update_profile_privacy(
    privacy_data: ProfilePrivacyUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update profile privacy settings."""
    try:
        profile_service = ProfileService(db)
        updated_privacy = await profile_service.update_profile_privacy(
            user_id=current_user.id,
            privacy_data=privacy_data
        )
        return updated_privacy
    except ProfileNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update privacy settings"
        )


@router.get(
    "/me/achievements",
    response_model=List[AchievementResponse],
    summary="Get user achievements",
    description="Get the current user's achievements and badges."
)
async def get_user_achievements(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get user achievements."""
    try:
        profile_service = ProfileService(db)
        achievements = await profile_service.get_user_achievements(current_user.id)
        return achievements
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get achievements"
        )


@router.get(
    "/{user_id}/achievements",
    response_model=List[AchievementResponse],
    summary="Get public user achievements",
    description="Get public achievements for a specific user."
)
async def get_public_user_achievements(
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    """Get public user achievements."""
    try:
        profile_service = ProfileService(db)
        achievements = await profile_service.get_public_achievements(
            user_id=user_id,
            requester=current_user
        )
        return achievements
    except UserNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    except PermissionDeniedError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Achievements are private"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get achievements"
        )


@router.get(
    "/me/badges",
    response_model=List[BadgeResponse],
    summary="Get user badges",
    description="Get the current user's badges and their progress."
)
async def get_user_badges(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get user badges."""
    try:
        profile_service = ProfileService(db)
        badges = await profile_service.get_user_badges(current_user.id)
        return badges
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get badges"
        )


@router.post(
    "/search",
    response_model=ProfileSearchResponse,
    summary="Search user profiles",
    description="Search for user profiles based on various criteria."
)
async def search_profiles(
    search_request: ProfileSearchRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    """Search user profiles."""
    try:
        profile_service = ProfileService(db)
        results = await profile_service.search_profiles(
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
            detail="Failed to search profiles"
        )


@router.get(
    "/featured",
    response_model=List[UserProfilePublicResponse],
    summary="Get featured profiles",
    description="Get a list of featured user profiles."
)
async def get_featured_profiles(
    limit: int = Query(10, ge=1, le=50, description="Number of profiles to return"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    """Get featured profiles."""
    try:
        profile_service = ProfileService(db)
        profiles = await profile_service.get_featured_profiles(
            limit=limit,
            requester=current_user
        )
        return profiles
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get featured profiles"
        )


@router.get(
    "/recent",
    response_model=List[UserProfilePublicResponse],
    summary="Get recent profiles",
    description="Get a list of recently created user profiles."
)
async def get_recent_profiles(
    limit: int = Query(10, ge=1, le=50, description="Number of profiles to return"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    """Get recent profiles."""
    try:
        profile_service = ProfileService(db)
        profiles = await profile_service.get_recent_profiles(
            limit=limit,
            requester=current_user
        )
        return profiles
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get recent profiles"
        )


@router.post(
    "/me/verify-phone",
    status_code=status.HTTP_200_OK,
    summary="Verify phone number",
    description="Send verification code to the user's phone number."
)
async def verify_phone_number(
    phone_number: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Verify phone number."""
    try:
        profile_service = ProfileService(db)
        await profile_service.send_phone_verification(
            user_id=current_user.id,
            phone_number=phone_number
        )
        return {"message": "Verification code sent to your phone"}
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send verification code"
        )


@router.post(
    "/me/confirm-phone",
    status_code=status.HTTP_200_OK,
    summary="Confirm phone verification",
    description="Confirm phone number verification with the received code."
)
async def confirm_phone_verification(
    verification_code: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Confirm phone verification."""
    try:
        profile_service = ProfileService(db)
        await profile_service.confirm_phone_verification(
            user_id=current_user.id,
            verification_code=verification_code
        )
        return {"message": "Phone number verified successfully"}
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to verify phone number"
        )


@router.get(
    "/stats/overview",
    summary="Get profile statistics overview",
    description="Get overview statistics for all profiles (admin only)."
)
async def get_profile_stats_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get profile statistics overview (admin only)."""
    if current_user.role.value != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission denied"
        )
    
    try:
        profile_service = ProfileService(db)
        stats = await profile_service.get_profile_stats_overview()
        return stats
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get profile statistics"
        )