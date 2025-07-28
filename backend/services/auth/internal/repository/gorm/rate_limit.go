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

// rateLimitRepository 限流仓储GORM实现
type rateLimitRepository struct {
	db *gorm.DB
}

// NewRateLimitRepository 创建新的限流仓储
func NewRateLimitRepository(db *gorm.DB) repository.RateLimitRepository {
	return &rateLimitRepository{db: db}
}

// Create 创建限流记录
func (r *rateLimitRepository) Create(ctx context.Context, record *models.RateLimitRecord) error {
	if err := r.db.WithContext(ctx).Create(record).Error; err != nil {
		return fmt.Errorf("failed to create rate limit record: %w", err)
	}
	return nil
}

// GetByID 根据ID获取限流记录
func (r *rateLimitRepository) GetByID(ctx context.Context, id string) (*models.RateLimitRecord, error) {
	var record models.RateLimitRecord
	if err := r.db.WithContext(ctx).Where("id = ?", id).First(&record).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, repository.ErrRateLimitRecordNotFound
		}
		return nil, fmt.Errorf("failed to get rate limit record by id: %w", err)
	}
	return &record, nil
}

// GetByKey 根据键获取限流记录
func (r *rateLimitRepository) GetByKey(ctx context.Context, key string) (*models.RateLimitRecord, error) {
	var record models.RateLimitRecord
	if err := r.db.WithContext(ctx).Where("key = ?", key).First(&record).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, repository.ErrRateLimitRecordNotFound
		}
		return nil, fmt.Errorf("failed to get rate limit record by key: %w", err)
	}
	return &record, nil
}

// GetByIPAddress 根据IP地址获取限流记录列表
func (r *rateLimitRepository) GetByIPAddress(ctx context.Context, ipAddress string) ([]*models.RateLimitRecord, error) {
	var records []*models.RateLimitRecord
	if err := r.db.WithContext(ctx).Where("ip_address = ?", ipAddress).Find(&records).Error; err != nil {
		return nil, fmt.Errorf("failed to get rate limit records by ip address: %w", err)
	}
	return records, nil
}

// GetByUserID 根据用户ID获取限流记录列表
func (r *rateLimitRepository) GetByUserID(ctx context.Context, userID string) ([]*models.RateLimitRecord, error) {
	var records []*models.RateLimitRecord
	if err := r.db.WithContext(ctx).Where("user_id = ?", userID).Find(&records).Error; err != nil {
		return nil, fmt.Errorf("failed to get rate limit records by user id: %w", err)
	}
	return records, nil
}

// GetActiveByKey 根据键获取活跃的限流记录
func (r *rateLimitRepository) GetActiveByKey(ctx context.Context, key string) (*models.RateLimitRecord, error) {
	var record models.RateLimitRecord
	if err := r.db.WithContext(ctx).Where("key = ? AND expires_at > ?", key, time.Now()).First(&record).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, repository.ErrRateLimitRecordNotFound
		}
		return nil, fmt.Errorf("failed to get active rate limit record by key: %w", err)
	}
	return &record, nil
}

// GetActiveByIPAddress 根据IP地址获取活跃的限流记录列表
func (r *rateLimitRepository) GetActiveByIPAddress(ctx context.Context, ipAddress string) ([]*models.RateLimitRecord, error) {
	var records []*models.RateLimitRecord
	if err := r.db.WithContext(ctx).Where("ip_address = ? AND expires_at > ?", ipAddress, time.Now()).Find(&records).Error; err != nil {
		return nil, fmt.Errorf("failed to get active rate limit records by ip address: %w", err)
	}
	return records, nil
}

// GetActiveByUserID 根据用户ID获取活跃的限流记录列表
func (r *rateLimitRepository) GetActiveByUserID(ctx context.Context, userID string) ([]*models.RateLimitRecord, error) {
	var records []*models.RateLimitRecord
	if err := r.db.WithContext(ctx).Where("user_id = ? AND expires_at > ?", userID, time.Now()).Find(&records).Error; err != nil {
		return nil, fmt.Errorf("failed to get active rate limit records by user id: %w", err)
	}
	return records, nil
}

// Update 更新限流记录
func (r *rateLimitRepository) Update(ctx context.Context, record *models.RateLimitRecord) error {
	record.UpdatedAt = time.Now()
	if err := r.db.WithContext(ctx).Save(record).Error; err != nil {
		return fmt.Errorf("failed to update rate limit record: %w", err)
	}
	return nil
}

// IncrementCount 增加计数
func (r *rateLimitRepository) IncrementCount(ctx context.Context, key string, duration time.Duration) (int64, error) {
	now := time.Now()
	expiresAt := now.Add(duration)
	
	// 尝试更新现有记录
	result := r.db.WithContext(ctx).Model(&models.RateLimitRecord{}).Where("key = ? AND expires_at > ?", key, now).Updates(map[string]interface{}{
		"count":      gorm.Expr("count + 1"),
		"expires_at": expiresAt,
		"updated_at": now,
	})
	
	if result.Error != nil {
		return 0, fmt.Errorf("failed to increment rate limit count: %w", result.Error)
	}
	
	// 如果没有更新任何记录，创建新记录
	if result.RowsAffected == 0 {
		newRecord := &models.RateLimitRecord{
			Key:       key,
			Count:     1,
			ExpiresAt: expiresAt,
			CreatedAt: now,
			UpdatedAt: now,
		}
		if err := r.db.WithContext(ctx).Create(newRecord).Error; err != nil {
			return 0, fmt.Errorf("failed to create rate limit record: %w", err)
		}
		return 1, nil
	}
	
	// 获取更新后的计数
	var record models.RateLimitRecord
	if err := r.db.WithContext(ctx).Where("key = ?", key).First(&record).Error; err != nil {
		return 0, fmt.Errorf("failed to get updated rate limit count: %w", err)
	}
	
	return int64(record.Count), nil
}

// ResetCount 重置计数
func (r *rateLimitRepository) ResetCount(ctx context.Context, key string) error {
	if err := r.db.WithContext(ctx).Model(&models.RateLimitRecord{}).Where("key = ?", key).Updates(map[string]interface{}{
		"count":      0,
		"updated_at": time.Now(),
	}).Error; err != nil {
		return fmt.Errorf("failed to reset rate limit count: %w", err)
	}
	return nil
}

// UpdateExpiresAt 更新过期时间
func (r *rateLimitRepository) UpdateExpiresAt(ctx context.Context, key string, expiresAt time.Time) error {
	if err := r.db.WithContext(ctx).Model(&models.RateLimitRecord{}).Where("key = ?", key).Updates(map[string]interface{}{
		"expires_at": expiresAt,
		"updated_at": time.Now(),
	}).Error; err != nil {
		return fmt.Errorf("failed to update rate limit expires at: %w", err)
	}
	return nil
}

// Delete 删除限流记录
func (r *rateLimitRepository) Delete(ctx context.Context, id uuid.UUID) error {
	if err := r.db.WithContext(ctx).Delete(&models.RateLimitRecord{}, "id = ?", id).Error; err != nil {
		return fmt.Errorf("failed to delete rate limit record: %w", err)
	}
	return nil
}

// DeleteByKey 根据键删除限流记录
func (r *rateLimitRepository) DeleteByKey(ctx context.Context, key string) error {
	if err := r.db.WithContext(ctx).Delete(&models.RateLimitRecord{}, "key = ?", key).Error; err != nil {
		return fmt.Errorf("failed to delete rate limit record by key: %w", err)
	}
	return nil
}

// DeleteByIPAddress 删除IP地址的所有限流记录
func (r *rateLimitRepository) DeleteByIPAddress(ctx context.Context, ipAddress string) error {
	if err := r.db.WithContext(ctx).Delete(&models.RateLimitRecord{}, "ip_address = ?", ipAddress).Error; err != nil {
		return fmt.Errorf("failed to delete rate limit records by ip address: %w", err)
	}
	return nil
}

// DeleteByUserID 删除用户的所有限流记录
func (r *rateLimitRepository) DeleteByUserID(ctx context.Context, userID string) error {
	if err := r.db.WithContext(ctx).Delete(&models.RateLimitRecord{}, "user_id = ?", userID).Error; err != nil {
		return fmt.Errorf("failed to delete rate limit records by user id: %w", err)
	}
	return nil
}

// DeleteExpired 删除过期的限流记录
func (r *rateLimitRepository) DeleteExpired(ctx context.Context) error {
	if err := r.db.WithContext(ctx).Delete(&models.RateLimitRecord{}, "expires_at < ?", time.Now()).Error; err != nil {
		return fmt.Errorf("failed to delete expired rate limit records: %w", err)
	}
	return nil
}

// List 获取限流记录列表
func (r *rateLimitRepository) List(ctx context.Context, offset, limit int) ([]*models.RateLimitRecord, error) {
	var records []*models.RateLimitRecord
	if err := r.db.WithContext(ctx).Offset(offset).Limit(limit).Find(&records).Error; err != nil {
		return nil, fmt.Errorf("failed to list rate limit records: %w", err)
	}
	return records, nil
}

// Count 获取限流记录总数
func (r *rateLimitRepository) Count(ctx context.Context) (int64, error) {
	var count int64
	if err := r.db.WithContext(ctx).Model(&models.RateLimitRecord{}).Count(&count).Error; err != nil {
		return 0, fmt.Errorf("failed to count rate limit records: %w", err)
	}
	return count, nil
}

// GetCount 获取指定键的计数
func (r *rateLimitRepository) GetCount(ctx context.Context, key string) (int64, error) {
	var record models.RateLimitRecord
	if err := r.db.WithContext(ctx).Where("key = ? AND expires_at > ?", key, time.Now()).First(&record).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return 0, nil
		}
		return 0, fmt.Errorf("failed to get rate limit count: %w", err)
	}
	return int64(record.Count), nil
}

// GetExpired 获取过期的限流记录
func (r *rateLimitRepository) GetExpired(ctx context.Context) ([]*models.RateLimitRecord, error) {
	var records []*models.RateLimitRecord
	if err := r.db.WithContext(ctx).Where("expires_at < ?", time.Now()).Find(&records).Error; err != nil {
		return nil, fmt.Errorf("failed to get expired rate limit records: %w", err)
	}
	return records, nil
}

// CountByIPAddress 根据IP地址统计限流记录数量
func (r *rateLimitRepository) CountByIPAddress(ctx context.Context, ipAddress string) (int64, error) {
	var count int64
	if err := r.db.WithContext(ctx).Model(&models.RateLimitRecord{}).Where("ip_address = ?", ipAddress).Count(&count).Error; err != nil {
		return 0, fmt.Errorf("failed to count rate limit records by ip address: %w", err)
	}
	return count, nil
}

// CountByUserID 根据用户ID统计限流记录数量
func (r *rateLimitRepository) CountByUserID(ctx context.Context, userID string) (int64, error) {
	var count int64
	if err := r.db.WithContext(ctx).Model(&models.RateLimitRecord{}).Where("user_id = ?", userID).Count(&count).Error; err != nil {
		return 0, fmt.Errorf("failed to count rate limit records by user id: %w", err)
	}
	return count, nil
}

// CountActiveByIPAddress 根据IP地址统计活跃限流记录数量
func (r *rateLimitRepository) CountActiveByIPAddress(ctx context.Context, ipAddress string) (int64, error) {
	var count int64
	if err := r.db.WithContext(ctx).Model(&models.RateLimitRecord{}).Where("ip_address = ? AND expires_at > ?", ipAddress, time.Now()).Count(&count).Error; err != nil {
		return 0, fmt.Errorf("failed to count active rate limit records by ip address: %w", err)
	}
	return count, nil
}

// CountActiveByUserID 根据用户ID统计活跃限流记录数量
func (r *rateLimitRepository) CountActiveByUserID(ctx context.Context, userID string) (int64, error) {
	var count int64
	if err := r.db.WithContext(ctx).Model(&models.RateLimitRecord{}).Where("user_id = ? AND expires_at > ?", userID, time.Now()).Count(&count).Error; err != nil {
		return 0, fmt.Errorf("failed to count active rate limit records by user id: %w", err)
	}
	return count, nil
}

// ExistsByKey 检查键是否存在
func (r *rateLimitRepository) ExistsByKey(ctx context.Context, key string) (bool, error) {
	var count int64
	if err := r.db.WithContext(ctx).Model(&models.RateLimitRecord{}).Where("key = ?", key).Count(&count).Error; err != nil {
		return false, fmt.Errorf("failed to check rate limit record exists by key: %w", err)
	}
	return count > 0, nil
}

// ExistsActiveByKey 检查活跃键是否存在
func (r *rateLimitRepository) ExistsActiveByKey(ctx context.Context, key string) (bool, error) {
	var count int64
	if err := r.db.WithContext(ctx).Model(&models.RateLimitRecord{}).Where("key = ? AND expires_at > ?", key, time.Now()).Count(&count).Error; err != nil {
		return false, fmt.Errorf("failed to check active rate limit record exists by key: %w", err)
	}
	return count > 0, nil
}

// GetExpiredRecords 获取过期的限流记录
func (r *rateLimitRepository) GetExpiredRecords(ctx context.Context) ([]*models.RateLimitRecord, error) {
	var records []*models.RateLimitRecord
	if err := r.db.WithContext(ctx).Where("expires_at < ?", time.Now()).Find(&records).Error; err != nil {
		return nil, fmt.Errorf("failed to get expired rate limit records: %w", err)
	}
	return records, nil
}

// GetTopIPAddresses 获取访问次数最多的IP地址
func (r *rateLimitRepository) GetTopIPAddresses(ctx context.Context, limit int, startTime, endTime time.Time) ([]string, error) {
	type result struct {
		IPAddress string `json:"ip_address"`
		Count     int64  `json:"count"`
	}

	var results []result
	query := r.db.WithContext(ctx).Model(&models.RateLimitRecord{}).Select("ip_address, SUM(count) as count").Group("ip_address").Order("count DESC")
	if !startTime.IsZero() && !endTime.IsZero() {
		query = query.Where("created_at BETWEEN ? AND ?", startTime, endTime)
	}
	if limit > 0 {
		query = query.Limit(limit)
	}
	if err := query.Find(&results).Error; err != nil {
		return nil, fmt.Errorf("failed to get top ip addresses: %w", err)
	}

	var ipAddresses []string
	for _, r := range results {
		ipAddresses = append(ipAddresses, r.IPAddress)
	}

	return ipAddresses, nil
}

// GetTopUsers 获取访问次数最多的用户
func (r *rateLimitRepository) GetTopUsers(ctx context.Context, limit int, startTime, endTime time.Time) ([]string, error) {
	type result struct {
		UserID string `json:"user_id"`
		Count  int64  `json:"count"`
	}

	var results []result
	query := r.db.WithContext(ctx).Model(&models.RateLimitRecord{}).Select("user_id, SUM(count) as count").Where("user_id IS NOT NULL AND user_id != ''").Group("user_id").Order("count DESC")
	if !startTime.IsZero() && !endTime.IsZero() {
		query = query.Where("created_at BETWEEN ? AND ?", startTime, endTime)
	}
	if limit > 0 {
		query = query.Limit(limit)
	}
	if err := query.Find(&results).Error; err != nil {
		return nil, fmt.Errorf("failed to get top users: %w", err)
	}

	var userIDs []string
	for _, r := range results {
		userIDs = append(userIDs, r.UserID)
	}

	return userIDs, nil
}

// CleanupOldRecords 清理旧的限流记录
func (r *rateLimitRepository) CleanupOldRecords(ctx context.Context, before time.Time) error {
	if err := r.db.WithContext(ctx).Delete(&models.RateLimitRecord{}, "created_at < ?", before).Error; err != nil {
		return fmt.Errorf("failed to cleanup old rate limit records: %w", err)
	}
	return nil
}

// CleanupExpired 清理过期的限流记录
func (r *rateLimitRepository) CleanupExpired(ctx context.Context) error {
	if err := r.db.WithContext(ctx).Delete(&models.RateLimitRecord{}, "expires_at < ?", time.Now()).Error; err != nil {
		return fmt.Errorf("failed to cleanup expired rate limit records: %w", err)
	}
	return nil
}