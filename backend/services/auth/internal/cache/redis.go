package cache

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/go-redis/redis/v8"
	"github.com/snowfall-guild/backend/services/auth/internal/config"
)

// RedisCache Redis缓存管理器
type RedisCache struct {
	client *redis.Client
	config *config.Config
}

// NewRedisCache 创建新的Redis缓存管理器
func NewRedisCache(cfg *config.Config) (*RedisCache, error) {
	client := redis.NewClient(&redis.Options{
		Addr:         cfg.GetRedisAddr(),
		Password:     cfg.Redis.Password,
		DB:           cfg.Redis.DB,
		PoolSize:     cfg.Redis.PoolSize,
		MinIdleConns: cfg.Redis.MinIdleConns,
		DialTimeout:  cfg.Redis.DialTimeout,
		ReadTimeout:  cfg.Redis.ReadTimeout,
		WriteTimeout: cfg.Redis.WriteTimeout,
		IdleTimeout:  cfg.Redis.IdleTimeout,
	})

	// 测试连接
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := client.Ping(ctx).Err(); err != nil {
		return nil, fmt.Errorf("failed to connect to Redis: %w", err)
	}

	return &RedisCache{
		client: client,
		config: cfg,
	}, nil
}

// Set 设置缓存
func (r *RedisCache) Set(ctx context.Context, key string, value interface{}, expiration time.Duration) error {
	data, err := json.Marshal(value)
	if err != nil {
		return fmt.Errorf("failed to marshal value: %w", err)
	}

	if expiration == 0 {
		expiration = r.config.Cache.DefaultTTL
	}

	return r.client.Set(ctx, key, data, expiration).Err()
}

// Get 获取缓存
func (r *RedisCache) Get(ctx context.Context, key string, dest interface{}) error {
	data, err := r.client.Get(ctx, key).Result()
	if err != nil {
		if err == redis.Nil {
			return ErrCacheNotFound
		}
		return fmt.Errorf("failed to get cache: %w", err)
	}

	return json.Unmarshal([]byte(data), dest)
}

// Delete 删除缓存
func (r *RedisCache) Delete(ctx context.Context, keys ...string) error {
	if len(keys) == 0 {
		return nil
	}
	return r.client.Del(ctx, keys...).Err()
}

// Exists 检查缓存是否存在
func (r *RedisCache) Exists(ctx context.Context, key string) (bool, error) {
	count, err := r.client.Exists(ctx, key).Result()
	return count > 0, err
}

// Expire 设置过期时间
func (r *RedisCache) Expire(ctx context.Context, key string, expiration time.Duration) error {
	return r.client.Expire(ctx, key, expiration).Err()
}

// TTL 获取剩余过期时间
func (r *RedisCache) TTL(ctx context.Context, key string) (time.Duration, error) {
	return r.client.TTL(ctx, key).Result()
}

// Increment 递增
func (r *RedisCache) Increment(ctx context.Context, key string) (int64, error) {
	return r.client.Incr(ctx, key).Result()
}

// IncrementBy 按指定值递增
func (r *RedisCache) IncrementBy(ctx context.Context, key string, value int64) (int64, error) {
	return r.client.IncrBy(ctx, key, value).Result()
}

// Decrement 递减
func (r *RedisCache) Decrement(ctx context.Context, key string) (int64, error) {
	return r.client.Decr(ctx, key).Result()
}

// DecrementBy 按指定值递减
func (r *RedisCache) DecrementBy(ctx context.Context, key string, value int64) (int64, error) {
	return r.client.DecrBy(ctx, key, value).Result()
}

// SetNX 仅当键不存在时设置
func (r *RedisCache) SetNX(ctx context.Context, key string, value interface{}, expiration time.Duration) (bool, error) {
	data, err := json.Marshal(value)
	if err != nil {
		return false, fmt.Errorf("failed to marshal value: %w", err)
	}

	if expiration == 0 {
		expiration = r.config.Cache.DefaultTTL
	}

	return r.client.SetNX(ctx, key, data, expiration).Result()
}

// GetSet 设置新值并返回旧值
func (r *RedisCache) GetSet(ctx context.Context, key string, value interface{}) (string, error) {
	data, err := json.Marshal(value)
	if err != nil {
		return "", fmt.Errorf("failed to marshal value: %w", err)
	}

	return r.client.GetSet(ctx, key, data).Result()
}

// MGet 批量获取
func (r *RedisCache) MGet(ctx context.Context, keys ...string) ([]interface{}, error) {
	return r.client.MGet(ctx, keys...).Result()
}

// MSet 批量设置
func (r *RedisCache) MSet(ctx context.Context, pairs ...interface{}) error {
	return r.client.MSet(ctx, pairs...).Err()
}

// Keys 获取匹配的键
func (r *RedisCache) Keys(ctx context.Context, pattern string) ([]string, error) {
	return r.client.Keys(ctx, pattern).Result()
}

// Scan 扫描键
func (r *RedisCache) Scan(ctx context.Context, cursor uint64, match string, count int64) ([]string, uint64, error) {
	return r.client.Scan(ctx, cursor, match, count).Result()
}

// FlushDB 清空当前数据库
func (r *RedisCache) FlushDB(ctx context.Context) error {
	return r.client.FlushDB(ctx).Err()
}

// FlushAll 清空所有数据库
func (r *RedisCache) FlushAll(ctx context.Context) error {
	return r.client.FlushAll(ctx).Err()
}

// Pipeline 管道操作
func (r *RedisCache) Pipeline() redis.Pipeliner {
	return r.client.Pipeline()
}

// TxPipeline 事务管道操作
func (r *RedisCache) TxPipeline() redis.Pipeliner {
	return r.client.TxPipeline()
}

// Watch 监视键
func (r *RedisCache) Watch(ctx context.Context, fn func(*redis.Tx) error, keys ...string) error {
	return r.client.Watch(ctx, fn, keys...)
}

// Publish 发布消息
func (r *RedisCache) Publish(ctx context.Context, channel string, message interface{}) error {
	data, err := json.Marshal(message)
	if err != nil {
		return fmt.Errorf("failed to marshal message: %w", err)
	}
	return r.client.Publish(ctx, channel, data).Err()
}

// Subscribe 订阅频道
func (r *RedisCache) Subscribe(ctx context.Context, channels ...string) *redis.PubSub {
	return r.client.Subscribe(ctx, channels...)
}

// PSubscribe 模式订阅
func (r *RedisCache) PSubscribe(ctx context.Context, patterns ...string) *redis.PubSub {
	return r.client.PSubscribe(ctx, patterns...)
}

// Close 关闭连接
func (r *RedisCache) Close() error {
	return r.client.Close()
}

// Health 健康检查
func (r *RedisCache) Health(ctx context.Context) error {
	return r.client.Ping(ctx).Err()
}

// GetStats 获取统计信息
func (r *RedisCache) GetStats() *redis.PoolStats {
	return r.client.PoolStats()
}

// GetClient 获取原始客户端
func (r *RedisCache) GetClient() *redis.Client {
	return r.client
}

// 缓存键前缀常量
const (
	// 用户相关
	UserCachePrefix         = "auth:user:"
	UserSessionPrefix       = "auth:user:session:"
	UserLoginAttemptsPrefix = "auth:user:login_attempts:"
	UserLockoutPrefix       = "auth:user:lockout:"

	// 会话相关
	SessionPrefix        = "auth:session:"
	SessionUserPrefix    = "auth:session:user:"
	RefreshTokenPrefix   = "auth:refresh_token:"
	TwoFactorTokenPrefix = "auth:2fa_token:"

	// 验证相关
	EmailVerificationPrefix = "auth:email_verify:"
	SMSVerificationPrefix   = "auth:sms_verify:"
	PasswordResetPrefix     = "auth:password_reset:"

	// 限流相关
	RateLimitPrefix   = "auth:rate_limit:"
	IPRateLimitPrefix = "auth:ip_rate_limit:"

	// OAuth相关
	OAuthStatePrefix = "auth:oauth:state:"
	OAuthTokenPrefix = "auth:oauth:token:"

	// 令牌黑名单
	TokenBlacklistPrefix = "auth:token_blacklist:"

	// 双因素认证
	TwoFactorSecretPrefix = "auth:2fa_secret:"
	TwoFactorBackupPrefix = "auth:2fa_backup:"

	// 安全相关
	SecurityEventPrefix = "auth:security_event:"
	AuditLogPrefix      = "auth:audit_log:"
)

// 缓存键生成函数

// GetUserCacheKey 获取用户缓存键
func GetUserCacheKey(userID string) string {
	return UserCachePrefix + userID
}

// GetUserSessionKey 获取用户会话键
func GetUserSessionKey(userID string) string {
	return UserSessionPrefix + userID
}

// GetUserLoginAttemptsKey 获取用户登录尝试键
func GetUserLoginAttemptsKey(identifier string) string {
	return UserLoginAttemptsPrefix + identifier
}

// GetUserLockoutKey 获取用户锁定键
func GetUserLockoutKey(identifier string) string {
	return UserLockoutPrefix + identifier
}

// GetSessionKey 获取会话键
func GetSessionKey(sessionID string) string {
	return SessionPrefix + sessionID
}

// GetSessionUserKey 获取会话用户键
func GetSessionUserKey(userID string) string {
	return SessionUserPrefix + userID
}

// GetRefreshTokenKey 获取刷新令牌键
func GetRefreshTokenKey(tokenID string) string {
	return RefreshTokenPrefix + tokenID
}

// GetTwoFactorTokenKey 获取双因素认证令牌键
func GetTwoFactorTokenKey(token string) string {
	return TwoFactorTokenPrefix + token
}

// GetEmailVerificationKey 获取邮箱验证键
func GetEmailVerificationKey(token string) string {
	return EmailVerificationPrefix + token
}

// GetSMSVerificationKey 获取短信验证键
func GetSMSVerificationKey(phone string) string {
	return SMSVerificationPrefix + phone
}

// GetPasswordResetKey 获取密码重置键
func GetPasswordResetKey(token string) string {
	return PasswordResetPrefix + token
}

// GetRateLimitKey 获取限流键
func GetRateLimitKey(key string) string {
	return RateLimitPrefix + key
}

// GetIPRateLimitKey 获取IP限流键
func GetIPRateLimitKey(ip string) string {
	return IPRateLimitPrefix + ip
}

// GetOAuthStateKey 获取OAuth状态键
func GetOAuthStateKey(state string) string {
	return OAuthStatePrefix + state
}

// GetOAuthTokenKey 获取OAuth令牌键
func GetOAuthTokenKey(provider, userID string) string {
	return OAuthTokenPrefix + provider + ":" + userID
}

// GetTokenBlacklistKey 获取令牌黑名单键
func GetTokenBlacklistKey(tokenHash string) string {
	return TokenBlacklistPrefix + tokenHash
}

// GetTwoFactorSecretKey 获取双因素认证密钥键
func GetTwoFactorSecretKey(userID string) string {
	return TwoFactorSecretPrefix + userID
}

// GetTwoFactorBackupKey 获取双因素认证备份码键
func GetTwoFactorBackupKey(userID string) string {
	return TwoFactorBackupPrefix + userID
}

// GetSecurityEventKey 获取安全事件键
func GetSecurityEventKey(userID, eventType string) string {
	return SecurityEventPrefix + userID + ":" + eventType
}

// GetAuditLogKey 获取审计日志键
func GetAuditLogKey(userID string, timestamp int64) string {
	return fmt.Sprintf("%s%s:%d", AuditLogPrefix, userID, timestamp)
}
