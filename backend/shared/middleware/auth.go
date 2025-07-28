package middleware

import (
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/snowfall-guild/backend/shared/types"
)

// JWTClaims JWT声明
type JWTClaims struct {
	UserID      uuid.UUID          `json:"userId"`
	Username    string             `json:"username"`
	Role        types.UserRole     `json:"role"`
	Permissions []types.Permission `json:"permissions"`
	TokenType   string             `json:"tokenType"`
	jwt.RegisteredClaims
}

// AuthMiddleware JWT认证中间件
func AuthMiddleware(jwtSecret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		token := extractToken(c)
		if token == "" {
			c.JSON(http.StatusUnauthorized, types.APIResponse{
				Success: false,
				Error: &types.APIError{
					Type:     "https://api.snowfall-guild.com/errors/unauthorized",
					Title:    "认证失败",
					Status:   http.StatusUnauthorized,
					Detail:   "缺少认证令牌",
					Instance: c.Request.URL.Path,
					Code:     "MISSING_TOKEN",
				},
				Timestamp: time.Now(),
				RequestID: c.GetString("requestId"),
			})
			c.Abort()
			return
		}

		claims, err := validateToken(token, jwtSecret)
		if err != nil {
			c.JSON(http.StatusUnauthorized, types.APIResponse{
				Success: false,
				Error: &types.APIError{
					Type:     "https://api.snowfall-guild.com/errors/unauthorized",
					Title:    "认证失败",
					Status:   http.StatusUnauthorized,
					Detail:   fmt.Sprintf("无效的认证令牌: %v", err),
					Instance: c.Request.URL.Path,
					Code:     "INVALID_TOKEN",
				},
				Timestamp: time.Now(),
				RequestID: c.GetString("requestId"),
			})
			c.Abort()
			return
		}

		// 将用户信息存储到上下文
		c.Set("userId", claims.UserID)
		c.Set("username", claims.Username)
		c.Set("role", claims.Role)
		c.Set("permissions", claims.Permissions)
		c.Set("tokenType", claims.TokenType)

		c.Next()
	}
}

// OptionalAuthMiddleware 可选认证中间件
func OptionalAuthMiddleware(jwtSecret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		token := extractToken(c)
		if token != "" {
			if claims, err := validateToken(token, jwtSecret); err == nil {
				c.Set("userId", claims.UserID)
				c.Set("username", claims.Username)
				c.Set("role", claims.Role)
				c.Set("permissions", claims.Permissions)
				c.Set("tokenType", claims.TokenType)
			}
		}
		c.Next()
	}
}

// RequirePermission 权限检查中间件
func RequirePermission(permission types.Permission) gin.HandlerFunc {
	return func(c *gin.Context) {
		permissions, exists := c.Get("permissions")
		if !exists {
			c.JSON(http.StatusForbidden, types.APIResponse{
				Success: false,
				Error: &types.APIError{
					Type:     "https://api.snowfall-guild.com/errors/forbidden",
					Title:    "权限不足",
					Status:   http.StatusForbidden,
					Detail:   "缺少权限信息",
					Instance: c.Request.URL.Path,
					Code:     "MISSING_PERMISSIONS",
				},
				Timestamp: time.Now(),
				RequestID: c.GetString("requestId"),
			})
			c.Abort()
			return
		}

		userPermissions, ok := permissions.([]types.Permission)
		if !ok {
			c.JSON(http.StatusForbidden, types.APIResponse{
				Success: false,
				Error: &types.APIError{
					Type:     "https://api.snowfall-guild.com/errors/forbidden",
					Title:    "权限不足",
					Status:   http.StatusForbidden,
					Detail:   "权限信息格式错误",
					Instance: c.Request.URL.Path,
					Code:     "INVALID_PERMISSIONS",
				},
				Timestamp: time.Now(),
				RequestID: c.GetString("requestId"),
			})
			c.Abort()
			return
		}

		// 检查是否有所需权限
		hasPermission := false
		for _, perm := range userPermissions {
			if perm == permission {
				hasPermission = true
				break
			}
		}

		if !hasPermission {
			c.JSON(http.StatusForbidden, types.APIResponse{
				Success: false,
				Error: &types.APIError{
					Type:     "https://api.snowfall-guild.com/errors/forbidden",
					Title:    "权限不足",
					Status:   http.StatusForbidden,
					Detail:   fmt.Sprintf("需要权限: %s", permission),
					Instance: c.Request.URL.Path,
					Code:     "INSUFFICIENT_PERMISSIONS",
				},
				Timestamp: time.Now(),
				RequestID: c.GetString("requestId"),
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

// RequireRole 角色检查中间件
func RequireRole(roles ...types.UserRole) gin.HandlerFunc {
	return func(c *gin.Context) {
		userRole, exists := c.Get("role")
		if !exists {
			c.JSON(http.StatusForbidden, types.APIResponse{
				Success: false,
				Error: &types.APIError{
					Type:     "https://api.snowfall-guild.com/errors/forbidden",
					Title:    "权限不足",
					Status:   http.StatusForbidden,
					Detail:   "缺少角色信息",
					Instance: c.Request.URL.Path,
					Code:     "MISSING_ROLE",
				},
				Timestamp: time.Now(),
				RequestID: c.GetString("requestId"),
			})
			c.Abort()
			return
		}

		role, ok := userRole.(types.UserRole)
		if !ok {
			c.JSON(http.StatusForbidden, types.APIResponse{
				Success: false,
				Error: &types.APIError{
					Type:     "https://api.snowfall-guild.com/errors/forbidden",
					Title:    "权限不足",
					Status:   http.StatusForbidden,
					Detail:   "角色信息格式错误",
					Instance: c.Request.URL.Path,
					Code:     "INVALID_ROLE",
				},
				Timestamp: time.Now(),
				RequestID: c.GetString("requestId"),
			})
			c.Abort()
			return
		}

		// 检查是否有所需角色
		hasRole := false
		for _, requiredRole := range roles {
			if role == requiredRole {
				hasRole = true
				break
			}
		}

		if !hasRole {
			c.JSON(http.StatusForbidden, types.APIResponse{
				Success: false,
				Error: &types.APIError{
					Type:     "https://api.snowfall-guild.com/errors/forbidden",
					Title:    "权限不足",
					Status:   http.StatusForbidden,
					Detail:   "角色权限不足",
					Instance: c.Request.URL.Path,
					Code:     "INSUFFICIENT_ROLE",
				},
				Timestamp: time.Now(),
				RequestID: c.GetString("requestId"),
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

// extractToken 从请求中提取JWT令牌
func extractToken(c *gin.Context) string {
	// 从Authorization头提取
	auth := c.GetHeader("Authorization")
	if auth != "" {
		parts := strings.SplitN(auth, " ", 2)
		if len(parts) == 2 && parts[0] == "Bearer" {
			return parts[1]
		}
	}

	// 从查询参数提取
	if token := c.Query("token"); token != "" {
		return token
	}

	// 从Cookie提取
	if token, err := c.Cookie("access_token"); err == nil {
		return token
	}

	return ""
}

// validateToken 验证JWT令牌
func validateToken(tokenString, jwtSecret string) (*JWTClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &JWTClaims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(jwtSecret), nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*JWTClaims); ok && token.Valid {
		// 检查令牌是否过期
		if claims.ExpiresAt != nil && claims.ExpiresAt.Time.Before(time.Now()) {
			return nil, fmt.Errorf("token expired")
		}
		return claims, nil
	}

	return nil, fmt.Errorf("invalid token")
}

// GenerateToken 生成JWT令牌
func GenerateToken(userID uuid.UUID, username string, role types.UserRole, tokenType string, ttl time.Duration, jwtSecret string) (string, error) {
	permissions := types.RolePermissions[role]

	claims := JWTClaims{
		UserID:      userID,
		Username:    username,
		Role:        role,
		Permissions: permissions,
		TokenType:   tokenType,
		RegisteredClaims: jwt.RegisteredClaims{
			Issuer:    "snowfall-guild",
			Audience:  []string{"snowfall-guild-users"},
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(ttl)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
			ID:        uuid.New().String(),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(jwtSecret))
}

// GetUserFromContext 从上下文获取用户信息
func GetUserFromContext(c *gin.Context) (uuid.UUID, string, types.UserRole, []types.Permission, bool) {
	userID, exists := c.Get("userId")
	if !exists {
		return uuid.Nil, "", "", nil, false
	}

	username, _ := c.Get("username")
	role, _ := c.Get("role")
	permissions, _ := c.Get("permissions")

	return userID.(uuid.UUID), username.(string), role.(types.UserRole), permissions.([]types.Permission), true
}

// GetUserIDFromContext 从上下文获取用户ID
func GetUserIDFromContext(c *gin.Context) (uuid.UUID, bool) {
	userID, exists := c.Get("userId")
	if !exists {
		return uuid.Nil, false
	}
	return userID.(uuid.UUID), true
}
