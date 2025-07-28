#!/usr/bin/env python3
"""
Custom Exceptions and Exception Handlers

Centralized exception handling for the forum service.
"""

from typing import Any, Dict, List, Union

from fastapi import HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import ValidationError


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


class ForumServiceException(Exception):
    """
    Base exception for forum service specific errors.
    """
    
    def __init__(self, message: str, error_code: str = None, context: Dict[str, Any] = None):
        super().__init__(message)
        self.message = message
        self.error_code = error_code
        self.context = context or {}


# Post related exceptions
class PostNotFoundError(ForumServiceException):
    """Raised when a post is not found."""
    
    def __init__(self, post_id: str):
        super().__init__(
            message=f"Post with ID {post_id} not found",
            error_code="POST_NOT_FOUND",
            context={"post_id": post_id}
        )


class PostAlreadyExistsError(ForumServiceException):
    """Raised when trying to create a duplicate post."""
    
    def __init__(self, title: str):
        super().__init__(
            message=f"Post with title '{title}' already exists",
            error_code="POST_ALREADY_EXISTS",
            context={"title": title}
        )


class PostPermissionError(ForumServiceException):
    """Raised when user doesn't have permission for post action."""
    
    def __init__(self, action: str, post_id: str, user_id: str = None):
        super().__init__(
            message=f"Permission denied for action '{action}' on post {post_id}",
            error_code="POST_PERMISSION_DENIED",
            context={"action": action, "post_id": post_id, "user_id": user_id}
        )


class PostValidationError(ForumServiceException):
    """Raised when post data is invalid."""
    
    def __init__(self, message: str, field: str = None):
        super().__init__(
            message=message,
            error_code="POST_VALIDATION_ERROR",
            context={"field": field} if field else {}
        )


# Reply related exceptions
class ReplyNotFoundError(ForumServiceException):
    """Raised when a reply is not found."""
    
    def __init__(self, reply_id: str):
        super().__init__(
            message=f"Reply with ID {reply_id} not found",
            error_code="REPLY_NOT_FOUND",
            context={"reply_id": reply_id}
        )


class ReplyPermissionError(ForumServiceException):
    """Raised when user doesn't have permission for reply action."""
    
    def __init__(self, action: str, reply_id: str, user_id: str = None):
        super().__init__(
            message=f"Permission denied for action '{action}' on reply {reply_id}",
            error_code="REPLY_PERMISSION_DENIED",
            context={"action": action, "reply_id": reply_id, "user_id": user_id}
        )


# Category related exceptions
class CategoryNotFoundError(ForumServiceException):
    """Raised when a category is not found."""
    
    def __init__(self, category_id: str):
        super().__init__(
            message=f"Category with ID {category_id} not found",
            error_code="CATEGORY_NOT_FOUND",
            context={"category_id": category_id}
        )


# Moderation related exceptions
class ModerationError(ForumServiceException):
    """Raised when moderation action fails."""
    
    def __init__(self, action: str, target_id: str, reason: str = None):
        super().__init__(
            message=f"Moderation action '{action}' failed for {target_id}",
            error_code="MODERATION_ERROR",
            context={"action": action, "target_id": target_id, "reason": reason}
        )


# Rental related exceptions
class RentalError(ForumServiceException):
    """Raised when rental operation fails."""
    
    def __init__(self, message: str, rental_id: str = None):
        super().__init__(
            message=message,
            error_code="RENTAL_ERROR",
            context={"rental_id": rental_id} if rental_id else {}
        )


class RentalNotFoundError(ForumServiceException):
    """Raised when a rental is not found."""
    
    def __init__(self, rental_id: str):
        super().__init__(
            message=f"Rental with ID {rental_id} not found",
            error_code="RENTAL_NOT_FOUND",
            context={"rental_id": rental_id}
        )


# General exceptions
class ValidationError(ForumServiceException):
    """Raised when data validation fails."""
    
    def __init__(self, message: str, field: str = None, value: Any = None):
        super().__init__(
            message=message,
            error_code="VALIDATION_ERROR",
            context={"field": field, "value": str(value)} if field else {}
        )


class PermissionDeniedError(ForumServiceException):
    """Raised when user doesn't have permission for an action."""
    
    def __init__(self, action: str, user_id: str = None, resource: str = None):
        super().__init__(
            message=f"Permission denied for action: {action}",
            error_code="PERMISSION_DENIED",
            context={"action": action, "user_id": user_id, "resource": resource}
        )


class DatabaseError(ForumServiceException):
    """Raised when database operation fails."""
    
    def __init__(self, operation: str, details: str = None):
        super().__init__(
            message=f"Database operation '{operation}' failed",
            error_code="DATABASE_ERROR",
            context={"operation": operation, "details": details}
        )


class CacheError(ForumServiceException):
    """Raised when cache operation fails."""
    
    def __init__(self, operation: str, key: str = None):
        super().__init__(
            message=f"Cache operation '{operation}' failed",
            error_code="CACHE_ERROR",
            context={"operation": operation, "key": key}
        )


class ExternalServiceError(ForumServiceException):
    """Raised when external service call fails."""
    
    def __init__(self, service: str, operation: str, details: str = None):
        super().__init__(
            message=f"External service '{service}' operation '{operation}' failed",
            error_code="EXTERNAL_SERVICE_ERROR",
            context={"service": service, "operation": operation, "details": details}
        )


class RateLimitExceededError(ForumServiceException):
    """Raised when rate limit is exceeded."""
    
    def __init__(self, limit: int, window: str):
        super().__init__(
            message=f"Rate limit exceeded: {limit} requests per {window}",
            error_code="RATE_LIMIT_EXCEEDED",
            context={"limit": limit, "window": window}
        )


# Exception handlers
async def custom_http_exception_handler(request: Request, exc: CustomHTTPException) -> JSONResponse:
    """Handle custom HTTP exceptions."""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {
                "type": "https://api.snowfall-guild.com/errors/http-error",
                "title": "HTTP Error",
                "status": exc.status_code,
                "detail": exc.detail,
                "code": exc.error_code or "HTTP_ERROR",
                "context": exc.context,
            },
            "timestamp": request.state.timestamp if hasattr(request.state, "timestamp") else None,
            "requestId": request.state.request_id if hasattr(request.state, "request_id") else None,
        }
    )


async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """Handle validation exceptions."""
    errors = []
    for error in exc.errors():
        field = ".".join(str(loc) for loc in error["loc"])
        errors.append({
            "field": field,
            "message": error["msg"],
            "code": error["type"],
            "input": error.get("input"),
        })
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "error": {
                "type": "https://api.snowfall-guild.com/errors/validation-error",
                "title": "Validation Error",
                "status": 422,
                "detail": "Input validation failed",
                "code": "VALIDATION_ERROR",
                "errors": errors,
            },
            "timestamp": request.state.timestamp if hasattr(request.state, "timestamp") else None,
            "requestId": request.state.request_id if hasattr(request.state, "request_id") else None,
        }
    )


async def forum_service_exception_handler(request: Request, exc: ForumServiceException) -> JSONResponse:
    """Handle forum service specific exceptions."""
    status_code = status.HTTP_400_BAD_REQUEST
    
    # Map specific exceptions to HTTP status codes
    if isinstance(exc, (PostNotFoundError, ReplyNotFoundError, CategoryNotFoundError, RentalNotFoundError)):
        status_code = status.HTTP_404_NOT_FOUND
    elif isinstance(exc, (PostPermissionError, ReplyPermissionError, PermissionDeniedError)):
        status_code = status.HTTP_403_FORBIDDEN
    elif isinstance(exc, (PostValidationError, ValidationError)):
        status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
    elif isinstance(exc, RateLimitExceededError):
        status_code = status.HTTP_429_TOO_MANY_REQUESTS
    elif isinstance(exc, (DatabaseError, ExternalServiceError)):
        status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    
    return JSONResponse(
        status_code=status_code,
        content={
            "success": False,
            "error": {
                "type": "https://api.snowfall-guild.com/errors/forum-error",
                "title": "Forum Service Error",
                "status": status_code,
                "detail": exc.message,
                "code": exc.error_code,
                "context": exc.context,
            },
            "timestamp": request.state.timestamp if hasattr(request.state, "timestamp") else None,
            "requestId": request.state.request_id if hasattr(request.state, "request_id") else None,
        }
    )


async def general_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handle general exceptions."""
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "error": {
                "type": "https://api.snowfall-guild.com/errors/internal-error",
                "title": "Internal Server Error",
                "status": 500,
                "detail": "An unexpected error occurred",
                "code": "INTERNAL_ERROR",
            },
            "timestamp": request.state.timestamp if hasattr(request.state, "timestamp") else None,
            "requestId": request.state.request_id if hasattr(request.state, "request_id") else None,
        }
    )