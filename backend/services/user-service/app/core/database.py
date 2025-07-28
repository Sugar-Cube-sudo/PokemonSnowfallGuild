#!/usr/bin/env python3
"""
Database Configuration and Session Management

Provides database connection, session management, and base model class.
"""

import asyncio
from contextlib import asynccontextmanager
from typing import AsyncGenerator, Optional

from sqlalchemy import MetaData, event
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.pool import NullPool

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


# Database metadata with naming convention
metadata = MetaData(
    naming_convention={
        "ix": "ix_%(column_0_label)s",
        "uq": "uq_%(table_name)s_%(column_0_name)s",
        "ck": "ck_%(table_name)s_%(constraint_name)s",
        "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
        "pk": "pk_%(table_name)s",
    }
)


class Base(DeclarativeBase):
    """Base class for all database models."""
    
    metadata = metadata


class DatabaseSessionManager:
    """
    Database session manager for async SQLAlchemy.
    
    Manages database engine and session lifecycle.
    """
    
    def __init__(self, host: str, engine_kwargs: dict[str, Any] = {}):
        self._engine = create_async_engine(
            host,
            poolclass=NullPool,
            **engine_kwargs
        )
        self._sessionmaker = async_sessionmaker(
            autocommit=False,
            autoflush=False,
            bind=self._engine,
        )
    
    async def close(self):
        """Close database engine."""
        if self._engine is None:
            raise Exception("DatabaseSessionManager is not initialized")
        await self._engine.dispose()
        
        self._engine = None
        self._sessionmaker = None
    
    @contextlib.asynccontextmanager
    async def connect(self) -> AsyncIterator[AsyncConnection]:
        """Get database connection."""
        if self._engine is None:
            raise Exception("DatabaseSessionManager is not initialized")
        
        async with self._engine.begin() as connection:
            try:
                yield connection
            except Exception:
                await connection.rollback()
                raise
    
    @contextlib.asynccontextmanager
    async def session(self) -> AsyncIterator[AsyncSession]:
        """Get database session."""
        if self._sessionmaker is None:
            raise Exception("DatabaseSessionManager is not initialized")
        
        session = self._sessionmaker()
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
    
    def init(self, host: str, **engine_kwargs):
        """Initialize database session manager."""
        self._engine = create_async_engine(
            host,
            poolclass=NullPool,
            **engine_kwargs
        )
        self._sessionmaker = async_sessionmaker(
            autocommit=False,
            autoflush=False,
            bind=self._engine,
        )


# Global session manager instance
sessionmanager = DatabaseSessionManager(
    settings.DATABASE_URL,
    {
        "echo": settings.DEBUG,
        "echo_pool": settings.DEBUG,
        "pool_pre_ping": True,
        "pool_recycle": 300,
    }
)

# Create engine for non-async operations (like Alembic)
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    pool_pre_ping=True,
    pool_recycle=300,
)


async def get_db_session() -> AsyncIterator[AsyncSession]:
    """
    Dependency to get database session.
    
    Yields:
        AsyncSession: Database session
    """
    async with sessionmanager.session() as session:
        yield session