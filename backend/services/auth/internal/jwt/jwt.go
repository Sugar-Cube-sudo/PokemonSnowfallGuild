package jwt

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/snowfall-guild/backend/services/auth/internal/config"
)

// TokenType 令牌类型
type TokenType string

const (
	TokenTypeAccess    TokenType = "access"
	TokenTypeRefresh   TokenType = "refresh"
	TokenTypeTwoFactor TokenType = "two_factor"
)

// Claims JWT声明
type Claims struct {
	UserID    string    `json:"user_id"`
	Username  string    `json:"username"`
	Email     string    `json:"email"`
	Role      string    `json:"role"`
	TokenType TokenType `json:"token_type"`
	SessionID string    `json:"session_id,omitempty"`
	DeviceID  string    `json:"device_id,omitempty"`
	jwt.RegisteredClaims
}

// TokenPair 令牌对
type TokenPair struct {
	AccessToken  string    `json:"access_token"`
	RefreshToken string    `json:"refresh_token"`
	TokenType    string    `json:"token_type"`
	ExpiresIn    int64     `json:"expires_in"`
	ExpiresAt    time.Time `json:"expires_at"`
}

// TwoFactorToken 双因素认证令牌
type TwoFactorToken struct {
	Token     string    `json:"token"`
	UserID    string    `json:"user_id"`
	ExpiresAt time.Time `json:"expires_at"`
}

// JWTManager JWT管理器
type JWTManager struct {
	config *config.Config
}

// NewJWTManager 创建JWT管理器
func NewJWTManager(cfg *config.Config) *JWTManager {
	return &JWTManager{
		config: cfg,
	}
}

// GenerateTokenPair 生成令牌对
func (j *JWTManager) GenerateTokenPair(userID, username, email, role, sessionID, deviceID string) (*TokenPair, error) {
	now := time.Now().UTC()
	accessTokenID := uuid.New().String()
	refreshTokenID := uuid.New().String()

	// 生成访问令牌
	accessClaims := &Claims{
		UserID:    userID,
		Username:  username,
		Email:     email,
		Role:      role,
		TokenType: TokenTypeAccess,
		SessionID: sessionID,
		DeviceID:  deviceID,
		RegisteredClaims: jwt.RegisteredClaims{
			ID:        accessTokenID,
			Issuer:    j.config.JWT.Issuer,
			Audience:  []string{j.config.JWT.Audience},
			Subject:   userID,
			IssuedAt:  jwt.NewNumericDate(now),
			NotBefore: jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(j.config.JWT.AccessTokenExpiry)),
		},
	}

	accessToken, err := j.generateToken(accessClaims)
	if err != nil {
		return nil, fmt.Errorf("failed to generate access token: %w", err)
	}

	// 生成刷新令牌
	refreshClaims := &Claims{
		UserID:    userID,
		Username:  username,
		Email:     email,
		Role:      role,
		TokenType: TokenTypeRefresh,
		SessionID: sessionID,
		DeviceID:  deviceID,
		RegisteredClaims: jwt.RegisteredClaims{
			ID:        refreshTokenID,
			Issuer:    j.config.JWT.Issuer,
			Audience:  []string{j.config.JWT.Audience},
			Subject:   userID,
			IssuedAt:  jwt.NewNumericDate(now),
			NotBefore: jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(j.config.JWT.RefreshTokenExpiry)),
		},
	}

	refreshToken, err := j.generateToken(refreshClaims)
	if err != nil {
		return nil, fmt.Errorf("failed to generate refresh token: %w", err)
	}

	return &TokenPair{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		TokenType:    "Bearer",
		ExpiresIn:    int64(j.config.JWT.AccessTokenExpiry.Seconds()),
		ExpiresAt:    now.Add(j.config.JWT.AccessTokenExpiry),
	}, nil
}

// GenerateTwoFactorToken 生成双因素认证令牌
func (j *JWTManager) GenerateTwoFactorToken(userID, username, email, role string) (*TwoFactorToken, error) {
	now := time.Now().UTC()
	tokenID := uuid.New().String()

	claims := &Claims{
		UserID:    userID,
		Username:  username,
		Email:     email,
		Role:      role,
		TokenType: TokenTypeTwoFactor,
		RegisteredClaims: jwt.RegisteredClaims{
			ID:        tokenID,
			Issuer:    j.config.JWT.Issuer,
			Audience:  []string{j.config.JWT.Audience},
			Subject:   userID,
			IssuedAt:  jwt.NewNumericDate(now),
			NotBefore: jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(j.config.JWT.TwoFactorTokenExpiry)),
		},
	}

	token, err := j.generateToken(claims)
	if err != nil {
		return nil, fmt.Errorf("failed to generate two factor token: %w", err)
	}

	return &TwoFactorToken{
		Token:     token,
		UserID:    userID,
		ExpiresAt: now.Add(j.config.JWT.TwoFactorTokenExpiry),
	}, nil
}

// ValidateToken 验证令牌
func (j *JWTManager) ValidateToken(tokenString string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		// 验证签名方法
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(j.config.JWT.SecretKey), nil
	})

	if err != nil {
		return nil, fmt.Errorf("failed to parse token: %w", err)
	}

	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, fmt.Errorf("invalid token")
	}

	// 验证发行者
	if claims.RegisteredClaims.Issuer != j.config.JWT.Issuer {
		return nil, fmt.Errorf("invalid issuer")
	}

	// 验证受众
	if len(claims.RegisteredClaims.Audience) == 0 || claims.RegisteredClaims.Audience[0] != j.config.JWT.Audience {
		return nil, fmt.Errorf("invalid audience")
	}

	return claims, nil
}

// RefreshToken 刷新令牌
func (j *JWTManager) RefreshToken(refreshTokenString string) (*TokenPair, error) {
	claims, err := j.ValidateToken(refreshTokenString)
	if err != nil {
		return nil, fmt.Errorf("invalid refresh token: %w", err)
	}

	// 验证令牌类型
	if claims.TokenType != TokenTypeRefresh {
		return nil, fmt.Errorf("invalid token type")
	}

	// 生成新的令牌对
	return j.GenerateTokenPair(
		claims.UserID,
		claims.Username,
		claims.Email,
		claims.Role,
		claims.SessionID,
		claims.DeviceID,
	)
}

// GetTokenHash 获取令牌哈希
func (j *JWTManager) GetTokenHash(tokenString string) string {
	hash := sha256.Sum256([]byte(tokenString))
	return hex.EncodeToString(hash[:])
}

// ExtractTokenFromHeader 从请求头中提取令牌
func (j *JWTManager) ExtractTokenFromHeader(authHeader string) (string, error) {
	if authHeader == "" {
		return "", fmt.Errorf("authorization header is required")
	}

	const bearerPrefix = "Bearer "
	if len(authHeader) < len(bearerPrefix) || authHeader[:len(bearerPrefix)] != bearerPrefix {
		return "", fmt.Errorf("invalid authorization header format")
	}

	return authHeader[len(bearerPrefix):], nil
}

// GetTokenClaims 获取令牌声明（不验证过期时间）
func (j *JWTManager) GetTokenClaims(tokenString string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(j.config.JWT.SecretKey), nil
	}, jwt.WithoutClaimsValidation())

	if err != nil {
		return nil, fmt.Errorf("failed to parse token: %w", err)
	}

	claims, ok := token.Claims.(*Claims)
	if !ok {
		return nil, fmt.Errorf("invalid token claims")
	}

	return claims, nil
}

// IsTokenExpired 检查令牌是否过期
func (j *JWTManager) IsTokenExpired(claims *Claims) bool {
	if claims.RegisteredClaims.ExpiresAt == nil {
		return true
	}
	return claims.RegisteredClaims.ExpiresAt.Time.Before(time.Now().UTC())
}

// GetTokenExpiry 获取令牌过期时间
func (j *JWTManager) GetTokenExpiry(claims *Claims) time.Time {
	if claims.RegisteredClaims.ExpiresAt == nil {
		return time.Time{}
	}
	return claims.RegisteredClaims.ExpiresAt.Time
}

// GetTokenID 获取令牌ID
func (j *JWTManager) GetTokenID(claims *Claims) string {
	return claims.RegisteredClaims.ID
}

// GetUserID 获取用户ID
func (j *JWTManager) GetUserID(claims *Claims) string {
	return claims.UserID
}

// GetSessionID 获取会话ID
func (j *JWTManager) GetSessionID(claims *Claims) string {
	return claims.SessionID
}

// GetDeviceID 获取设备ID
func (j *JWTManager) GetDeviceID(claims *Claims) string {
	return claims.DeviceID
}

// GetTokenType 获取令牌类型
func (j *JWTManager) GetTokenType(claims *Claims) TokenType {
	return claims.TokenType
}

// generateToken 生成令牌
func (j *JWTManager) generateToken(claims *Claims) (string, error) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(j.config.JWT.SecretKey))
}

// ValidateAccessToken 验证访问令牌
func (j *JWTManager) ValidateAccessToken(tokenString string) (*Claims, error) {
	claims, err := j.ValidateToken(tokenString)
	if err != nil {
		return nil, err
	}

	if claims.TokenType != TokenTypeAccess {
		return nil, fmt.Errorf("invalid token type: expected access token")
	}

	return claims, nil
}

// ValidateRefreshToken 验证刷新令牌
func (j *JWTManager) ValidateRefreshToken(tokenString string) (*Claims, error) {
	claims, err := j.ValidateToken(tokenString)
	if err != nil {
		return nil, err
	}

	if claims.TokenType != TokenTypeRefresh {
		return nil, fmt.Errorf("invalid token type: expected refresh token")
	}

	return claims, nil
}

// ValidateTwoFactorToken 验证双因素认证令牌
func (j *JWTManager) ValidateTwoFactorToken(tokenString string) (*Claims, error) {
	claims, err := j.ValidateToken(tokenString)
	if err != nil {
		return nil, err
	}

	if claims.TokenType != TokenTypeTwoFactor {
		return nil, fmt.Errorf("invalid token type: expected two factor token")
	}

	return claims, nil
}

// CreateCustomToken 创建自定义令牌
func (j *JWTManager) CreateCustomToken(userID, username, email, role string, tokenType TokenType, expiry time.Duration, customClaims map[string]interface{}) (string, error) {
	now := time.Now().UTC()
	tokenID := uuid.New().String()

	claims := &Claims{
		UserID:    userID,
		Username:  username,
		Email:     email,
		Role:      role,
		TokenType: tokenType,
		RegisteredClaims: jwt.RegisteredClaims{
			ID:        tokenID,
			Issuer:    j.config.JWT.Issuer,
			Audience:  []string{j.config.JWT.Audience},
			Subject:   userID,
			IssuedAt:  jwt.NewNumericDate(now),
			NotBefore: jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(expiry)),
		},
	}

	// 添加自定义声明
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id":    claims.UserID,
		"username":   claims.Username,
		"email":      claims.Email,
		"role":       claims.Role,
		"token_type": claims.TokenType,
		"jti":        claims.ID,
		"iss":        claims.Issuer,
		"aud":        claims.Audience,
		"sub":        claims.Subject,
		"iat":        claims.IssuedAt.Unix(),
		"nbf":        claims.NotBefore.Unix(),
		"exp":        claims.ExpiresAt.Unix(),
	})

	// 添加自定义声明
	for key, value := range customClaims {
		token.Claims.(jwt.MapClaims)[key] = value
	}

	return token.SignedString([]byte(j.config.JWT.SecretKey))
}

// GetRemainingTime 获取令牌剩余时间
func (j *JWTManager) GetRemainingTime(claims *Claims) time.Duration {
	if claims.ExpiresAt == nil {
		return 0
	}

	remaining := claims.ExpiresAt.Time.Sub(time.Now().UTC())
	if remaining < 0 {
		return 0
	}
	return remaining
}

// ShouldRefresh 检查是否应该刷新令牌
func (j *JWTManager) ShouldRefresh(claims *Claims) bool {
	remaining := j.GetRemainingTime(claims)
	threshold := j.config.JWT.AccessTokenExpiry / 3 // 剩余时间少于1/3时刷新
	return remaining < threshold
}
