package cache

import (
	"context"
	"errors"
	"time"
)

// Cache 缓存接口
type Cache interface {
	// 基本操作
	Set(ctx context.Context, key string, value interface{}, expiration time.Duration) error
	Get(ctx context.Context, key string, dest interface{}) error
	Delete(ctx context.Context, keys ...string) error
	Exists(ctx context.Context, key string) (bool, error)
	Expire(ctx context.Context, key string, expiration time.Duration) error
	TTL(ctx context.Context, key string) (time.Duration, error)

	// 数值操作
	Increment(ctx context.Context, key string) (int64, error)
	IncrementBy(ctx context.Context, key string, value int64) (int64, error)
	Decrement(ctx context.Context, key string) (int64, error)
	DecrementBy(ctx context.Context, key string, value int64) (int64, error)

	// 原子操作
	SetNX(ctx context.Context, key string, value interface{}, expiration time.Duration) (bool, error)
	GetSet(ctx context.Context, key string, value interface{}) (string, error)

	// 批量操作
	MGet(ctx context.Context, keys ...string) ([]interface{}, error)
	MSet(ctx context.Context, pairs ...interface{}) error

	// 键操作
	Keys(ctx context.Context, pattern string) ([]string, error)
	Scan(ctx context.Context, cursor uint64, match string, count int64) ([]string, uint64, error)

	// 管理操作
	FlushDB(ctx context.Context) error
	FlushAll(ctx context.Context) error
	Close() error
	Health(ctx context.Context) error
}

// 错误定义
var (
	ErrCacheNotFound    = errors.New("cache not found")
	ErrCacheExpired     = errors.New("cache expired")
	ErrCacheKeyExists   = errors.New("cache key already exists")
	ErrCacheInvalidType = errors.New("cache invalid type")
	ErrCacheConnection  = errors.New("cache connection error")
	ErrCacheTimeout     = errors.New("cache operation timeout")
)

// CacheManager 缓存管理器
type CacheManager struct {
	cache Cache
}

// NewCacheManager 创建缓存管理器
func NewCacheManager(cache Cache) *CacheManager {
	return &CacheManager{
		cache: cache,
	}
}

// GetCache 获取缓存实例
func (cm *CacheManager) GetCache() Cache {
	return cm.cache
}

// SetUserCache 设置用户缓存
func (cm *CacheManager) SetUserCache(ctx context.Context, userID string, user interface{}, expiration time.Duration) error {
	key := GetUserCacheKey(userID)
	return cm.cache.Set(ctx, key, user, expiration)
}

// GetUserCache 获取用户缓存
func (cm *CacheManager) GetUserCache(ctx context.Context, userID string, dest interface{}) error {
	key := GetUserCacheKey(userID)
	return cm.cache.Get(ctx, key, dest)
}

// DeleteUserCache 删除用户缓存
func (cm *CacheManager) DeleteUserCache(ctx context.Context, userID string) error {
	key := GetUserCacheKey(userID)
	return cm.cache.Delete(ctx, key)
}

// SetSessionCache 设置会话缓存
func (cm *CacheManager) SetSessionCache(ctx context.Context, sessionID string, session interface{}, expiration time.Duration) error {
	key := GetSessionKey(sessionID)
	return cm.cache.Set(ctx, key, session, expiration)
}

// GetSessionCache 获取会话缓存
func (cm *CacheManager) GetSessionCache(ctx context.Context, sessionID string, dest interface{}) error {
	key := GetSessionKey(sessionID)
	return cm.cache.Get(ctx, key, dest)
}

// DeleteSessionCache 删除会话缓存
func (cm *CacheManager) DeleteSessionCache(ctx context.Context, sessionID string) error {
	key := GetSessionKey(sessionID)
	return cm.cache.Delete(ctx, key)
}

// SetUserSessions 设置用户会话列表
func (cm *CacheManager) SetUserSessions(ctx context.Context, userID string, sessions interface{}, expiration time.Duration) error {
	key := GetUserSessionKey(userID)
	return cm.cache.Set(ctx, key, sessions, expiration)
}

// GetUserSessions 获取用户会话列表
func (cm *CacheManager) GetUserSessions(ctx context.Context, userID string, dest interface{}) error {
	key := GetUserSessionKey(userID)
	return cm.cache.Get(ctx, key, dest)
}

// DeleteUserSessions 删除用户会话列表
func (cm *CacheManager) DeleteUserSessions(ctx context.Context, userID string) error {
	key := GetUserSessionKey(userID)
	return cm.cache.Delete(ctx, key)
}

// IncrementLoginAttempts 增加登录尝试次数
func (cm *CacheManager) IncrementLoginAttempts(ctx context.Context, identifier string) (int64, error) {
	key := GetUserLoginAttemptsKey(identifier)
	count, err := cm.cache.IncrementBy(ctx, key, 1)
	if err != nil {
		return 0, err
	}

	// 设置过期时间（15分钟）
	if count == 1 {
		if err := cm.cache.Expire(ctx, key, 15*time.Minute); err != nil {
			return count, err
		}
	}

	return count, nil
}

// GetLoginAttempts 获取登录尝试次数
func (cm *CacheManager) GetLoginAttempts(ctx context.Context, identifier string) (int64, error) {
	key := GetUserLoginAttemptsKey(identifier)
	var count int64
	err := cm.cache.Get(ctx, key, &count)
	if err != nil {
		if err == ErrCacheNotFound {
			return 0, nil
		}
		return 0, err
	}
	return count, nil
}

// ResetLoginAttempts 重置登录尝试次数
func (cm *CacheManager) ResetLoginAttempts(ctx context.Context, identifier string) error {
	key := GetUserLoginAttemptsKey(identifier)
	return cm.cache.Delete(ctx, key)
}

// SetUserLockout 设置用户锁定
func (cm *CacheManager) SetUserLockout(ctx context.Context, identifier string, expiration time.Duration) error {
	key := GetUserLockoutKey(identifier)
	return cm.cache.Set(ctx, key, true, expiration)
}

// IsUserLockedOut 检查用户是否被锁定
func (cm *CacheManager) IsUserLockedOut(ctx context.Context, identifier string) (bool, error) {
	key := GetUserLockoutKey(identifier)
	return cm.cache.Exists(ctx, key)
}

// RemoveUserLockout 移除用户锁定
func (cm *CacheManager) RemoveUserLockout(ctx context.Context, identifier string) error {
	key := GetUserLockoutKey(identifier)
	return cm.cache.Delete(ctx, key)
}

// SetRefreshToken 设置刷新令牌
func (cm *CacheManager) SetRefreshToken(ctx context.Context, tokenID string, token interface{}, expiration time.Duration) error {
	key := GetRefreshTokenKey(tokenID)
	return cm.cache.Set(ctx, key, token, expiration)
}

// GetRefreshToken 获取刷新令牌
func (cm *CacheManager) GetRefreshToken(ctx context.Context, tokenID string, dest interface{}) error {
	key := GetRefreshTokenKey(tokenID)
	return cm.cache.Get(ctx, key, dest)
}

// DeleteRefreshToken 删除刷新令牌
func (cm *CacheManager) DeleteRefreshToken(ctx context.Context, tokenID string) error {
	key := GetRefreshTokenKey(tokenID)
	return cm.cache.Delete(ctx, key)
}

// SetTwoFactorToken 设置双因素认证令牌
func (cm *CacheManager) SetTwoFactorToken(ctx context.Context, token string, data interface{}, expiration time.Duration) error {
	key := GetTwoFactorTokenKey(token)
	return cm.cache.Set(ctx, key, data, expiration)
}

// GetTwoFactorToken 获取双因素认证令牌
func (cm *CacheManager) GetTwoFactorToken(ctx context.Context, token string, dest interface{}) error {
	key := GetTwoFactorTokenKey(token)
	return cm.cache.Get(ctx, key, dest)
}

// DeleteTwoFactorToken 删除双因素认证令牌
func (cm *CacheManager) DeleteTwoFactorToken(ctx context.Context, token string) error {
	key := GetTwoFactorTokenKey(token)
	return cm.cache.Delete(ctx, key)
}

// SetEmailVerification 设置邮箱验证
func (cm *CacheManager) SetEmailVerification(ctx context.Context, token string, data interface{}, expiration time.Duration) error {
	key := GetEmailVerificationKey(token)
	return cm.cache.Set(ctx, key, data, expiration)
}

// GetEmailVerification 获取邮箱验证
func (cm *CacheManager) GetEmailVerification(ctx context.Context, token string, dest interface{}) error {
	key := GetEmailVerificationKey(token)
	return cm.cache.Get(ctx, key, dest)
}

// DeleteEmailVerification 删除邮箱验证
func (cm *CacheManager) DeleteEmailVerification(ctx context.Context, token string) error {
	key := GetEmailVerificationKey(token)
	return cm.cache.Delete(ctx, key)
}

// SetSMSVerification 设置短信验证
func (cm *CacheManager) SetSMSVerification(ctx context.Context, phone string, data interface{}, expiration time.Duration) error {
	key := GetSMSVerificationKey(phone)
	return cm.cache.Set(ctx, key, data, expiration)
}

// GetSMSVerification 获取短信验证
func (cm *CacheManager) GetSMSVerification(ctx context.Context, phone string, dest interface{}) error {
	key := GetSMSVerificationKey(phone)
	return cm.cache.Get(ctx, key, dest)
}

// DeleteSMSVerification 删除短信验证
func (cm *CacheManager) DeleteSMSVerification(ctx context.Context, phone string) error {
	key := GetSMSVerificationKey(phone)
	return cm.cache.Delete(ctx, key)
}

// SetPasswordReset 设置密码重置
func (cm *CacheManager) SetPasswordReset(ctx context.Context, token string, data interface{}, expiration time.Duration) error {
	key := GetPasswordResetKey(token)
	return cm.cache.Set(ctx, key, data, expiration)
}

// GetPasswordReset 获取密码重置
func (cm *CacheManager) GetPasswordReset(ctx context.Context, token string, dest interface{}) error {
	key := GetPasswordResetKey(token)
	return cm.cache.Get(ctx, key, dest)
}

// DeletePasswordReset 删除密码重置
func (cm *CacheManager) DeletePasswordReset(ctx context.Context, token string) error {
	key := GetPasswordResetKey(token)
	return cm.cache.Delete(ctx, key)
}

// SetRateLimit 设置限流
func (cm *CacheManager) SetRateLimit(ctx context.Context, key string, count int64, expiration time.Duration) error {
	rateLimitKey := GetRateLimitKey(key)
	return cm.cache.Set(ctx, rateLimitKey, count, expiration)
}

// IncrementRateLimit 增加限流计数
func (cm *CacheManager) IncrementRateLimit(ctx context.Context, key string, expiration time.Duration) (int64, error) {
	rateLimitKey := GetRateLimitKey(key)
	count, err := cm.cache.IncrementBy(ctx, rateLimitKey, 1)
	if err != nil {
		return 0, err
	}

	// 设置过期时间
	if count == 1 {
		if err := cm.cache.Expire(ctx, rateLimitKey, expiration); err != nil {
			return count, err
		}
	}

	return count, nil
}

// GetRateLimit 获取限流计数
func (cm *CacheManager) GetRateLimit(ctx context.Context, key string) (int64, error) {
	rateLimitKey := GetRateLimitKey(key)
	var count int64
	err := cm.cache.Get(ctx, rateLimitKey, &count)
	if err != nil {
		if err == ErrCacheNotFound {
			return 0, nil
		}
		return 0, err
	}
	return count, nil
}

// SetOAuthState 设置OAuth状态
func (cm *CacheManager) SetOAuthState(ctx context.Context, state string, data interface{}, expiration time.Duration) error {
	key := GetOAuthStateKey(state)
	return cm.cache.Set(ctx, key, data, expiration)
}

// GetOAuthState 获取OAuth状态
func (cm *CacheManager) GetOAuthState(ctx context.Context, state string, dest interface{}) error {
	key := GetOAuthStateKey(state)
	return cm.cache.Get(ctx, key, dest)
}

// DeleteOAuthState 删除OAuth状态
func (cm *CacheManager) DeleteOAuthState(ctx context.Context, state string) error {
	key := GetOAuthStateKey(state)
	return cm.cache.Delete(ctx, key)
}

// SetTokenBlacklist 设置令牌黑名单
func (cm *CacheManager) SetTokenBlacklist(ctx context.Context, tokenHash string, expiration time.Duration) error {
	key := GetTokenBlacklistKey(tokenHash)
	return cm.cache.Set(ctx, key, true, expiration)
}

// IsTokenBlacklisted 检查令牌是否在黑名单中
func (cm *CacheManager) IsTokenBlacklisted(ctx context.Context, tokenHash string) (bool, error) {
	key := GetTokenBlacklistKey(tokenHash)
	return cm.cache.Exists(ctx, key)
}

// SetTwoFactorSecret 设置双因素认证密钥
func (cm *CacheManager) SetTwoFactorSecret(ctx context.Context, userID string, secret string, expiration time.Duration) error {
	key := GetTwoFactorSecretKey(userID)
	return cm.cache.Set(ctx, key, secret, expiration)
}

// GetTwoFactorSecret 获取双因素认证密钥
func (cm *CacheManager) GetTwoFactorSecret(ctx context.Context, userID string) (string, error) {
	key := GetTwoFactorSecretKey(userID)
	var secret string
	err := cm.cache.Get(ctx, key, &secret)
	return secret, err
}

// DeleteTwoFactorSecret 删除双因素认证密钥
func (cm *CacheManager) DeleteTwoFactorSecret(ctx context.Context, userID string) error {
	key := GetTwoFactorSecretKey(userID)
	return cm.cache.Delete(ctx, key)
}

// SetTwoFactorBackupCodes 设置双因素认证备份码
func (cm *CacheManager) SetTwoFactorBackupCodes(ctx context.Context, userID string, codes []string, expiration time.Duration) error {
	key := GetTwoFactorBackupKey(userID)
	return cm.cache.Set(ctx, key, codes, expiration)
}

// GetTwoFactorBackupCodes 获取双因素认证备份码
func (cm *CacheManager) GetTwoFactorBackupCodes(ctx context.Context, userID string) ([]string, error) {
	key := GetTwoFactorBackupKey(userID)
	var codes []string
	err := cm.cache.Get(ctx, key, &codes)
	return codes, err
}

// DeleteTwoFactorBackupCodes 删除双因素认证备份码
func (cm *CacheManager) DeleteTwoFactorBackupCodes(ctx context.Context, userID string) error {
	key := GetTwoFactorBackupKey(userID)
	return cm.cache.Delete(ctx, key)
}

// Close 关闭缓存连接
func (cm *CacheManager) Close() error {
	return cm.cache.Close()
}

// Health 健康检查
func (cm *CacheManager) Health(ctx context.Context) error {
	return cm.cache.Health(ctx)
}