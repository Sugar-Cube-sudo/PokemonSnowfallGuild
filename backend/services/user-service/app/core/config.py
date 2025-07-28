#!/usr/bin/env python3
"""
Application Configuration

Centralized configuration management using Pydantic Settings.
"""

import secrets
from typing import Any, Dict, List, Optional, Union

from pydantic import AnyHttpUrl, BaseSettings, EmailStr, PostgresDsn, validator


class Settings(BaseSettings):
    """
    Application settings.
    
    All settings can be overridden by environment variables.
    """
    
    # Basic app settings
    PROJECT_NAME: str = "Pokemon Snowfall Guild User Service"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = secrets.token_urlsafe(32)
    
    # Server settings
    HOST: str = "0.0.0.0"
    PORT: int = 8001
    DEBUG: bool = False
    
    # Security settings
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ALGORITHM: str = "HS256"
    
    # CORS settings
    CORS_ORIGINS: List[AnyHttpUrl] = [
        "http://localhost:3000",
        "http://localhost:8080",
        "https://snowfall-guild.com",
    ]
    
    # Trusted hosts
    ALLOWED_HOSTS: List[str] = ["localhost", "127.0.0.1", "0.0.0.0"]
    
    # Database settings
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "snowfall_guild"
    POSTGRES_PORT: int = 5432
    DATABASE_URL: Optional[PostgresDsn] = None
    
    @validator("DATABASE_URL", pre=True)
    def assemble_db_connection(cls, v: Optional[str], values: Dict[str, Any]) -> Any:
        """Assemble database URL from components."""
        if isinstance(v, str):
            return v
        return PostgresDsn.build(
            scheme="postgresql+asyncpg",
            user=values.get("POSTGRES_USER"),
            password=values.get("POSTGRES_PASSWORD"),
            host=values.get("POSTGRES_SERVER"),
            port=str(values.get("POSTGRES_PORT")),
            path=f"/{values.get('POSTGRES_DB') or ''}",
        )
    
    # Redis settings
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0
    REDIS_PASSWORD: Optional[str] = None
    REDIS_URL: Optional[str] = None
    
    @validator("REDIS_URL", pre=True)
    def assemble_redis_connection(cls, v: Optional[str], values: Dict[str, Any]) -> str:
        """Assemble Redis URL from components."""
        if isinstance(v, str):
            return v
        
        password = values.get("REDIS_PASSWORD")
        auth = f":{password}@" if password else ""
        
        return (
            f"redis://{auth}{values.get('REDIS_HOST')}"
            f":{values.get('REDIS_PORT')}/{values.get('REDIS_DB')}"
        )
    
    # Auth service settings
    AUTH_SERVICE_URL: str = "http://localhost:8081"
    AUTH_SERVICE_TIMEOUT: int = 30
    
    # File storage settings
    FILE_STORAGE_URL: str = "http://localhost:8085"
    MAX_AVATAR_SIZE: int = 5 * 1024 * 1024  # 5MB
    ALLOWED_AVATAR_TYPES: List[str] = ["image/jpeg", "image/png", "image/webp"]
    
    # Rate limiting
    RATE_LIMIT_PER_MINUTE: int = 60
    RATE_LIMIT_BURST: int = 10
    
    # Logging settings
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "json"
    
    # Monitoring settings
    ENABLE_METRICS: bool = True
    METRICS_PORT: int = 9090
    
    # Email settings (for notifications)
    SMTP_TLS: bool = True
    SMTP_PORT: Optional[int] = None
    SMTP_HOST: Optional[str] = None
    SMTP_USER: Optional[EmailStr] = None
    SMTP_PASSWORD: Optional[str] = None
    EMAILS_FROM_EMAIL: Optional[EmailStr] = None
    EMAILS_FROM_NAME: Optional[str] = None
    
    # Pagination settings
    DEFAULT_PAGE_SIZE: int = 20
    MAX_PAGE_SIZE: int = 100
    
    # Cache settings
    CACHE_TTL_SECONDS: int = 300  # 5 minutes
    USER_PROFILE_CACHE_TTL: int = 600  # 10 minutes
    USER_STATS_CACHE_TTL: int = 1800  # 30 minutes
    
    # Feature flags
    ENABLE_USER_REGISTRATION: bool = True
    ENABLE_PROFILE_UPDATES: bool = True
    ENABLE_ACTIVITY_TRACKING: bool = True
    ENABLE_STATISTICS: bool = True
    
    # Privacy settings
    DEFAULT_PROFILE_VISIBILITY: str = "public"  # public, friends, private
    ALLOW_PROFILE_SEARCH: bool = True
    
    # Activity tracking
    TRACK_LOGIN_ACTIVITY: bool = True
    TRACK_PROFILE_VIEWS: bool = True
    ACTIVITY_RETENTION_DAYS: int = 90
    
    class Config:
        """Pydantic config."""
        case_sensitive = True
        env_file = ".env"
        env_file_encoding = "utf-8"


# Global settings instance
settings = Settings()