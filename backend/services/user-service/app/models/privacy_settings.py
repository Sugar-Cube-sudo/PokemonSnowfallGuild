#!/usr/bin/env python3
"""
Privacy Settings Model

Manages user privacy preferences and visibility settings.
"""

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    ForeignKey,
    String,
    func,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.schemas.enums import PrivacyLevel, ProfileVisibility


class PrivacySettings(Base):
    """
    Privacy settings model for managing user privacy preferences.
    
    This model stores detailed privacy settings that control
    what information is visible to other users and how the user
    can be contacted or found.
    """
    
    __tablename__ = "privacy_settings"
    
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
    
    # Profile visibility settings
    profile_visibility: Mapped[ProfileVisibility] = mapped_column(
        Enum(ProfileVisibility),
        default=ProfileVisibility.PUBLIC,
        nullable=False
    )
    
    show_email: Mapped[PrivacyLevel] = mapped_column(
        Enum(PrivacyLevel),
        default=PrivacyLevel.PRIVATE,
        nullable=False
    )
    
    show_phone: Mapped[PrivacyLevel] = mapped_column(
        Enum(PrivacyLevel),
        default=PrivacyLevel.PRIVATE,
        nullable=False
    )
    
    show_real_name: Mapped[PrivacyLevel] = mapped_column(
        Enum(PrivacyLevel),
        default=PrivacyLevel.FRIENDS,
        nullable=False
    )
    
    show_birth_date: Mapped[PrivacyLevel] = mapped_column(
        Enum(PrivacyLevel),
        default=PrivacyLevel.FRIENDS,
        nullable=False
    )
    
    show_location: Mapped[PrivacyLevel] = mapped_column(
        Enum(PrivacyLevel),
        default=PrivacyLevel.PUBLIC,
        nullable=False
    )
    
    show_last_seen: Mapped[PrivacyLevel] = mapped_column(
        Enum(PrivacyLevel),
        default=PrivacyLevel.FRIENDS,
        nullable=False
    )
    
    show_online_status: Mapped[PrivacyLevel] = mapped_column(
        Enum(PrivacyLevel),
        default=PrivacyLevel.FRIENDS,
        nullable=False
    )
    
    # Activity visibility
    show_activity_status: Mapped[PrivacyLevel] = mapped_column(
        Enum(PrivacyLevel),
        default=PrivacyLevel.FRIENDS,
        nullable=False
    )
    
    show_posts: Mapped[PrivacyLevel] = mapped_column(
        Enum(PrivacyLevel),
        default=PrivacyLevel.PUBLIC,
        nullable=False
    )
    
    show_comments: Mapped[PrivacyLevel] = mapped_column(
        Enum(PrivacyLevel),
        default=PrivacyLevel.PUBLIC,
        nullable=False
    )
    
    show_likes: Mapped[PrivacyLevel] = mapped_column(
        Enum(PrivacyLevel),
        default=PrivacyLevel.FRIENDS,
        nullable=False
    )
    
    show_followers: Mapped[PrivacyLevel] = mapped_column(
        Enum(PrivacyLevel),
        default=PrivacyLevel.PUBLIC,
        nullable=False
    )
    
    show_following: Mapped[PrivacyLevel] = mapped_column(
        Enum(PrivacyLevel),
        default=PrivacyLevel.PUBLIC,
        nullable=False
    )
    
    # Gaming privacy
    show_pokemon_collection: Mapped[PrivacyLevel] = mapped_column(
        Enum(PrivacyLevel),
        default=PrivacyLevel.PUBLIC,
        nullable=False
    )
    
    show_achievements: Mapped[PrivacyLevel] = mapped_column(
        Enum(PrivacyLevel),
        default=PrivacyLevel.PUBLIC,
        nullable=False
    )
    
    show_game_stats: Mapped[PrivacyLevel] = mapped_column(
        Enum(PrivacyLevel),
        default=PrivacyLevel.FRIENDS,
        nullable=False
    )
    
    show_trainer_code: Mapped[PrivacyLevel] = mapped_column(
        Enum(PrivacyLevel),
        default=PrivacyLevel.FRIENDS,
        nullable=False
    )
    
    # Contact and discovery settings
    allow_friend_requests: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False
    )
    
    allow_messages_from_strangers: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False
    )
    
    allow_mentions: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False
    )
    
    allow_tags: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False
    )
    
    discoverable_by_email: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False
    )
    
    discoverable_by_phone: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False
    )
    
    discoverable_by_username: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False
    )
    
    appear_in_search: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False
    )
    
    appear_in_suggestions: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False
    )
    
    # Notification settings
    email_notifications: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False
    )
    
    push_notifications: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False
    )
    
    sms_notifications: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False
    )
    
    # Data and analytics
    allow_analytics: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False
    )
    
    allow_personalization: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False
    )
    
    allow_data_export: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False
    )
    
    # Security settings
    require_approval_for_followers: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False
    )
    
    two_factor_enabled: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False
    )
    
    login_notifications: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False
    )
    
    # Blocked users and content
    blocked_users: Mapped[Optional[list]] = mapped_column(
        JSONB,
        nullable=True,
        comment="List of blocked user IDs"
    )
    
    blocked_keywords: Mapped[Optional[list]] = mapped_column(
        JSONB,
        nullable=True,
        comment="List of blocked keywords"
    )
    
    # Custom privacy rules
    custom_rules: Mapped[Optional[dict]] = mapped_column(
        JSONB,
        nullable=True,
        comment="Custom privacy rules in JSON format"
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
    
    last_privacy_review: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        comment="When user last reviewed privacy settings"
    )
    
    # Relationships
    user: Mapped["User"] = relationship(
        "User",
        back_populates="privacy_settings"
    )
    
    def __repr__(self) -> str:
        return (
            f"<PrivacySettings("
            f"id={self.id}, "
            f"user_id={self.user_id}, "
            f"profile_visibility={self.profile_visibility}"
            f")>"
        )
    
    @property
    def is_private_profile(self) -> bool:
        """Check if the profile is private."""
        return self.profile_visibility == ProfileVisibility.PRIVATE
    
    @property
    def is_public_profile(self) -> bool:
        """Check if the profile is public."""
        return self.profile_visibility == ProfileVisibility.PUBLIC
    
    @property
    def is_friends_only_profile(self) -> bool:
        """Check if the profile is friends-only."""
        return self.profile_visibility == ProfileVisibility.FRIENDS_ONLY
    
    def can_view_field(self, field: str, viewer_relationship: str) -> bool:
        """
        Check if a viewer can see a specific field based on privacy settings.
        
        Args:
            field: Field name to check
            viewer_relationship: Relationship of viewer ('self', 'friend', 'follower', 'stranger')
            
        Returns:
            True if the field can be viewed
        """
        if viewer_relationship == "self":
            return True
        
        # Map field names to privacy settings
        field_privacy_map = {
            "email": self.show_email,
            "phone": self.show_phone,
            "real_name": self.show_real_name,
            "birth_date": self.show_birth_date,
            "location": self.show_location,
            "last_seen": self.show_last_seen,
            "online_status": self.show_online_status,
            "activity_status": self.show_activity_status,
            "posts": self.show_posts,
            "comments": self.show_comments,
            "likes": self.show_likes,
            "followers": self.show_followers,
            "following": self.show_following,
            "pokemon_collection": self.show_pokemon_collection,
            "achievements": self.show_achievements,
            "game_stats": self.show_game_stats,
            "trainer_code": self.show_trainer_code,
        }
        
        privacy_level = field_privacy_map.get(field)
        if privacy_level is None:
            return False
        
        # Check privacy level against viewer relationship
        if privacy_level == PrivacyLevel.PUBLIC:
            return True
        elif privacy_level == PrivacyLevel.FRIENDS and viewer_relationship in ["friend", "follower"]:
            return True
        elif privacy_level == PrivacyLevel.PRIVATE:
            return False
        
        return False
    
    def block_user(self, user_id: str) -> None:
        """
        Block a user.
        
        Args:
            user_id: ID of the user to block
        """
        if self.blocked_users is None:
            self.blocked_users = []
        
        if user_id not in self.blocked_users:
            self.blocked_users.append(user_id)
    
    def unblock_user(self, user_id: str) -> None:
        """
        Unblock a user.
        
        Args:
            user_id: ID of the user to unblock
        """
        if self.blocked_users and user_id in self.blocked_users:
            self.blocked_users.remove(user_id)
    
    def is_user_blocked(self, user_id: str) -> bool:
        """
        Check if a user is blocked.
        
        Args:
            user_id: ID of the user to check
            
        Returns:
            True if the user is blocked
        """
        return self.blocked_users is not None and user_id in self.blocked_users
    
    def add_blocked_keyword(self, keyword: str) -> None:
        """
        Add a blocked keyword.
        
        Args:
            keyword: Keyword to block
        """
        if self.blocked_keywords is None:
            self.blocked_keywords = []
        
        keyword_lower = keyword.lower().strip()
        if keyword_lower not in [k.lower() for k in self.blocked_keywords]:
            self.blocked_keywords.append(keyword_lower)
    
    def remove_blocked_keyword(self, keyword: str) -> None:
        """
        Remove a blocked keyword.
        
        Args:
            keyword: Keyword to unblock
        """
        if self.blocked_keywords:
            keyword_lower = keyword.lower().strip()
            self.blocked_keywords = [
                k for k in self.blocked_keywords 
                if k.lower() != keyword_lower
            ]
    
    def is_keyword_blocked(self, text: str) -> bool:
        """
        Check if text contains blocked keywords.
        
        Args:
            text: Text to check
            
        Returns:
            True if text contains blocked keywords
        """
        if not self.blocked_keywords or not text:
            return False
        
        text_lower = text.lower()
        return any(keyword in text_lower for keyword in self.blocked_keywords)
    
    def set_custom_rule(self, rule_name: str, rule_data: dict) -> None:
        """
        Set a custom privacy rule.
        
        Args:
            rule_name: Name of the rule
            rule_data: Rule configuration
        """
        if self.custom_rules is None:
            self.custom_rules = {}
        
        self.custom_rules[rule_name] = rule_data
    
    def get_custom_rule(self, rule_name: str) -> Optional[dict]:
        """
        Get a custom privacy rule.
        
        Args:
            rule_name: Name of the rule
            
        Returns:
            Rule configuration or None
        """
        if not self.custom_rules:
            return None
        return self.custom_rules.get(rule_name)
    
    def update_privacy_review_timestamp(self) -> None:
        """Update the last privacy review timestamp."""
        self.last_privacy_review = datetime.utcnow()
    
    def get_privacy_summary(self) -> dict:
        """
        Get a summary of privacy settings.
        
        Returns:
            Dictionary with privacy settings summary
        """
        return {
            "profile_visibility": self.profile_visibility.value,
            "requires_approval": self.require_approval_for_followers,
            "allows_friend_requests": self.allow_friend_requests,
            "allows_stranger_messages": self.allow_messages_from_strangers,
            "discoverable": self.appear_in_search,
            "two_factor_enabled": self.two_factor_enabled,
            "blocked_users_count": len(self.blocked_users) if self.blocked_users else 0,
            "blocked_keywords_count": len(self.blocked_keywords) if self.blocked_keywords else 0,
            "last_review": self.last_privacy_review.isoformat() if self.last_privacy_review else None,
        }
    
    @classmethod
    def create_default_settings(cls, user_id: uuid.UUID) -> "PrivacySettings":
        """
        Create default privacy settings for a new user.
        
        Args:
            user_id: User ID
            
        Returns:
            PrivacySettings instance with default values
        """
        return cls(
            user_id=user_id,
            profile_visibility=ProfileVisibility.PUBLIC,
            show_email=PrivacyLevel.PRIVATE,
            show_phone=PrivacyLevel.PRIVATE,
            show_real_name=PrivacyLevel.FRIENDS,
            show_birth_date=PrivacyLevel.FRIENDS,
            show_location=PrivacyLevel.PUBLIC,
            show_last_seen=PrivacyLevel.FRIENDS,
            show_online_status=PrivacyLevel.FRIENDS,
            # Set other defaults as defined in the model
        )