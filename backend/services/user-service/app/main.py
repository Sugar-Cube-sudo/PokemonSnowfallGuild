#!/usr/bin/env python3
"""
FastAPI Application Factory

Main application setup with middleware, routes, and configuration.
"""

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from slowapi.util import get_remote_address

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.database import engine, sessionmanager
from app.core.exceptions import (
    CustomHTTPException,
    custom_http_exception_handler,
    validation_exception_handler,
)
from app.core.logging import setup_logging
from app.core.middleware import (
    LoggingMiddleware,
    SecurityHeadersMiddleware,
    TimingMiddleware,
)
from app.core.monitoring import setup_monitoring

# Setup logging
setup_logging()

# Rate limiter
limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    Application lifespan manager.
    
    Handles startup and shutdown events.
    """
    # Startup
    sessionmanager.init(settings.DATABASE_URL)
    
    # Setup monitoring
    setup_monitoring(app)
    
    yield
    
    # Shutdown
    if sessionmanager._engine is not None:
        await sessionmanager.close()


def create_app() -> FastAPI:
    """
    Create and configure FastAPI application.
    
    Returns:
        FastAPI: Configured application instance
    """
    app = FastAPI(
        title=settings.PROJECT_NAME,
        description="Pokemon Snowfall Guild User Management Service",
        version=settings.VERSION,
        openapi_url=f"{settings.API_V1_STR}/openapi.json" if settings.DEBUG else None,
        docs_url=f"{settings.API_V1_STR}/docs" if settings.DEBUG else None,
        redoc_url=f"{settings.API_V1_STR}/redoc" if settings.DEBUG else None,
        lifespan=lifespan,
    )
    
    # Security middleware
    if settings.ALLOWED_HOSTS:
        app.add_middleware(
            TrustedHostMiddleware,
            allowed_hosts=settings.ALLOWED_HOSTS,
        )
    
    # CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Rate limiting middleware
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    app.add_middleware(SlowAPIMiddleware)
    
    # Custom middleware
    app.add_middleware(SecurityHeadersMiddleware)
    app.add_middleware(TimingMiddleware)
    app.add_middleware(LoggingMiddleware)
    
    # Exception handlers
    app.add_exception_handler(CustomHTTPException, custom_http_exception_handler)
    app.add_exception_handler(422, validation_exception_handler)
    
    # Include routers
    app.include_router(api_router, prefix=settings.API_V1_STR)
    
    @app.get("/health")
    async def health_check():
        """Health check endpoint."""
        return {"status": "healthy", "service": "user-service"}
    
    @app.get("/")
    async def root():
        """Root endpoint."""
        return {
            "message": "Pokemon Snowfall Guild User Service",
            "version": settings.VERSION,
            "docs": f"{settings.API_V1_STR}/docs" if settings.DEBUG else None,
        }
    
    return app


# Create application instance
app = create_app()