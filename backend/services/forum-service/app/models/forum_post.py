#!/usr/bin/env python3
"""
Forum Post Model

Defines the database model for forum posts.
"""

from datetime import datetime
from typing import List, Optional

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, String, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
import enum

from app.core.database import Base


class PostType(str, enum.Enum):
    """Post type enumeration."""
    DISCUSSION = "discussion"
    QUESTION = "question"
    ANNOUNCEMENT = "announcement"
    GUIDE = "guide"
    RENTAL = "rental"
    TRADE = "trade"
    SHOWCASE = "showcase"
    EVENT = "event"


class PostStatus(str, enum.Enum):
    """Post status enumeration."""
    DRAFT = "draft"
    PUBLISHED = "published"
    HIDDEN = "hidden"
    LOCKED = "locked"
    DELETED = "deleted"
    PENDING_REVIEW = "pending_review"


class RentalStatus(str, enum.Enum):
    """Rental status enumeration."""
    AVAILABLE = "available"
    RENTED = "rented"
    UNAVAILABLE = "unavailable"
    COMPLETED = "completed"


class ForumPost(Base):
    """Forum post model."""
    
    __tablename__ = "forum_posts"
    
    # Primary key
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    
    # Foreign keys
    category_id: Mapped[int] = mapped_column(
        Integer, 
        ForeignKey("forum_categories.id", ondelete="CASCADE"), 
        nullable=False,
        index=True
    )
    author_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)  # References users.id
    
    # Basic information
    title: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    summary: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    
    # Post metadata
    post_type: Mapped[PostType] = mapped_column(
        Enum(PostType), 
        default=PostType.DISCUSSION, 
        nullable=False,
        index=True
    )
    status: Mapped[PostStatus] = mapped_column(
        Enum(PostStatus), 
        default=PostStatus.PUBLISHED, 
        nullable=False,
        index=True
    )
    
    # Post attributes
    is_pinned: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_locked: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    allow_replies: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    
    # Statistics
    view_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    like_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    reply_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    
    # Content metadata
    tags: Mapped[Optional[List[str]]] = mapped_column(JSON, nullable=True)
    attachments: Mapped[Optional[List[dict]]] = mapped_column(JSON, nullable=True)
    
    # Rental information (for rental posts)
    rental_info: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    rental_status: Mapped[Optional[RentalStatus]] = mapped_column(
        Enum(RentalStatus), 
        nullable=True,
        index=True
    )
    
    # SEO and search
    slug: Mapped[Optional[str]] = mapped_column(String(250), nullable=True, unique=True, index=True)
    search_vector: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # For full-text search
    
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
    published_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), 
        nullable=True,
        index=True
    )
    last_activity_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        nullable=False,
        index=True
    )
    
    # Relationships
    category: Mapped["ForumCategory"] = relationship(
        "ForumCategory", 
        back_populates="posts"
    )
    replies: Mapped[List["ForumReply"]] = relationship(
        "ForumReply", 
        back_populates="post",
        cascade="all, delete-orphan",
        order_by="ForumReply.created_at"
    )
    likes: Mapped[List["PostLike"]] = relationship(
        "PostLike", 
        back_populates="post",
        cascade="all, delete-orphan"
    )
    post_tags: Mapped[List["PostTag"]] = relationship(
        "PostTag", 
        back_populates="post",
        cascade="all, delete-orphan"
    )
    rental_info: Mapped[Optional["RentalInfo"]] = relationship(
        "RentalInfo", 
        back_populates="post",
        cascade="all, delete-orphan",
        uselist=False
    )
    
    def __repr__(self) -> str:
        return f"<ForumPost(id={self.id}, title='{self.title[:50]}...', author_id={self.author_id})>"
    
    def to_dict(self, include_content: bool = True, include_replies: bool = False) -> dict:
        """Convert to dictionary."""
        data = {
            "id": self.id,
            "category_id": self.category_id,
            "author_id": self.author_id,
            "title": self.title,
            "summary": self.summary,
            "post_type": self.post_type.value if self.post_type else None,
            "status": self.status.value if self.status else None,
            "is_pinned": self.is_pinned,
            "is_locked": self.is_locked,
            "is_featured": self.is_featured,
            "allow_replies": self.allow_replies,
            "view_count": self.view_count,
            "like_count": self.like_count,
            "reply_count": self.reply_count,
            "tags": self.tags,
            "attachments": self.attachments,
            "rental_info": self.rental_info,
            "rental_status": self.rental_status.value if self.rental_status else None,
            "slug": self.slug,
            "moderation_status": self.moderation_status,
            "moderation_reason": self.moderation_reason,
            "moderated_by": self.moderated_by,
            "moderated_at": self.moderated_at.isoformat() if self.moderated_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "published_at": self.published_at.isoformat() if self.published_at else None,
            "last_activity_at": self.last_activity_at.isoformat() if self.last_activity_at else None,
        }
        
        if include_content:
            data["content"] = self.content
        
        if include_replies and self.replies:
            data["replies"] = [reply.to_dict() for reply in self.replies]
        
        return data
    
    def is_rental_post(self) -> bool:
        """Check if this is a rental post."""
        return self.post_type == PostType.RENTAL and self.rental_info is not None
    
    def can_be_replied_to(self) -> bool:
        """Check if post can receive replies."""
        return (
            self.allow_replies and 
            not self.is_locked and 
            self.status == PostStatus.PUBLISHED
        )
    
    def is_visible_to_public(self) -> bool:
        """Check if post is visible to public."""
        return self.status == PostStatus.PUBLISHED and not self.moderation_status