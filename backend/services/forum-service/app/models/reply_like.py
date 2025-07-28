#!/usr/bin/env python3
"""
Reply Like Model

Defines the database model for reply likes.
"""

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.core.database import Base


class ReplyLike(Base):
    """Reply like model."""
    
    __tablename__ = "reply_likes"
    
    # Primary key
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    
    # Foreign keys
    reply_id: Mapped[int] = mapped_column(
        Integer, 
        ForeignKey("forum_replies.id", ondelete="CASCADE"), 
        nullable=False,
        index=True
    )
    user_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)  # References users.id
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        nullable=False
    )
    
    # Relationships
    reply: Mapped["ForumReply"] = relationship(
        "ForumReply", 
        back_populates="likes"
    )
    
    # Constraints
    __table_args__ = (
        UniqueConstraint('reply_id', 'user_id', name='uq_reply_like_user'),
    )
    
    def __repr__(self) -> str:
        return f"<ReplyLike(id={self.id}, reply_id={self.reply_id}, user_id={self.user_id})>"
    
    def to_dict(self) -> dict:
        """Convert to dictionary."""
        return {
            "id": self.id,
            "reply_id": self.reply_id,
            "user_id": self.user_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }