#!/usr/bin/env python3
"""
Forum Reply Model

Defines the database model for forum replies.
"""

from datetime import datetime
from typing import List, Optional

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, String, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
import enum

from app.core.database import Base


class ReplyStatus(str, enum.Enum):
    """Reply status enumeration."""
    PUBLISHED = "published"
    HIDDEN = "hidden"
    DELETED = "deleted"
    PENDING_REVIEW = "pending_review"


class ForumReply(Base):
    """Forum reply model."""
    
    __tablename__ = "forum_replies"
    
    # Primary key
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    
    # Foreign keys
    post_id: Mapped[int] = mapped_column(
        Integer, 
        ForeignKey("forum_posts.id", ondelete="CASCADE"), 
        nullable=False,
        index=True
    )
    author_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)  # References users.id
    parent_reply_id: Mapped[Optional[int]] = mapped_column(
        Integer, 
        ForeignKey("forum_replies.id", ondelete="CASCADE"), 
        nullable=True,
        index=True
    )
    
    # Basic information
    content: Mapped[str] = mapped_column(Text, nullable=False)
    
    # Reply metadata
    status: Mapped[ReplyStatus] = mapped_column(
        Enum(ReplyStatus), 
        default=ReplyStatus.PUBLISHED, 
        nullable=False,
        index=True
    )
    
    # Statistics
    like_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    reply_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)  # Number of child replies
    
    # Content metadata
    attachments: Mapped[Optional[List[dict]]] = mapped_column(JSON, nullable=True)
    mentions: Mapped[Optional[List[int]]] = mapped_column(JSON, nullable=True)  # User IDs mentioned
    
    # Rental response (for rental posts)
    rental_response: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    
    # Threading information
    depth: Mapped[int] = mapped_column(Integer, default=0, nullable=False)  # Nesting depth
    path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True, index=True)  # Materialized path
    
    # Moderation
    moderation_status: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    moderation_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    moderated_by: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # References users.id
    moderated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
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
    
    # Relationships
    post: Mapped["ForumPost"] = relationship(
        "ForumPost", 
        back_populates="replies"
    )
    parent_reply: Mapped[Optional["ForumReply"]] = relationship(
        "ForumReply", 
        remote_side=[id],
        back_populates="child_replies"
    )
    child_replies: Mapped[List["ForumReply"]] = relationship(
        "ForumReply", 
        back_populates="parent_reply",
        cascade="all, delete-orphan",
        order_by="ForumReply.created_at"
    )
    likes: Mapped[List["ReplyLike"]] = relationship(
        "ReplyLike", 
        back_populates="reply",
        cascade="all, delete-orphan"
    )
    
    def __repr__(self) -> str:
        return f"<ForumReply(id={self.id}, post_id={self.post_id}, author_id={self.author_id})>"
    
    def to_dict(self, include_children: bool = False, max_depth: int = 3) -> dict:
        """Convert to dictionary."""
        data = {
            "id": self.id,
            "post_id": self.post_id,
            "author_id": self.author_id,
            "parent_reply_id": self.parent_reply_id,
            "content": self.content,
            "status": self.status.value if self.status else None,
            "like_count": self.like_count,
            "reply_count": self.reply_count,
            "attachments": self.attachments,
            "mentions": self.mentions,
            "rental_response": self.rental_response,
            "depth": self.depth,
            "path": self.path,
            "moderation_status": self.moderation_status,
            "moderation_reason": self.moderation_reason,
            "moderated_by": self.moderated_by,
            "moderated_at": self.moderated_at.isoformat() if self.moderated_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
        
        if include_children and self.child_replies and self.depth < max_depth:
            data["child_replies"] = [
                reply.to_dict(include_children=True, max_depth=max_depth) 
                for reply in self.child_replies
            ]
        
        return data
    
    def is_top_level(self) -> bool:
        """Check if this is a top-level reply (direct reply to post)."""
        return self.parent_reply_id is None
    
    def is_visible_to_public(self) -> bool:
        """Check if reply is visible to public."""
        return self.status == ReplyStatus.PUBLISHED and not self.moderation_status
    
    def get_root_reply(self) -> "ForumReply":
        """Get the root reply in the thread."""
        if self.is_top_level():
            return self
        return self.parent_reply.get_root_reply()
    
    def update_path(self) -> None:
        """Update the materialized path for threading."""
        if self.parent_reply_id is None:
            self.path = str(self.id)
            self.depth = 0
        else:
            parent_path = self.parent_reply.path or str(self.parent_reply.id)
            self.path = f"{parent_path}.{self.id}"
            self.depth = self.parent_reply.depth + 1