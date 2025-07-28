package gorm

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/snowfall-guild/backend/services/auth/internal/models"
	"github.com/snowfall-guild/backend/services/auth/internal/repository"
	"gorm.io/gorm"
)

// auditLogRepository 审计日志仓储GORM实现
type auditLogRepository struct {
	db *gorm.DB
}

// NewAuditLogRepository 创建新的审计日志仓储
func NewAuditLogRepository(db *gorm.DB) repository.AuditLogRepository {
	return &auditLogRepository{db: db}
}

// Create 创建审计日志
func (r *auditLogRepository) Create(ctx context.Context, log *models.AuditLog) error {
	if err := r.db.WithContext(ctx).Create(log).Error; err != nil {
		return fmt.Errorf("failed to create audit log: %w", err)
	}
	return nil
}

// GetByID 根据ID获取审计日志
func (r *auditLogRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.AuditLog, error) {
	var log models.AuditLog
	if err := r.db.WithContext(ctx).Where("id = ?", id).First(&log).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, repository.ErrAuditLogNotFound
		}
		return nil, fmt.Errorf("failed to get audit log by id: %w", err)
	}
	return &log, nil
}

// GetByUserID 根据用户ID获取审计日志列表
func (r *auditLogRepository) GetByUserID(ctx context.Context, userID string, offset, limit int) ([]*models.AuditLog, error) {
	var logs []*models.AuditLog
	if err := r.db.WithContext(ctx).Where("user_id = ?", userID).Order("created_at DESC").Offset(offset).Limit(limit).Find(&logs).Error; err != nil {
		return nil, fmt.Errorf("failed to get audit logs by user id: %w", err)
	}
	return logs, nil
}

// GetByAction 根据动作获取审计日志列表
func (r *auditLogRepository) GetByAction(ctx context.Context, action models.AuditAction, offset, limit int) ([]*models.AuditLog, error) {
	var logs []*models.AuditLog
	if err := r.db.WithContext(ctx).Where("action = ?", action).Order("created_at DESC").Offset(offset).Limit(limit).Find(&logs).Error; err != nil {
		return nil, fmt.Errorf("failed to get audit logs by action: %w", err)
	}
	return logs, nil
}

// GetByResource 根据资源获取审计日志列表
func (r *auditLogRepository) GetByResource(ctx context.Context, resource models.AuditResource, resourceID string, offset, limit int) ([]*models.AuditLog, error) {
	var logs []*models.AuditLog
	query := r.db.WithContext(ctx).Where("resource = ?", resource)
	if resourceID != "" {
		query = query.Where("resource_id = ?", resourceID)
	}
	if err := query.Order("created_at DESC").Offset(offset).Limit(limit).Find(&logs).Error; err != nil {
		return nil, fmt.Errorf("failed to get audit logs by resource: %w", err)
	}
	return logs, nil
}

// GetByIPAddress 根据IP地址获取审计日志列表
func (r *auditLogRepository) GetByIPAddress(ctx context.Context, ipAddress string, offset, limit int) ([]*models.AuditLog, error) {
	var logs []*models.AuditLog
	if err := r.db.WithContext(ctx).Where("ip_address = ?", ipAddress).Order("created_at DESC").Offset(offset).Limit(limit).Find(&logs).Error; err != nil {
		return nil, fmt.Errorf("failed to get audit logs by ip address: %w", err)
	}
	return logs, nil
}

// GetByTimeRange 根据时间范围获取审计日志列表
func (r *auditLogRepository) GetByTimeRange(ctx context.Context, startTime, endTime time.Time, offset, limit int) ([]*models.AuditLog, error) {
	var logs []*models.AuditLog
	if err := r.db.WithContext(ctx).Where("created_at BETWEEN ? AND ?", startTime, endTime).Order("created_at DESC").Offset(offset).Limit(limit).Find(&logs).Error; err != nil {
		return nil, fmt.Errorf("failed to get audit logs by time range: %w", err)
	}
	return logs, nil
}

// GetByUserIDAndAction 根据用户ID和动作获取审计日志列表
func (r *auditLogRepository) GetByUserIDAndAction(ctx context.Context, userID string, action models.AuditAction, offset, limit int) ([]*models.AuditLog, error) {
	var logs []*models.AuditLog
	if err := r.db.WithContext(ctx).Where("user_id = ? AND action = ?", userID, action).Order("created_at DESC").Offset(offset).Limit(limit).Find(&logs).Error; err != nil {
		return nil, fmt.Errorf("failed to get audit logs by user id and action: %w", err)
	}
	return logs, nil
}

// GetByUserIDAndTimeRange 根据用户ID和时间范围获取审计日志列表
func (r *auditLogRepository) GetByUserIDAndTimeRange(ctx context.Context, userID string, startTime, endTime time.Time, offset, limit int) ([]*models.AuditLog, error) {
	var logs []*models.AuditLog
	if err := r.db.WithContext(ctx).Where("user_id = ? AND created_at BETWEEN ? AND ?", userID, startTime, endTime).Order("created_at DESC").Offset(offset).Limit(limit).Find(&logs).Error; err != nil {
		return nil, fmt.Errorf("failed to get audit logs by user id and time range: %w", err)
	}
	return logs, nil
}

// Search 搜索审计日志
func (r *auditLogRepository) Search(ctx context.Context, filters map[string]interface{}, offset, limit int) ([]*models.AuditLog, error) {
	var logs []*models.AuditLog
	query := r.db.WithContext(ctx)

	for key, value := range filters {
		switch key {
		case "user_id":
			query = query.Where("user_id = ?", value)
		case "action":
			query = query.Where("action = ?", value)
		case "resource":
			query = query.Where("resource = ?", value)
		case "resource_id":
			query = query.Where("resource_id = ?", value)
		case "ip_address":
			query = query.Where("ip_address = ?", value)
		case "user_agent":
			query = query.Where("user_agent LIKE ?", "%"+value.(string)+"%")
		case "start_time":
			query = query.Where("created_at >= ?", value)
		case "end_time":
			query = query.Where("created_at <= ?", value)
		}
	}

	if err := query.Order("created_at DESC").Offset(offset).Limit(limit).Find(&logs).Error; err != nil {
		return nil, fmt.Errorf("failed to search audit logs: %w", err)
	}
	return logs, nil
}

// Delete 删除审计日志
func (r *auditLogRepository) Delete(ctx context.Context, id string) error {
	if err := r.db.WithContext(ctx).Delete(&models.AuditLog{}, "id = ?", id).Error; err != nil {
		return fmt.Errorf("failed to delete audit log: %w", err)
	}
	return nil
}

// DeleteByUserID 删除用户的所有审计日志
func (r *auditLogRepository) DeleteByUserID(ctx context.Context, userID string) error {
	if err := r.db.WithContext(ctx).Delete(&models.AuditLog{}, "user_id = ?", userID).Error; err != nil {
		return fmt.Errorf("failed to delete audit logs by user id: %w", err)
	}
	return nil
}

// DeleteByTimeRange 删除时间范围内的审计日志
func (r *auditLogRepository) DeleteByTimeRange(ctx context.Context, startTime, endTime time.Time) error {
	if err := r.db.WithContext(ctx).Delete(&models.AuditLog{}, "created_at BETWEEN ? AND ?", startTime, endTime).Error; err != nil {
		return fmt.Errorf("failed to delete audit logs by time range: %w", err)
	}
	return nil
}

// DeleteOlderThan 删除指定时间之前的审计日志
func (r *auditLogRepository) DeleteOlderThan(ctx context.Context, before time.Time) error {
	if err := r.db.WithContext(ctx).Delete(&models.AuditLog{}, "created_at < ?", before).Error; err != nil {
		return fmt.Errorf("failed to delete audit logs older than: %w", err)
	}
	return nil
}

// List 获取审计日志列表
func (r *auditLogRepository) List(ctx context.Context, offset, limit int, filters map[string]interface{}) ([]*models.AuditLog, int64, error) {
	var logs []*models.AuditLog
	var total int64
	
	query := r.db.WithContext(ctx).Model(&models.AuditLog{})
	
	// 应用过滤器
	for key, value := range filters {
		switch key {
		case "user_id":
			query = query.Where("user_id = ?", value)
		case "action":
			query = query.Where("action = ?", value)
		case "resource":
			query = query.Where("resource = ?", value)
		case "ip_address":
			query = query.Where("ip_address = ?", value)
		}
	}
	
	// 获取总数
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to count audit logs: %w", err)
	}
	
	// 获取数据
	if err := query.Order("created_at DESC").Offset(offset).Limit(limit).Find(&logs).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to list audit logs: %w", err)
	}
	return logs, total, nil
}

// GetUserLogs 获取用户审计日志
func (r *auditLogRepository) GetUserLogs(ctx context.Context, userID uuid.UUID, offset, limit int) ([]*models.AuditLog, int64, error) {
	var logs []*models.AuditLog
	var total int64
	
	query := r.db.WithContext(ctx).Model(&models.AuditLog{}).Where("user_id = ?", userID)
	
	// 获取总数
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to count user audit logs: %w", err)
	}
	
	// 获取数据
	if err := query.Order("created_at DESC").Offset(offset).Limit(limit).Find(&logs).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to get user audit logs: %w", err)
	}
	return logs, total, nil
}

// GetLogsByAction 根据动作获取审计日志
func (r *auditLogRepository) GetLogsByAction(ctx context.Context, action string, offset, limit int) ([]*models.AuditLog, int64, error) {
	var logs []*models.AuditLog
	var total int64
	
	query := r.db.WithContext(ctx).Model(&models.AuditLog{}).Where("action = ?", action)
	
	// 获取总数
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to count audit logs by action: %w", err)
	}
	
	// 获取数据
	if err := query.Order("created_at DESC").Offset(offset).Limit(limit).Find(&logs).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to get audit logs by action: %w", err)
	}
	return logs, total, nil
}

// GetLogsByResource 根据资源获取审计日志
func (r *auditLogRepository) GetLogsByResource(ctx context.Context, resource string, offset, limit int) ([]*models.AuditLog, int64, error) {
	var logs []*models.AuditLog
	var total int64
	
	query := r.db.WithContext(ctx).Model(&models.AuditLog{}).Where("resource = ?", resource)
	
	// 获取总数
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to count audit logs by resource: %w", err)
	}
	
	// 获取数据
	if err := query.Order("created_at DESC").Offset(offset).Limit(limit).Find(&logs).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to get audit logs by resource: %w", err)
	}
	return logs, total, nil
}

// GetLogsByIPAddress 根据IP地址获取审计日志
func (r *auditLogRepository) GetLogsByIPAddress(ctx context.Context, ipAddress string, offset, limit int) ([]*models.AuditLog, int64, error) {
	var logs []*models.AuditLog
	var total int64
	
	query := r.db.WithContext(ctx).Model(&models.AuditLog{}).Where("ip_address = ?", ipAddress)
	
	// 获取总数
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to count audit logs by ip address: %w", err)
	}
	
	// 获取数据
	if err := query.Order("created_at DESC").Offset(offset).Limit(limit).Find(&logs).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to get audit logs by ip address: %w", err)
	}
	return logs, total, nil
}

// GetLogsByTimeRange 根据时间范围获取审计日志
func (r *auditLogRepository) GetLogsByTimeRange(ctx context.Context, start, end time.Time, offset, limit int) ([]*models.AuditLog, int64, error) {
	var logs []*models.AuditLog
	var total int64
	
	query := r.db.WithContext(ctx).Model(&models.AuditLog{}).Where("created_at BETWEEN ? AND ?", start, end)
	
	// 获取总数
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to count audit logs by time range: %w", err)
	}
	
	// 获取数据
	if err := query.Order("created_at DESC").Offset(offset).Limit(limit).Find(&logs).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to get audit logs by time range: %w", err)
	}
	return logs, total, nil
}

// GetLogCount 获取审计日志总数
func (r *auditLogRepository) GetLogCount(ctx context.Context) (int64, error) {
	var count int64
	if err := r.db.WithContext(ctx).Model(&models.AuditLog{}).Count(&count).Error; err != nil {
		return 0, fmt.Errorf("failed to get audit log count: %w", err)
	}
	return count, nil
}

// GetFailedLoginAttempts 获取失败登录尝试次数
func (r *auditLogRepository) GetFailedLoginAttempts(ctx context.Context, since time.Time) (int64, error) {
	var count int64
	if err := r.db.WithContext(ctx).Model(&models.AuditLog{}).Where("action = ? AND created_at >= ?", "login_failed", since).Count(&count).Error; err != nil {
		return 0, fmt.Errorf("failed to get failed login attempts: %w", err)
	}
	return count, nil
}

// GetSuccessfulLogins 获取成功登录次数
func (r *auditLogRepository) GetSuccessfulLogins(ctx context.Context, since time.Time) (int64, error) {
	var count int64
	if err := r.db.WithContext(ctx).Model(&models.AuditLog{}).Where("action = ? AND created_at >= ?", "login_success", since).Count(&count).Error; err != nil {
		return 0, fmt.Errorf("failed to get successful logins: %w", err)
	}
	return count, nil
}

// Count 获取审计日志总数
func (r *auditLogRepository) Count(ctx context.Context) (int64, error) {
	var count int64
	if err := r.db.WithContext(ctx).Model(&models.AuditLog{}).Count(&count).Error; err != nil {
		return 0, fmt.Errorf("failed to count audit logs: %w", err)
	}
	return count, nil
}

// CountByUserID 根据用户ID统计审计日志数量
func (r *auditLogRepository) CountByUserID(ctx context.Context, userID string) (int64, error) {
	var count int64
	if err := r.db.WithContext(ctx).Model(&models.AuditLog{}).Where("user_id = ?", userID).Count(&count).Error; err != nil {
		return 0, fmt.Errorf("failed to count audit logs by user id: %w", err)
	}
	return count, nil
}

// CountByAction 根据动作统计审计日志数量
func (r *auditLogRepository) CountByAction(ctx context.Context, action models.AuditAction) (int64, error) {
	var count int64
	if err := r.db.WithContext(ctx).Model(&models.AuditLog{}).Where("action = ?", action).Count(&count).Error; err != nil {
		return 0, fmt.Errorf("failed to count audit logs by action: %w", err)
	}
	return count, nil
}

// CountByResource 根据资源统计审计日志数量
func (r *auditLogRepository) CountByResource(ctx context.Context, resource models.AuditResource) (int64, error) {
	var count int64
	if err := r.db.WithContext(ctx).Model(&models.AuditLog{}).Where("resource = ?", resource).Count(&count).Error; err != nil {
		return 0, fmt.Errorf("failed to count audit logs by resource: %w", err)
	}
	return count, nil
}

// CountByTimeRange 根据时间范围统计审计日志数量
func (r *auditLogRepository) CountByTimeRange(ctx context.Context, startTime, endTime time.Time) (int64, error) {
	var count int64
	if err := r.db.WithContext(ctx).Model(&models.AuditLog{}).Where("created_at BETWEEN ? AND ?", startTime, endTime).Count(&count).Error; err != nil {
		return 0, fmt.Errorf("failed to count audit logs by time range: %w", err)
	}
	return count, nil
}

// GetStatsByAction 根据动作获取统计信息
func (r *auditLogRepository) GetStatsByAction(ctx context.Context, startTime, endTime time.Time) (map[models.AuditAction]int64, error) {
	type result struct {
		Action models.AuditAction `json:"action"`
		Count  int64             `json:"count"`
	}

	var results []result
	if err := r.db.WithContext(ctx).Model(&models.AuditLog{}).Select("action, COUNT(*) as count").Where("created_at BETWEEN ? AND ?", startTime, endTime).Group("action").Find(&results).Error; err != nil {
		return nil, fmt.Errorf("failed to get audit log stats by action: %w", err)
	}

	stats := make(map[models.AuditAction]int64)
	for _, r := range results {
		stats[r.Action] = r.Count
	}

	return stats, nil
}

// GetStatsByResource 根据资源获取统计信息
func (r *auditLogRepository) GetStatsByResource(ctx context.Context, startTime, endTime time.Time) (map[models.AuditResource]int64, error) {
	type result struct {
		Resource models.AuditResource `json:"resource"`
		Count    int64               `json:"count"`
	}

	var results []result
	if err := r.db.WithContext(ctx).Model(&models.AuditLog{}).Select("resource, COUNT(*) as count").Where("created_at BETWEEN ? AND ?", startTime, endTime).Group("resource").Find(&results).Error; err != nil {
		return nil, fmt.Errorf("failed to get audit log stats by resource: %w", err)
	}

	stats := make(map[models.AuditResource]int64)
	for _, r := range results {
		stats[r.Resource] = r.Count
	}

	return stats, nil
}

// GetStatsByUser 根据用户获取统计信息
func (r *auditLogRepository) GetStatsByUser(ctx context.Context, startTime, endTime time.Time, limit int) (map[string]int64, error) {
	type result struct {
		UserID string `json:"user_id"`
		Count  int64  `json:"count"`
	}

	var results []result
	query := r.db.WithContext(ctx).Model(&models.AuditLog{}).Select("user_id, COUNT(*) as count").Where("created_at BETWEEN ? AND ?", startTime, endTime).Group("user_id").Order("count DESC")
	if limit > 0 {
		query = query.Limit(limit)
	}
	if err := query.Find(&results).Error; err != nil {
		return nil, fmt.Errorf("failed to get audit log stats by user: %w", err)
	}

	stats := make(map[string]int64)
	for _, r := range results {
		stats[r.UserID] = r.Count
	}

	return stats, nil
}

// CleanupOldLogs 清理旧的审计日志
func (r *auditLogRepository) CleanupOldLogs(ctx context.Context, before time.Time) error {
	if err := r.db.WithContext(ctx).Delete(&models.AuditLog{}, "created_at < ?", before).Error; err != nil {
		return fmt.Errorf("failed to cleanup old audit logs: %w", err)
	}
	return nil
}

// GetActionStats 获取动作统计信息
func (r *auditLogRepository) GetActionStats(ctx context.Context, since time.Time) (map[string]int64, error) {
	type result struct {
		Action string `json:"action"`
		Count  int64  `json:"count"`
	}

	var results []result
	if err := r.db.WithContext(ctx).Model(&models.AuditLog{}).Select("action, COUNT(*) as count").Where("created_at >= ?", since).Group("action").Find(&results).Error; err != nil {
		return nil, fmt.Errorf("failed to get audit log action stats: %w", err)
	}

	stats := make(map[string]int64)
	for _, r := range results {
		stats[r.Action] = r.Count
	}

	return stats, nil
}