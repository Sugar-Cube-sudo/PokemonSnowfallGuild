"""Schemas package for user service."""

from .enums import (
    ActivityStatus,
    ActivityType,
    FollowStatus,
    Gender,
    PrivacyLevel,
    ProfileVisibility,
    Timezone,
    UserRole,
    UserStatus,
)
from .user import (
    UserCreate,
    UserResponse,
    UserUpdate,
)
from .user_profile import (
    UserProfileCreate,
    UserProfileResponse,
    UserProfileUpdate,
)
from .user_activity import (
    UserActivityCreate,
    UserActivityResponse,
)
from .user_stats import (
    UserStatsResponse,
)
from .follow_relationship import (
    FollowRelationshipCreate,
    FollowRelationshipResponse,
)
from .privacy_settings import (
    PrivacySettingsResponse,
    PrivacySettingsUpdate,
)

__all__ = [
    # Enums
    "ActivityStatus",
    "ActivityType",
    "FollowStatus",
    "Gender",
    "PrivacyLevel",
    "ProfileVisibility",
    "Timezone",
    "UserRole",
    "UserStatus",
    # User schemas
    "UserCreate",
    "UserResponse",
    "UserUpdate",
    # User profile schemas
    "UserProfileCreate",
    "UserProfileResponse",
    "UserProfileUpdate",
    # User activity schemas
    "UserActivityCreate",
    "UserActivityResponse",
    # User stats schemas
    "UserStatsResponse",
    # Follow relationship schemas
    "FollowRelationshipCreate",
    "FollowRelationshipResponse",
    # Privacy settings schemas
    "PrivacySettingsResponse",
    "PrivacySettingsUpdate",
]