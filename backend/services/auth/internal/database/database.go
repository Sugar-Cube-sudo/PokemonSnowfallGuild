package database

import (
	"fmt"
	"time"

	"github.com/snowfall-guild/backend/services/auth/internal/config"
	"github.com/snowfall-guild/backend/services/auth/internal/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// Database 数据库管理器
type Database struct {
	DB     *gorm.DB
	config *config.Config
}

// New 创建新的数据库连接
func New(cfg *config.Config) (*Database, error) {
	// 配置GORM日志级别
	logLevel := logger.Silent
	if cfg.Development.DebugMode {
		logLevel = logger.Info
	}

	// 连接数据库
	db, err := gorm.Open(postgres.Open(cfg.GetDSN()), &gorm.Config{
		Logger: logger.Default.LogMode(logLevel),
		NowFunc: func() time.Time {
			return time.Now().UTC()
		},
		DisableForeignKeyConstraintWhenMigrating: false,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	// 获取底层sql.DB以配置连接池
	sqlDB, err := db.DB()
	if err != nil {
		return nil, fmt.Errorf("failed to get underlying sql.DB: %w", err)
	}

	// 配置连接池
	sqlDB.SetMaxOpenConns(cfg.Database.MaxOpenConns)
	sqlDB.SetMaxIdleConns(cfg.Database.MaxIdleConns)
	sqlDB.SetConnMaxLifetime(cfg.Database.ConnMaxLifetime)
	sqlDB.SetConnMaxIdleTime(cfg.Database.ConnMaxIdleTime)

	// 测试连接
	if err := sqlDB.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	database := &Database{
		DB:     db,
		config: cfg,
	}

	// 自动迁移
	if cfg.Database.Migration.AutoMigrate {
		if err := database.AutoMigrate(); err != nil {
			return nil, fmt.Errorf("failed to auto migrate: %w", err)
		}
	}

	return database, nil
}

// AutoMigrate 自动迁移数据库表
func (d *Database) AutoMigrate() error {
	return d.DB.AutoMigrate(
		&models.User{},
		&models.Session{},
		&models.PasswordHistory{},
		&models.EmailVerification{},
		&models.SMSVerification{},
		&models.OAuthAccount{},
		&models.AuditLog{},
		&models.RateLimitRecord{},
		&models.TokenBlacklist{},
	)
}

// Close 关闭数据库连接
func (d *Database) Close() error {
	sqlDB, err := d.DB.DB()
	if err != nil {
		return err
	}
	return sqlDB.Close()
}

// Health 检查数据库健康状态
func (d *Database) Health() error {
	sqlDB, err := d.DB.DB()
	if err != nil {
		return err
	}
	return sqlDB.Ping()
}

// GetStats 获取数据库连接统计信息
func (d *Database) GetStats() (map[string]interface{}, error) {
	sqlDB, err := d.DB.DB()
	if err != nil {
		return nil, err
	}

	stats := sqlDB.Stats()
	return map[string]interface{}{
		"maxOpenConnections": stats.MaxOpenConnections,
		"openConnections":    stats.OpenConnections,
		"inUse":              stats.InUse,
		"idle":               stats.Idle,
		"waitCount":          stats.WaitCount,
		"waitDuration":       stats.WaitDuration.String(),
		"maxIdleClosed":      stats.MaxIdleClosed,
		"maxIdleTimeClosed":  stats.MaxIdleTimeClosed,
		"maxLifetimeClosed":  stats.MaxLifetimeClosed,
	}, nil
}

// Transaction 执行事务
func (d *Database) Transaction(fn func(*gorm.DB) error) error {
	return d.DB.Transaction(fn)
}

// BeginTx 开始事务
func (d *Database) BeginTx() *gorm.DB {
	return d.DB.Begin()
}

// WithContext 使用上下文
func (d *Database) WithContext(ctx interface{}) *gorm.DB {
	if ctx == nil {
		return d.DB
	}
	return d.DB.WithContext(ctx.(interface {
		Deadline() (time.Time, bool)
		Done() <-chan struct{}
		Err() error
		Value(interface{}) interface{}
	}))
}

// CreateIndexes 创建索引
func (d *Database) CreateIndexes() error {
	// 用户表索引
	if err := d.DB.Exec("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)").Error; err != nil {
		return fmt.Errorf("failed to create users email index: %w", err)
	}

	if err := d.DB.Exec("CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)").Error; err != nil {
		return fmt.Errorf("failed to create users username index: %w", err)
	}

	if err := d.DB.Exec("CREATE INDEX IF NOT EXISTS idx_users_status ON users(status)").Error; err != nil {
		return fmt.Errorf("failed to create users status index: %w", err)
	}

	if err := d.DB.Exec("CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at)").Error; err != nil {
		return fmt.Errorf("failed to create users created_at index: %w", err)
	}

	// 会话表索引
	if err := d.DB.Exec("CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)").Error; err != nil {
		return fmt.Errorf("failed to create sessions user_id index: %w", err)
	}

	if err := d.DB.Exec("CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token)").Error; err != nil {
		return fmt.Errorf("failed to create sessions token index: %w", err)
	}

	if err := d.DB.Exec("CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at)").Error; err != nil {
		return fmt.Errorf("failed to create sessions expires_at index: %w", err)
	}

	if err := d.DB.Exec("CREATE INDEX IF NOT EXISTS idx_sessions_is_active ON sessions(is_active)").Error; err != nil {
		return fmt.Errorf("failed to create sessions is_active index: %w", err)
	}

	// 密码历史表索引
	if err := d.DB.Exec("CREATE INDEX IF NOT EXISTS idx_password_histories_user_id ON password_histories(user_id)").Error; err != nil {
		return fmt.Errorf("failed to create password_histories user_id index: %w", err)
	}

	if err := d.DB.Exec("CREATE INDEX IF NOT EXISTS idx_password_histories_created_at ON password_histories(created_at)").Error; err != nil {
		return fmt.Errorf("failed to create password_histories created_at index: %w", err)
	}

	// 邮箱验证表索引
	if err := d.DB.Exec("CREATE INDEX IF NOT EXISTS idx_email_verifications_user_id ON email_verifications(user_id)").Error; err != nil {
		return fmt.Errorf("failed to create email_verifications user_id index: %w", err)
	}

	if err := d.DB.Exec("CREATE INDEX IF NOT EXISTS idx_email_verifications_token ON email_verifications(token)").Error; err != nil {
		return fmt.Errorf("failed to create email_verifications token index: %w", err)
	}

	if err := d.DB.Exec("CREATE INDEX IF NOT EXISTS idx_email_verifications_expires_at ON email_verifications(expires_at)").Error; err != nil {
		return fmt.Errorf("failed to create email_verifications expires_at index: %w", err)
	}

	// 短信验证表索引
	if err := d.DB.Exec("CREATE INDEX IF NOT EXISTS idx_sms_verifications_user_id ON sms_verifications(user_id)").Error; err != nil {
		return fmt.Errorf("failed to create sms_verifications user_id index: %w", err)
	}

	if err := d.DB.Exec("CREATE INDEX IF NOT EXISTS idx_sms_verifications_phone_number ON sms_verifications(phone_number)").Error; err != nil {
		return fmt.Errorf("failed to create sms_verifications phone_number index: %w", err)
	}

	if err := d.DB.Exec("CREATE INDEX IF NOT EXISTS idx_sms_verifications_expires_at ON sms_verifications(expires_at)").Error; err != nil {
		return fmt.Errorf("failed to create sms_verifications expires_at index: %w", err)
	}

	// OAuth账户表索引
	if err := d.DB.Exec("CREATE INDEX IF NOT EXISTS idx_oauth_accounts_user_id ON oauth_accounts(user_id)").Error; err != nil {
		return fmt.Errorf("failed to create oauth_accounts user_id index: %w", err)
	}

	if err := d.DB.Exec("CREATE INDEX IF NOT EXISTS idx_oauth_accounts_provider ON oauth_accounts(provider)").Error; err != nil {
		return fmt.Errorf("failed to create oauth_accounts provider index: %w", err)
	}

	if err := d.DB.Exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_oauth_accounts_provider_id ON oauth_accounts(provider, provider_id)").Error; err != nil {
		return fmt.Errorf("failed to create oauth_accounts provider_id unique index: %w", err)
	}

	// 审计日志表索引
	if err := d.DB.Exec("CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id)").Error; err != nil {
		return fmt.Errorf("failed to create audit_logs user_id index: %w", err)
	}

	if err := d.DB.Exec("CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action)").Error; err != nil {
		return fmt.Errorf("failed to create audit_logs action index: %w", err)
	}

	if err := d.DB.Exec("CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource)").Error; err != nil {
		return fmt.Errorf("failed to create audit_logs resource index: %w", err)
	}

	if err := d.DB.Exec("CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at)").Error; err != nil {
		return fmt.Errorf("failed to create audit_logs created_at index: %w", err)
	}

	if err := d.DB.Exec("CREATE INDEX IF NOT EXISTS idx_audit_logs_ip_address ON audit_logs(ip_address)").Error; err != nil {
		return fmt.Errorf("failed to create audit_logs ip_address index: %w", err)
	}

	// 限流记录表索引
	if err := d.DB.Exec("CREATE INDEX IF NOT EXISTS idx_rate_limit_records_key ON rate_limit_records(key)").Error; err != nil {
		return fmt.Errorf("failed to create rate_limit_records key index: %w", err)
	}

	if err := d.DB.Exec("CREATE INDEX IF NOT EXISTS idx_rate_limit_records_expires_at ON rate_limit_records(expires_at)").Error; err != nil {
		return fmt.Errorf("failed to create rate_limit_records expires_at index: %w", err)
	}

	// 令牌黑名单表索引
	if err := d.DB.Exec("CREATE INDEX IF NOT EXISTS idx_token_blacklists_token_hash ON token_blacklists(token_hash)").Error; err != nil {
		return fmt.Errorf("failed to create token_blacklists token_hash index: %w", err)
	}

	if err := d.DB.Exec("CREATE INDEX IF NOT EXISTS idx_token_blacklists_expires_at ON token_blacklists(expires_at)").Error; err != nil {
		return fmt.Errorf("failed to create token_blacklists expires_at index: %w", err)
	}

	return nil
}

// CleanupExpiredRecords 清理过期记录
func (d *Database) CleanupExpiredRecords() error {
	now := time.Now().UTC()

	// 清理过期的会话
	if err := d.DB.Where("expires_at < ?", now).Delete(&models.Session{}).Error; err != nil {
		return fmt.Errorf("failed to cleanup expired sessions: %w", err)
	}

	// 清理过期的邮箱验证
	if err := d.DB.Where("expires_at < ?", now).Delete(&models.EmailVerification{}).Error; err != nil {
		return fmt.Errorf("failed to cleanup expired email verifications: %w", err)
	}

	// 清理过期的短信验证
	if err := d.DB.Where("expires_at < ?", now).Delete(&models.SMSVerification{}).Error; err != nil {
		return fmt.Errorf("failed to cleanup expired sms verifications: %w", err)
	}

	// 清理过期的限流记录
	if err := d.DB.Where("expires_at < ?", now).Delete(&models.RateLimitRecord{}).Error; err != nil {
		return fmt.Errorf("failed to cleanup expired rate limit records: %w", err)
	}

	// 清理过期的令牌黑名单
	if err := d.DB.Where("expires_at < ?", now).Delete(&models.TokenBlacklist{}).Error; err != nil {
		return fmt.Errorf("failed to cleanup expired token blacklists: %w", err)
	}

	// 清理旧的审计日志（根据配置的保留期）
	retentionPeriod := d.config.Security.Audit.RetentionPeriod
	if retentionPeriod > 0 {
		cutoff := now.Add(-retentionPeriod)
		if err := d.DB.Where("created_at < ?", cutoff).Delete(&models.AuditLog{}).Error; err != nil {
			return fmt.Errorf("failed to cleanup old audit logs: %w", err)
		}
	}

	// 清理旧的密码历史（保留最近的N个）
	historyCount := d.config.Password.HistoryCount
	if historyCount > 0 {
		// 为每个用户保留最近的密码历史
		var users []models.User
		if err := d.DB.Select("id").Find(&users).Error; err != nil {
			return fmt.Errorf("failed to get users for password history cleanup: %w", err)
		}

		for _, user := range users {
			// 获取该用户的密码历史，按创建时间倒序
			var histories []models.PasswordHistory
			if err := d.DB.Where("user_id = ?", user.ID).Order("created_at DESC").Find(&histories).Error; err != nil {
				continue
			}

			// 如果超过保留数量，删除多余的
			if len(histories) > historyCount {
				toDelete := histories[historyCount:]
				for _, history := range toDelete {
					if err := d.DB.Delete(&history).Error; err != nil {
						continue
					}
				}
			}
		}
	}

	return nil
}

// SeedData 种子数据
func (d *Database) SeedData() error {
	if !d.config.Development.SeedData {
		return nil
	}

	// 创建管理员用户
	adminUser := &models.User{
		Username:      "admin",
		Email:         "admin@pokemon-snowfall-guild.com",
		PasswordHash:  "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj8xLs9ksK6G", // password: admin123
		EmailVerified: true,
		Role:          models.UserRoleAdmin,
		Status:        models.UserStatusActive,
	}

	// 检查管理员是否已存在
	var count int64
	d.DB.Model(&models.User{}).Where("email = ?", adminUser.Email).Count(&count)
	if count == 0 {
		if err := d.DB.Create(adminUser).Error; err != nil {
			return fmt.Errorf("failed to create admin user: %w", err)
		}
	}

	return nil
}
