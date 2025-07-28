#!/usr/bin/env python3
"""
Forum Category Model

Defines the database model for forum categories.
"""

from datetime import datetime
from typing import List, Optional

from sqlalchemy import Boolean, DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.core.database import Base


class ForumCategory(Base):
    """Forum category model."""
    
    __tablename__ = "forum_categories"
    
    # Primary key
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    
    # Basic information
    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    slug: Mapped[str] = mapped_column(String(100), nullable=False, unique=True, index=True)
    
    # Display settings
    color: Mapped[Optional[str]] = mapped_column(String(7), nullable=True)  # Hex color code
    icon: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # Icon name or URL
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    
    # Status
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_visible: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    
    # Permissions
    require_auth_to_view: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    require_auth_to_post: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    
    # Statistics
    post_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    reply_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        onupdate=func.now(), 
        nullable=False
    )
    
    # Relationships
    posts: Mapped[List["ForumPost"]] = relationship(
        "ForumPost", 
        back_populates="category",
        cascade="all, delete-orphan"
    )
    
    def __repr__(self) -> str:
        return f"<ForumCategory(id={self.id}, name='{self.name}', slug='{self.slug}')>"
    
    def to_dict(self) -> dict:
        """Convert to dictionary."""
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "slug": self.slug,
            "color": self.color,
            "icon": self.icon,
            "sort_order": self.sort_order,
            "is_active": self.is_active,
            "is_visible": self.is_visible,
            "require_auth_to_view": self.require_auth_to_view,
            "require_auth_to_post": self.require_auth_to_post,
            "post_count": self.post_count,
            "reply_count": self.reply_count,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }