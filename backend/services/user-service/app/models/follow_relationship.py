#!/usr/bin/env python3
"""
Follow Relationship Model

Manages user follow/following relationships and social connections.
"""

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    ForeignKey,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.schemas.enums import FollowStatus


class FollowRelationship(Base):
    """
    Follow relationship model for managing user social connections.
    
    This model tracks who follows whom, including the status of the relationship
    (pending, accepted, blocked) and related metadata.
    """
    
    __tablename__ = "follow_relationships"
    
    # Composite unique constraint
    __table_args__ = (
        UniqueConstraint(
            "follower_id",
            "following_id",
            name="uq_follow_relationship_follower_following"
        ),
    )
    
    # Primary key
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    
    # Foreign keys
    follower_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="User who is following"
    )
    
    following_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="User who is being followed"
    )
    
    # Relationship status
    status: Mapped[FollowStatus] = mapped_column(
        Enum(FollowStatus),
        default=FollowStatus.ACTIVE,
        nullable=False,
        index=True
    )
    
    # Privacy and notification settings
    is_muted: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        comment="Whether the follower has muted the following user"
    )
    
    notifications_enabled: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
        comment="Whether to send notifications for this relationship"
    )
    
    # Relationship metadata
    follow_source: Mapped[Optional[str]] = mapped_column(
        nullable=True,
        comment="Source of the follow (e.g., 'search', 'suggestion', 'profile')"
    )
    
    metadata: Mapped[Optional[dict]] = mapped_column(
        JSONB,
        nullable=True,
        comment="Additional relationship metadata"
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
    
    accepted_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        comment="When the follow request was accepted (for private accounts)"
    )
    
    blocked_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        comment="When the relationship was blocked"
    )
    
    # Relationships
    follower: Mapped["User"] = relationship(
        "User",
        foreign_keys=[follower_id],
        back_populates="following"
    )
    
    following: Mapped["User"] = relationship(
        "User",
        foreign_keys=[following_id],
        back_populates="followers"
    )
    
    def __repr__(self) -> str:
        return (
            f"<FollowRelationship("
            f"id={self.id}, "
            f"follower_id={self.follower_id}, "
            f"following_id={self.following_id}, "
            f"status={self.status}"
            f")>"
        )
    
    @property
    def is_active(self) -> bool:
        """Check if the follow relationship is active."""
        return self.status == FollowStatus.ACTIVE
    
    @property
    def is_pending(self) -> bool:
        """Check if the follow request is pending."""
        return self.status == FollowStatus.PENDING
    
    @property
    def is_blocked(self) -> bool:
        """Check if the relationship is blocked."""
        return self.status == FollowStatus.BLOCKED
    
    @property
    def is_rejected(self) -> bool:
        """Check if the follow request was rejected."""
        return self.status == FollowStatus.REJECTED
    
    @property
    def duration_days(self) -> Optional[int]:
        """Get the duration of the relationship in days."""
        if not self.accepted_at:
            return None
        
        end_time = self.blocked_at or datetime.utcnow()
        return (end_time - self.accepted_at).days
    
    def accept(self) -> None:
        """Accept a pending follow request."""
        if self.status == FollowStatus.PENDING:
            self.status = FollowStatus.ACTIVE
            self.accepted_at = datetime.utcnow()
    
    def reject(self) -> None:
        """Reject a pending follow request."""
        if self.status == FollowStatus.PENDING:
            self.status = FollowStatus.REJECTED
    
    def block(self) -> None:
        """Block the relationship."""
        self.status = FollowStatus.BLOCKED
        self.blocked_at = datetime.utcnow()
    
    def unblock(self) -> None:
        """Unblock the relationship."""
        if self.status == FollowStatus.BLOCKED:
            self.status = FollowStatus.ACTIVE
            self.blocked_at = None
    
    def mute(self) -> None:
        """Mute notifications from the followed user."""
        self.is_muted = True
        self.notifications_enabled = False
    
    def unmute(self) -> None:
        """Unmute notifications from the followed user."""
        self.is_muted = False
        self.notifications_enabled = True
    
    def toggle_notifications(self) -> None:
        """Toggle notification settings."""
        self.notifications_enabled = not self.notifications_enabled
    
    def add_metadata(self, key: str, value: any) -> None:
        """
        Add metadata to the relationship.
        
        Args:
            key: Metadata key
            value: Metadata value
        """
        if self.metadata is None:
            self.metadata = {}
        
        self.metadata[key] = value
    
    def get_metadata(self, key: str, default: any = None) -> any:
        """
        Get metadata value by key.
        
        Args:
            key: Metadata key
            default: Default value if key not found
            
        Returns:
            Metadata value or default
        """
        if not self.metadata:
            return default
        return self.metadata.get(key, default)
    
    @classmethod
    def create_follow_request(
        cls,
        follower_id: uuid.UUID,
        following_id: uuid.UUID,
        follow_source: Optional[str] = None,
        auto_accept: bool = True,
        **metadata
    ) -> "FollowRelationship":
        """
        Create a new follow relationship.
        
        Args:
            follower_id: ID of the user who wants to follow
            following_id: ID of the user to be followed
            follow_source: Source of the follow request
            auto_accept: Whether to auto-accept the request
            **metadata: Additional metadata
            
        Returns:
            FollowRelationship instance
        """
        status = FollowStatus.ACTIVE if auto_accept else FollowStatus.PENDING
        accepted_at = datetime.utcnow() if auto_accept else None
        
        return cls(
            follower_id=follower_id,
            following_id=following_id,
            status=status,
            follow_source=follow_source,
            accepted_at=accepted_at,
            metadata=metadata if metadata else None
        )
    
    def to_dict(self) -> dict:
        """
        Convert the relationship to a dictionary.
        
        Returns:
            Dictionary representation of the relationship
        """
        return {
            "id": str(self.id),
            "follower_id": str(self.follower_id),
            "following_id": str(self.following_id),
            "status": self.status.value,
            "is_muted": self.is_muted,
            "notifications_enabled": self.notifications_enabled,
            "follow_source": self.follow_source,
            "metadata": self.metadata,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "accepted_at": self.accepted_at.isoformat() if self.accepted_at else None,
            "blocked_at": self.blocked_at.isoformat() if self.blocked_at else None,
            "duration_days": self.duration_days,
        }
    
    @staticmethod
    def validate_relationship(follower_id: uuid.UUID, following_id: uuid.UUID) -> bool:
        """
        Validate that a follow relationship is valid.
        
        Args:
            follower_id: ID of the follower
            following_id: ID of the user being followed
            
        Returns:
            True if the relationship is valid
            
        Raises:
            ValueError: If the relationship is invalid
        """
        if follower_id == following_id:
            raise ValueError("Users cannot follow themselves")
        
        return True