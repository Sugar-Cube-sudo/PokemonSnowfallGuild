#!/usr/bin/env python3
"""
Privacy Settings API Routes

API endpoints for user privacy settings and data protection management.
"""

import uuid
from typing import List, Optional
from datetime import datetime, date

from fastapi import APIRouter, Depends, HTTPException, Query, status, BackgroundTasks
from sqlalchemy.orm import Session

from ...core.database import get_db
from ...core.security import get_current_user, get_current_active_user
from ...models.user import User
from ...schemas.privacy_settings import (
    PrivacySettingsCreate,
    PrivacySettingsUpdate,
    PrivacySettingsResponse,
    PrivacySettingsPublicResponse,
    BlockUserRequest,
    UnblockUserRequest,
    BlockedUsersResponse,
    AddBlockedKeywordRequest,
    RemoveBlockedKeywordRequest,
    NotificationSettingsUpdate,
    PrivacyAuditResponse,
    PrivacyExportRequest,
    PrivacyExportResponse
)
from ...schemas.enums import UserRole
from ...services.privacy_service import PrivacyService
from ...core.exceptions import (
    UserNotFoundError,
    PrivacySettingsNotFoundError,
    PermissionDeniedError,
    ValidationError,
    DuplicateBlockError
)

router = APIRouter()


@router.post(
    "/",
    response_model=PrivacySettingsResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create privacy settings",
    description="Create initial privacy settings for a user."
)
async def create_privacy_settings(
    settings_data: PrivacySettingsCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create privacy settings."""
    try:
        privacy_service = PrivacyService(db)
        settings = await privacy_service.create_privacy_settings(
            user_id=current_user.id,
            settings_data=settings_data
        )
        return settings
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create privacy settings"
        )


@router.get(
    "/me",
    response_model=PrivacySettingsResponse,
    summary="Get current user privacy settings",
    description="Get privacy settings for the current authenticated user."
)
async def get_current_user_privacy_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get current user privacy settings."""
    try:
        privacy_service = PrivacyService(db)
        settings = await privacy_service.get_privacy_settings(current_user.id)
        
        if not settings:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Privacy settings not found"
            )
        
        return settings
    except PrivacySettingsNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Privacy settings not found"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve privacy settings"
        )


@router.get(
    "/{user_id}/public",
    response_model=PrivacySettingsPublicResponse,
    summary="Get public privacy settings",
    description="Get public privacy settings for a specific user."
)
async def get_public_privacy_settings(
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    """Get public privacy settings."""
    try:
        privacy_service = PrivacyService(db)
        settings = await privacy_service.get_public_privacy_settings(
            user_id=user_id,
            requester=current_user
        )
        
        if not settings:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Privacy settings not found"
            )
        
        return settings
    except UserNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    except PrivacySettingsNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Privacy settings not found"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve privacy settings"
        )


@router.put(
    "/me",
    response_model=PrivacySettingsResponse,
    summary="Update current user privacy settings",
    description="Update privacy settings for the current authenticated user."
)
async def update_current_user_privacy_settings(
    settings_data: PrivacySettingsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update current user privacy settings."""
    try:
        privacy_service = PrivacyService(db)
        updated_settings = await privacy_service.update_privacy_settings(
            user_id=current_user.id,
            settings_data=settings_data
        )
        return updated_settings
    except PrivacySettingsNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Privacy settings not found"
        )
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update privacy settings"
        )


@router.post(
    "/me/block",
    status_code=status.HTTP_200_OK,
    summary="Block a user",
    description="Block another user."
)
async def block_user(
    block_request: BlockUserRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Block a user."""
    try:
        privacy_service = PrivacyService(db)
        await privacy_service.block_user(
            blocker_id=current_user.id,
            blocked_id=block_request.user_id,
            reason=block_request.reason
        )
        return {"message": "User blocked successfully"}
    except UserNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    except DuplicateBlockError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User is already blocked"
        )
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to block user"
        )


@router.post(
    "/me/unblock",
    status_code=status.HTTP_200_OK,
    summary="Unblock a user",
    description="Unblock a previously blocked user."
)
async def unblock_user(
    unblock_request: UnblockUserRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Unblock a user."""
    try:
        privacy_service = PrivacyService(db)
        await privacy_service.unblock_user(
            blocker_id=current_user.id,
            blocked_id=unblock_request.user_id
        )
        return {"message": "User unblocked successfully"}
    except UserNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found or not blocked"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to unblock user"
        )


@router.get(
    "/me/blocked-users",
    response_model=BlockedUsersResponse,
    summary="Get blocked users",
    description="Get list of users blocked by the current user."
)
async def get_blocked_users(
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(20, ge=1, le=100, description="Page size"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get blocked users."""
    try:
        privacy_service = PrivacyService(db)
        blocked_users = await privacy_service.get_blocked_users(
            user_id=current_user.id,
            page=page,
            size=size
        )
        return blocked_users
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get blocked users"
        )


@router.post(
    "/me/blocked-keywords",
    status_code=status.HTTP_200_OK,
    summary="Add blocked keyword",
    description="Add a keyword to the blocked list."
)
async def add_blocked_keyword(
    keyword_request: AddBlockedKeywordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Add blocked keyword."""
    try:
        privacy_service = PrivacyService(db)
        await privacy_service.add_blocked_keyword(
            user_id=current_user.id,
            keyword=keyword_request.keyword
        )
        return {"message": "Keyword added to blocked list"}
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to add blocked keyword"
        )


@router.delete(
    "/me/blocked-keywords",
    status_code=status.HTTP_200_OK,
    summary="Remove blocked keyword",
    description="Remove a keyword from the blocked list."
)
async def remove_blocked_keyword(
    keyword_request: RemoveBlockedKeywordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Remove blocked keyword."""
    try:
        privacy_service = PrivacyService(db)
        await privacy_service.remove_blocked_keyword(
            user_id=current_user.id,
            keyword=keyword_request.keyword
        )
        return {"message": "Keyword removed from blocked list"}
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to remove blocked keyword"
        )


@router.get(
    "/me/blocked-keywords",
    summary="Get blocked keywords",
    description="Get list of blocked keywords for the current user."
)
async def get_blocked_keywords(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get blocked keywords."""
    try:
        privacy_service = PrivacyService(db)
        keywords = await privacy_service.get_blocked_keywords(current_user.id)
        return {"keywords": keywords}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get blocked keywords"
        )


@router.put(
    "/me/notifications",
    response_model=PrivacySettingsResponse,
    summary="Update notification settings",
    description="Update notification preferences."
)
async def update_notification_settings(
    notification_settings: NotificationSettingsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update notification settings."""
    try:
        privacy_service = PrivacyService(db)
        updated_settings = await privacy_service.update_notification_settings(
            user_id=current_user.id,
            notification_settings=notification_settings
        )
        return updated_settings
    except PrivacySettingsNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Privacy settings not found"
        )
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update notification settings"
        )


@router.get(
    "/me/audit",
    response_model=PrivacyAuditResponse,
    summary="Get privacy audit",
    description="Get privacy audit information for the current user."
)
async def get_privacy_audit(
    start_date: Optional[date] = Query(None, description="Start date for audit"),
    end_date: Optional[date] = Query(None, description="End date for audit"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get privacy audit."""
    try:
        privacy_service = PrivacyService(db)
        audit = await privacy_service.get_privacy_audit(
            user_id=current_user.id,
            start_date=start_date,
            end_date=end_date
        )
        return audit
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get privacy audit"
        )


@router.post(
    "/me/export",
    response_model=PrivacyExportResponse,
    summary="Request privacy data export",
    description="Request export of user's privacy data."
)
async def request_privacy_export(
    export_request: PrivacyExportRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Request privacy data export."""
    try:
        privacy_service = PrivacyService(db)
        export_response = await privacy_service.request_privacy_export(
            user_id=current_user.id,
            export_request=export_request,
            background_tasks=background_tasks
        )
        return export_response
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to request privacy export"
        )


@router.get(
    "/me/export/{export_id}",
    summary="Get privacy export status",
    description="Get status of a privacy data export request."
)
async def get_privacy_export_status(
    export_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get privacy export status."""
    try:
        privacy_service = PrivacyService(db)
        status_info = await privacy_service.get_export_status(
            user_id=current_user.id,
            export_id=export_id
        )
        return status_info
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get export status"
        )


@router.post(
    "/me/delete-account",
    status_code=status.HTTP_200_OK,
    summary="Request account deletion",
    description="Request deletion of user account and all associated data."
)
async def request_account_deletion(
    background_tasks: BackgroundTasks,
    confirmation: str = Query(..., description="Type 'DELETE' to confirm"),
    reason: Optional[str] = Query(None, description="Reason for deletion"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Request account deletion."""
    if confirmation != "DELETE":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid confirmation. Type 'DELETE' to confirm account deletion."
        )
    
    try:
        privacy_service = PrivacyService(db)
        deletion_response = await privacy_service.request_account_deletion(
            user_id=current_user.id,
            reason=reason,
            background_tasks=background_tasks
        )
        return deletion_response
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to request account deletion"
        )


@router.get(
    "/me/data-usage",
    summary="Get data usage statistics",
    description="Get statistics about user's data usage and storage."
)
async def get_data_usage_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get data usage statistics."""
    try:
        privacy_service = PrivacyService(db)
        usage_stats = await privacy_service.get_data_usage_stats(current_user.id)
        return usage_stats
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get data usage statistics"
        )


@router.post(
    "/me/consent",
    status_code=status.HTTP_200_OK,
    summary="Update consent preferences",
    description="Update user consent for data processing."
)
async def update_consent_preferences(
    consent_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update consent preferences."""
    try:
        privacy_service = PrivacyService(db)
        await privacy_service.update_consent_preferences(
            user_id=current_user.id,
            consent_data=consent_data
        )
        return {"message": "Consent preferences updated successfully"}
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update consent preferences"
        )


@router.get(
    "/me/consent",
    summary="Get consent preferences",
    description="Get current user consent preferences."
)
async def get_consent_preferences(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get consent preferences."""
    try:
        privacy_service = PrivacyService(db)
        consent_data = await privacy_service.get_consent_preferences(current_user.id)
        return consent_data
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get consent preferences"
        )


@router.get(
    "/admin/overview",
    summary="Get privacy overview",
    description="Get privacy settings overview for admin dashboard."
)
async def get_privacy_overview(
    start_date: Optional[date] = Query(None, description="Start date for overview"),
    end_date: Optional[date] = Query(None, description="End date for overview"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get privacy overview (admin only)."""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission denied"
        )
    
    try:
        privacy_service = PrivacyService(db)
        overview = await privacy_service.get_privacy_overview(
            start_date=start_date,
            end_date=end_date
        )
        return overview
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get privacy overview"
        )


@router.post(
    "/admin/compliance-check",
    summary="Run compliance check",
    description="Run privacy compliance check across all users (admin only)."
)
async def run_compliance_check(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Run compliance check (admin only)."""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission denied"
        )
    
    try:
        privacy_service = PrivacyService(db)
        check_result = await privacy_service.run_compliance_check(background_tasks)
        return check_result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to run compliance check"
        )