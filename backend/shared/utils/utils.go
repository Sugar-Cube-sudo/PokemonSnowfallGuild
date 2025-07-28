package utils

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"fmt"
	"math/big"
	"net/http"
	"regexp"
	"strconv"
	"strings"
	"time"
	"unicode"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/snowfall-guild/backend/shared/types"
	"golang.org/x/crypto/bcrypt"
)

// HashPassword 哈希密码
func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	return string(bytes), err
}

// CheckPasswordHash 验证密码哈希
func CheckPasswordHash(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

// GenerateRandomString 生成随机字符串
func GenerateRandomString(length int) (string, error) {
	const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	b := make([]byte, length)
	for i := range b {
		n, err := rand.Int(rand.Reader, big.NewInt(int64(len(charset))))
		if err != nil {
			return "", err
		}
		b[i] = charset[n.Int64()]
	}
	return string(b), nil
}

// GenerateUniqueID 生成唯一ID
func GenerateUniqueID(prefix string, length int) (string, error) {
	randomPart, err := GenerateRandomString(length)
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("%s%s", prefix, randomPart), nil
}

// ValidateEmail 验证邮箱格式
func ValidateEmail(email string) bool {
	emailRegex := regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)
	return emailRegex.MatchString(email)
}

// ValidateUsername 验证用户名格式
func ValidateUsername(username string) bool {
	// 用户名长度3-20，只能包含字母、数字、下划线
	if len(username) < 3 || len(username) > 20 {
		return false
	}
	usernameRegex := regexp.MustCompile(`^[a-zA-Z0-9_]+$`)
	return usernameRegex.MatchString(username)
}

// ValidatePassword 验证密码强度
func ValidatePassword(password string, minLength int, requireSpecial, requireNumber, requireUpper, requireLower bool) []string {
	var errors []string

	// 检查长度
	if len(password) < minLength {
		errors = append(errors, fmt.Sprintf("密码长度至少需要%d个字符", minLength))
	}

	// 检查是否包含数字
	if requireNumber {
		hasNumber := false
		for _, char := range password {
			if unicode.IsDigit(char) {
				hasNumber = true
				break
			}
		}
		if !hasNumber {
			errors = append(errors, "密码必须包含至少一个数字")
		}
	}

	// 检查是否包含大写字母
	if requireUpper {
		hasUpper := false
		for _, char := range password {
			if unicode.IsUpper(char) {
				hasUpper = true
				break
			}
		}
		if !hasUpper {
			errors = append(errors, "密码必须包含至少一个大写字母")
		}
	}

	// 检查是否包含小写字母
	if requireLower {
		hasLower := false
		for _, char := range password {
			if unicode.IsLower(char) {
				hasLower = true
				break
			}
		}
		if !hasLower {
			errors = append(errors, "密码必须包含至少一个小写字母")
		}
	}

	// 检查是否包含特殊字符
	if requireSpecial {
		specialChars := "!@#$%^&*()_+-=[]{}|;:,.<>?"
		hasSpecial := false
		for _, char := range password {
			if strings.ContainsRune(specialChars, char) {
				hasSpecial = true
				break
			}
		}
		if !hasSpecial {
			errors = append(errors, "密码必须包含至少一个特殊字符")
		}
	}

	return errors
}

// SanitizeInput 清理输入内容
func SanitizeInput(input string) string {
	// 移除前后空格
	input = strings.TrimSpace(input)

	// 移除HTML标签（简单版本）
	htmlRegex := regexp.MustCompile(`<[^>]*>`)
	input = htmlRegex.ReplaceAllString(input, "")

	// 移除SQL注入相关字符
	sqlRegex := regexp.MustCompile(`(?i)(union|select|insert|update|delete|drop|create|alter|exec|execute)`)
	input = sqlRegex.ReplaceAllString(input, "")

	return input
}

// GenerateHash 生成哈希值
func GenerateHash(data string) string {
	hash := sha256.Sum256([]byte(data))
	return hex.EncodeToString(hash[:])
}

// EncodeBase64 Base64编码
func EncodeBase64(data []byte) string {
	return base64.StdEncoding.EncodeToString(data)
}

// DecodeBase64 Base64解码
func DecodeBase64(data string) ([]byte, error) {
	return base64.StdEncoding.DecodeString(data)
}

// ParseUUID 解析UUID
func ParseUUID(uuidStr string) (uuid.UUID, error) {
	return uuid.Parse(uuidStr)
}

// IsValidUUID 验证UUID格式
func IsValidUUID(uuidStr string) bool {
	_, err := uuid.Parse(uuidStr)
	return err == nil
}

// FormatTime 格式化时间
func FormatTime(t time.Time) string {
	return t.Format(time.RFC3339)
}

// ParseTime 解析时间
func ParseTime(timeStr string) (time.Time, error) {
	return time.Parse(time.RFC3339, timeStr)
}

// GetClientIP 获取客户端IP
func GetClientIP(c *gin.Context) string {
	// 检查X-Forwarded-For头
	if xff := c.GetHeader("X-Forwarded-For"); xff != "" {
		ips := strings.Split(xff, ",")
		if len(ips) > 0 {
			return strings.TrimSpace(ips[0])
		}
	}

	// 检查X-Real-IP头
	if xri := c.GetHeader("X-Real-IP"); xri != "" {
		return xri
	}

	// 使用RemoteAddr
	return c.ClientIP()
}

// SuccessResponse 成功响应
func SuccessResponse(c *gin.Context, data interface{}, message string) {
	c.JSON(http.StatusOK, types.APIResponse{
		Success:   true,
		Data:      data,
		Message:   message,
		Timestamp: time.Now(),
		RequestID: c.GetString("requestId"),
	})
}

// ErrorResponse 错误响应
func ErrorResponse(c *gin.Context, status int, errorType, title, detail, code string) {
	c.JSON(status, types.APIResponse{
		Success: false,
		Error: &types.APIError{
			Type:     errorType,
			Title:    title,
			Status:   status,
			Detail:   detail,
			Instance: c.Request.URL.Path,
			Code:     code,
		},
		Timestamp: time.Now(),
		RequestID: c.GetString("requestId"),
	})
}

// ValidationErrorResponse 验证错误响应
func ValidationErrorResponse(c *gin.Context, errors []types.ValidationError) {
	c.JSON(http.StatusUnprocessableEntity, types.APIResponse{
		Success: false,
		Error: &types.APIError{
			Type:     "https://api.snowfall-guild.com/errors/validation-error",
			Title:    "输入数据验证失败",
			Status:   http.StatusUnprocessableEntity,
			Detail:   "请检查输入数据格式",
			Instance: c.Request.URL.Path,
			Code:     "VALIDATION_ERROR",
			Errors:   errors,
		},
		Timestamp: time.Now(),
		RequestID: c.GetString("requestId"),
	})
}

// PaginatedResponse 分页响应
func PaginatedResponse(c *gin.Context, items interface{}, pagination types.PaginationResponse, meta map[string]interface{}) {
	c.JSON(http.StatusOK, types.APIResponse{
		Success: true,
		Data: types.ListResponse{
			Items:      items,
			Pagination: &pagination,
			Meta:       meta,
		},
		Timestamp: time.Now(),
		RequestID: c.GetString("requestId"),
	})
}

// CalculatePagination 计算分页信息
func CalculatePagination(page, pageSize int, total int64) types.PaginationResponse {
	totalPages := int((total + int64(pageSize) - 1) / int64(pageSize))
	hasMore := page < totalPages

	return types.PaginationResponse{
		Page:       page,
		PageSize:   pageSize,
		Total:      total,
		TotalPages: totalPages,
		HasMore:    hasMore,
	}
}

// StringToInt 字符串转整数
func StringToInt(s string, defaultValue int) int {
	if i, err := strconv.Atoi(s); err == nil {
		return i
	}
	return defaultValue
}

// StringToBool 字符串转布尔值
func StringToBool(s string, defaultValue bool) bool {
	if b, err := strconv.ParseBool(s); err == nil {
		return b
	}
	return defaultValue
}

// Contains 检查切片是否包含元素
func Contains[T comparable](slice []T, item T) bool {
	for _, s := range slice {
		if s == item {
			return true
		}
	}
	return false
}

// Remove 从切片中移除元素
func Remove[T comparable](slice []T, item T) []T {
	result := make([]T, 0, len(slice))
	for _, s := range slice {
		if s != item {
			result = append(result, s)
		}
	}
	return result
}

// Unique 去重切片
func Unique[T comparable](slice []T) []T {
	seen := make(map[T]bool)
	result := make([]T, 0, len(slice))
	for _, item := range slice {
		if !seen[item] {
			seen[item] = true
			result = append(result, item)
		}
	}
	return result
}

// TruncateString 截断字符串
func TruncateString(s string, maxLength int) string {
	if len(s) <= maxLength {
		return s
	}
	return s[:maxLength-3] + "..."
}

// IsEmpty 检查字符串是否为空
func IsEmpty(s string) bool {
	return strings.TrimSpace(s) == ""
}

// DefaultString 返回默认字符串
func DefaultString(s, defaultValue string) string {
	if IsEmpty(s) {
		return defaultValue
	}
	return s
}
