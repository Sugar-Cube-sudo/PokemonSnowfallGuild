#!/usr/bin/env python3
"""
Logging Configuration

Structured logging setup with JSON formatting and correlation IDs.
"""

import logging
import sys
from typing import Any, Dict

import structlog
from pythonjsonlogger import jsonlogger

from app.core.config import settings


def setup_logging() -> None:
    """
    Configure structured logging for the application.
    
    Sets up both standard library logging and structlog with JSON formatting.
    """
    # Configure standard library logging
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=getattr(logging, settings.LOG_LEVEL.upper()),
    )
    
    # Configure structlog
    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.processors.add_log_level,
            structlog.processors.StackInfoRenderer(),
            structlog.dev.set_exc_info,
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.JSONRenderer() if settings.LOG_FORMAT == "json" else structlog.dev.ConsoleRenderer(),
        ],
        wrapper_class=structlog.make_filtering_bound_logger(getattr(logging, settings.LOG_LEVEL.upper())),
        logger_factory=structlog.PrintLoggerFactory(),
        cache_logger_on_first_use=True,
    )
    
    # Configure JSON formatter for standard library loggers
    if settings.LOG_FORMAT == "json":
        json_formatter = jsonlogger.JsonFormatter(
            "%(asctime)s %(name)s %(levelname)s %(message)s",
            datefmt="%Y-%m-%dT%H:%M:%S",
        )
        
        # Apply to root logger
        root_logger = logging.getLogger()
        for handler in root_logger.handlers:
            handler.setFormatter(json_formatter)
        
        # Apply to uvicorn loggers
        for logger_name in ["uvicorn", "uvicorn.access", "uvicorn.error"]:
            logger = logging.getLogger(logger_name)
            for handler in logger.handlers:
                handler.setFormatter(json_formatter)


def get_logger(name: str) -> structlog.BoundLogger:
    """
    Get a structured logger instance.
    
    Args:
        name: Logger name (usually __name__)
        
    Returns:
        Configured structlog logger
    """
    return structlog.get_logger(name)


class LoggerMixin:
    """
    Mixin class to add logging capabilities to any class.
    """
    
    @property
    def logger(self) -> structlog.BoundLogger:
        """Get logger for this class."""
        return get_logger(self.__class__.__module__ + "." + self.__class__.__name__)


def log_function_call(func_name: str, **kwargs) -> Dict[str, Any]:
    """
    Create a structured log entry for function calls.
    
    Args:
        func_name: Name of the function being called
        **kwargs: Additional context to log
        
    Returns:
        Dictionary with structured log data
    """
    return {
        "event": "function_call",
        "function": func_name,
        **kwargs,
    }


def log_database_operation(operation: str, table: str, **kwargs) -> Dict[str, Any]:
    """
    Create a structured log entry for database operations.
    
    Args:
        operation: Type of operation (select, insert, update, delete)
        table: Database table name
        **kwargs: Additional context to log
        
    Returns:
        Dictionary with structured log data
    """
    return {
        "event": "database_operation",
        "operation": operation,
        "table": table,
        **kwargs,
    }


def log_cache_operation(operation: str, key: str, **kwargs) -> Dict[str, Any]:
    """
    Create a structured log entry for cache operations.
    
    Args:
        operation: Type of operation (get, set, delete)
        key: Cache key
        **kwargs: Additional context to log
        
    Returns:
        Dictionary with structured log data
    """
    return {
        "event": "cache_operation",
        "operation": operation,
        "key": key,
        **kwargs,
    }


def log_api_request(method: str, path: str, **kwargs) -> Dict[str, Any]:
    """
    Create a structured log entry for API requests.
    
    Args:
        method: HTTP method
        path: Request path
        **kwargs: Additional context to log
        
    Returns:
        Dictionary with structured log data
    """
    return {
        "event": "api_request",
        "method": method,
        "path": path,
        **kwargs,
    }


def log_user_action(user_id: str, action: str, **kwargs) -> Dict[str, Any]:
    """
    Create a structured log entry for user actions.
    
    Args:
        user_id: User identifier
        action: Action performed
        **kwargs: Additional context to log
        
    Returns:
        Dictionary with structured log data
    """
    return {
        "event": "user_action",
        "user_id": user_id,
        "action": action,
        **kwargs,
    }