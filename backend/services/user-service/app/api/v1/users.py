#!/usr/bin/env python3
"""
User API Routes

API endpoints for user management operations.
"""

import uuid
from typing import List, Optional
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from ...core.database import get_db
from ...core.security import get_current_user, get_current_active_user
from ...models.user import User
from ...schemas.user import (
    UserCreate,
    UserUpdate,
    UserResponse,
    UserPublicResponse,
    UserSearchResponse,
    UserListResponse,
    PasswordChangeRequest,
    EmailChangeRequest,
    UserDeactivateRequest,
    UserBulkActionRequest,
    UserBulkActionResponse
)
from ...schemas.enums import UserRole, UserStatus, SortOrder, SortField
from ...services.user_service import UserService
from ...core.exceptions import (
    UserNotFoundError,
    UserAlreadyExistsError,
    InvalidCredentialsError,
    PermissionDeniedError
)

router = APIRouter()


@router.post(
    "/",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new user",
    description="Create a new user account with the provided information."
)
async def create_user(
    user_data: UserCreate,
    db: Session = Depends(get_db)
):
    """Create a new user."""
    try:
        user_service = UserService(db)
        user = await user_service.create_user(user_data)
        return user
    except UserAlreadyExistsError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create user"
        )


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current user",
    description="Get the current authenticated user's information."
)
async def get_current_user_info(
    current_user: User = Depends(get_current_active_user)
):
    """Get current user information."""
    return current_user


@router.get(
    "/{user_id}",
    response_model=UserPublicResponse,
    summary="Get user by ID",
    description="Get public information about a specific user."
)
async def get_user(
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    """Get user by ID."""
    try:
        user_service = UserService(db)
        user = await user_service.get_user_by_id(user_id)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Return different response based on relationship with current user
        if current_user and (current_user.id == user_id or current_user.role == UserRole.ADMIN):
            return UserResponse.from_orm(user)
        else:
            return UserPublicResponse.from_orm(user)
            
    except UserNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve user"
        )


@router.put(
    "/me",
    response_model=UserResponse,
    summary="Update current user",
    description="Update the current authenticated user's information."
)
async def update_current_user(
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update current user."""
    try:
        user_service = UserService(db)
        updated_user = await user_service.update_user(current_user.id, user_data)
        return updated_user
    except UserNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update user"
        )


@router.put(
    "/{user_id}",
    response_model=UserResponse,
    summary="Update user by ID",
    description="Update a specific user's information (admin only)."
)
async def update_user(
    user_id: uuid.UUID,
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update user by ID (admin only)."""
    if current_user.role != UserRole.ADMIN and current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission denied"
        )
    
    try:
        user_service = UserService(db)
        updated_user = await user_service.update_user(user_id, user_data)
        return updated_user
    except UserNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    except PermissionDeniedError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission denied"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update user"
        )


@router.delete(
    "/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete user",
    description="Delete a user account (admin only)."
)
async def delete_user(
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete user (admin only)."""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission denied"
        )
    
    try:
        user_service = UserService(db)
        await user_service.delete_user(user_id)
    except UserNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete user"
        )


@router.get(
    "/",
    response_model=UserListResponse,
    summary="List users",
    description="Get a paginated list of users with optional filtering."
)
async def list_users(
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=100, description="Items per page"),
    search: Optional[str] = Query(None, description="Search term"),
    role: Optional[UserRole] = Query(None, description="Filter by role"),
    status: Optional[UserStatus] = Query(None, description="Filter by status"),
    sort_by: SortField = Query(SortField.CREATED_AT, description="Sort field"),
    sort_order: SortOrder = Query(SortOrder.DESC, description="Sort order"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """List users with pagination and filtering."""
    try:
        user_service = UserService(db)
        result = await user_service.list_users(
            page=page,
            per_page=per_page,
            search=search,
            role=role,
            status=status,
            sort_by=sort_by,
            sort_order=sort_order,
            requester=current_user
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve users"
        )


@router.get(
    "/search",
    response_model=List[UserSearchResponse],
    summary="Search users",
    description="Search for users by username, email, or display name."
)
async def search_users(
    q: str = Query(..., min_length=2, description="Search query"),
    limit: int = Query(10, ge=1, le=50, description="Maximum results"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    """Search users."""
    try:
        user_service = UserService(db)
        results = await user_service.search_users(
            query=q,
            limit=limit,
            requester=current_user
        )
        return results
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to search users"
        )


@router.post(
    "/me/change-password",
    status_code=status.HTTP_200_OK,
    summary="Change password",
    description="Change the current user's password."
)
async def change_password(
    password_data: PasswordChangeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Change user password."""
    try:
        user_service = UserService(db)
        await user_service.change_password(
            user_id=current_user.id,
            current_password=password_data.current_password,
            new_password=password_data.new_password
        )
        return {"message": "Password changed successfully"}
    except InvalidCredentialsError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to change password"
        )


@router.post(
    "/me/change-email",
    status_code=status.HTTP_200_OK,
    summary="Change email",
    description="Change the current user's email address."
)
async def change_email(
    email_data: EmailChangeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Change user email."""
    try:
        user_service = UserService(db)
        await user_service.change_email(
            user_id=current_user.id,
            new_email=email_data.new_email,
            password=email_data.password
        )
        return {"message": "Email change initiated. Please check your new email for verification."}
    except InvalidCredentialsError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password is incorrect"
        )
    except UserAlreadyExistsError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already in use"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to change email"
        )


@router.post(
    "/me/deactivate",
    status_code=status.HTTP_200_OK,
    summary="Deactivate account",
    description="Deactivate the current user's account."
)
async def deactivate_account(
    deactivate_data: UserDeactivateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Deactivate user account."""
    try:
        user_service = UserService(db)
        await user_service.deactivate_user(
            user_id=current_user.id,
            password=deactivate_data.password,
            reason=deactivate_data.reason
        )
        return {"message": "Account deactivated successfully"}
    except InvalidCredentialsError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password is incorrect"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to deactivate account"
        )


@router.post(
    "/{user_id}/activate",
    status_code=status.HTTP_200_OK,
    summary="Activate user",
    description="Activate a deactivated user account (admin only)."
)
async def activate_user(
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Activate user (admin only)."""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission denied"
        )
    
    try:
        user_service = UserService(db)
        await user_service.activate_user(user_id)
        return {"message": "User activated successfully"}
    except UserNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to activate user"
        )


@router.post(
    "/bulk-action",
    response_model=UserBulkActionResponse,
    summary="Bulk user actions",
    description="Perform bulk actions on multiple users (admin only)."
)
async def bulk_user_action(
    action_data: UserBulkActionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Perform bulk actions on users (admin only)."""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission denied"
        )
    
    try:
        user_service = UserService(db)
        result = await user_service.bulk_user_action(action_data)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to perform bulk action"
        )


@router.get(
    "/{user_id}/verify-email/{token}",
    status_code=status.HTTP_200_OK,
    summary="Verify email",
    description="Verify user's email address using verification token."
)
async def verify_email(
    user_id: uuid.UUID,
    token: str,
    db: Session = Depends(get_db)
):
    """Verify user email."""
    try:
        user_service = UserService(db)
        await user_service.verify_email(user_id, token)
        return {"message": "Email verified successfully"}
    except UserNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to verify email"
        )


@router.post(
    "/me/resend-verification",
    status_code=status.HTTP_200_OK,
    summary="Resend email verification",
    description="Resend email verification link to current user."
)
async def resend_email_verification(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Resend email verification."""
    try:
        user_service = UserService(db)
        await user_service.resend_email_verification(current_user.id)
        return {"message": "Verification email sent"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send verification email"
        )