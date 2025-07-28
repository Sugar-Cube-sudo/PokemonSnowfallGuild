#!/usr/bin/env python3
"""
User Stats Model

Tracks user statistics and metrics for analytics and gamification.
"""

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import (
    DateTime,
    ForeignKey,
    Integer,
    func,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class UserStats(Base):
    """
    User statistics model for tracking user metrics and achievements.
    
    This model stores various statistics about user activity and engagement
    for analytics, gamification, and user insights.
    """
    
    __tablename__ = "user_stats"
    
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
        unique=True,
        nullable=False,
        index=True
    )
    
    # Profile statistics
    profile_views: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False
    )
    
    profile_views_today: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False
    )
    
    profile_views_this_week: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False
    )
    
    profile_views_this_month: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False
    )
    
    # Social statistics
    followers_count: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
        index=True
    )
    
    following_count: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False
    )
    
    # Content statistics
    posts_count: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False
    )
    
    comments_count: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False
    )
    
    likes_given: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False
    )
    
    likes_received: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False
    )
    
    # Engagement statistics
    total_reactions: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False
    )
    
    total_shares: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False
    )
    
    total_mentions: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False
    )
    
    # Activity statistics
    login_count: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False
    )
    
    login_streak: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False
    )
    
    max_login_streak: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False
    )
    
    total_time_spent_minutes: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False
    )
    
    # Gaming statistics
    pokemon_caught: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False
    )
    
    battles_won: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False
    )
    
    battles_lost: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False
    )
    
    achievements_unlocked: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False
    )
    
    badges_earned: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False
    )
    
    # Reputation and scoring
    reputation_score: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
        index=True
    )
    
    experience_points: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False
    )
    
    level: Mapped[int] = mapped_column(
        Integer,
        default=1,
        nullable=False
    )
    
    # Moderation statistics
    reports_made: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False
    )
    
    reports_received: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False
    )
    
    warnings_received: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False
    )
    
    # Custom statistics (extensible)
    custom_stats: Mapped[Optional[dict]] = mapped_column(
        JSONB,
        nullable=True,
        comment="Custom statistics in JSON format"
    )
    
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
    
    last_activity_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        index=True
    )
    
    last_login_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )
    
    last_post_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )
    
    # Daily reset timestamps
    daily_stats_reset_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )
    
    weekly_stats_reset_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )
    
    monthly_stats_reset_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )
    
    # Relationships
    user: Mapped["User"] = relationship(
        "User",
        back_populates="stats"
    )
    
    def __repr__(self) -> str:
        return (
            f"<UserStats("
            f"id={self.id}, "
            f"user_id={self.user_id}, "
            f"reputation_score={self.reputation_score}, "
            f"level={self.level}"
            f")>"
        )
    
    @property
    def total_battles(self) -> int:
        """Get total number of battles."""
        return self.battles_won + self.battles_lost
    
    @property
    def win_rate(self) -> float:
        """Calculate battle win rate."""
        total = self.total_battles
        if total == 0:
            return 0.0
        return (self.battles_won / total) * 100
    
    @property
    def engagement_score(self) -> int:
        """Calculate engagement score based on various activities."""
        return (
            self.posts_count * 10 +
            self.comments_count * 5 +
            self.likes_given * 2 +
            self.likes_received * 3 +
            self.total_reactions * 2 +
            self.total_shares * 5
        )
    
    @property
    def is_active_user(self) -> bool:
        """Check if user is considered active."""
        if not self.last_activity_at:
            return False
        
        # Consider user active if they had activity in the last 7 days
        days_since_activity = (datetime.utcnow() - self.last_activity_at).days
        return days_since_activity <= 7
    
    def increment_profile_views(self, count: int = 1) -> None:
        """
        Increment profile view counts.
        
        Args:
            count: Number of views to add
        """
        self.profile_views += count
        self.profile_views_today += count
        self.profile_views_this_week += count
        self.profile_views_this_month += count
    
    def increment_followers(self, count: int = 1) -> None:
        """
        Increment followers count.
        
        Args:
            count: Number of followers to add
        """
        self.followers_count += count
    
    def decrement_followers(self, count: int = 1) -> None:
        """
        Decrement followers count.
        
        Args:
            count: Number of followers to remove
        """
        self.followers_count = max(0, self.followers_count - count)
    
    def increment_following(self, count: int = 1) -> None:
        """
        Increment following count.
        
        Args:
            count: Number of following to add
        """
        self.following_count += count
    
    def decrement_following(self, count: int = 1) -> None:
        """
        Decrement following count.
        
        Args:
            count: Number of following to remove
        """
        self.following_count = max(0, self.following_count - count)
    
    def add_experience_points(self, points: int) -> None:
        """
        Add experience points and update level if necessary.
        
        Args:
            points: Experience points to add
        """
        self.experience_points += points
        
        # Calculate new level (simple formula: level = sqrt(xp / 100))
        import math
        new_level = max(1, int(math.sqrt(self.experience_points / 100)) + 1)
        
        if new_level > self.level:
            self.level = new_level
    
    def update_reputation(self, change: int) -> None:
        """
        Update reputation score.
        
        Args:
            change: Reputation change (can be negative)
        """
        self.reputation_score = max(0, self.reputation_score + change)
    
    def record_login(self) -> None:
        """Record a user login and update login statistics."""
        now = datetime.utcnow()
        
        self.login_count += 1
        self.last_login_at = now
        self.last_activity_at = now
        
        # Update login streak
        if self.last_login_at:
            days_since_last_login = (now - self.last_login_at).days
            if days_since_last_login <= 1:
                self.login_streak += 1
            else:
                self.login_streak = 1
        else:
            self.login_streak = 1
        
        # Update max login streak
        if self.login_streak > self.max_login_streak:
            self.max_login_streak = self.login_streak
    
    def record_post(self) -> None:
        """Record a new post."""
        self.posts_count += 1
        self.last_post_at = datetime.utcnow()
        self.last_activity_at = datetime.utcnow()
        
        # Add experience points for posting
        self.add_experience_points(10)
    
    def record_comment(self) -> None:
        """Record a new comment."""
        self.comments_count += 1
        self.last_activity_at = datetime.utcnow()
        
        # Add experience points for commenting
        self.add_experience_points(5)
    
    def record_like_given(self) -> None:
        """Record a like given by the user."""
        self.likes_given += 1
        self.last_activity_at = datetime.utcnow()
        
        # Add experience points for engaging
        self.add_experience_points(1)
    
    def record_like_received(self) -> None:
        """Record a like received by the user."""
        self.likes_received += 1
        
        # Add experience points for receiving likes
        self.add_experience_points(2)
    
    def get_custom_stat(self, key: str, default: any = None) -> any:
        """
        Get a custom statistic value.
        
        Args:
            key: Statistic key
            default: Default value if key not found
            
        Returns:
            Statistic value or default
        """
        if not self.custom_stats:
            return default
        return self.custom_stats.get(key, default)
    
    def set_custom_stat(self, key: str, value: any) -> None:
        """
        Set a custom statistic value.
        
        Args:
            key: Statistic key
            value: Statistic value
        """
        if self.custom_stats is None:
            self.custom_stats = {}
        
        self.custom_stats[key] = value
    
    def increment_custom_stat(self, key: str, increment: int = 1) -> None:
        """
        Increment a custom statistic value.
        
        Args:
            key: Statistic key
            increment: Amount to increment
        """
        current_value = self.get_custom_stat(key, 0)
        self.set_custom_stat(key, current_value + increment)
    
    def reset_daily_stats(self) -> None:
        """Reset daily statistics."""
        self.profile_views_today = 0
        self.daily_stats_reset_at = datetime.utcnow()
    
    def reset_weekly_stats(self) -> None:
        """Reset weekly statistics."""
        self.profile_views_this_week = 0
        self.weekly_stats_reset_at = datetime.utcnow()
    
    def reset_monthly_stats(self) -> None:
        """Reset monthly statistics."""
        self.profile_views_this_month = 0
        self.monthly_stats_reset_at = datetime.utcnow()