package gorm

import (
	"context"
	"fmt"

	"github.com/snowfall-guild/backend/services/auth/internal/repository"
	"gorm.io/gorm"
)

// gormRepository GORM仓储实现
type gormRepository struct {
	db                    *gorm.DB
	userRepo              repository.UserRepository
	sessionRepo           repository.SessionRepository
	emailVerificationRepo repository.EmailVerificationRepository
	smsVerificationRepo   repository.SMSVerificationRepository
	oauthAccountRepo      repository.OAuthAccountRepository
	auditLogRepo          repository.AuditLogRepository
	rateLimitRepo         repository.RateLimitRepository
	tokenBlacklistRepo    repository.TokenBlacklistRepository
	isTx                  bool
}

// NewRepository 创建新的GORM仓储
func NewRepository(db *gorm.DB) repository.Repository {
	return &gormRepository{
		db:                    db,
		userRepo:              NewUserRepository(db),
		sessionRepo:           NewSessionRepository(db),
		emailVerificationRepo: NewEmailVerificationRepository(db),
		smsVerificationRepo:   NewSMSVerificationRepository(db),
		oauthAccountRepo:      NewOAuthAccountRepository(db),
		auditLogRepo:          NewAuditLogRepository(db),
		rateLimitRepo:         NewRateLimitRepository(db),
		tokenBlacklistRepo:    NewTokenBlacklistRepository(db),
		isTx:                  false,
	}
}

// User 获取用户仓储
func (r *gormRepository) User() repository.UserRepository {
	return r.userRepo
}

// Session 获取会话仓储
func (r *gormRepository) Session() repository.SessionRepository {
	return r.sessionRepo
}

// EmailVerification 获取邮箱验证仓储
func (r *gormRepository) EmailVerification() repository.EmailVerificationRepository {
	return r.emailVerificationRepo
}

// SMSVerification 获取短信验证仓储
func (r *gormRepository) SMSVerification() repository.SMSVerificationRepository {
	return r.smsVerificationRepo
}

// OAuthAccount 获取OAuth账户仓储
func (r *gormRepository) OAuthAccount() repository.OAuthAccountRepository {
	return r.oauthAccountRepo
}

// AuditLog 获取审计日志仓储
func (r *gormRepository) AuditLog() repository.AuditLogRepository {
	return r.auditLogRepo
}

// RateLimit 获取限流仓储
func (r *gormRepository) RateLimit() repository.RateLimitRepository {
	return r.rateLimitRepo
}

// TokenBlacklist 获取令牌黑名单仓储
func (r *gormRepository) TokenBlacklist() repository.TokenBlacklistRepository {
	return r.tokenBlacklistRepo
}

// BeginTx 开始事务
func (r *gormRepository) BeginTx(ctx context.Context) (repository.Repository, error) {
	if r.isTx {
		return nil, fmt.Errorf("already in transaction")
	}

	tx := r.db.WithContext(ctx).Begin()
	if tx.Error != nil {
		return nil, fmt.Errorf("failed to begin transaction: %w", tx.Error)
	}

	return &gormRepository{
		db:                    tx,
		userRepo:              NewUserRepository(tx),
		sessionRepo:           NewSessionRepository(tx),
		emailVerificationRepo: NewEmailVerificationRepository(tx),
		smsVerificationRepo:   NewSMSVerificationRepository(tx),
		oauthAccountRepo:      NewOAuthAccountRepository(tx),
		auditLogRepo:          NewAuditLogRepository(tx),
		rateLimitRepo:         NewRateLimitRepository(tx),
		tokenBlacklistRepo:    NewTokenBlacklistRepository(tx),
		isTx:                  true,
	}, nil
}

// Commit 提交事务
func (r *gormRepository) Commit() error {
	if !r.isTx {
		return fmt.Errorf("not in transaction")
	}

	if err := r.db.Commit().Error; err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}

// Rollback 回滚事务
func (r *gormRepository) Rollback() error {
	if !r.isTx {
		return fmt.Errorf("not in transaction")
	}

	if err := r.db.Rollback().Error; err != nil {
		return fmt.Errorf("failed to rollback transaction: %w", err)
	}

	return nil
}

// Health 健康检查
func (r *gormRepository) Health(ctx context.Context) error {
	sqlDB, err := r.db.DB()
	if err != nil {
		return fmt.Errorf("failed to get underlying sql.DB: %w", err)
	}

	if err := sqlDB.PingContext(ctx); err != nil {
		return fmt.Errorf("database ping failed: %w", err)
	}

	return nil
}

// Close 关闭连接
func (r *gormRepository) Close() error {
	if r.isTx {
		return fmt.Errorf("cannot close connection while in transaction")
	}

	sqlDB, err := r.db.DB()
	if err != nil {
		return fmt.Errorf("failed to get underlying sql.DB: %w", err)
	}

	return sqlDB.Close()
}

// RepositoryManager GORM仓储管理器
type RepositoryManager struct {
	db   *gorm.DB
	repo repository.Repository
}

// NewRepositoryManager 创建新的仓储管理器
func NewRepositoryManager(db *gorm.DB) repository.RepositoryManager {
	return &RepositoryManager{
		db:   db,
		repo: NewRepository(db),
	}
}

// GetRepository 获取仓储实例
func (rm *RepositoryManager) GetRepository() repository.Repository {
	return rm.repo
}

// Close 关闭连接
func (rm *RepositoryManager) Close() error {
	return rm.repo.Close()
}

// Health 健康检查
func (rm *RepositoryManager) Health(ctx context.Context) error {
	return rm.repo.Health(ctx)
}