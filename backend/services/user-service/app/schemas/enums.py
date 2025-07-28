#!/usr/bin/env python3
"""
Enums for User Service

Defines all enumeration types used throughout the user service.
"""

from enum import Enum


class UserRole(str, Enum):
    """User role enumeration."""
    
    USER = "user"
    MODERATOR = "moderator"
    ADMIN = "admin"
    SUPER_ADMIN = "super_admin"


class UserStatus(str, Enum):
    """User status enumeration."""
    
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"
    BANNED = "banned"
    DELETED = "deleted"
    PENDING_VERIFICATION = "pending_verification"


class Gender(str, Enum):
    """Gender enumeration."""
    
    MALE = "male"
    FEMALE = "female"
    NON_BINARY = "non_binary"
    PREFER_NOT_TO_SAY = "prefer_not_to_say"
    OTHER = "other"


class Timezone(str, Enum):
    """Timezone enumeration for common timezones."""
    
    UTC = "UTC"
    US_EASTERN = "US/Eastern"
    US_CENTRAL = "US/Central"
    US_MOUNTAIN = "US/Mountain"
    US_PACIFIC = "US/Pacific"
    EUROPE_LONDON = "Europe/London"
    EUROPE_PARIS = "Europe/Paris"
    EUROPE_BERLIN = "Europe/Berlin"
    ASIA_TOKYO = "Asia/Tokyo"
    ASIA_SHANGHAI = "Asia/Shanghai"
    ASIA_KOLKATA = "Asia/Kolkata"
    AUSTRALIA_SYDNEY = "Australia/Sydney"
    AMERICA_SAO_PAULO = "America/Sao_Paulo"
    AFRICA_CAIRO = "Africa/Cairo"


class ActivityType(str, Enum):
    """User activity type enumeration."""
    
    AUTHENTICATION = "authentication"
    PROFILE = "profile"
    SOCIAL = "social"
    CONTENT = "content"
    GAMING = "gaming"
    SYSTEM = "system"
    MODERATION = "moderation"
    SECURITY = "security"
    API = "api"
    OTHER = "other"


class ActivityStatus(str, Enum):
    """Activity status enumeration."""
    
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class FollowStatus(str, Enum):
    """Follow relationship status enumeration."""
    
    PENDING = "pending"
    ACTIVE = "active"
    BLOCKED = "blocked"
    REJECTED = "rejected"


class PrivacyLevel(str, Enum):
    """Privacy level enumeration."""
    
    PUBLIC = "public"
    FRIENDS = "friends"
    PRIVATE = "private"


class ProfileVisibility(str, Enum):
    """Profile visibility enumeration."""
    
    PUBLIC = "public"
    FRIENDS_ONLY = "friends_only"
    PRIVATE = "private"


class NotificationType(str, Enum):
    """Notification type enumeration."""
    
    FOLLOW_REQUEST = "follow_request"
    FOLLOW_ACCEPTED = "follow_accepted"
    NEW_FOLLOWER = "new_follower"
    MENTION = "mention"
    LIKE = "like"
    COMMENT = "comment"
    MESSAGE = "message"
    SYSTEM = "system"
    SECURITY = "security"
    ACHIEVEMENT = "achievement"
    BADGE = "badge"
    OTHER = "other"


class ContentType(str, Enum):
    """Content type enumeration."""
    
    POST = "post"
    COMMENT = "comment"
    REPLY = "reply"
    MESSAGE = "message"
    PROFILE = "profile"
    IMAGE = "image"
    VIDEO = "video"
    AUDIO = "audio"
    DOCUMENT = "document"
    OTHER = "other"


class ReportReason(str, Enum):
    """Report reason enumeration."""
    
    SPAM = "spam"
    HARASSMENT = "harassment"
    HATE_SPEECH = "hate_speech"
    VIOLENCE = "violence"
    NUDITY = "nudity"
    COPYRIGHT = "copyright"
    MISINFORMATION = "misinformation"
    IMPERSONATION = "impersonation"
    SELF_HARM = "self_harm"
    OTHER = "other"


class ReportStatus(str, Enum):
    """Report status enumeration."""
    
    PENDING = "pending"
    UNDER_REVIEW = "under_review"
    RESOLVED = "resolved"
    DISMISSED = "dismissed"
    ESCALATED = "escalated"


class BadgeType(str, Enum):
    """Badge type enumeration."""
    
    ACHIEVEMENT = "achievement"
    MILESTONE = "milestone"
    SPECIAL = "special"
    SEASONAL = "seasonal"
    COMMUNITY = "community"
    GAMING = "gaming"
    MODERATOR = "moderator"
    VERIFIED = "verified"
    PREMIUM = "premium"
    OTHER = "other"


class AchievementCategory(str, Enum):
    """Achievement category enumeration."""
    
    SOCIAL = "social"
    CONTENT = "content"
    GAMING = "gaming"
    COMMUNITY = "community"
    MILESTONE = "milestone"
    SPECIAL = "special"
    SEASONAL = "seasonal"
    OTHER = "other"


class SortOrder(str, Enum):
    """Sort order enumeration."""
    
    ASC = "asc"
    DESC = "desc"


class SortField(str, Enum):
    """Sort field enumeration for users."""
    
    CREATED_AT = "created_at"
    UPDATED_AT = "updated_at"
    USERNAME = "username"
    DISPLAY_NAME = "display_name"
    EMAIL = "email"
    LAST_LOGIN_AT = "last_login_at"
    FOLLOWERS_COUNT = "followers_count"
    FOLLOWING_COUNT = "following_count"
    REPUTATION_SCORE = "reputation_score"
    LEVEL = "level"


class FilterOperator(str, Enum):
    """Filter operator enumeration."""
    
    EQUALS = "eq"
    NOT_EQUALS = "ne"
    GREATER_THAN = "gt"
    GREATER_THAN_OR_EQUAL = "gte"
    LESS_THAN = "lt"
    LESS_THAN_OR_EQUAL = "lte"
    CONTAINS = "contains"
    STARTS_WITH = "starts_with"
    ENDS_WITH = "ends_with"
    IN = "in"
    NOT_IN = "not_in"
    IS_NULL = "is_null"
    IS_NOT_NULL = "is_not_null"


class CacheKeyType(str, Enum):
    """Cache key type enumeration."""
    
    USER = "user"
    USER_PROFILE = "user_profile"
    USER_STATS = "user_stats"
    USER_ACTIVITIES = "user_activities"
    FOLLOW_RELATIONSHIPS = "follow_relationships"
    PRIVACY_SETTINGS = "privacy_settings"
    USER_SEARCH = "user_search"
    USER_SUGGESTIONS = "user_suggestions"
    SESSION = "session"
    RATE_LIMIT = "rate_limit"
    OTHER = "other"


class LogLevel(str, Enum):
    """Log level enumeration."""
    
    DEBUG = "debug"
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"


class APIVersion(str, Enum):
    """API version enumeration."""
    
    V1 = "v1"
    V2 = "v2"


class ResponseFormat(str, Enum):
    """Response format enumeration."""
    
    JSON = "json"
    XML = "xml"
    CSV = "csv"
    YAML = "yaml"


class FileType(str, Enum):
    """File type enumeration."""
    
    IMAGE = "image"
    VIDEO = "video"
    AUDIO = "audio"
    DOCUMENT = "document"
    ARCHIVE = "archive"
    OTHER = "other"


class ImageFormat(str, Enum):
    """Image format enumeration."""
    
    JPEG = "jpeg"
    PNG = "png"
    GIF = "gif"
    WEBP = "webp"
    SVG = "svg"
    BMP = "bmp"
    TIFF = "tiff"


class VideoFormat(str, Enum):
    """Video format enumeration."""
    
    MP4 = "mp4"
    AVI = "avi"
    MOV = "mov"
    WMV = "wmv"
    FLV = "flv"
    WEBM = "webm"
    MKV = "mkv"


class AudioFormat(str, Enum):
    """Audio format enumeration."""
    
    MP3 = "mp3"
    WAV = "wav"
    FLAC = "flac"
    AAC = "aac"
    OGG = "ogg"
    WMA = "wma"
    M4A = "m4a"