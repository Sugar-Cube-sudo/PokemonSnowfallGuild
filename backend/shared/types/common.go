package types

import (
	"time"

	"github.com/google/uuid"
)

// BaseModel 基础模型
type BaseModel struct {
	ID        uuid.UUID `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	CreatedAt time.Time `json:"createdAt" gorm:"autoCreateTime"`
	UpdatedAt time.Time `json:"updatedAt" gorm:"autoUpdateTime"`
}

// APIResponse 统一API响应格式
type APIResponse struct {
	Success   bool        `json:"success"`
	Data      interface{} `json:"data,omitempty"`
	Message   string      `json:"message,omitempty"`
	Error     *APIError   `json:"error,omitempty"`
	Timestamp time.Time   `json:"timestamp"`
	RequestID string      `json:"requestId,omitempty"`
}

// APIError 错误响应格式
type APIError struct {
	Type     string                 `json:"type"`
	Title    string                 `json:"title"`
	Status   int                    `json:"status"`
	Detail   string                 `json:"detail"`
	Instance string                 `json:"instance"`
	Code     string                 `json:"code"`
	Errors   []ValidationError      `json:"errors,omitempty"`
	Meta     map[string]interface{} `json:"meta,omitempty"`
}

// ValidationError 验证错误
type ValidationError struct {
	Field   string `json:"field"`
	Message string `json:"message"`
	Code    string `json:"code"`
}

// PaginationRequest 分页请求
type PaginationRequest struct {
	Page   int    `json:"page" form:"page" binding:"min=1"`
	Limit  int    `json:"limit" form:"limit" binding:"min=1,max=100"`
	Cursor string `json:"cursor,omitempty" form:"cursor"`
}

// PaginationResponse 分页响应
type PaginationResponse struct {
	Page       int    `json:"page"`
	PageSize   int    `json:"pageSize"`
	Total      int64  `json:"total"`
	TotalPages int    `json:"totalPages"`
	HasMore    bool   `json:"hasMore"`
	NextCursor string `json:"nextCursor,omitempty"`
	PrevCursor string `json:"prevCursor,omitempty"`
}

// ListResponse 列表响应
type ListResponse struct {
	Items      interface{}            `json:"items"`
	Pagination *PaginationResponse    `json:"pagination"`
	Meta       map[string]interface{} `json:"meta,omitempty"`
}

// UserRole 用户角色
type UserRole string

const (
	RoleSuperAdmin UserRole = "SUPER_ADMIN"
	RoleAdmin      UserRole = "ADMIN"
	RoleModerator  UserRole = "MODERATOR"
	RoleUser       UserRole = "USER"
)

// Permission 权限
type Permission string

const (
	PermissionUserRead      Permission = "USER_READ"
	PermissionUserWrite     Permission = "USER_WRITE"
	PermissionMemberUpdate  Permission = "MEMBER_UPDATE"
	PermissionViewReports   Permission = "VIEW_REPORTS"
	PermissionManageReports Permission = "MANAGE_REPORTS"
	PermissionForumRead     Permission = "FORUM_READ"
	PermissionForumWrite    Permission = "FORUM_WRITE"
	PermissionForumModerate Permission = "FORUM_MODERATE"
	PermissionMessageRead   Permission = "MESSAGE_READ"
	PermissionMessageWrite  Permission = "MESSAGE_WRITE"
	PermissionSystemAdmin   Permission = "SYSTEM_ADMIN"
)

// RolePermissions 角色权限映射
var RolePermissions = map[UserRole][]Permission{
	RoleSuperAdmin: {
		PermissionUserRead, PermissionUserWrite, PermissionMemberUpdate,
		PermissionViewReports, PermissionManageReports,
		PermissionForumRead, PermissionForumWrite, PermissionForumModerate,
		PermissionMessageRead, PermissionMessageWrite,
		PermissionSystemAdmin,
	},
	RoleAdmin: {
		PermissionUserRead, PermissionUserWrite, PermissionMemberUpdate,
		PermissionViewReports, PermissionManageReports,
		PermissionForumRead, PermissionForumWrite, PermissionForumModerate,
		PermissionMessageRead, PermissionMessageWrite,
	},
	RoleModerator: {
		PermissionUserRead, PermissionViewReports,
		PermissionForumRead, PermissionForumWrite, PermissionForumModerate,
		PermissionMessageRead, PermissionMessageWrite,
	},
	RoleUser: {
		PermissionUserRead, PermissionForumRead, PermissionForumWrite,
		PermissionMessageRead, PermissionMessageWrite,
	},
}

// HasPermission 检查角色是否有指定权限
func (r UserRole) HasPermission(permission Permission) bool {
	perms, exists := RolePermissions[r]
	if !exists {
		return false
	}
	for _, perm := range perms {
		if perm == permission {
			return true
		}
	}
	return false
}
