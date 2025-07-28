package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// User 用户模型
type User struct {
	ID                uuid.UUID      `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	Username          string         `json:"username" gorm:"uniqueIndex;not null;size:50"`
	Email             string         `json:"email" gorm:"uniqueIndex;not null;size:255"`
	PasswordHash      string         `json:"-" gorm:"not null;size:255"`
	Salt              string         `json:"-" gorm:"not null;size:32"`
	EmailVerified     bool           `json:"emailVerified" gorm:"default:false"`
	EmailVerifiedAt   *time.Time     `json:"emailVerifiedAt"`
	PhoneNumber       *string        `json:"phoneNumber" gorm:"size:20"`
	PhoneVerified     bool           `json:"phoneVerified" gorm:"default:false"`
	PhoneVerifiedAt   *time.Time     `json:"phoneVerifiedAt"`
	TwoFactorEnabled  bool           `json:"twoFactorEnabled" gorm:"default:false"`
	TwoFactorSecret   *string        `json:"-" gorm:"size:32"`
	BackupCodes       []string       `json:"-" gorm:"type:text[]"`
	Role              string         `json:"role" gorm:"not null;default:'user';size:20"`
	Status            string         `json:"status" gorm:"not null;default:'active';size:20"`
	LastLoginAt       *time.Time     `json:"lastLoginAt"`
	LastLoginIP       *string        `json:"lastLoginIP" gorm:"size:45"`
	FailedLoginCount  int            `json:"failedLoginCount" gorm:"default:0"`
	LockedUntil       *time.Time     `json:"lockedUntil"`
	PasswordChangedAt time.Time      `json:"passwordChangedAt" gorm:"default:CURRENT_TIMESTAMP"`
	CreatedAt         time.Time      `json:"createdAt"`
	UpdatedAt         time.Time      `json:"updatedAt"`
	DeletedAt         gorm.DeletedAt `json:"deletedAt" gorm:"index"`

	// 关联
	Sessions        []Session         `json:"-" gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE"`
	PasswordHistory []PasswordHistory `json:"-" gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE"`
	AuditLogs       []AuditLog        `json:"-" gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE"`
	OAuthAccounts   []OAuthAccount    `json:"-" gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE"`
}

// BeforeCreate GORM钩子
func (u *User) BeforeCreate(tx *gorm.DB) error {
	if u.ID == uuid.Nil {
		u.ID = uuid.New()
	}
	return nil
}

// Session 会话模型
type Session struct {
	ID           uuid.UUID      `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	UserID       uuid.UUID      `json:"userId" gorm:"type:uuid;not null;index"`
	TokenHash    string         `json:"-" gorm:"uniqueIndex;not null;size:255"`
	RefreshToken string         `json:"-" gorm:"uniqueIndex;not null;size:255"`
	DeviceInfo   string         `json:"deviceInfo" gorm:"size:500"`
	DeviceID     string         `json:"deviceId" gorm:"size:255;index"`
	UserAgent    string         `json:"userAgent" gorm:"size:500"`
	IPAddress    string         `json:"ipAddress" gorm:"size:45"`
	Location     *string        `json:"location" gorm:"size:100"`
	IsActive     bool           `json:"isActive" gorm:"default:true"`
	IsRevoked    bool           `json:"isRevoked" gorm:"default:false"`
	LastUsedAt   time.Time      `json:"lastUsedAt" gorm:"default:CURRENT_TIMESTAMP"`
	ExpiresAt    time.Time      `json:"expiresAt" gorm:"not null;index"`
	CreatedAt    time.Time      `json:"createdAt"`
	UpdatedAt    time.Time      `json:"updatedAt"`
	DeletedAt    gorm.DeletedAt `json:"deletedAt" gorm:"index"`

	// 关联
	User User `json:"user" gorm:"foreignKey:UserID"`
}

// BeforeCreate GORM钩子
func (s *Session) BeforeCreate(tx *gorm.DB) error {
	if s.ID == uuid.Nil {
		s.ID = uuid.New()
	}
	return nil
}

// PasswordHistory 密码历史模型
type PasswordHistory struct {
	ID           uuid.UUID      `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	UserID       uuid.UUID      `json:"userId" gorm:"type:uuid;not null;index"`
	PasswordHash string         `json:"-" gorm:"not null;size:255"`
	Salt         string         `json:"-" gorm:"not null;size:32"`
	CreatedAt    time.Time      `json:"createdAt"`
	DeletedAt    gorm.DeletedAt `json:"deletedAt" gorm:"index"`

	// 关联
	User User `json:"user" gorm:"foreignKey:UserID"`
}

// BeforeCreate GORM钩子
func (ph *PasswordHistory) BeforeCreate(tx *gorm.DB) error {
	if ph.ID == uuid.Nil {
		ph.ID = uuid.New()
	}
	return nil
}

// EmailVerification 邮箱验证模型
type EmailVerification struct {
	ID        uuid.UUID      `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	UserID    *uuid.UUID     `json:"userId" gorm:"type:uuid;index"`
	Email     string         `json:"email" gorm:"not null;size:255;index"`
	Token     string         `json:"-" gorm:"uniqueIndex;not null;size:255"`
	Type      string         `json:"type" gorm:"not null;size:20"` // verification, password_reset
	Used      bool           `json:"used" gorm:"default:false"`
	Attempts  int            `json:"attempts" gorm:"default:0"`
	ExpiresAt time.Time      `json:"expiresAt" gorm:"not null;index"`
	CreatedAt time.Time      `json:"createdAt"`
	UpdatedAt time.Time      `json:"updatedAt"`
	UsedAt    *time.Time     `json:"usedAt"`
	DeletedAt gorm.DeletedAt `json:"deletedAt" gorm:"index"`

	// 关联
	User *User `json:"user" gorm:"foreignKey:UserID"`
}

// BeforeCreate GORM钩子
func (ev *EmailVerification) BeforeCreate(tx *gorm.DB) error {
	if ev.ID == uuid.Nil {
		ev.ID = uuid.New()
	}
	return nil
}

// SMSVerification 短信验证模型
type SMSVerification struct {
	ID          uuid.UUID      `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	UserID      *uuid.UUID     `json:"userId" gorm:"type:uuid;index"`
	PhoneNumber string         `json:"phoneNumber" gorm:"not null;size:20;index"`
	Token       string         `json:"-" gorm:"uniqueIndex;not null;size:255"`
	Code        string         `json:"-" gorm:"not null;size:10"`
	Type        string         `json:"type" gorm:"not null;size:20"` // verification, password_reset, login
	Used        bool           `json:"used" gorm:"default:false"`
	Attempts    int            `json:"attempts" gorm:"default:0"`
	ExpiresAt   time.Time      `json:"expiresAt" gorm:"not null;index"`
	CreatedAt   time.Time      `json:"createdAt"`
	UpdatedAt   time.Time      `json:"updatedAt"`
	UsedAt      *time.Time     `json:"usedAt"`
	DeletedAt   gorm.DeletedAt `json:"deletedAt" gorm:"index"`

	// 关联
	User *User `json:"user" gorm:"foreignKey:UserID"`
}

// BeforeCreate GORM钩子
func (sv *SMSVerification) BeforeCreate(tx *gorm.DB) error {
	if sv.ID == uuid.Nil {
		sv.ID = uuid.New()
	}
	return nil
}

// OAuthAccount OAuth账户模型
type OAuthAccount struct {
	ID           uuid.UUID      `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	UserID       uuid.UUID      `json:"userId" gorm:"type:uuid;not null;index"`
	Provider     string         `json:"provider" gorm:"not null;size:20;index"`
	ProviderID   string         `json:"providerId" gorm:"not null;size:100"`
	Email        string         `json:"email" gorm:"size:255"`
	Name         string         `json:"name" gorm:"size:100"`
	Avatar       *string        `json:"avatar" gorm:"size:500"`
	AccessToken  *string        `json:"-" gorm:"type:text"`
	RefreshToken *string        `json:"-" gorm:"type:text"`
	ExpiresAt    *time.Time     `json:"expiresAt"`
	Scope        *string        `json:"scope" gorm:"size:500"`
	RawData      *string        `json:"-" gorm:"type:text"`
	CreatedAt    time.Time      `json:"createdAt"`
	UpdatedAt    time.Time      `json:"updatedAt"`
	DeletedAt    gorm.DeletedAt `json:"deletedAt" gorm:"index"`

	// 关联
	User User `json:"user" gorm:"foreignKey:UserID"`
}

// BeforeCreate GORM钩子
func (oa *OAuthAccount) BeforeCreate(tx *gorm.DB) error {
	if oa.ID == uuid.Nil {
		oa.ID = uuid.New()
	}
	return nil
}

// AuditLog 审计日志模型
type AuditLog struct {
	ID         uuid.UUID      `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	UserID     *uuid.UUID     `json:"userId" gorm:"type:uuid;index"`
	Action     string         `json:"action" gorm:"not null;size:50;index"`
	Resource   string         `json:"resource" gorm:"not null;size:50;index"`
	ResourceID *string        `json:"resourceId" gorm:"size:255;index"`
	Details    *string        `json:"details" gorm:"type:text"`
	IPAddress  string         `json:"ipAddress" gorm:"size:45"`
	UserAgent  string         `json:"userAgent" gorm:"size:500"`
	Success    bool           `json:"success" gorm:"default:true;index"`
	ErrorMsg   *string        `json:"errorMsg" gorm:"size:500"`
	CreatedAt  time.Time      `json:"createdAt" gorm:"index"`
	DeletedAt  gorm.DeletedAt `json:"deletedAt" gorm:"index"`

	// 关联
	User *User `json:"user" gorm:"foreignKey:UserID"`
}

// BeforeCreate GORM钩子
func (al *AuditLog) BeforeCreate(tx *gorm.DB) error {
	if al.ID == uuid.Nil {
		al.ID = uuid.New()
	}
	return nil
}

// RateLimitRecord 限流记录模型
type RateLimitRecord struct {
	ID        uuid.UUID      `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	Key       string         `json:"key" gorm:"uniqueIndex;not null;size:255"`
	IPAddress string         `json:"ipAddress" gorm:"index;size:45"`
	UserID    string         `json:"userId" gorm:"index;size:255"`
	Count     int            `json:"count" gorm:"default:1"`
	ExpiresAt time.Time      `json:"expiresAt" gorm:"not null;index"`
	WindowEnd time.Time      `json:"windowEnd" gorm:"not null;index"`
	CreatedAt time.Time      `json:"createdAt"`
	UpdatedAt time.Time      `json:"updatedAt"`
	DeletedAt gorm.DeletedAt `json:"deletedAt" gorm:"index"`
}

// BeforeCreate GORM钩子
func (rlr *RateLimitRecord) BeforeCreate(tx *gorm.DB) error {
	if rlr.ID == uuid.Nil {
		rlr.ID = uuid.New()
	}
	return nil
}

// TokenBlacklist 令牌黑名单模型
type TokenBlacklist struct {
	ID        uuid.UUID      `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	TokenHash string         `json:"-" gorm:"uniqueIndex;not null;size:255"`
	JTI       string         `json:"jti" gorm:"index;size:255"`
	UserID    string         `json:"userId" gorm:"index;size:255"`
	TokenType string         `json:"tokenType" gorm:"size:50"`
	Reason    string         `json:"reason" gorm:"size:100"`
	ExpiresAt time.Time      `json:"expiresAt" gorm:"not null;index"`
	CreatedAt time.Time      `json:"createdAt"`
	UpdatedAt time.Time      `json:"updatedAt"`
	DeletedAt gorm.DeletedAt `json:"deletedAt" gorm:"index"`

	// 关联
	User *User `json:"user" gorm:"foreignKey:UserID"`
}

// BeforeCreate GORM钩子
func (tb *TokenBlacklist) BeforeCreate(tx *gorm.DB) error {
	if tb.ID == uuid.Nil {
		tb.ID = uuid.New()
	}
	return nil
}

// 用户状态常量
const (
	UserStatusActive    = "active"
	UserStatusInactive  = "inactive"
	UserStatusSuspended = "suspended"
	UserStatusBanned    = "banned"
	UserStatusPending   = "pending"
)

// 用户角色常量
const (
	UserRoleUser      = "user"
	UserRoleModerator = "moderator"
	UserRoleAdmin     = "admin"
	UserRoleSuper     = "super"
)

// 验证类型常量
const (
	VerificationTypeEmail         = "email_verification"
	VerificationTypePasswordReset = "password_reset"
	VerificationTypePhoneLogin    = "phone_login"
	VerificationTypePhoneVerify   = "phone_verification"
)

// OAuth提供商常量
const (
	OAuthProviderGoogle  = "google"
	OAuthProviderGitHub  = "github"
	OAuthProviderDiscord = "discord"
)

// 审计动作常量
const (
	AuditActionLogin            = "login"
	AuditActionLogout           = "logout"
	AuditActionRegister         = "register"
	AuditActionPasswordChange   = "password_change"
	AuditActionPasswordReset    = "password_reset"
	AuditActionEmailVerify      = "email_verify"
	AuditActionPhoneVerify      = "phone_verify"
	AuditActionTwoFactorEnable  = "two_factor_enable"
	AuditActionTwoFactorDisable = "two_factor_disable"
	AuditActionOAuthLink        = "oauth_link"
	AuditActionOAuthUnlink      = "oauth_unlink"
	AuditActionSessionRevoke    = "session_revoke"
	AuditActionAccountSuspend   = "account_suspend"
	AuditActionAccountActivate  = "account_activate"
)

// 审计资源常量
const (
	AuditResourceUser    = "user"
	AuditResourceSession = "session"
	AuditResourceAuth    = "auth"
	AuditResourceOAuth   = "oauth"
)

// 类型别名
type (
	UserStatus            = string
	UserRole              = string
	VerificationType      = string
	EmailVerificationType = string
	SMSVerificationType   = string
	OAuthProvider         = string
	AuditAction           = string
	AuditResource         = string
)
