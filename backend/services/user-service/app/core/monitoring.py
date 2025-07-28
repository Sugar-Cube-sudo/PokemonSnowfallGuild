#!/usr/bin/env python3
"""
Monitoring and Metrics

Prometheus metrics and health checks for the user service.
"""

import time
from typing import Dict, Any

from fastapi import FastAPI, Request
from prometheus_client import (
    Counter,
    Histogram,
    Gauge,
    generate_latest,
    CONTENT_TYPE_LATEST,
)
from starlette.responses import Response

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)

# Prometheus metrics
REQUEST_COUNT = Counter(
    "http_requests_total",
    "Total HTTP requests",
    ["method", "endpoint", "status_code"]
)

REQUEST_DURATION = Histogram(
    "http_request_duration_seconds",
    "HTTP request duration in seconds",
    ["method", "endpoint"]
)

ACTIVE_CONNECTIONS = Gauge(
    "active_connections",
    "Number of active connections"
)

DATABASE_CONNECTIONS = Gauge(
    "database_connections_active",
    "Number of active database connections"
)

CACHE_OPERATIONS = Counter(
    "cache_operations_total",
    "Total cache operations",
    ["operation", "status"]
)

USER_OPERATIONS = Counter(
    "user_operations_total",
    "Total user operations",
    ["operation", "status"]
)

PROFILE_VIEWS = Counter(
    "profile_views_total",
    "Total profile views",
    ["viewer_type"]
)

ACTIVE_USERS = Gauge(
    "active_users",
    "Number of currently active users"
)

ERROR_COUNT = Counter(
    "errors_total",
    "Total errors",
    ["error_type", "endpoint"]
)


class MetricsCollector:
    """
    Collect and manage application metrics.
    """
    
    def __init__(self):
        self.start_time = time.time()
        self.active_requests = 0
    
    def record_request_start(self, method: str, endpoint: str):
        """Record the start of a request."""
        self.active_requests += 1
        ACTIVE_CONNECTIONS.set(self.active_requests)
    
    def record_request_end(
        self,
        method: str,
        endpoint: str,
        status_code: int,
        duration: float
    ):
        """Record the end of a request."""
        self.active_requests = max(0, self.active_requests - 1)
        ACTIVE_CONNECTIONS.set(self.active_requests)
        
        REQUEST_COUNT.labels(
            method=method,
            endpoint=endpoint,
            status_code=status_code
        ).inc()
        
        REQUEST_DURATION.labels(
            method=method,
            endpoint=endpoint
        ).observe(duration)
    
    def record_cache_operation(self, operation: str, success: bool):
        """Record a cache operation."""
        status = "success" if success else "error"
        CACHE_OPERATIONS.labels(operation=operation, status=status).inc()
    
    def record_user_operation(self, operation: str, success: bool):
        """Record a user operation."""
        status = "success" if success else "error"
        USER_OPERATIONS.labels(operation=operation, status=status).inc()
    
    def record_profile_view(self, viewer_type: str):
        """Record a profile view."""
        PROFILE_VIEWS.labels(viewer_type=viewer_type).inc()
    
    def record_error(self, error_type: str, endpoint: str):
        """Record an error."""
        ERROR_COUNT.labels(error_type=error_type, endpoint=endpoint).inc()
    
    def update_active_users(self, count: int):
        """Update active users count."""
        ACTIVE_USERS.set(count)
    
    def get_uptime(self) -> float:
        """Get application uptime in seconds."""
        return time.time() - self.start_time


# Global metrics collector
metrics_collector = MetricsCollector()


def setup_monitoring(app: FastAPI):
    """
    Setup monitoring endpoints and middleware.
    
    Args:
        app: FastAPI application instance
    """
    if not settings.ENABLE_METRICS:
        return
    
    @app.middleware("http")
    async def metrics_middleware(request: Request, call_next):
        """Middleware to collect request metrics."""
        start_time = time.time()
        method = request.method
        endpoint = request.url.path
        
        # Record request start
        metrics_collector.record_request_start(method, endpoint)
        
        try:
            response = await call_next(request)
            
            # Record successful request
            duration = time.time() - start_time
            metrics_collector.record_request_end(
                method, endpoint, response.status_code, duration
            )
            
            return response
            
        except Exception as exc:
            # Record failed request
            duration = time.time() - start_time
            metrics_collector.record_request_end(method, endpoint, 500, duration)
            metrics_collector.record_error(type(exc).__name__, endpoint)
            raise
    
    @app.get("/metrics")
    async def metrics_endpoint():
        """Prometheus metrics endpoint."""
        return Response(
            generate_latest(),
            media_type=CONTENT_TYPE_LATEST
        )
    
    @app.get("/health")
    async def health_check():
        """Health check endpoint."""
        return await get_health_status()
    
    @app.get("/health/ready")
    async def readiness_check():
        """Readiness check endpoint."""
        return await get_readiness_status()
    
    @app.get("/health/live")
    async def liveness_check():
        """Liveness check endpoint."""
        return {
            "status": "healthy",
            "timestamp": time.time(),
            "uptime": metrics_collector.get_uptime(),
        }


async def get_health_status() -> Dict[str, Any]:
    """
    Get comprehensive health status.
    
    Returns:
        Dictionary with health information
    """
    from app.core.database import sessionmanager
    from app.core.cache import cache_manager
    
    health_status = {
        "status": "healthy",
        "timestamp": time.time(),
        "uptime": metrics_collector.get_uptime(),
        "version": settings.VERSION,
        "service": "user-service",
        "checks": {}
    }
    
    # Database health check
    try:
        async with sessionmanager.session() as session:
            await session.execute("SELECT 1")
        health_status["checks"]["database"] = {
            "status": "healthy",
            "message": "Database connection successful"
        }
    except Exception as e:
        health_status["status"] = "unhealthy"
        health_status["checks"]["database"] = {
            "status": "unhealthy",
            "message": f"Database connection failed: {str(e)}"
        }
    
    # Cache health check
    try:
        await cache_manager.redis.ping()
        health_status["checks"]["cache"] = {
            "status": "healthy",
            "message": "Cache connection successful"
        }
    except Exception as e:
        health_status["status"] = "unhealthy"
        health_status["checks"]["cache"] = {
            "status": "unhealthy",
            "message": f"Cache connection failed: {str(e)}"
        }
    
    return health_status


async def get_readiness_status() -> Dict[str, Any]:
    """
    Get readiness status for Kubernetes.
    
    Returns:
        Dictionary with readiness information
    """
    health = await get_health_status()
    
    # Service is ready if all critical components are healthy
    is_ready = (
        health["checks"].get("database", {}).get("status") == "healthy" and
        health["checks"].get("cache", {}).get("status") == "healthy"
    )
    
    return {
        "status": "ready" if is_ready else "not_ready",
        "timestamp": time.time(),
        "checks": health["checks"]
    }


def record_cache_hit(operation: str):
    """Record a cache hit."""
    metrics_collector.record_cache_operation(operation, True)


def record_cache_miss(operation: str):
    """Record a cache miss."""
    metrics_collector.record_cache_operation(operation, False)


def record_user_created():
    """Record a user creation."""
    metrics_collector.record_user_operation("create", True)


def record_user_updated():
    """Record a user update."""
    metrics_collector.record_user_operation("update", True)


def record_user_deleted():
    """Record a user deletion."""
    metrics_collector.record_user_operation("delete", True)


def record_profile_view(is_authenticated: bool = False):
    """Record a profile view."""
    viewer_type = "authenticated" if is_authenticated else "anonymous"
    metrics_collector.record_profile_view(viewer_type)


def record_database_error(endpoint: str):
    """Record a database error."""
    metrics_collector.record_error("database", endpoint)


def record_cache_error(endpoint: str):
    """Record a cache error."""
    metrics_collector.record_error("cache", endpoint)


def record_validation_error(endpoint: str):
    """Record a validation error."""
    metrics_collector.record_error("validation", endpoint)