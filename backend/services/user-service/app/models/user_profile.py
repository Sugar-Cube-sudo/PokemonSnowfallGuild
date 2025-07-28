#!/usr/bin/env python3
"""
User Profile Model

Detailed user profile information including bio, preferences, and settings.
"""

import uuid
from datetime import datetime, date
from typing import Optional

from sqlalchemy import (
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.schemas.enums import Gender, Timezone


class UserProfile(Base):
    """
    User profile model containing detailed user information.
    
    This model stores extended user information that is not required
    for basic authentication and authorization.
    """
    
    __tablename__ = "user_profiles"
    
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
    
    # Personal information
    first_name: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True
    )
    
    last_name: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True
    )
    
    bio: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True
    )
    
    location: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True
    )
    
    website: Mapped[Optional[str]] = mapped_column(
        String(200),
        nullable=True
    )
    
    birth_date: Mapped[Optional[date]] = mapped_column(
        Date,
        nullable=True
    )
    
    gender: Mapped[Optional[Gender]] = mapped_column(
        Enum(Gender),
        nullable=True
    )
    
    # Contact information
    phone: Mapped[Optional[str]] = mapped_column(
        String(20),
        nullable=True
    )
    
    # Preferences
    timezone: Mapped[Optional[Timezone]] = mapped_column(
        Enum(Timezone),
        default=Timezone.UTC,
        nullable=True
    )
    
    language: Mapped[Optional[str]] = mapped_column(
        String(10),
        default="en",
        nullable=True
    )
    
    theme: Mapped[Optional[str]] = mapped_column(
        String(20),
        default="light",
        nullable=True
    )
    
    # Social media links
    social_links: Mapped[Optional[dict]] = mapped_column(
        JSONB,
        nullable=True,
        comment="JSON object containing social media links"
    )
    
    # Gaming preferences
    favorite_pokemon: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True
    )
    
    favorite_pokemon_type: Mapped[Optional[str]] = mapped_column(
        String(20),
        nullable=True
    )
    
    pokemon_trainer_code: Mapped[Optional[str]] = mapped_column(
        String(20),
        nullable=True,
        unique=True
    )
    
    gaming_preferences: Mapped[Optional[dict]] = mapped_column(
        JSONB,
        nullable=True,
        comment="JSON object containing gaming preferences"
    )
    
    # Profile customization
    banner_url: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True
    )
    
    profile_color: Mapped[Optional[str]] = mapped_column(
        String(7),  # Hex color code
        nullable=True
    )
    
    custom_fields: Mapped[Optional[dict]] = mapped_column(
        JSONB,
        nullable=True,
        comment="JSON object for custom profile fields"
    )
    
    # Achievements and badges
    achievements: Mapped[Optional[dict]] = mapped_column(
        JSONB,
        nullable=True,
        comment="JSON array of user achievements"
    )
    
    badges: Mapped[Optional[dict]] = mapped_column(
        JSONB,
        nullable=True,
        comment="JSON array of user badges"
    )
    
    # Profile statistics
    profile_views: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False
    )
    
    profile_completion: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
        comment="Profile completion percentage (0-100)"
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
    
    last_profile_update: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )
    
    # Relationships
    user: Mapped["User"] = relationship(
        "User",
        back_populates="profile"
    )
    
    def __repr__(self) -> str:
        return f"<UserProfile(id={self.id}, user_id={self.user_id})>"
    
    @property
    def full_name(self) -> Optional[str]:
        """Get user's full name if available."""
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        elif self.first_name:
            return self.first_name
        elif self.last_name:
            return self.last_name
        return None
    
    @property
    def age(self) -> Optional[int]:
        """Calculate user's age from birth date."""
        if not self.birth_date:
            return None
        
        today = date.today()
        age = today.year - self.birth_date.year
        
        # Adjust if birthday hasn't occurred this year
        if today.month < self.birth_date.month or (
            today.month == self.birth_date.month and today.day < self.birth_date.day
        ):
            age -= 1
        
        return age
    
    @property
    def is_profile_complete(self) -> bool:
        """Check if profile is considered complete."""
        return self.profile_completion >= 80
    
    def calculate_completion_percentage(self) -> int:
        """
        Calculate profile completion percentage.
        
        Returns:
            Completion percentage (0-100)
        """
        total_fields = 15  # Total number of optional fields
        completed_fields = 0
        
        # Check each optional field
        fields_to_check = [
            self.first_name,
            self.last_name,
            self.bio,
            self.location,
            self.website,
            self.birth_date,
            self.gender,
            self.phone,
            self.favorite_pokemon,
            self.favorite_pokemon_type,
            self.pokemon_trainer_code,
            self.banner_url,
            self.profile_color,
            self.social_links,
            self.gaming_preferences,
        ]
        
        for field in fields_to_check:
            if field is not None:
                if isinstance(field, (dict, list)) and field:
                    completed_fields += 1
                elif isinstance(field, str) and field.strip():
                    completed_fields += 1
                elif not isinstance(field, (dict, list, str)):
                    completed_fields += 1
        
        return int((completed_fields / total_fields) * 100)
    
    def update_completion_percentage(self) -> None:
        """Update the profile completion percentage."""
        self.profile_completion = self.calculate_completion_percentage()
        self.last_profile_update = datetime.utcnow()
    
    def increment_profile_views(self) -> None:
        """Increment profile view count."""
        self.profile_views += 1
    
    def add_achievement(self, achievement_id: str, achievement_data: dict) -> None:
        """
        Add an achievement to the user's profile.
        
        Args:
            achievement_id: Unique identifier for the achievement
            achievement_data: Achievement data including name, description, etc.
        """
        if self.achievements is None:
            self.achievements = {}
        
        self.achievements[achievement_id] = {
            **achievement_data,
            "earned_at": datetime.utcnow().isoformat(),
        }
    
    def add_badge(self, badge_id: str, badge_data: dict) -> None:
        """
        Add a badge to the user's profile.
        
        Args:
            badge_id: Unique identifier for the badge
            badge_data: Badge data including name, description, etc.
        """
        if self.badges is None:
            self.badges = {}
        
        self.badges[badge_id] = {
            **badge_data,
            "earned_at": datetime.utcnow().isoformat(),
        }
    
    def get_social_link(self, platform: str) -> Optional[str]:
        """
        Get social media link for a specific platform.
        
        Args:
            platform: Social media platform name
            
        Returns:
            URL for the platform or None if not found
        """
        if not self.social_links:
            return None
        return self.social_links.get(platform)
    
    def set_social_link(self, platform: str, url: str) -> None:
        """
        Set social media link for a specific platform.
        
        Args:
            platform: Social media platform name
            url: URL for the platform
        """
        if self.social_links is None:
            self.social_links = {}
        
        self.social_links[platform] = url
        self.update_completion_percentage()