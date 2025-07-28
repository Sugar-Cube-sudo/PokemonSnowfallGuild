#!/usr/bin/env python3
"""
Custom Middleware

Application middleware for security, logging, and monitoring.
"""

import time
import uuid
from typing import Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

from app.core.logging import get_logger

logger = get_logger(__name__)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Add security headers to all responses.
    """
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)
        
        # Security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        
        # Remove server header
        response.headers.pop("server", None)
        
        return response


class TimingMiddleware(BaseHTTPMiddleware):
    """
    Add timing information to responses.
    """
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        start_time = time.time()
        
        response = await call_next(request)
        
        process_time = time.time() - start_time
        response.headers["X-Process-Time"] = str(process_time)
        
        return response


class LoggingMiddleware(BaseHTTPMiddleware):
    """
    Log all requests and responses.
    """
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Generate correlation ID
        correlation_id = str(uuid.uuid4())
        request.state.correlation_id = correlation_id
        
        # Log request
        start_time = time.time()
        
        logger.info(
            "Request started",
            correlation_id=correlation_id,
            method=request.method,
            url=str(request.url),
            path=request.url.path,
            query_params=dict(request.query_params),
            client_ip=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
        )
        
        try:
            response = await call_next(request)
            
            # Log response
            process_time = time.time() - start_time
            
            logger.info(
                "Request completed",
                correlation_id=correlation_id,
                method=request.method,
                path=request.url.path,
                status_code=response.status_code,
                process_time=process_time,
            )
            
            # Add correlation ID to response headers
            response.headers["X-Correlation-ID"] = correlation_id
            
            return response
            
        except Exception as exc:
            # Log error
            process_time = time.time() - start_time
            
            logger.error(
                "Request failed",
                correlation_id=correlation_id,
                method=request.method,
                path=request.url.path,
                process_time=process_time,
                exception=str(exc),
                exc_info=True,
            )
            
            raise


class CORSMiddleware(BaseHTTPMiddleware):
    """
    Custom CORS middleware with additional security.
    """
    
    def __init__(self, app: ASGIApp, allowed_origins: list[str]):
        super().__init__(app)
        self.allowed_origins = allowed_origins
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        origin = request.headers.get("origin")
        
        # Handle preflight requests
        if request.method == "OPTIONS":
            response = Response()
            
            if origin in self.allowed_origins:
                response.headers["Access-Control-Allow-Origin"] = origin
                response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
                response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Requested-With"
                response.headers["Access-Control-Allow-Credentials"] = "true"
                response.headers["Access-Control-Max-Age"] = "86400"
            
            return response
        
        response = await call_next(request)
        
        # Add CORS headers to actual requests
        if origin in self.allowed_origins:
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
        
        return response


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Simple in-memory rate limiting middleware.
    
    Note: In production, use Redis-based rate limiting.
    """
    
    def __init__(self, app: ASGIApp, requests_per_minute: int = 60):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self.requests = {}  # In production, use Redis
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        client_ip = request.client.host if request.client else "unknown"
        current_time = int(time.time() / 60)  # Current minute
        
        # Clean old entries
        self.requests = {
            key: value for key, value in self.requests.items()
            if key[1] >= current_time - 1
        }
        
        # Check rate limit
        key = (client_ip, current_time)
        current_requests = self.requests.get(key, 0)
        
        if current_requests >= self.requests_per_minute:
            logger.warning(
                "Rate limit exceeded",
                client_ip=client_ip,
                requests=current_requests,
                limit=self.requests_per_minute,
            )
            
            return Response(
                content="Rate limit exceeded",
                status_code=429,
                headers={
                    "Retry-After": "60",
                    "X-RateLimit-Limit": str(self.requests_per_minute),
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": str((current_time + 1) * 60),
                }
            )
        
        # Increment counter
        self.requests[key] = current_requests + 1
        
        response = await call_next(request)
        
        # Add rate limit headers
        remaining = self.requests_per_minute - self.requests[key]
        response.headers["X-RateLimit-Limit"] = str(self.requests_per_minute)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        response.headers["X-RateLimit-Reset"] = str((current_time + 1) * 60)
        
        return response


class UserContextMiddleware(BaseHTTPMiddleware):
    """
    Extract user context from JWT token and add to request state.
    """
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Extract user info from Authorization header
        auth_header = request.headers.get("authorization")
        
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header[7:]  # Remove "Bearer " prefix
            
            # In a real implementation, you would decode and validate the JWT
            # For now, we'll just store the token
            request.state.auth_token = token
            
            # You would extract user_id, roles, etc. from the token
            # request.state.user_id = decoded_token.get("user_id")
            # request.state.user_roles = decoded_token.get("roles", [])
        
        return await call_next(request)


class CompressionMiddleware(BaseHTTPMiddleware):
    """
    Add compression hints to responses.
    
    Note: In production, use a proper compression middleware or reverse proxy.
    """
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)
        
        # Add compression hints
        accept_encoding = request.headers.get("accept-encoding", "")
        
        if "gzip" in accept_encoding:
            response.headers["Vary"] = "Accept-Encoding"
        
        return response