package service

import (
	"time"

	"github.com/snowfall-guild/backend/services/auth/internal/models"
)

// 认证服务请求和响应类型

// RegisterRequest 注册请求
type RegisterRequest struct {
	Username        string `json:"username" validate:"required,min=3,max=50"`
	Email           string `json:"email" validate:"required,email"`
	Password        string `json:"password" validate:"required,min=8"`
	ConfirmPassword string `json:"confirm_password" validate:"required,eqfield=Password"`
	Phone           string `json:"phone,omitempty" validate:"omitempty,phone"`
	FirstName       string `json:"first_name,omitempty" validate:"omitempty,max=50"`
	LastName        string `json:"last_name,omitempty" validate:"omitempty,max=50"`
	AvatarURL       string `json:"avatar_url,omitempty" validate:"omitempty,url"`
	Timezone        string `json:"timezone,omitempty"`
	Language        string `json:"language,omitempty"`
	IPAddress       string `json:"-"`
	UserAgent       string `json:"-"`
	DeviceID        string `json:"device_id,omitempty"`
	DeviceName      string `json:"device_name,omitempty"`
}

// RegisterResponse 注册响应
type RegisterResponse struct {
	User         *UserResponse `json:"user"`
	AccessToken  string        `json:"access_token,omitempty"`
	RefreshToken string        `json:"refresh_token,omitempty"`
	ExpiresIn    int64         `json:"expires_in,omitempty"`
	TokenType    string        `json:"token_type,omitempty"`
	Message      string        `json:"message"`
}

// LoginRequest 登录请求
type LoginRequest struct {
	Identifier    string `json:"identifier" validate:"required"` // 邮箱、用户名或手机号
	Password      string `json:"password" validate:"required"`
	RememberMe    bool   `json:"remember_me"`
	TwoFactorCode string `json:"two_factor_code,omitempty"`
	BackupCode    string `json:"backup_code,omitempty"`
	IPAddress     string `json:"-"`
	UserAgent     string `json:"-"`
	DeviceID      string `json:"device_id,omitempty"`
	DeviceName    string `json:"device_name,omitempty"`
}

// LoginResponse 登录响应
type LoginResponse struct {
	User               *UserResponse `json:"user"`
	AccessToken        string        `json:"access_token"`
	RefreshToken       string        `json:"refresh_token"`
	ExpiresIn          int64         `json:"expires_in"`
	TokenType          string        `json:"token_type"`
	RequiresTwoFactor  bool          `json:"requires_two_factor"`
	TwoFactorToken     string        `json:"two_factor_token,omitempty"`
	TwoFactorExpiresIn int64         `json:"two_factor_expires_in,omitempty"`
	SessionID          string        `json:"session_id"`
}

// RefreshTokenRequest 刷新令牌请求
type RefreshTokenRequest struct {
	RefreshToken string `json:"refresh_token" validate:"required"`
	IPAddress    string `json:"-"`
	UserAgent    string `json:"-"`
}

// RefreshTokenResponse 刷新令牌响应
type RefreshTokenResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	ExpiresIn    int64  `json:"expires_in"`
	TokenType    string `json:"token_type"`
}

// LogoutRequest 登出请求
type LogoutRequest struct {
	AccessToken  string `json:"access_token,omitempty"`
	RefreshToken string `json:"refresh_token,omitempty"`
	SessionID    string `json:"session_id,omitempty"`
	RevokeAll    bool   `json:"revoke_all"` // 是否撤销所有会话
}

// TokenValidationResponse 令牌验证响应
type TokenValidationResponse struct {
	Valid     bool          `json:"valid"`
	User      *UserResponse `json:"user,omitempty"`
	SessionID string        `json:"session_id,omitempty"`
	ExpiresAt time.Time     `json:"expires_at,omitempty"`
	Scopes    []string      `json:"scopes,omitempty"`
}

// UserInfoResponse 用户信息响应
type UserInfoResponse struct {
	User     *UserResponse      `json:"user"`
	Sessions []*SessionResponse `json:"sessions,omitempty"`
	Stats    *UserStatsResponse `json:"stats,omitempty"`
}

// 用户服务请求和响应类型

// CreateUserRequest 创建用户请求
type CreateUserRequest struct {
	Username  string                 `json:"username" validate:"required,min=3,max=50"`
	Email     string                 `json:"email" validate:"required,email"`
	Password  string                 `json:"password" validate:"required,min=8"`
	Phone     string                 `json:"phone,omitempty" validate:"omitempty,phone"`
	FirstName string                 `json:"first_name,omitempty" validate:"omitempty,max=50"`
	LastName  string                 `json:"last_name,omitempty" validate:"omitempty,max=50"`
	AvatarURL string                 `json:"avatar_url,omitempty" validate:"omitempty,url"`
	Role      models.UserRole        `json:"role,omitempty"`
	Status    models.UserStatus      `json:"status,omitempty"`
	Timezone  string                 `json:"timezone,omitempty"`
	Language  string                 `json:"language,omitempty"`
	Metadata  map[string]interface{} `json:"metadata,omitempty"`
}

// UpdateUserRequest 更新用户请求
type UpdateUserRequest struct {
	Username  *string                `json:"username,omitempty" validate:"omitempty,min=3,max=50"`
	Email     *string                `json:"email,omitempty" validate:"omitempty,email"`
	Phone     *string                `json:"phone,omitempty" validate:"omitempty,phone"`
	FirstName *string                `json:"first_name,omitempty" validate:"omitempty,max=50"`
	LastName  *string                `json:"last_name,omitempty" validate:"omitempty,max=50"`
	AvatarURL *string                `json:"avatar_url,omitempty" validate:"omitempty,url"`
	Timezone  *string                `json:"timezone,omitempty"`
	Language  *string                `json:"language,omitempty"`
	Metadata  map[string]interface{} `json:"metadata,omitempty"`
}

// UpdatePasswordRequest 更新密码请求
type UpdatePasswordRequest struct {
	CurrentPassword string `json:"current_password" validate:"required"`
	NewPassword     string `json:"new_password" validate:"required,min=8"`
	ConfirmPassword string `json:"confirm_password" validate:"required,eqfield=NewPassword"`
}

// UserResponse 用户响应
type UserResponse struct {
	ID               string                 `json:"id"`
	Username         string                 `json:"username"`
	Email            string                 `json:"email"`
	Phone            string                 `json:"phone,omitempty"`
	FirstName        string                 `json:"first_name,omitempty"`
	LastName         string                 `json:"last_name,omitempty"`
	AvatarURL        string                 `json:"avatar_url,omitempty"`
	Role             models.UserRole        `json:"role"`
	Status           models.UserStatus      `json:"status"`
	EmailVerified    bool                   `json:"email_verified"`
	PhoneVerified    bool                   `json:"phone_verified"`
	TwoFactorEnabled bool                   `json:"two_factor_enabled"`
	Timezone         string                 `json:"timezone,omitempty"`
	Language         string                 `json:"language,omitempty"`
	LastLoginAt      *time.Time             `json:"last_login_at,omitempty"`
	LoginAttempts    int                    `json:"login_attempts"`
	LockedUntil      *time.Time             `json:"locked_until,omitempty"`
	CreatedAt        time.Time              `json:"created_at"`
	UpdatedAt        time.Time              `json:"updated_at"`
	Metadata         map[string]interface{} `json:"metadata,omitempty"`
}

// ListUsersRequest 用户列表请求
type ListUsersRequest struct {
	Page     int                `json:"page" validate:"min=1"`
	PageSize int                `json:"page_size" validate:"min=1,max=100"`
	Search   string             `json:"search,omitempty"`
	Role     *models.UserRole   `json:"role,omitempty"`
	Status   *models.UserStatus `json:"status,omitempty"`
	SortBy   string             `json:"sort_by,omitempty"`
	SortDesc bool               `json:"sort_desc"`
}

// ListUsersResponse 用户列表响应
type ListUsersResponse struct {
	Users      []*UserResponse `json:"users"`
	Total      int64           `json:"total"`
	Page       int             `json:"page"`
	PageSize   int             `json:"page_size"`
	TotalPages int             `json:"total_pages"`
}

// UserStatsResponse 用户统计响应
type UserStatsResponse struct {
	TotalSessions    int64      `json:"total_sessions"`
	ActiveSessions   int64      `json:"active_sessions"`
	LastLoginAt      *time.Time `json:"last_login_at,omitempty"`
	LoginCount       int64      `json:"login_count"`
	FailedLoginCount int64      `json:"failed_login_count"`
	CreatedAt        time.Time  `json:"created_at"`
}

// 会话服务请求和响应类型

// CreateSessionRequest 创建会话请求
type CreateSessionRequest struct {
	UserID     string `json:"user_id" validate:"required"`
	IPAddress  string `json:"ip_address" validate:"required"`
	UserAgent  string `json:"user_agent" validate:"required"`
	DeviceID   string `json:"device_id,omitempty"`
	DeviceName string `json:"device_name,omitempty"`
	RememberMe bool   `json:"remember_me"`
}

// UpdateSessionRequest 更新会话请求
type UpdateSessionRequest struct {
	LastUsedAt *time.Time `json:"last_used_at,omitempty"`
	IPAddress  *string    `json:"ip_address,omitempty"`
	UserAgent  *string    `json:"user_agent,omitempty"`
}

// SessionResponse 会话响应
type SessionResponse struct {
	ID           string     `json:"id"`
	UserID       string     `json:"user_id"`
	RefreshToken string     `json:"refresh_token,omitempty"`
	IPAddress    string     `json:"ip_address"`
	UserAgent    string     `json:"user_agent"`
	DeviceID     string     `json:"device_id,omitempty"`
	DeviceName   string     `json:"device_name,omitempty"`
	IsRevoked    bool       `json:"is_revoked"`
	ExpiresAt    time.Time  `json:"expires_at"`
	LastUsedAt   *time.Time `json:"last_used_at,omitempty"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
}

// 邮箱验证服务请求和响应类型

// SendVerificationEmailRequest 发送验证邮件请求
type SendVerificationEmailRequest struct {
	Email  string                       `json:"email" validate:"required,email"`
	UserID string                       `json:"user_id,omitempty"`
	Type   models.EmailVerificationType `json:"type" validate:"required"`
	Data   map[string]interface{}       `json:"data,omitempty"`
}

// VerifyEmailRequest 验证邮箱请求
type VerifyEmailRequest struct {
	Token string `json:"token" validate:"required"`
	Code  string `json:"code,omitempty"`
}

// VerificationStatusResponse 验证状态响应
type VerificationStatusResponse struct {
	Email     string     `json:"email"`
	Verified  bool       `json:"verified"`
	ExpiresAt *time.Time `json:"expires_at,omitempty"`
	Attempts  int        `json:"attempts"`
}

// PasswordResetTokenResponse 密码重置令牌响应
type PasswordResetTokenResponse struct {
	Valid     bool      `json:"valid"`
	Email     string    `json:"email,omitempty"`
	ExpiresAt time.Time `json:"expires_at,omitempty"`
}

// ResetPasswordRequest 重置密码请求
type ResetPasswordRequest struct {
	Token           string `json:"token" validate:"required"`
	NewPassword     string `json:"new_password" validate:"required,min=8"`
	ConfirmPassword string `json:"confirm_password" validate:"required,eqfield=NewPassword"`
}

// 短信验证服务请求和响应类型

// SendVerificationSMSRequest 发送验证短信请求
type SendVerificationSMSRequest struct {
	Phone  string                     `json:"phone" validate:"required,phone"`
	UserID string                     `json:"user_id,omitempty"`
	Type   models.SMSVerificationType `json:"type" validate:"required"`
	Data   map[string]interface{}     `json:"data,omitempty"`
}

// VerifySMSRequest 验证短信请求
type VerifySMSRequest struct {
	Phone string `json:"phone" validate:"required,phone"`
	Code  string `json:"code" validate:"required"`
}

// SMSVerificationStatusResponse 短信验证状态响应
type SMSVerificationStatusResponse struct {
	Phone     string     `json:"phone"`
	Verified  bool       `json:"verified"`
	ExpiresAt *time.Time `json:"expires_at,omitempty"`
	Attempts  int        `json:"attempts"`
}

// VerifyPasswordResetSMSRequest 验证密码重置短信请求
type VerifyPasswordResetSMSRequest struct {
	Phone string `json:"phone" validate:"required,phone"`
	Code  string `json:"code" validate:"required"`
}

// PasswordResetSMSResponse 密码重置短信响应
type PasswordResetSMSResponse struct {
	Valid     bool      `json:"valid"`
	Phone     string    `json:"phone,omitempty"`
	ExpiresAt time.Time `json:"expires_at,omitempty"`
	Token     string    `json:"token,omitempty"`
}

// 双因素认证服务请求和响应类型

// EnableTwoFactorResponse 启用双因素认证响应
type EnableTwoFactorResponse struct {
	Secret      string   `json:"secret"`
	QRCodeURL   string   `json:"qr_code_url"`
	BackupCodes []string `json:"backup_codes"`
}

// ConfirmEnableTwoFactorRequest 确认启用双因素认证请求
type ConfirmEnableTwoFactorRequest struct {
	UserID string `json:"user_id" validate:"required"`
	Code   string `json:"code" validate:"required"`
	Secret string `json:"secret" validate:"required"`
}

// ConfirmEnableTwoFactorResponse 确认启用双因素认证响应
type ConfirmEnableTwoFactorResponse struct {
	Enabled     bool     `json:"enabled"`
	BackupCodes []string `json:"backup_codes"`
}

// DisableTwoFactorRequest 禁用双因素认证请求
type DisableTwoFactorRequest struct {
	UserID   string `json:"user_id" validate:"required"`
	Password string `json:"password" validate:"required"`
	Code     string `json:"code,omitempty"`
}

// VerifyTwoFactorRequest 验证双因素认证请求
type VerifyTwoFactorRequest struct {
	UserID     string `json:"user_id" validate:"required"`
	Code       string `json:"code,omitempty"`
	BackupCode string `json:"backup_code,omitempty"`
}

// VerifyTwoFactorResponse 验证双因素认证响应
type VerifyTwoFactorResponse struct {
	Valid          bool   `json:"valid"`
	BackupCodeUsed bool   `json:"backup_code_used"`
	RemainingCodes int    `json:"remaining_codes,omitempty"`
	Token          string `json:"token,omitempty"`
}

// GenerateBackupCodesResponse 生成备份码响应
type GenerateBackupCodesResponse struct {
	BackupCodes []string `json:"backup_codes"`
}

// UseBackupCodeRequest 使用备份码请求
type UseBackupCodeRequest struct {
	UserID     string `json:"user_id" validate:"required"`
	BackupCode string `json:"backup_code" validate:"required"`
}

// UseBackupCodeResponse 使用备份码响应
type UseBackupCodeResponse struct {
	Valid          bool `json:"valid"`
	RemainingCodes int  `json:"remaining_codes"`
}

// TwoFactorStatusResponse 双因素认证状态响应
type TwoFactorStatusResponse struct {
	Enabled     bool       `json:"enabled"`
	BackupCodes int        `json:"backup_codes"`
	LastUsedAt  *time.Time `json:"last_used_at,omitempty"`
}

// OAuth服务请求和响应类型

// GetAuthURLRequest 获取授权URL请求
type GetAuthURLRequest struct {
	Provider    string   `json:"provider" validate:"required"`
	RedirectURI string   `json:"redirect_uri" validate:"required,url"`
	State       string   `json:"state,omitempty"`
	Scopes      []string `json:"scopes,omitempty"`
}

// GetAuthURLResponse 获取授权URL响应
type GetAuthURLResponse struct {
	AuthURL string `json:"auth_url"`
	State   string `json:"state"`
}

// HandleCallbackRequest 处理回调请求
type HandleCallbackRequest struct {
	Provider string `json:"provider" validate:"required"`
	Code     string `json:"code" validate:"required"`
	State    string `json:"state,omitempty"`
}

// HandleCallbackResponse 处理回调响应
type HandleCallbackResponse struct {
	User         *UserResponse `json:"user"`
	AccessToken  string        `json:"access_token"`
	RefreshToken string        `json:"refresh_token"`
	ExpiresIn    int64         `json:"expires_in"`
	TokenType    string        `json:"token_type"`
	IsNewUser    bool          `json:"is_new_user"`
}

// BindOAuthAccountRequest 绑定OAuth账户请求
type BindOAuthAccountRequest struct {
	UserID      string `json:"user_id" validate:"required"`
	Provider    string `json:"provider" validate:"required"`
	Code        string `json:"code" validate:"required"`
	RedirectURI string `json:"redirect_uri" validate:"required,url"`
}

// UnbindOAuthAccountRequest 解绑OAuth账户请求
type UnbindOAuthAccountRequest struct {
	UserID   string `json:"user_id" validate:"required"`
	Provider string `json:"provider" validate:"required"`
}

// OAuthAccountResponse OAuth账户响应
type OAuthAccountResponse struct {
	ID          string     `json:"id"`
	Provider    string     `json:"provider"`
	ProviderID  string     `json:"provider_id"`
	Email       string     `json:"email,omitempty"`
	Name        string     `json:"name,omitempty"`
	AvatarURL   string     `json:"avatar_url,omitempty"`
	Scopes      []string   `json:"scopes,omitempty"`
	TokenExpiry *time.Time `json:"token_expiry,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

// RefreshOAuthTokenRequest 刷新OAuth令牌请求
type RefreshOAuthTokenRequest struct {
	UserID   string `json:"user_id" validate:"required"`
	Provider string `json:"provider" validate:"required"`
}

// RefreshOAuthTokenResponse 刷新OAuth令牌响应
type RefreshOAuthTokenResponse struct {
	AccessToken string    `json:"access_token"`
	ExpiresIn   int64     `json:"expires_in"`
	ExpiresAt   time.Time `json:"expires_at"`
}

// 限流服务请求和响应类型

// CheckRateLimitRequest 检查限流请求
type CheckRateLimitRequest struct {
	Key       string        `json:"key" validate:"required"`
	Limit     int           `json:"limit" validate:"required,min=1"`
	Window    time.Duration `json:"window" validate:"required"`
	IPAddress string        `json:"ip_address,omitempty"`
	UserID    string        `json:"user_id,omitempty"`
}

// CheckRateLimitResponse 检查限流响应
type CheckRateLimitResponse struct {
	Allowed    bool          `json:"allowed"`
	Limit      int           `json:"limit"`
	Remaining  int           `json:"remaining"`
	ResetTime  time.Time     `json:"reset_time"`
	RetryAfter time.Duration `json:"retry_after,omitempty"`
}

// RateLimitStatusResponse 限流状态响应
type RateLimitStatusResponse struct {
	Key       string    `json:"key"`
	Count     int       `json:"count"`
	Limit     int       `json:"limit"`
	Remaining int       `json:"remaining"`
	ExpiresAt time.Time `json:"expires_at"`
}

// GetRateLimitStatsRequest 获取限流统计请求
type GetRateLimitStatsRequest struct {
	StartTime time.Time `json:"start_time"`
	EndTime   time.Time `json:"end_time"`
	GroupBy   string    `json:"group_by,omitempty"` // ip, user, key
	Limit     int       `json:"limit,omitempty"`
}

// GetRateLimitStatsResponse 获取限流统计响应
type GetRateLimitStatsResponse struct {
	Stats []RateLimitStat `json:"stats"`
	Total int64           `json:"total"`
}

// RateLimitStat 限流统计
type RateLimitStat struct {
	Key   string `json:"key"`
	Count int64  `json:"count"`
	Label string `json:"label,omitempty"`
}

// 令牌服务请求和响应类型

// GenerateTokenPairRequest 生成令牌对请求
type GenerateTokenPairRequest struct {
	UserID    string                 `json:"user_id" validate:"required"`
	SessionID string                 `json:"session_id" validate:"required"`
	DeviceID  string                 `json:"device_id,omitempty"`
	Scopes    []string               `json:"scopes,omitempty"`
	Metadata  map[string]interface{} `json:"metadata,omitempty"`
}

// GenerateTokenPairResponse 生成令牌对响应
type GenerateTokenPairResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	ExpiresIn    int64  `json:"expires_in"`
	TokenType    string `json:"token_type"`
}

// ValidateTokenResponse 验证令牌响应
type ValidateTokenResponse struct {
	Valid     bool                   `json:"valid"`
	UserID    string                 `json:"user_id,omitempty"`
	SessionID string                 `json:"session_id,omitempty"`
	DeviceID  string                 `json:"device_id,omitempty"`
	Scopes    []string               `json:"scopes,omitempty"`
	ExpiresAt time.Time              `json:"expires_at,omitempty"`
	IssuedAt  time.Time              `json:"issued_at,omitempty"`
	Metadata  map[string]interface{} `json:"metadata,omitempty"`
}

// RefreshTokensResponse 刷新令牌响应
type RefreshTokensResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	ExpiresIn    int64  `json:"expires_in"`
	TokenType    string `json:"token_type"`
}

// TokenInfoResponse 令牌信息响应
type TokenInfoResponse struct {
	TokenID   string                 `json:"token_id"`
	UserID    string                 `json:"user_id"`
	SessionID string                 `json:"session_id"`
	DeviceID  string                 `json:"device_id,omitempty"`
	TokenType string                 `json:"token_type"`
	Scopes    []string               `json:"scopes,omitempty"`
	IssuedAt  time.Time              `json:"issued_at"`
	ExpiresAt time.Time              `json:"expires_at"`
	IsRevoked bool                   `json:"is_revoked"`
	Metadata  map[string]interface{} `json:"metadata,omitempty"`
}

// 审计服务请求和响应类型

// LogActionRequest 记录审计日志请求
type LogActionRequest struct {
	UserID       string                 `json:"user_id,omitempty"`
	Action       string                 `json:"action" validate:"required"`
	Resource     string                 `json:"resource" validate:"required"`
	ResourceID   string                 `json:"resource_id,omitempty"`
	IPAddress    string                 `json:"ip_address,omitempty"`
	UserAgent    string                 `json:"user_agent,omitempty"`
	Details      map[string]interface{} `json:"details,omitempty"`
	Result       string                 `json:"result,omitempty"`
	ErrorMessage string                 `json:"error_message,omitempty"`
}

// GetAuditLogsRequest 获取审计日志请求
type GetAuditLogsRequest struct {
	Page      int       `json:"page" validate:"min=1"`
	PageSize  int       `json:"page_size" validate:"min=1,max=100"`
	UserID    string    `json:"user_id,omitempty"`
	Action    string    `json:"action,omitempty"`
	Resource  string    `json:"resource,omitempty"`
	IPAddress string    `json:"ip_address,omitempty"`
	StartTime time.Time `json:"start_time,omitempty"`
	EndTime   time.Time `json:"end_time,omitempty"`
	SortBy    string    `json:"sort_by,omitempty"`
	SortDesc  bool      `json:"sort_desc"`
}

// GetAuditLogsResponse 获取审计日志响应
type GetAuditLogsResponse struct {
	Logs       []*AuditLogResponse `json:"logs"`
	Total      int64               `json:"total"`
	Page       int                 `json:"page"`
	PageSize   int                 `json:"page_size"`
	TotalPages int                 `json:"total_pages"`
}

// GetUserAuditLogsRequest 获取用户审计日志请求
type GetUserAuditLogsRequest struct {
	Page      int       `json:"page" validate:"min=1"`
	PageSize  int       `json:"page_size" validate:"min=1,max=100"`
	Action    string    `json:"action,omitempty"`
	Resource  string    `json:"resource,omitempty"`
	StartTime time.Time `json:"start_time,omitempty"`
	EndTime   time.Time `json:"end_time,omitempty"`
}

// GetUserAuditLogsResponse 获取用户审计日志响应
type GetUserAuditLogsResponse struct {
	Logs       []*AuditLogResponse `json:"logs"`
	Total      int64               `json:"total"`
	Page       int                 `json:"page"`
	PageSize   int                 `json:"page_size"`
	TotalPages int                 `json:"total_pages"`
}

// SearchAuditLogsRequest 搜索审计日志请求
type SearchAuditLogsRequest struct {
	Query    string `json:"query" validate:"required"`
	Page     int    `json:"page" validate:"min=1"`
	PageSize int    `json:"page_size" validate:"min=1,max=100"`
}

// SearchAuditLogsResponse 搜索审计日志响应
type SearchAuditLogsResponse struct {
	Logs       []*AuditLogResponse `json:"logs"`
	Total      int64               `json:"total"`
	Page       int                 `json:"page"`
	PageSize   int                 `json:"page_size"`
	TotalPages int                 `json:"total_pages"`
}

// AuditLogResponse 审计日志响应
type AuditLogResponse struct {
	ID           string                 `json:"id"`
	UserID       string                 `json:"user_id,omitempty"`
	Action       string                 `json:"action"`
	Resource     string                 `json:"resource"`
	ResourceID   string                 `json:"resource_id,omitempty"`
	IPAddress    string                 `json:"ip_address,omitempty"`
	UserAgent    string                 `json:"user_agent,omitempty"`
	Details      map[string]interface{} `json:"details,omitempty"`
	Result       string                 `json:"result,omitempty"`
	ErrorMessage string                 `json:"error_message,omitempty"`
	CreatedAt    time.Time              `json:"created_at"`
}

// GetAuditStatsRequest 获取审计统计请求
type GetAuditStatsRequest struct {
	StartTime time.Time `json:"start_time"`
	EndTime   time.Time `json:"end_time"`
	GroupBy   string    `json:"group_by,omitempty"` // action, resource, user, hour, day
}

// GetAuditStatsResponse 获取审计统计响应
type GetAuditStatsResponse struct {
	Stats []AuditStat `json:"stats"`
	Total int64       `json:"total"`
}

// AuditStat 审计统计
type AuditStat struct {
	Key   string `json:"key"`
	Count int64  `json:"count"`
	Label string `json:"label,omitempty"`
}

// 健康检查和其他服务类型

// HealthCheckResponse 健康检查响应
type HealthCheckResponse struct {
	Status    string            `json:"status"`
	Timestamp time.Time         `json:"timestamp"`
	Version   string            `json:"version"`
	Uptime    time.Duration     `json:"uptime"`
	Checks    map[string]string `json:"checks"`
}

// ExternalServicesHealthResponse 外部服务健康检查响应
type ExternalServicesHealthResponse struct {
	Database bool              `json:"database"`
	Cache    bool              `json:"cache"`
	Email    bool              `json:"email"`
	SMS      bool              `json:"sms"`
	OAuth    map[string]bool   `json:"oauth"`
	Details  map[string]string `json:"details,omitempty"`
}

// ServiceInfoResponse 服务信息响应
type ServiceInfoResponse struct {
	Name        string                 `json:"name"`
	Version     string                 `json:"version"`
	Environment string                 `json:"environment"`
	StartTime   time.Time              `json:"start_time"`
	Uptime      time.Duration          `json:"uptime"`
	Metadata    map[string]interface{} `json:"metadata,omitempty"`
}

// 通知服务类型

// SendEmailRequest 发送邮件请求
type SendEmailRequest struct {
	To           []string               `json:"to" validate:"required"`
	CC           []string               `json:"cc,omitempty"`
	BCC          []string               `json:"bcc,omitempty"`
	Subject      string                 `json:"subject" validate:"required"`
	Body         string                 `json:"body" validate:"required"`
	IsHTML       bool                   `json:"is_html"`
	TemplateID   string                 `json:"template_id,omitempty"`
	TemplateData map[string]interface{} `json:"template_data,omitempty"`
	Attachments  []EmailAttachment      `json:"attachments,omitempty"`
}

// EmailAttachment 邮件附件
type EmailAttachment struct {
	Filename string `json:"filename"`
	Content  []byte `json:"content"`
	MimeType string `json:"mime_type"`
}

// SendSMSRequest 发送短信请求
type SendSMSRequest struct {
	To           []string               `json:"to" validate:"required"`
	Message      string                 `json:"message" validate:"required"`
	TemplateID   string                 `json:"template_id,omitempty"`
	TemplateData map[string]interface{} `json:"template_data,omitempty"`
}

// SendPushNotificationRequest 发送推送通知请求
type SendPushNotificationRequest struct {
	UserIDs  []string               `json:"user_ids" validate:"required"`
	Title    string                 `json:"title" validate:"required"`
	Body     string                 `json:"body" validate:"required"`
	Data     map[string]interface{} `json:"data,omitempty"`
	ImageURL string                 `json:"image_url,omitempty"`
}

// NotificationTemplateResponse 通知模板响应
type NotificationTemplateResponse struct {
	ID        string                 `json:"id"`
	Name      string                 `json:"name"`
	Type      string                 `json:"type"`
	Subject   string                 `json:"subject,omitempty"`
	Body      string                 `json:"body"`
	Variables []string               `json:"variables,omitempty"`
	Metadata  map[string]interface{} `json:"metadata,omitempty"`
}

// RenderNotificationRequest 渲染通知内容请求
type RenderNotificationRequest struct {
	TemplateID string                 `json:"template_id" validate:"required"`
	Data       map[string]interface{} `json:"data" validate:"required"`
}

// RenderNotificationResponse 渲染通知内容响应
type RenderNotificationResponse struct {
	Subject string `json:"subject,omitempty"`
	Body    string `json:"body"`
}

// 缓存服务类型

// CacheStatsResponse 缓存统计响应
type CacheStatsResponse struct {
	Hits        int64         `json:"hits"`
	Misses      int64         `json:"misses"`
	HitRate     float64       `json:"hit_rate"`
	Keys        int64         `json:"keys"`
	MemoryUsage int64         `json:"memory_usage"`
	Uptime      time.Duration `json:"uptime"`
}

// 指标服务类型

// RecordMetricRequest 记录指标请求
type RecordMetricRequest struct {
	Name      string            `json:"name" validate:"required"`
	Value     float64           `json:"value" validate:"required"`
	Tags      map[string]string `json:"tags,omitempty"`
	Timestamp time.Time         `json:"timestamp,omitempty"`
}

// GetMetricsRequest 获取指标请求
type GetMetricsRequest struct {
	Name      string            `json:"name" validate:"required"`
	Tags      map[string]string `json:"tags,omitempty"`
	StartTime time.Time         `json:"start_time"`
	EndTime   time.Time         `json:"end_time"`
	Interval  time.Duration     `json:"interval,omitempty"`
}

// GetMetricsResponse 获取指标响应
type GetMetricsResponse struct {
	Metrics []MetricPoint `json:"metrics"`
	Total   int64         `json:"total"`
}

// MetricPoint 指标点
type MetricPoint struct {
	Timestamp time.Time         `json:"timestamp"`
	Value     float64           `json:"value"`
	Tags      map[string]string `json:"tags,omitempty"`
}

// GetMetricStatsRequest 获取指标统计请求
type GetMetricStatsRequest struct {
	Name        string            `json:"name" validate:"required"`
	Tags        map[string]string `json:"tags,omitempty"`
	StartTime   time.Time         `json:"start_time"`
	EndTime     time.Time         `json:"end_time"`
	Aggregation string            `json:"aggregation,omitempty"` // sum, avg, min, max, count
}

// GetMetricStatsResponse 获取指标统计响应
type GetMetricStatsResponse struct {
	Sum   float64 `json:"sum"`
	Avg   float64 `json:"avg"`
	Min   float64 `json:"min"`
	Max   float64 `json:"max"`
	Count int64   `json:"count"`
}
