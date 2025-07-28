#!/usr/bin/env python3
"""
User Activity Model

Tracks user activities and actions for analytics and audit purposes.
"""

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import (
    DateTime,
    Enum,
    ForeignKey,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB, INET
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.schemas.enums import ActivityType, ActivityStatus


class UserActivity(Base):
    """
    User activity model for tracking user actions and behaviors.
    
    This model stores detailed information about user activities
    for analytics, audit trails, and user behavior analysis.
    """
    
    __tablename__ = "user_activities"
    
    # Primary key
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    
    # Foreign key to user
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    
    # Activity information
    activity_type: Mapped[ActivityType] = mapped_column(
        Enum(ActivityType),
        nullable=False,
        index=True
    )
    
    activity_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True
    )
    
    description: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True
    )
    
    status: Mapped[ActivityStatus] = mapped_column(
        Enum(ActivityStatus),
        default=ActivityStatus.COMPLETED,
        nullable=False,
        index=True
    )
    
    # Activity context
    resource_type: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
        index=True,
        comment="Type of resource being acted upon (e.g., 'post', 'comment', 'user')"
    )
    
    resource_id: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
        index=True,
        comment="ID of the resource being acted upon"
    )
    
    # Activity metadata
    metadata: Mapped[Optional[dict]] = mapped_column(
        JSONB,
        nullable=True,
        comment="Additional activity data in JSON format"
    )
    
    # Request information
    ip_address: Mapped[Optional[str]] = mapped_column(
        INET,
        nullable=True,
        index=True
    )
    
    user_agent: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True
    )
    
    session_id: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
        index=True
    )
    
    # Location information
    country: Mapped[Optional[str]] = mapped_column(
        String(2),  # ISO country code
        nullable=True,
        index=True
    )
    
    city: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True
    )
    
    # Performance metrics
    duration_ms: Mapped[Optional[int]] = mapped_column(
        nullable=True,
        comment="Activity duration in milliseconds"
    )
    
    # Error information (if activity failed)
    error_code: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
        index=True
    )
    
    error_message: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True
    )
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True
    )
    
    completed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        index=True
    )
    
    # Relationships
    user: Mapped["User"] = relationship(
        "User",
        back_populates="activities"
    )
    
    def __repr__(self) -> str:
        return (
            f"<UserActivity("
            f"id={self.id}, "
            f"user_id={self.user_id}, "
            f"activity_type={self.activity_type}, "
            f"activity_name={self.activity_name}"
            f")>"
        )
    
    @property
    def is_completed(self) -> bool:
        """Check if activity is completed."""
        return self.status == ActivityStatus.COMPLETED
    
    @property
    def is_failed(self) -> bool:
        """Check if activity failed."""
        return self.status == ActivityStatus.FAILED
    
    @property
    def is_in_progress(self) -> bool:
        """Check if activity is in progress."""
        return self.status == ActivityStatus.IN_PROGRESS
    
    @property
    def duration_seconds(self) -> Optional[float]:
        """Get activity duration in seconds."""
        if self.duration_ms is None:
            return None
        return self.duration_ms / 1000.0
    
    def mark_completed(self, duration_ms: Optional[int] = None) -> None:
        """
        Mark activity as completed.
        
        Args:
            duration_ms: Optional duration in milliseconds
        """
        self.status = ActivityStatus.COMPLETED
        self.completed_at = datetime.utcnow()
        if duration_ms is not None:
            self.duration_ms = duration_ms
    
    def mark_failed(self, error_code: str, error_message: str, duration_ms: Optional[int] = None) -> None:
        """
        Mark activity as failed.
        
        Args:
            error_code: Error code
            error_message: Error message
            duration_ms: Optional duration in milliseconds
        """
        self.status = ActivityStatus.FAILED
        self.error_code = error_code
        self.error_message = error_message
        self.completed_at = datetime.utcnow()
        if duration_ms is not None:
            self.duration_ms = duration_ms
    
    def add_metadata(self, key: str, value: any) -> None:
        """
        Add metadata to the activity.
        
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
    def create_login_activity(
        cls,
        user_id: uuid.UUID,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        session_id: Optional[str] = None,
        **kwargs
    ) -> "UserActivity":
        """
        Create a login activity record.
        
        Args:
            user_id: User ID
            ip_address: IP address
            user_agent: User agent string
            session_id: Session ID
            **kwargs: Additional metadata
            
        Returns:
            UserActivity instance
        """
        return cls(
            user_id=user_id,
            activity_type=ActivityType.AUTHENTICATION,
            activity_name="user_login",
            description="User logged in",
            ip_address=ip_address,
            user_agent=user_agent,
            session_id=session_id,
            metadata=kwargs if kwargs else None
        )
    
    @classmethod
    def create_logout_activity(
        cls,
        user_id: uuid.UUID,
        session_id: Optional[str] = None,
        **kwargs
    ) -> "UserActivity":
        """
        Create a logout activity record.
        
        Args:
            user_id: User ID
            session_id: Session ID
            **kwargs: Additional metadata
            
        Returns:
            UserActivity instance
        """
        return cls(
            user_id=user_id,
            activity_type=ActivityType.AUTHENTICATION,
            activity_name="user_logout",
            description="User logged out",
            session_id=session_id,
            metadata=kwargs if kwargs else None
        )
    
    @classmethod
    def create_profile_update_activity(
        cls,
        user_id: uuid.UUID,
        fields_updated: list,
        **kwargs
    ) -> "UserActivity":
        """
        Create a profile update activity record.
        
        Args:
            user_id: User ID
            fields_updated: List of fields that were updated
            **kwargs: Additional metadata
            
        Returns:
            UserActivity instance
        """
        metadata = {"fields_updated": fields_updated}
        if kwargs:
            metadata.update(kwargs)
        
        return cls(
            user_id=user_id,
            activity_type=ActivityType.PROFILE,
            activity_name="profile_update",
            description=f"Updated profile fields: {', '.join(fields_updated)}",
            resource_type="user_profile",
            resource_id=str(user_id),
            metadata=metadata
        )
    
    @classmethod
    def create_follow_activity(
        cls,
        user_id: uuid.UUID,
        target_user_id: uuid.UUID,
        action: str,  # "follow" or "unfollow"
        **kwargs
    ) -> "UserActivity":
        """
        Create a follow/unfollow activity record.
        
        Args:
            user_id: User ID performing the action
            target_user_id: User ID being followed/unfollowed
            action: "follow" or "unfollow"
            **kwargs: Additional metadata
            
        Returns:
            UserActivity instance
        """
        metadata = {"target_user_id": str(target_user_id), "action": action}
        if kwargs:
            metadata.update(kwargs)
        
        return cls(
            user_id=user_id,
            activity_type=ActivityType.SOCIAL,
            activity_name=f"user_{action}",
            description=f"User {action}ed another user",
            resource_type="user",
            resource_id=str(target_user_id),
            metadata=metadata
        )