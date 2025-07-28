#!/usr/bin/env python3
"""
Custom Exceptions and Exception Handlers

Centralized exception handling for the user service.
"""

from typing import Any, Dict, List, Union

from fastapi import HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import ValidationError

from app.core.logging import get_logger

logger = get_logger(__name__)


class CustomHTTPException(HTTPException):
    """
    Custom HTTP exception with additional context.
    """
    
    def __init__(
        self,
        status_code: int,
        detail: str,
        error_code: str = None,
        context: Dict[str, Any] = None,
    ):
        super().__init__(status_code=status_code, detail=detail)
        self.error_code = error_code
        self.context = context or {}


class UserServiceException(Exception):
    """
    Base exception for user service specific errors.
    """
    
    def __init__(self, message: str, error_code: str = None, context: Dict[str, Any] = None):
        super().__init__(message)
        self.message = message
        self.error_code = error_code
        self.context = context or {}


class UserNotFoundError(UserServiceException):
    """Raised when a user is not found."""
    
    def __init__(self, user_id: str):
        super().__init__(
            message=f"User with ID {user_id} not found",
            error_code="USER_NOT_FOUND",
            context={"user_id": user_id}
        )


class UserAlreadyExistsError(UserServiceException):
    """Raised when trying to create a user that already exists."""
    
    def __init__(self, identifier: str, field: str = "email"):
        super().__init__(
            message=f"User with {field} '{identifier}' already exists",
            error_code="USER_ALREADY_EXISTS",
            context={"identifier": identifier, "field": field}
        )


class InvalidUserDataError(UserServiceException):
    """Raised when user data is invalid."""
    
    def __init__(self, message: str, field: str = None):
        super().__init__(
            message=message,
            error_code="INVALID_USER_DATA",
            context={"field": field} if field else {}
        )


class PermissionDeniedError(UserServiceException):
    """Raised when user doesn't have permission for an action."""
    
    def __init__(self, action: str, user_id: str = None):
        super().__init__(
            message=f"Permission denied for action: {action}",
            error_code="PERMISSION_DENIED",
            context={"action": action, "user_id": user_id}
        )


class ProfileUpdateError(UserServiceException):
    """Raised when profile update fails."""
    
    def __init__(self, message: str, user_id: str = None):
        super().__init__(
            message=message,
            error_code="PROFILE_UPDATE_ERROR",
            context={"user_id": user_id}
        )


class DatabaseError(UserServiceException):
    """Raised when database operation fails."""
    
    def __init__(self, operation: str, details: str = None):
        super().__init__(
            message=f"Database operation failed: {operation}",
            error_code="DATABASE_ERROR",
            context={"operation": operation, "details": details}
        )


class CacheError(UserServiceException):
    """Raised when cache operation fails."""
    
    def __init__(self, operation: str, key: str = None):
        super().__init__(
            message=f"Cache operation failed: {operation}",
            error_code="CACHE_ERROR",
            context={"operation": operation, "key": key}
        )


class ExternalServiceError(UserServiceException):
    """Raised when external service call fails."""
    
    def __init__(self, service: str, operation: str, details: str = None):
        super().__init__(
            message=f"External service error: {service} - {operation}",
            error_code="EXTERNAL_SERVICE_ERROR",
            context={"service": service, "operation": operation, "details": details}
        )


class RateLimitExceededError(UserServiceException):
    """Raised when rate limit is exceeded."""
    
    def __init__(self, limit: int, window: str):
        super().__init__(
            message=f"Rate limit exceeded: {limit} requests per {window}",
            error_code="RATE_LIMIT_EXCEEDED",
            context={"limit": limit, "window": window}
        )


# Exception handlers

async def custom_http_exception_handler(request: Request, exc: CustomHTTPException) -> JSONResponse:
    """
    Handle custom HTTP exceptions.
    
    Args:
        request: FastAPI request object
        exc: Custom HTTP exception
        
    Returns:
        JSON response with error details
    """
    logger.error(
        "Custom HTTP exception",
        status_code=exc.status_code,
        detail=exc.detail,
        error_code=exc.error_code,
        context=exc.context,
        path=request.url.path,
        method=request.method,
    )
    
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "message": exc.detail,
                "code": exc.error_code,
                "context": exc.context,
            }
        },
    )


async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """
    Handle validation exceptions.
    
    Args:
        request: FastAPI request object
        exc: Validation exception
        
    Returns:
        JSON response with validation errors
    """
    logger.warning(
        "Validation error",
        errors=exc.errors(),
        path=request.url.path,
        method=request.method,
    )
    
    # Format validation errors
    formatted_errors = []
    for error in exc.errors():
        formatted_errors.append({
            "field": ".".join(str(loc) for loc in error["loc"]),
            "message": error["msg"],
            "type": error["type"],
        })
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": {
                "message": "Validation failed",
                "code": "VALIDATION_ERROR",
                "details": formatted_errors,
            }
        },
    )


async def user_service_exception_handler(request: Request, exc: UserServiceException) -> JSONResponse:
    """
    Handle user service specific exceptions.
    
    Args:
        request: FastAPI request object
        exc: User service exception
        
    Returns:
        JSON response with error details
    """
    # Map exception types to HTTP status codes
    status_code_map = {
        UserNotFoundError: status.HTTP_404_NOT_FOUND,
        UserAlreadyExistsError: status.HTTP_409_CONFLICT,
        InvalidUserDataError: status.HTTP_400_BAD_REQUEST,
        PermissionDeniedError: status.HTTP_403_FORBIDDEN,
        ProfileUpdateError: status.HTTP_400_BAD_REQUEST,
        DatabaseError: status.HTTP_500_INTERNAL_SERVER_ERROR,
        CacheError: status.HTTP_500_INTERNAL_SERVER_ERROR,
        ExternalServiceError: status.HTTP_502_BAD_GATEWAY,
        RateLimitExceededError: status.HTTP_429_TOO_MANY_REQUESTS,
    }
    
    status_code = status_code_map.get(type(exc), status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    logger.error(
        "User service exception",
        exception_type=type(exc).__name__,
        message=exc.message,
        error_code=exc.error_code,
        context=exc.context,
        path=request.url.path,
        method=request.method,
    )
    
    return JSONResponse(
        status_code=status_code,
        content={
            "error": {
                "message": exc.message,
                "code": exc.error_code,
                "context": exc.context,
            }
        },
    )


async def general_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """
    Handle general exceptions.
    
    Args:
        request: FastAPI request object
        exc: General exception
        
    Returns:
        JSON response with generic error message
    """
    logger.error(
        "Unhandled exception",
        exception_type=type(exc).__name__,
        message=str(exc),
        path=request.url.path,
        method=request.method,
        exc_info=True,
    )
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": {
                "message": "Internal server error",
                "code": "INTERNAL_ERROR",
            }
        },
    )