package dto

import (
	"time"

	"github.com/google/uuid"
)

// RegisterRequest 注册请求
type RegisterRequest struct {
	Username        string `json:"username" binding:"required,min=3,max=50" example:"johndoe"`
	Email           string `json:"email" binding:"required,email,max=255" example:"john@example.com"`
	Password        string `json:"password" binding:"required,min=8,max=128" example:"SecurePass123!"`
	ConfirmPassword string `json:"confirmPassword" binding:"required,eqfield=Password" example:"SecurePass123!"`
	PhoneNumber     string `json:"phoneNumber,omitempty" binding:"omitempty,e164" example:"+1234567890"`
	InviteCode      string `json:"inviteCode,omitempty" example:"INVITE123"`
	AcceptTerms     bool   `json:"acceptTerms" binding:"required" example:"true"`
}

// LoginRequest 登录请求
type LoginRequest struct {
	Identifier string `json:"identifier" binding:"required" example:"john@example.com"` // 用户名或邮箱
	Password   string `json:"password" binding:"required" example:"SecurePass123!"`
	RememberMe bool   `json:"rememberMe" example:"true"`
	DeviceInfo string `json:"deviceInfo,omitempty" example:"iPhone 12 Pro"`
}

// TwoFactorLoginRequest 双因素认证登录请求
type TwoFactorLoginRequest struct {
	Token      string `json:"token" binding:"required" example:"temp_token_123"`
	Code       string `json:"code" binding:"required,len=6" example:"123456"`
	BackupCode string `json:"backupCode,omitempty" example:"backup123"`
}

// RefreshTokenRequest 刷新令牌请求
type RefreshTokenRequest struct {
	RefreshToken string `json:"refreshToken" binding:"required" example:"refresh_token_123"`
}

// ChangePasswordRequest 修改密码请求
type ChangePasswordRequest struct {
	CurrentPassword string `json:"currentPassword" binding:"required" example:"OldPass123!"`
	NewPassword     string `json:"newPassword" binding:"required,min=8,max=128" example:"NewPass123!"`
	ConfirmPassword string `json:"confirmPassword" binding:"required,eqfield=NewPassword" example:"NewPass123!"`
}

// ResetPasswordRequest 重置密码请求
type ResetPasswordRequest struct {
	Email string `json:"email" binding:"required,email" example:"john@example.com"`
}

// ResetPasswordConfirmRequest 确认重置密码请求
type ResetPasswordConfirmRequest struct {
	Token           string `json:"token" binding:"required" example:"reset_token_123"`
	NewPassword     string `json:"newPassword" binding:"required,min=8,max=128" example:"NewPass123!"`
	ConfirmPassword string `json:"confirmPassword" binding:"required,eqfield=NewPassword" example:"NewPass123!"`
}

// VerifyEmailRequest 验证邮箱请求
type VerifyEmailRequest struct {
	Token string `json:"token" binding:"required" example:"verify_token_123"`
}

// ResendVerificationRequest 重发验证请求
type ResendVerificationRequest struct {
	Email string `json:"email" binding:"required,email" example:"john@example.com"`
	Type  string `json:"type" binding:"required,oneof=email sms" example:"email"`
}

// EnableTwoFactorRequest 启用双因素认证请求
type EnableTwoFactorRequest struct {
	Password string `json:"password" binding:"required" example:"SecurePass123!"`
}

// ConfirmTwoFactorRequest 确认双因素认证请求
type ConfirmTwoFactorRequest struct {
	Secret string `json:"secret" binding:"required" example:"JBSWY3DPEHPK3PXP"`
	Code   string `json:"code" binding:"required,len=6" example:"123456"`
}

// DisableTwoFactorRequest 禁用双因素认证请求
type DisableTwoFactorRequest struct {
	Password string `json:"password" binding:"required" example:"SecurePass123!"`
	Code     string `json:"code" binding:"required,len=6" example:"123456"`
}

// UpdateProfileRequest 更新个人资料请求
type UpdateProfileRequest struct {
	Username    string `json:"username,omitempty" binding:"omitempty,min=3,max=50" example:"johndoe"`
	PhoneNumber string `json:"phoneNumber,omitempty" binding:"omitempty,e164" example:"+1234567890"`
}

// OAuthCallbackRequest OAuth回调请求
type OAuthCallbackRequest struct {
	Code  string `json:"code" binding:"required" example:"oauth_code_123"`
	State string `json:"state" binding:"required" example:"state_123"`
}

// LinkOAuthRequest 关联OAuth账户请求
type LinkOAuthRequest struct {
	Provider string `json:"provider" binding:"required,oneof=google github discord" example:"google"`
	Code     string `json:"code" binding:"required" example:"oauth_code_123"`
	State    string `json:"state" binding:"required" example:"state_123"`
}

// UnlinkOAuthRequest 取消关联OAuth账户请求
type UnlinkOAuthRequest struct {
	Provider string `json:"provider" binding:"required,oneof=google github discord" example:"google"`
	Password string `json:"password" binding:"required" example:"SecurePass123!"`
}

// AuthResponse 认证响应
type AuthResponse struct {
	AccessToken          string    `json:"accessToken" example:"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."`
	RefreshToken         string    `json:"refreshToken" example:"refresh_token_123"`
	TokenType            string    `json:"tokenType" example:"Bearer"`
	ExpiresIn            int64     `json:"expiresIn" example:"86400"`
	ExpiresAt            time.Time `json:"expiresAt" example:"2024-01-01T12:00:00Z"`
	User                 UserInfo  `json:"user"`
	RequiresTwoFactor    bool      `json:"requiresTwoFactor,omitempty" example:"false"`
	TwoFactorToken       string    `json:"twoFactorToken,omitempty" example:"temp_token_123"`
	RequiresVerification bool      `json:"requiresVerification,omitempty" example:"false"`
}

// UserInfo 用户信息
type UserInfo struct {
	ID               uuid.UUID  `json:"id" example:"123e4567-e89b-12d3-a456-426614174000"`
	Username         string     `json:"username" example:"johndoe"`
	Email            string     `json:"email" example:"john@example.com"`
	EmailVerified    bool       `json:"emailVerified" example:"true"`
	PhoneNumber      *string    `json:"phoneNumber,omitempty" example:"+1234567890"`
	PhoneVerified    bool       `json:"phoneVerified" example:"false"`
	TwoFactorEnabled bool       `json:"twoFactorEnabled" example:"false"`
	Role             string     `json:"role" example:"user"`
	Status           string     `json:"status" example:"active"`
	LastLoginAt      *time.Time `json:"lastLoginAt,omitempty" example:"2024-01-01T12:00:00Z"`
	CreatedAt        time.Time  `json:"createdAt" example:"2024-01-01T12:00:00Z"`
	UpdatedAt        time.Time  `json:"updatedAt" example:"2024-01-01T12:00:00Z"`
}

// SessionInfo 会话信息
type SessionInfo struct {
	ID         uuid.UUID `json:"id" example:"123e4567-e89b-12d3-a456-426614174000"`
	DeviceInfo string    `json:"deviceInfo" example:"iPhone 12 Pro"`
	UserAgent  string    `json:"userAgent" example:"Mozilla/5.0..."`
	IPAddress  string    `json:"ipAddress" example:"192.168.1.1"`
	Location   *string   `json:"location,omitempty" example:"New York, US"`
	IsActive   bool      `json:"isActive" example:"true"`
	IsCurrent  bool      `json:"isCurrent" example:"true"`
	LastUsedAt time.Time `json:"lastUsedAt" example:"2024-01-01T12:00:00Z"`
	CreatedAt  time.Time `json:"createdAt" example:"2024-01-01T12:00:00Z"`
}

// TwoFactorSetupResponse 双因素认证设置响应
type TwoFactorSetupResponse struct {
	Secret      string   `json:"secret" example:"JBSWY3DPEHPK3PXP"`
	QRCodeURL   string   `json:"qrCodeUrl" example:"data:image/png;base64,..."`
	BackupCodes []string `json:"backupCodes" example:"[\"backup1\", \"backup2\"]"`
}

// OAuthURLResponse OAuth授权URL响应
type OAuthURLResponse struct {
	URL   string `json:"url" example:"https://accounts.google.com/oauth/authorize?..."`
	State string `json:"state" example:"state_123"`
}

// OAuthAccountInfo OAuth账户信息
type OAuthAccountInfo struct {
	Provider   string    `json:"provider" example:"google"`
	ProviderID string    `json:"providerId" example:"123456789"`
	Email      string    `json:"email" example:"john@gmail.com"`
	Name       string    `json:"name" example:"John Doe"`
	Avatar     *string   `json:"avatar,omitempty" example:"https://avatar.url"`
	LinkedAt   time.Time `json:"linkedAt" example:"2024-01-01T12:00:00Z"`
}

// AuditLogInfo 审计日志信息
type AuditLogInfo struct {
	ID        uuid.UUID `json:"id" example:"123e4567-e89b-12d3-a456-426614174000"`
	Action    string    `json:"action" example:"login"`
	Resource  string    `json:"resource" example:"auth"`
	Details   *string   `json:"details,omitempty" example:"Login successful"`
	IPAddress string    `json:"ipAddress" example:"192.168.1.1"`
	UserAgent string    `json:"userAgent" example:"Mozilla/5.0..."`
	Success   bool      `json:"success" example:"true"`
	ErrorMsg  *string   `json:"errorMsg,omitempty" example:"Invalid credentials"`
	CreatedAt time.Time `json:"createdAt" example:"2024-01-01T12:00:00Z"`
}

// PasswordStrengthResponse 密码强度响应
type PasswordStrengthResponse struct {
	Score        int      `json:"score" example:"4"`         // 0-4
	Strength     string   `json:"strength" example:"strong"` // weak, fair, good, strong
	Feedback     []string `json:"feedback" example:"[\"Add more variety\", \"Avoid common patterns\"]"`
	IsValid      bool     `json:"isValid" example:"true"`
	Requirements struct {
		MinLength      bool `json:"minLength" example:"true"`
		HasUppercase   bool `json:"hasUppercase" example:"true"`
		HasLowercase   bool `json:"hasLowercase" example:"true"`
		HasNumbers     bool `json:"hasNumbers" example:"true"`
		HasSpecialChar bool `json:"hasSpecialChar" example:"true"`
	} `json:"requirements"`
}

// SecuritySettingsResponse 安全设置响应
type SecuritySettingsResponse struct {
	TwoFactorEnabled    bool               `json:"twoFactorEnabled" example:"true"`
	EmailVerified       bool               `json:"emailVerified" example:"true"`
	PhoneVerified       bool               `json:"phoneVerified" example:"false"`
	ActiveSessions      int                `json:"activeSessions" example:"3"`
	LinkedOAuthAccounts []OAuthAccountInfo `json:"linkedOAuthAccounts"`
	PasswordLastChanged time.Time          `json:"passwordLastChanged" example:"2024-01-01T12:00:00Z"`
	RecentActivity      []AuditLogInfo     `json:"recentActivity"`
}

// RevokeSessionRequest 撤销会话请求
type RevokeSessionRequest struct {
	SessionID uuid.UUID `json:"sessionId" binding:"required" example:"123e4567-e89b-12d3-a456-426614174000"`
}

// RevokeAllSessionsRequest 撤销所有会话请求
type RevokeAllSessionsRequest struct {
	Password      string `json:"password" binding:"required" example:"SecurePass123!"`
	ExceptCurrent bool   `json:"exceptCurrent" example:"true"`
}

// HealthResponse 健康检查响应
type HealthResponse struct {
	Status    string                 `json:"status" example:"healthy"`
	Timestamp time.Time              `json:"timestamp" example:"2024-01-01T12:00:00Z"`
	Uptime    float64                `json:"uptime" example:"3600.5"`
	Version   string                 `json:"version" example:"1.0.0"`
	Checks    map[string]interface{} `json:"checks"`
}

// ErrorResponse 错误响应
type ErrorResponse struct {
	Error struct {
		Code      string                 `json:"code" example:"INVALID_CREDENTIALS"`
		Message   string                 `json:"message" example:"Invalid username or password"`
		Details   map[string]interface{} `json:"details,omitempty"`
		RequestID string                 `json:"requestId,omitempty" example:"req_123456"`
	} `json:"error"`
	Timestamp time.Time `json:"timestamp" example:"2024-01-01T12:00:00Z"`
}

// ValidationErrorResponse 验证错误响应
type ValidationErrorResponse struct {
	Error struct {
		Code      string            `json:"code" example:"VALIDATION_ERROR"`
		Message   string            `json:"message" example:"Validation failed"`
		Fields    map[string]string `json:"fields" example:"{\"email\": \"Invalid email format\", \"password\": \"Password too short\"}"`
		RequestID string            `json:"requestId,omitempty" example:"req_123456"`
	} `json:"error"`
	Timestamp time.Time `json:"timestamp" example:"2024-01-01T12:00:00Z"`
}

// SuccessResponse 成功响应
type SuccessResponse struct {
	Success   bool        `json:"success" example:"true"`
	Message   string      `json:"message" example:"Operation completed successfully"`
	Data      interface{} `json:"data,omitempty"`
	Timestamp time.Time   `json:"timestamp" example:"2024-01-01T12:00:00Z"`
}

// PaginationRequest 分页请求
type PaginationRequest struct {
	Page     int    `form:"page" binding:"omitempty,min=1" example:"1"`
	PageSize int    `form:"pageSize" binding:"omitempty,min=1,max=100" example:"20"`
	Sort     string `form:"sort" binding:"omitempty" example:"createdAt"`
	Order    string `form:"order" binding:"omitempty,oneof=asc desc" example:"desc"`
}

// PaginationResponse 分页响应
type PaginationResponse struct {
	Page       int         `json:"page" example:"1"`
	PageSize   int         `json:"pageSize" example:"20"`
	Total      int64       `json:"total" example:"100"`
	TotalPages int         `json:"totalPages" example:"5"`
	HasNext    bool        `json:"hasNext" example:"true"`
	HasPrev    bool        `json:"hasPrev" example:"false"`
	Data       interface{} `json:"data"`
}
