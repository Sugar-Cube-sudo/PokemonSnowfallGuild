package middleware

import (
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/sirupsen/logrus"
	"github.com/snowfall-guild/backend/shared/config"
	"github.com/snowfall-guild/backend/shared/types"
	"golang.org/x/time/rate"
)

// RequestIDMiddleware 请求ID中间件
func RequestIDMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		requestID := c.GetHeader("X-Request-ID")
		if requestID == "" {
			requestID = uuid.New().String()
		}
		c.Set("requestId", requestID)
		c.Header("X-Request-ID", requestID)
		c.Next()
	}
}

// LoggerMiddleware 日志中间件
func LoggerMiddleware(logger *logrus.Logger) gin.HandlerFunc {
	return gin.LoggerWithFormatter(func(param gin.LogFormatterParams) string {
		logger.WithFields(logrus.Fields{
			"timestamp":    param.TimeStamp.Format(time.RFC3339),
			"status":       param.StatusCode,
			"latency":      param.Latency,
			"clientIP":     param.ClientIP,
			"method":       param.Method,
			"path":         param.Path,
			"userAgent":    param.Request.UserAgent(),
			"requestId":    param.Keys["requestId"],
			"userId":       param.Keys["userId"],
			"errorMessage": param.ErrorMessage,
		}).Info("HTTP Request")
		return ""
	})
}

// CORSMiddleware CORS中间件
func CORSMiddleware(corsConfig config.CORSConfig) gin.HandlerFunc {
	return cors.New(cors.Config{
		AllowOrigins:     corsConfig.AllowOrigins,
		AllowMethods:     corsConfig.AllowMethods,
		AllowHeaders:     corsConfig.AllowHeaders,
		ExposeHeaders:    corsConfig.ExposeHeaders,
		AllowCredentials: corsConfig.AllowCredentials,
		MaxAge:           time.Duration(corsConfig.MaxAge) * time.Second,
	})
}

// RateLimitMiddleware 限流中间件
func RateLimitMiddleware(rateLimitConfig config.RateLimitConfig) gin.HandlerFunc {
	if !rateLimitConfig.Enabled {
		return func(c *gin.Context) {
			c.Next()
		}
	}

	// 创建限流器
	limiter := rate.NewLimiter(rate.Limit(rateLimitConfig.RPS), rateLimitConfig.Burst)

	return func(c *gin.Context) {
		if !limiter.Allow() {
			c.JSON(http.StatusTooManyRequests, types.APIResponse{
				Success: false,
				Error: &types.APIError{
					Type:     "https://api.snowfall-guild.com/errors/rate-limit",
					Title:    "请求频率超限",
					Status:   http.StatusTooManyRequests,
					Detail:   "请求过于频繁，请稍后再试",
					Instance: c.Request.URL.Path,
					Code:     "RATE_LIMIT_EXCEEDED",
				},
				Timestamp: time.Now(),
				RequestID: c.GetString("requestId"),
			})
			c.Abort()
			return
		}

		// 设置限流相关的响应头
		c.Header("X-Rate-Limit-Limit", strconv.Itoa(rateLimitConfig.RPS))
		c.Header("X-Rate-Limit-Remaining", strconv.Itoa(rateLimitConfig.Burst-1))
		c.Header("X-Rate-Limit-Reset", strconv.FormatInt(time.Now().Add(rateLimitConfig.Window).Unix(), 10))

		c.Next()
	}
}

// SecurityHeadersMiddleware 安全头中间件
func SecurityHeadersMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 防止XSS攻击
		c.Header("X-Content-Type-Options", "nosniff")
		c.Header("X-Frame-Options", "DENY")
		c.Header("X-XSS-Protection", "1; mode=block")

		// 强制HTTPS
		c.Header("Strict-Transport-Security", "max-age=31536000; includeSubDomains")

		// 内容安全策略
		c.Header("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:")

		// 引用策略
		c.Header("Referrer-Policy", "strict-origin-when-cross-origin")

		// 权限策略
		c.Header("Permissions-Policy", "geolocation=(), microphone=(), camera=()")

		c.Next()
	}
}

// ErrorHandlerMiddleware 错误处理中间件
func ErrorHandlerMiddleware() gin.HandlerFunc {
	return gin.CustomRecovery(func(c *gin.Context, recovered interface{}) {
		if err, ok := recovered.(string); ok {
			c.JSON(http.StatusInternalServerError, types.APIResponse{
				Success: false,
				Error: &types.APIError{
					Type:     "https://api.snowfall-guild.com/errors/internal-server-error",
					Title:    "服务器内部错误",
					Status:   http.StatusInternalServerError,
					Detail:   "服务器遇到了一个意外的错误",
					Instance: c.Request.URL.Path,
					Code:     "INTERNAL_SERVER_ERROR",
					Meta: map[string]interface{}{
						"error": err,
					},
				},
				Timestamp: time.Now(),
				RequestID: c.GetString("requestId"),
			})
		}
		c.AbortWithStatus(http.StatusInternalServerError)
	})
}

// ResponseTimeMiddleware 响应时间中间件
func ResponseTimeMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		c.Next()
		latency := time.Since(start)
		c.Header("X-Response-Time", fmt.Sprintf("%dms", latency.Milliseconds()))
	}
}

// ContentTypeMiddleware 内容类型中间件
func ContentTypeMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 设置默认内容类型
		if c.GetHeader("Content-Type") == "" {
			c.Header("Content-Type", "application/json; charset=utf-8")
		}
		c.Next()
	}
}

// HealthCheckMiddleware 健康检查中间件
func HealthCheckMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		if c.Request.URL.Path == "/health" || c.Request.URL.Path == "/ping" {
			c.JSON(http.StatusOK, gin.H{
				"status":    "ok",
				"timestamp": time.Now().Format(time.RFC3339),
				"service":   "snowfall-guild-api",
				"version":   "1.0.0",
			})
			c.Abort()
			return
		}
		c.Next()
	}
}

// ValidateContentTypeMiddleware 验证内容类型中间件
func ValidateContentTypeMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		if c.Request.Method == "POST" || c.Request.Method == "PUT" || c.Request.Method == "PATCH" {
			contentType := c.GetHeader("Content-Type")
			if contentType != "" && !strings.Contains(contentType, "application/json") && !strings.Contains(contentType, "multipart/form-data") {
				c.JSON(http.StatusUnsupportedMediaType, types.APIResponse{
					Success: false,
					Error: &types.APIError{
						Type:     "https://api.snowfall-guild.com/errors/unsupported-media-type",
						Title:    "不支持的媒体类型",
						Status:   http.StatusUnsupportedMediaType,
						Detail:   "请使用 application/json 或 multipart/form-data 内容类型",
						Instance: c.Request.URL.Path,
						Code:     "UNSUPPORTED_MEDIA_TYPE",
					},
					Timestamp: time.Now(),
					RequestID: c.GetString("requestId"),
				})
				c.Abort()
				return
			}
		}
		c.Next()
	}
}

// PaginationMiddleware 分页中间件
func PaginationMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 解析分页参数
		page := 1
		pageSize := 20
		cursor := ""

		if p := c.Query("page"); p != "" {
			if parsed, err := strconv.Atoi(p); err == nil && parsed > 0 {
				page = parsed
			}
		}

		if l := c.Query("page_size"); l != "" {
			if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 && parsed <= 100 {
				pageSize = parsed
			}
		}

		if c := c.Query("cursor"); c != "" {
			cursor = c
		}

		// 将分页参数存储到上下文
		c.Set("pagination", types.PaginationRequest{
			Page:   page,
			Limit:  pageSize,
			Cursor: cursor,
		})

		c.Next()
	}
}

// GetPaginationFromContext 从上下文获取分页参数
func GetPaginationFromContext(c *gin.Context) types.PaginationRequest {
	if pagination, exists := c.Get("pagination"); exists {
		if p, ok := pagination.(types.PaginationRequest); ok {
			return p
		}
	}
	return types.PaginationRequest{Page: 1, Limit: 20}
}

// SetupMiddlewares 设置所有中间件
func SetupMiddlewares(r *gin.Engine, cfg *config.Config, logger *logrus.Logger) {
	// 基础中间件
	r.Use(RequestIDMiddleware())
	r.Use(LoggerMiddleware(logger))
	r.Use(ErrorHandlerMiddleware())
	r.Use(ResponseTimeMiddleware())
	r.Use(ContentTypeMiddleware())
	r.Use(HealthCheckMiddleware())

	// 安全中间件
	r.Use(SecurityHeadersMiddleware())
	r.Use(CORSMiddleware(cfg.CORS))
	r.Use(RateLimitMiddleware(cfg.RateLimit))
	r.Use(ValidateContentTypeMiddleware())

	// 业务中间件
	r.Use(PaginationMiddleware())
}
