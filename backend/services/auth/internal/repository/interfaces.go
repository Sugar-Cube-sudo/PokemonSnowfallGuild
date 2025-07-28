package repository

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/snowfall-guild/backend/services/auth/internal/models"
)

// 错误定义
var (
	ErrUserNotFound              = errors.New("user not found")
	ErrSessionNotFound           = errors.New("session not found")
	ErrEmailVerificationNotFound = errors.New("email verification not found")
	ErrSMSVerificationNotFound   = errors.New("sms verification not found")
	ErrOAuthAccountNotFound      = errors.New("oauth account not found")
	ErrAuditLogNotFound          = errors.New("audit log not found")
	ErrRateLimitRecordNotFound   = errors.New("rate limit record not found")
	ErrTokenBlacklistNotFound    = errors.New("token blacklist not found")
)

// UserRepository 用户仓储接口
type UserRepository interface {
	// 基本CRUD操作
	Create(ctx context.Context, user *models.User) error
	GetByID(ctx context.Context, id uuid.UUID) (*models.User, error)
	GetByEmail(ctx context.Context, email string) (*models.User, error)
	GetByUsername(ctx context.Context, username string) (*models.User, error)
	Update(ctx context.Context, user *models.User) error
	Delete(ctx context.Context, id uuid.UUID) error

	// 查询操作
	ExistsByEmail(ctx context.Context, email string) (bool, error)
	ExistsByUsername(ctx context.Context, username string) (bool, error)
	List(ctx context.Context, offset, limit int, filters map[string]interface{}) ([]*models.User, int64, error)
	Search(ctx context.Context, query string, offset, limit int) ([]*models.User, int64, error)

	// 状态操作
	UpdateStatus(ctx context.Context, id uuid.UUID, status string) error
	UpdateEmailVerified(ctx context.Context, id uuid.UUID, verified bool) error
	UpdatePhoneVerified(ctx context.Context, id uuid.UUID, verified bool) error
	UpdateTwoFactorEnabled(ctx context.Context, id uuid.UUID, enabled bool) error
	UpdateLastLoginAt(ctx context.Context, id uuid.UUID, lastLoginAt time.Time) error

	// 密码操作
	UpdatePassword(ctx context.Context, id uuid.UUID, passwordHash string) error
	GetPasswordHistory(ctx context.Context, userID uuid.UUID, limit int) ([]*models.PasswordHistory, error)
	AddPasswordHistory(ctx context.Context, history *models.PasswordHistory) error

	// 统计操作
	GetUserCount(ctx context.Context) (int64, error)
	GetActiveUserCount(ctx context.Context, since time.Time) (int64, error)
	GetUsersByRole(ctx context.Context, role string) ([]*models.User, error)
}

// SessionRepository 会话仓储接口
type SessionRepository interface {
	// 基本CRUD操作
	Create(ctx context.Context, session *models.Session) error
	GetByID(ctx context.Context, id uuid.UUID) (*models.Session, error)
	GetByToken(ctx context.Context, token string) (*models.Session, error)
	Update(ctx context.Context, session *models.Session) error
	Delete(ctx context.Context, id uuid.UUID) error

	// 用户会话操作
	GetUserSessions(ctx context.Context, userID uuid.UUID) ([]*models.Session, error)
	GetActiveUserSessions(ctx context.Context, userID uuid.UUID) ([]*models.Session, error)
	DeleteUserSessions(ctx context.Context, userID uuid.UUID) error
	DeleteUserSessionsExcept(ctx context.Context, userID uuid.UUID, exceptSessionID uuid.UUID) error

	// 状态操作
	UpdateLastUsedAt(ctx context.Context, id uuid.UUID, lastUsedAt time.Time) error
	DeactivateSession(ctx context.Context, id uuid.UUID) error
	DeactivateExpiredSessions(ctx context.Context) error

	// 清理操作
	CleanupExpiredSessions(ctx context.Context) error
	GetExpiredSessions(ctx context.Context) ([]*models.Session, error)

	// 统计操作
	GetActiveSessionCount(ctx context.Context) (int64, error)
	GetUserSessionCount(ctx context.Context, userID uuid.UUID) (int64, error)
}

// EmailVerificationRepository 邮箱验证仓储接口
type EmailVerificationRepository interface {
	// 基本CRUD操作
	Create(ctx context.Context, verification *models.EmailVerification) error
	GetByToken(ctx context.Context, token string) (*models.EmailVerification, error)
	GetByUserID(ctx context.Context, userID uuid.UUID) (*models.EmailVerification, error)
	Update(ctx context.Context, verification *models.EmailVerification) error
	Delete(ctx context.Context, id uuid.UUID) error

	// 状态操作
	MarkAsUsed(ctx context.Context, id uuid.UUID) error
	DeleteByUserID(ctx context.Context, userID uuid.UUID) error

	// 清理操作
	CleanupExpired(ctx context.Context) error
	GetExpired(ctx context.Context) ([]*models.EmailVerification, error)

	// 限制操作
	GetRecentAttempts(ctx context.Context, userID uuid.UUID, since time.Time) (int64, error)
}

// SMSVerificationRepository 短信验证仓储接口
type SMSVerificationRepository interface {
	// 基本CRUD操作
	Create(ctx context.Context, verification *models.SMSVerification) error
	GetByPhoneAndCode(ctx context.Context, phoneNumber, code string) (*models.SMSVerification, error)
	GetByUserID(ctx context.Context, userID uuid.UUID) (*models.SMSVerification, error)
	Update(ctx context.Context, verification *models.SMSVerification) error
	Delete(ctx context.Context, id uuid.UUID) error

	// 状态操作
	MarkAsUsed(ctx context.Context, id uuid.UUID) error
	DeleteByUserID(ctx context.Context, userID uuid.UUID) error

	// 清理操作
	CleanupExpired(ctx context.Context) error
	GetExpired(ctx context.Context) ([]*models.SMSVerification, error)

	// 限制操作
	GetRecentAttempts(ctx context.Context, phoneNumber string, since time.Time) (int64, error)
}

// OAuthAccountRepository OAuth账户仓储接口
type OAuthAccountRepository interface {
	// 基本CRUD操作
	Create(ctx context.Context, account *models.OAuthAccount) error
	GetByProviderAndID(ctx context.Context, provider, providerID string) (*models.OAuthAccount, error)
	GetByUserID(ctx context.Context, userID uuid.UUID) ([]*models.OAuthAccount, error)
	Update(ctx context.Context, account *models.OAuthAccount) error
	Delete(ctx context.Context, id uuid.UUID) error

	// 关联操作
	LinkAccount(ctx context.Context, userID uuid.UUID, provider, providerID, email, name string, avatar *string) error
	UnlinkAccount(ctx context.Context, userID uuid.UUID, provider string) error
	GetLinkedProviders(ctx context.Context, userID uuid.UUID) ([]string, error)

	// 查询操作
	ExistsByProviderAndID(ctx context.Context, provider, providerID string) (bool, error)
	GetUserByProviderAccount(ctx context.Context, provider, providerID string) (*models.User, error)
}

// AuditLogRepository 审计日志仓储接口
type AuditLogRepository interface {
	// 基本CRUD操作
	Create(ctx context.Context, log *models.AuditLog) error
	GetByID(ctx context.Context, id uuid.UUID) (*models.AuditLog, error)
	List(ctx context.Context, offset, limit int, filters map[string]interface{}) ([]*models.AuditLog, int64, error)

	// 查询操作
	GetUserLogs(ctx context.Context, userID uuid.UUID, offset, limit int) ([]*models.AuditLog, int64, error)
	GetLogsByAction(ctx context.Context, action string, offset, limit int) ([]*models.AuditLog, int64, error)
	GetLogsByResource(ctx context.Context, resource string, offset, limit int) ([]*models.AuditLog, int64, error)
	GetLogsByIPAddress(ctx context.Context, ipAddress string, offset, limit int) ([]*models.AuditLog, int64, error)
	GetLogsByTimeRange(ctx context.Context, start, end time.Time, offset, limit int) ([]*models.AuditLog, int64, error)

	// 统计操作
	GetLogCount(ctx context.Context) (int64, error)
	GetFailedLoginAttempts(ctx context.Context, since time.Time) (int64, error)
	GetSuccessfulLogins(ctx context.Context, since time.Time) (int64, error)
	GetActionStats(ctx context.Context, since time.Time) (map[string]int64, error)

	// 清理操作
	CleanupOldLogs(ctx context.Context, before time.Time) error
}

// RateLimitRepository 限流仓储接口
type RateLimitRepository interface {
	// 基本CRUD操作
	Create(ctx context.Context, record *models.RateLimitRecord) error
	GetByKey(ctx context.Context, key string) (*models.RateLimitRecord, error)
	Update(ctx context.Context, record *models.RateLimitRecord) error
	Delete(ctx context.Context, id uuid.UUID) error

	// 限流操作
	IncrementCount(ctx context.Context, key string, window time.Duration) (int64, error)
	GetCount(ctx context.Context, key string) (int64, error)
	ResetCount(ctx context.Context, key string) error

	// 清理操作
	CleanupExpired(ctx context.Context) error
	GetExpired(ctx context.Context) ([]*models.RateLimitRecord, error)
}

// TokenBlacklistRepository 令牌黑名单仓储接口
type TokenBlacklistRepository interface {
	// 基本CRUD操作
	Create(ctx context.Context, blacklist *models.TokenBlacklist) error
	GetByTokenHash(ctx context.Context, tokenHash string) (*models.TokenBlacklist, error)
	Delete(ctx context.Context, id uuid.UUID) error

	// 黑名单操作
	IsTokenBlacklisted(ctx context.Context, tokenHash string) (bool, error)
	AddToken(ctx context.Context, tokenHash string, expiresAt time.Time, reason string) error
	RemoveToken(ctx context.Context, tokenHash string) error

	// 清理操作
	CleanupExpired(ctx context.Context) error
	GetExpired(ctx context.Context) ([]*models.TokenBlacklist, error)
}

// Repository 仓储聚合接口
type Repository interface {
	User() UserRepository
	Session() SessionRepository
	EmailVerification() EmailVerificationRepository
	SMSVerification() SMSVerificationRepository
	OAuthAccount() OAuthAccountRepository
	AuditLog() AuditLogRepository
	RateLimit() RateLimitRepository
	TokenBlacklist() TokenBlacklistRepository

	// 事务操作
	BeginTx(ctx context.Context) (Repository, error)
	Commit() error
	Rollback() error

	// 健康检查
	Health(ctx context.Context) error

	// 关闭连接
	Close() error
}

// RepositoryManager 仓储管理器接口
type RepositoryManager interface {
	GetRepository() Repository
	Close() error
	Health(ctx context.Context) error
}