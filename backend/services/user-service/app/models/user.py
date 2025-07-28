#!/usr/bin/env python3
"""
User Model

Core user entity with basic information and authentication data.
"""

import uuid
from datetime import datetime
from typing import Optional, List

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.schemas.enums import UserRole, UserStatus


class User(Base):
    """
    User model representing a registered user in the system.
    
    This model contains core user information that is shared across services.
    Detailed profile information is stored in the UserProfile model.
    """
    
    __tablename__ = "users"
    
    # Primary key
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True
    )
    
    # Authentication fields
    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=False
    )
    
    username: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        index=True,
        nullable=False
    )
    
    # Display name (can be changed, unlike username)
    display_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )
    
    # User status and role
    status: Mapped[UserStatus] = mapped_column(
        Enum(UserStatus),
        default=UserStatus.ACTIVE,
        nullable=False,
        index=True
    )
    
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole),
        default=UserRole.USER,
        nullable=False,
        index=True
    )
    
    # Account verification
    is_verified: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False
    )
    
    # Avatar URL (stored in file service)
    avatar_url: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True
    )
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True
    )
    
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )
    
    last_login_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        index=True
    )
    
    # Soft delete
    deleted_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        index=True
    )
    
    # Additional metadata
    metadata: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        comment="JSON metadata for extensibility"
    )
    
    # Relationships
    profile: Mapped["UserProfile"] = relationship(
        "UserProfile",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan"
    )
    
    stats: Mapped["UserStats"] = relationship(
        "UserStats",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan"
    )
    
    activities: Mapped[List["UserActivity"]] = relationship(
        "UserActivity",
        back_populates="user",
        cascade="all, delete-orphan",
        order_by="UserActivity.created_at.desc()"
    )
    
    privacy_settings: Mapped["PrivacySettings"] = relationship(
        "PrivacySettings",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan"
    )
    
    # Following relationships
    following: Mapped[List["FollowRelationship"]] = relationship(
        "FollowRelationship",
        foreign_keys="FollowRelationship.follower_id",
        back_populates="follower",
        cascade="all, delete-orphan"
    )
    
    followers: Mapped[List["FollowRelationship"]] = relationship(
        "FollowRelationship",
        foreign_keys="FollowRelationship.following_id",
        back_populates="following",
        cascade="all, delete-orphan"
    )
    
    def __repr__(self) -> str:
        return f"<User(id={self.id}, username={self.username}, email={self.email})>"
    
    @property
    def is_active(self) -> bool:
        """Check if user is active."""
        return self.status == UserStatus.ACTIVE and self.deleted_at is None
    
    @property
    def is_admin(self) -> bool:
        """Check if user has admin privileges."""
        return self.role in [UserRole.ADMIN, UserRole.SUPER_ADMIN]
    
    @property
    def is_moderator(self) -> bool:
        """Check if user has moderator privileges."""
        return self.role in [UserRole.MODERATOR, UserRole.ADMIN, UserRole.SUPER_ADMIN]
    
    @property
    def full_name(self) -> str:
        """Get user's full display name."""
        return self.display_name or self.username
    
    def can_perform_action(self, action: str) -> bool:
        """
        Check if user can perform a specific action.
        
        Args:
            action: Action to check
            
        Returns:
            True if user can perform the action
        """
        if not self.is_active:
            return False
        
        # Define role-based permissions
        permissions = {
            UserRole.USER: [
                "view_profile",
                "edit_own_profile",
                "follow_users",
                "create_posts",
                "comment_posts",
            ],
            UserRole.MODERATOR: [
                "view_profile",
                "edit_own_profile",
                "follow_users",
                "create_posts",
                "comment_posts",
                "moderate_posts",
                "moderate_comments",
                "view_reports",
            ],
            UserRole.ADMIN: [
                "view_profile",
                "edit_own_profile",
                "edit_any_profile",
                "follow_users",
                "create_posts",
                "comment_posts",
                "moderate_posts",
                "moderate_comments",
                "view_reports",
                "manage_users",
                "view_admin_panel",
            ],
            UserRole.SUPER_ADMIN: [
                "*",  # All permissions
            ],
        }
        
        user_permissions = permissions.get(self.role, [])
        return "*" in user_permissions or action in user_permissions
    
    def soft_delete(self) -> None:
        """Soft delete the user."""
        self.deleted_at = datetime.utcnow()
        self.status = UserStatus.DELETED
    
    def restore(self) -> None:
        """Restore a soft-deleted user."""
        self.deleted_at = None
        self.status = UserStatus.ACTIVE