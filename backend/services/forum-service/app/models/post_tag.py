#!/usr/bin/env python3
"""
Post Tag Model

Defines the database model for post tags.
"""

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.core.database import Base


class PostTag(Base):
    """Post tag model for many-to-many relationship between posts and tags."""
    
    __tablename__ = "post_tags"
    
    # Primary key
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    
    # Foreign keys
    post_id: Mapped[int] = mapped_column(
        Integer, 
        ForeignKey("forum_posts.id", ondelete="CASCADE"), 
        nullable=False,
        index=True
    )
    
    # Tag information
    tag_name: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    tag_color: Mapped[str] = mapped_column(String(7), nullable=True)  # Hex color code
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        nullable=False
    )
    
    # Relationships
    post: Mapped["ForumPost"] = relationship(
        "ForumPost", 
        back_populates="post_tags"
    )
    
    # Constraints
    __table_args__ = (
        UniqueConstraint('post_id', 'tag_name', name='uq_post_tag'),
    )
    
    def __repr__(self) -> str:
        return f"<PostTag(id={self.id}, post_id={self.post_id}, tag_name='{self.tag_name}')>"
    
    def to_dict(self) -> dict:
        """Convert to dictionary."""
        return {
            "id": self.id,
            "post_id": self.post_id,
            "tag_name": self.tag_name,
            "tag_color": self.tag_color,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }