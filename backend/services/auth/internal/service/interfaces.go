package service

import (
	"context"
	"time"

	"github.com/snowfall-guild/backend/services/auth/internal/models"
)

// AuthService 认证服务接口
type AuthService interface {
	// 用户注册
	Register(ctx context.Context, req *RegisterRequest) (*RegisterResponse, error)
	// 用户登录
	Login(ctx context.Context, req *LoginRequest) (*LoginResponse, error)
	// 刷新令牌
	RefreshToken(ctx context.Context, req *RefreshTokenRequest) (*RefreshTokenResponse, error)
	// 用户登出
	Logout(ctx context.Context, req *LogoutRequest) error
	// 撤销所有会话
	RevokeAllSessions(ctx context.Context, userID string) error
	// 验证令牌
	ValidateToken(ctx context.Context, token string) (*TokenValidationResponse, error)
	// 获取用户信息
	GetUserInfo(ctx context.Context, userID string) (*UserInfoResponse, error)
}

// UserService 用户服务接口
type UserService interface {
	// 创建用户
	CreateUser(ctx context.Context, req *CreateUserRequest) (*UserResponse, error)
	// 获取用户
	GetUser(ctx context.Context, userID string) (*UserResponse, error)
	// 根据邮箱获取用户
	GetUserByEmail(ctx context.Context, email string) (*UserResponse, error)
	// 根据用户名获取用户
	GetUserByUsername(ctx context.Context, username string) (*UserResponse, error)
	// 根据手机号获取用户
	GetUserByPhone(ctx context.Context, phone string) (*UserResponse, error)
	// 更新用户
	UpdateUser(ctx context.Context, userID string, req *UpdateUserRequest) (*UserResponse, error)
	// 更新用户密码
	UpdatePassword(ctx context.Context, userID string, req *UpdatePasswordRequest) error
	// 更新用户状态
	UpdateUserStatus(ctx context.Context, userID string, status models.UserStatus) error
	// 删除用户
	DeleteUser(ctx context.Context, userID string) error
	// 获取用户列表
	ListUsers(ctx context.Context, req *ListUsersRequest) (*ListUsersResponse, error)
	// 检查邮箱是否存在
	EmailExists(ctx context.Context, email string) (bool, error)
	// 检查用户名是否存在
	UsernameExists(ctx context.Context, username string) (bool, error)
	// 检查手机号是否存在
	PhoneExists(ctx context.Context, phone string) (bool, error)
	// 锁定用户
	LockUser(ctx context.Context, userID string, reason string, duration time.Duration) error
	// 解锁用户
	UnlockUser(ctx context.Context, userID string) error
}

// SessionService 会话服务接口
type SessionService interface {
	// 创建会话
	CreateSession(ctx context.Context, req *CreateSessionRequest) (*SessionResponse, error)
	// 获取会话
	GetSession(ctx context.Context, sessionID string) (*SessionResponse, error)
	// 更新会话
	UpdateSession(ctx context.Context, sessionID string, req *UpdateSessionRequest) (*SessionResponse, error)
	// 撤销会话
	RevokeSession(ctx context.Context, sessionID string) error
	// 撤销用户的所有会话
	RevokeUserSessions(ctx context.Context, userID string) error
	// 撤销设备的所有会话
	RevokeDeviceSessions(ctx context.Context, deviceID string) error
	// 获取用户会话列表
	GetUserSessions(ctx context.Context, userID string) ([]*SessionResponse, error)
	// 获取活跃会话
	GetActiveSessions(ctx context.Context, userID string) ([]*SessionResponse, error)
	// 清理过期会话
	CleanupExpiredSessions(ctx context.Context) error
}

// EmailVerificationService 邮箱验证服务接口
type EmailVerificationService interface {
	// 发送验证邮件
	SendVerificationEmail(ctx context.Context, req *SendVerificationEmailRequest) error
	// 验证邮箱
	VerifyEmail(ctx context.Context, req *VerifyEmailRequest) error
	// 重新发送验证邮件
	ResendVerificationEmail(ctx context.Context, email string) error
	// 检查验证状态
	CheckVerificationStatus(ctx context.Context, email string) (*VerificationStatusResponse, error)
	// 发送密码重置邮件
	SendPasswordResetEmail(ctx context.Context, email string) error
	// 验证密码重置令牌
	VerifyPasswordResetToken(ctx context.Context, token string) (*PasswordResetTokenResponse, error)
	// 重置密码
	ResetPassword(ctx context.Context, req *ResetPasswordRequest) error
}

// SMSVerificationService 短信验证服务接口
type SMSVerificationService interface {
	// 发送验证短信
	SendVerificationSMS(ctx context.Context, req *SendVerificationSMSRequest) error
	// 验证短信
	VerifySMS(ctx context.Context, req *VerifySMSRequest) error
	// 重新发送验证短信
	ResendVerificationSMS(ctx context.Context, phone string) error
	// 检查验证状态
	CheckSMSVerificationStatus(ctx context.Context, phone string) (*SMSVerificationStatusResponse, error)
	// 发送密码重置短信
	SendPasswordResetSMS(ctx context.Context, phone string) error
	// 验证密码重置验证码
	VerifyPasswordResetSMS(ctx context.Context, req *VerifyPasswordResetSMSRequest) (*PasswordResetSMSResponse, error)
}

// TwoFactorService 双因素认证服务接口
type TwoFactorService interface {
	// 启用双因素认证
	EnableTwoFactor(ctx context.Context, userID string) (*EnableTwoFactorResponse, error)
	// 确认启用双因素认证
	ConfirmEnableTwoFactor(ctx context.Context, req *ConfirmEnableTwoFactorRequest) (*ConfirmEnableTwoFactorResponse, error)
	// 禁用双因素认证
	DisableTwoFactor(ctx context.Context, req *DisableTwoFactorRequest) error
	// 验证双因素认证
	VerifyTwoFactor(ctx context.Context, req *VerifyTwoFactorRequest) (*VerifyTwoFactorResponse, error)
	// 生成备份码
	GenerateBackupCodes(ctx context.Context, userID string) (*GenerateBackupCodesResponse, error)
	// 使用备份码
	UseBackupCode(ctx context.Context, req *UseBackupCodeRequest) (*UseBackupCodeResponse, error)
	// 获取双因素认证状态
	GetTwoFactorStatus(ctx context.Context, userID string) (*TwoFactorStatusResponse, error)
}

// OAuthService OAuth服务接口
type OAuthService interface {
	// 获取授权URL
	GetAuthURL(ctx context.Context, req *GetAuthURLRequest) (*GetAuthURLResponse, error)
	// 处理回调
	HandleCallback(ctx context.Context, req *HandleCallbackRequest) (*HandleCallbackResponse, error)
	// 绑定OAuth账户
	BindOAuthAccount(ctx context.Context, req *BindOAuthAccountRequest) error
	// 解绑OAuth账户
	UnbindOAuthAccount(ctx context.Context, req *UnbindOAuthAccountRequest) error
	// 获取用户的OAuth账户
	GetUserOAuthAccounts(ctx context.Context, userID string) ([]*OAuthAccountResponse, error)
	// 刷新OAuth令牌
	RefreshOAuthToken(ctx context.Context, req *RefreshOAuthTokenRequest) (*RefreshOAuthTokenResponse, error)
}

// RateLimitService 限流服务接口
type RateLimitService interface {
	// 检查限流
	CheckRateLimit(ctx context.Context, req *CheckRateLimitRequest) (*CheckRateLimitResponse, error)
	// 增加计数
	IncrementCount(ctx context.Context, key string) error
	// 重置计数
	ResetCount(ctx context.Context, key string) error
	// 获取限流状态
	GetRateLimitStatus(ctx context.Context, key string) (*RateLimitStatusResponse, error)
	// 清理过期记录
	CleanupExpiredRecords(ctx context.Context) error
	// 获取限流统计
	GetRateLimitStats(ctx context.Context, req *GetRateLimitStatsRequest) (*GetRateLimitStatsResponse, error)
}

// TokenService 令牌服务接口
type TokenService interface {
	// 生成令牌对
	GenerateTokenPair(ctx context.Context, req *GenerateTokenPairRequest) (*GenerateTokenPairResponse, error)
	// 验证访问令牌
	ValidateAccessToken(ctx context.Context, token string) (*ValidateTokenResponse, error)
	// 验证刷新令牌
	ValidateRefreshToken(ctx context.Context, token string) (*ValidateTokenResponse, error)
	// 刷新令牌
	RefreshTokens(ctx context.Context, refreshToken string) (*RefreshTokensResponse, error)
	// 撤销令牌
	RevokeToken(ctx context.Context, token string, reason string) error
	// 撤销用户的所有令牌
	RevokeUserTokens(ctx context.Context, userID string, reason string) error
	// 检查令牌是否被撤销
	IsTokenRevoked(ctx context.Context, token string) (bool, error)
	// 获取令牌信息
	GetTokenInfo(ctx context.Context, token string) (*TokenInfoResponse, error)
	// 清理过期令牌
	CleanupExpiredTokens(ctx context.Context) error
}

// AuditService 审计服务接口
type AuditService interface {
	// 记录审计日志
	LogAction(ctx context.Context, req *LogActionRequest) error
	// 获取审计日志
	GetAuditLogs(ctx context.Context, req *GetAuditLogsRequest) (*GetAuditLogsResponse, error)
	// 获取用户审计日志
	GetUserAuditLogs(ctx context.Context, userID string, req *GetUserAuditLogsRequest) (*GetUserAuditLogsResponse, error)
	// 搜索审计日志
	SearchAuditLogs(ctx context.Context, req *SearchAuditLogsRequest) (*SearchAuditLogsResponse, error)
	// 获取审计统计
	GetAuditStats(ctx context.Context, req *GetAuditStatsRequest) (*GetAuditStatsResponse, error)
	// 清理旧的审计日志
	CleanupOldLogs(ctx context.Context, before time.Time) error
}

// ServiceManager 服务管理器接口
type ServiceManager interface {
	Auth() AuthService
	User() UserService
	Session() SessionService
	EmailVerification() EmailVerificationService
	SMSVerification() SMSVerificationService
	TwoFactor() TwoFactorService
	OAuth() OAuthService
	RateLimit() RateLimitService
	Token() TokenService
	Audit() AuditService
}

// HealthService 健康检查服务接口
type HealthService interface {
	// 检查服务健康状态
	CheckHealth(ctx context.Context) (*HealthCheckResponse, error)
	// 检查数据库连接
	CheckDatabase(ctx context.Context) error
	// 检查缓存连接
	CheckCache(ctx context.Context) error
	// 检查外部服务
	CheckExternalServices(ctx context.Context) (*ExternalServicesHealthResponse, error)
	// 获取服务信息
	GetServiceInfo(ctx context.Context) (*ServiceInfoResponse, error)
}

// NotificationService 通知服务接口
type NotificationService interface {
	// 发送邮件
	SendEmail(ctx context.Context, req *SendEmailRequest) error
	// 发送短信
	SendSMS(ctx context.Context, req *SendSMSRequest) error
	// 发送推送通知
	SendPushNotification(ctx context.Context, req *SendPushNotificationRequest) error
	// 获取通知模板
	GetNotificationTemplate(ctx context.Context, templateID string) (*NotificationTemplateResponse, error)
	// 渲染通知内容
	RenderNotification(ctx context.Context, req *RenderNotificationRequest) (*RenderNotificationResponse, error)
}

// CacheService 缓存服务接口
type CacheService interface {
	// 设置缓存
	Set(ctx context.Context, key string, value interface{}, expiration time.Duration) error
	// 获取缓存
	Get(ctx context.Context, key string) (interface{}, error)
	// 删除缓存
	Delete(ctx context.Context, key string) error
	// 检查缓存是否存在
	Exists(ctx context.Context, key string) (bool, error)
	// 设置过期时间
	Expire(ctx context.Context, key string, expiration time.Duration) error
	// 获取剩余过期时间
	TTL(ctx context.Context, key string) (time.Duration, error)
	// 批量设置
	MSet(ctx context.Context, pairs map[string]interface{}, expiration time.Duration) error
	// 批量获取
	MGet(ctx context.Context, keys []string) (map[string]interface{}, error)
	// 批量删除
	MDelete(ctx context.Context, keys []string) error
	// 清空缓存
	Flush(ctx context.Context) error
	// 获取缓存统计
	GetStats(ctx context.Context) (*CacheStatsResponse, error)
}

// ConfigService 配置服务接口
type ConfigService interface {
	// 获取配置
	GetConfig(ctx context.Context, key string) (interface{}, error)
	// 设置配置
	SetConfig(ctx context.Context, key string, value interface{}) error
	// 删除配置
	DeleteConfig(ctx context.Context, key string) error
	// 获取所有配置
	GetAllConfigs(ctx context.Context) (map[string]interface{}, error)
	// 重载配置
	ReloadConfig(ctx context.Context) error
	// 验证配置
	ValidateConfig(ctx context.Context, config map[string]interface{}) error
}

// MetricsService 指标服务接口
type MetricsService interface {
	// 记录指标
	RecordMetric(ctx context.Context, req *RecordMetricRequest) error
	// 获取指标
	GetMetrics(ctx context.Context, req *GetMetricsRequest) (*GetMetricsResponse, error)
	// 获取指标统计
	GetMetricStats(ctx context.Context, req *GetMetricStatsRequest) (*GetMetricStatsResponse, error)
	// 清理旧指标
	CleanupOldMetrics(ctx context.Context, before time.Time) error
}
