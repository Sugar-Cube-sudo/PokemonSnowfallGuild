#!/usr/bin/env python3
"""
Moderation Log Model

Defines the database model for moderation logs.
"""

from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, Enum, Integer, String, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func
import enum

from app.core.database import Base


class ModerationAction(str, enum.Enum):
    """Moderation action enumeration."""
    APPROVE = "approve"
    REJECT = "reject"
    HIDE = "hide"
    SHOW = "show"
    LOCK = "lock"
    UNLOCK = "unlock"
    PIN = "pin"
    UNPIN = "unpin"
    DELETE = "delete"
    RESTORE = "restore"
    EDIT = "edit"
    MOVE = "move"
    MERGE = "merge"
    SPLIT = "split"
    WARNING = "warning"
    BAN_USER = "ban_user"
    UNBAN_USER = "unban_user"
    FEATURE = "feature"
    UNFEATURE = "unfeature"


class ModerationTarget(str, enum.Enum):
    """Moderation target type enumeration."""
    POST = "post"
    REPLY = "reply"
    USER = "user"
    CATEGORY = "category"
    RENTAL = "rental"


class ModerationSeverity(str, enum.Enum):
    """Moderation severity enumeration."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class ModerationLog(Base):
    """Moderation log model for tracking moderation actions."""
    
    __tablename__ = "moderation_logs"
    
    # Primary key
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    
    # Moderation details
    action: Mapped[ModerationAction] = mapped_column(
        Enum(ModerationAction), 
        nullable=False,
        index=True
    )
    target_type: Mapped[ModerationTarget] = mapped_column(
        Enum(ModerationTarget), 
        nullable=False,
        index=True
    )
    target_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    
    # Moderation metadata
    moderator_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)  # References users.id
    affected_user_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True, index=True)  # References users.id
    
    # Reason and details
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    details: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    severity: Mapped[ModerationSeverity] = mapped_column(
        Enum(ModerationSeverity), 
        default=ModerationSeverity.LOW, 
        nullable=False
    )
    
    # Additional context
    context: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    previous_state: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    new_state: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    
    # System information
    ip_address: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)  # IPv6 support
    user_agent: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        nullable=False,
        index=True
    )
    
    def __repr__(self) -> str:
        return f"<ModerationLog(id={self.id}, action='{self.action}', target_type='{self.target_type}', target_id={self.target_id})>"
    
    def to_dict(self) -> dict:
        """Convert to dictionary."""
        return {
            "id": self.id,
            "action": self.action.value if self.action else None,
            "target_type": self.target_type.value if self.target_type else None,
            "target_id": self.target_id,
            "moderator_id": self.moderator_id,
            "affected_user_id": self.affected_user_id,
            "reason": self.reason,
            "details": self.details,
            "severity": self.severity.value if self.severity else None,
            "context": self.context,
            "previous_state": self.previous_state,
            "new_state": self.new_state,
            "ip_address": self.ip_address,
            "user_agent": self.user_agent,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
    
    @classmethod
    def create_log(
        cls,
        action: ModerationAction,
        target_type: ModerationTarget,
        target_id: int,
        moderator_id: int,
        reason: str,
        affected_user_id: Optional[int] = None,
        details: Optional[str] = None,
        severity: ModerationSeverity = ModerationSeverity.LOW,
        context: Optional[dict] = None,
        previous_state: Optional[dict] = None,
        new_state: Optional[dict] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> "ModerationLog":
        """Create a new moderation log entry."""
        return cls(
            action=action,
            target_type=target_type,
            target_id=target_id,
            moderator_id=moderator_id,
            affected_user_id=affected_user_id,
            reason=reason,
            details=details,
            severity=severity,
            context=context,
            previous_state=previous_state,
            new_state=new_state,
            ip_address=ip_address,
            user_agent=user_agent,
        )