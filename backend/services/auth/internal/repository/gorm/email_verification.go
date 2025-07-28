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

// emailVerificationRepository 邮箱验证仓储GORM实现
type emailVerificationRepository struct {
	db *gorm.DB
}

// NewEmailVerificationRepository 创建新的邮箱验证仓储
func NewEmailVerificationRepository(db *gorm.DB) repository.EmailVerificationRepository {
	return &emailVerificationRepository{db: db}
}

// Create 创建邮箱验证记录
func (r *emailVerificationRepository) Create(ctx context.Context, verification *models.EmailVerification) error {
	if err := r.db.WithContext(ctx).Create(verification).Error; err != nil {
		return fmt.Errorf("failed to create email verification: %w", err)
	}
	return nil
}

// GetByID 根据ID获取邮箱验证记录
func (r *emailVerificationRepository) GetByID(ctx context.Context, id string) (*models.EmailVerification, error) {
	var verification models.EmailVerification
	if err := r.db.WithContext(ctx).Where("id = ?", id).First(&verification).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, repository.ErrEmailVerificationNotFound
		}
		return nil, fmt.Errorf("failed to get email verification by id: %w", err)
	}
	return &verification, nil
}

// GetByToken 根据令牌获取邮箱验证记录
func (r *emailVerificationRepository) GetByToken(ctx context.Context, token string) (*models.EmailVerification, error) {
	var verification models.EmailVerification
	if err := r.db.WithContext(ctx).Where("token = ?", token).First(&verification).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, repository.ErrEmailVerificationNotFound
		}
		return nil, fmt.Errorf("failed to get email verification by token: %w", err)
	}
	return &verification, nil
}

// GetByEmail 根据邮箱获取验证记录列表
func (r *emailVerificationRepository) GetByEmail(ctx context.Context, email string) ([]*models.EmailVerification, error) {
	var verifications []*models.EmailVerification
	if err := r.db.WithContext(ctx).Where("email = ?", email).Find(&verifications).Error; err != nil {
		return nil, fmt.Errorf("failed to get email verifications by email: %w", err)
	}
	return verifications, nil
}

// GetByUserID 根据用户ID获取验证记录
func (r *emailVerificationRepository) GetByUserID(ctx context.Context, userID uuid.UUID) (*models.EmailVerification, error) {
	var verification models.EmailVerification
	if err := r.db.WithContext(ctx).Where("user_id = ?", userID).First(&verification).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, repository.ErrEmailVerificationNotFound
		}
		return nil, fmt.Errorf("failed to get email verification by user id: %w", err)
	}
	return &verification, nil
}

// GetActiveByEmail 根据邮箱获取活跃的验证记录
func (r *emailVerificationRepository) GetActiveByEmail(ctx context.Context, email string) (*models.EmailVerification, error) {
	var verification models.EmailVerification
	if err := r.db.WithContext(ctx).Where("email = ? AND expires_at > ? AND used = false", email, time.Now()).First(&verification).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, repository.ErrEmailVerificationNotFound
		}
		return nil, fmt.Errorf("failed to get active email verification by email: %w", err)
	}
	return &verification, nil
}

// GetActiveByUserID 根据用户ID获取活跃的验证记录
func (r *emailVerificationRepository) GetActiveByUserID(ctx context.Context, userID string) (*models.EmailVerification, error) {
	var verification models.EmailVerification
	if err := r.db.WithContext(ctx).Where("user_id = ? AND expires_at > ? AND used = false", userID, time.Now()).First(&verification).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, repository.ErrEmailVerificationNotFound
		}
		return nil, fmt.Errorf("failed to get active email verification by user id: %w", err)
	}
	return &verification, nil
}

// Update 更新邮箱验证记录
func (r *emailVerificationRepository) Update(ctx context.Context, verification *models.EmailVerification) error {
	verification.UpdatedAt = time.Now()
	if err := r.db.WithContext(ctx).Save(verification).Error; err != nil {
		return fmt.Errorf("failed to update email verification: %w", err)
	}
	return nil
}

// MarkAsUsed 标记为已使用
func (r *emailVerificationRepository) MarkAsUsed(ctx context.Context, id uuid.UUID) error {
	now := time.Now()
	if err := r.db.WithContext(ctx).Model(&models.EmailVerification{}).Where("id = ?", id).Updates(map[string]interface{}{
		"used":       true,
		"used_at":    &now,
		"updated_at": now,
	}).Error; err != nil {
		return fmt.Errorf("failed to mark email verification as used: %w", err)
	}
	return nil
}

// MarkAsUsedByToken 根据令牌标记为已使用
func (r *emailVerificationRepository) MarkAsUsedByToken(ctx context.Context, token string) error {
	now := time.Now()
	if err := r.db.WithContext(ctx).Model(&models.EmailVerification{}).Where("token = ?", token).Updates(map[string]interface{}{
		"used":       true,
		"used_at":    &now,
		"updated_at": now,
	}).Error; err != nil {
		return fmt.Errorf("failed to mark email verification as used by token: %w", err)
	}
	return nil
}

// IncrementAttempts 增加尝试次数
func (r *emailVerificationRepository) IncrementAttempts(ctx context.Context, id string) error {
	if err := r.db.WithContext(ctx).Model(&models.EmailVerification{}).Where("id = ?", id).Updates(map[string]interface{}{
		"attempts":   gorm.Expr("attempts + 1"),
		"updated_at": time.Now(),
	}).Error; err != nil {
		return fmt.Errorf("failed to increment email verification attempts: %w", err)
	}
	return nil
}

// Delete 删除邮箱验证记录
func (r *emailVerificationRepository) Delete(ctx context.Context, id uuid.UUID) error {
	if err := r.db.WithContext(ctx).Delete(&models.EmailVerification{}, "id = ?", id).Error; err != nil {
		return fmt.Errorf("failed to delete email verification: %w", err)
	}
	return nil
}

// DeleteByEmail 删除邮箱的所有验证记录
func (r *emailVerificationRepository) DeleteByEmail(ctx context.Context, email string) error {
	if err := r.db.WithContext(ctx).Delete(&models.EmailVerification{}, "email = ?", email).Error; err != nil {
		return fmt.Errorf("failed to delete email verifications by email: %w", err)
	}
	return nil
}

// DeleteByUserID 删除用户的所有验证记录
func (r *emailVerificationRepository) DeleteByUserID(ctx context.Context, userID uuid.UUID) error {
	if err := r.db.WithContext(ctx).Delete(&models.EmailVerification{}, "user_id = ?", userID).Error; err != nil {
		return fmt.Errorf("failed to delete email verifications by user id: %w", err)
	}
	return nil
}

// DeleteExpired 删除过期的验证记录
func (r *emailVerificationRepository) DeleteExpired(ctx context.Context) error {
	if err := r.db.WithContext(ctx).Delete(&models.EmailVerification{}, "expires_at < ?", time.Now()).Error; err != nil {
		return fmt.Errorf("failed to delete expired email verifications: %w", err)
	}
	return nil
}

// DeleteUsed 删除已使用的验证记录
func (r *emailVerificationRepository) DeleteUsed(ctx context.Context) error {
	if err := r.db.WithContext(ctx).Delete(&models.EmailVerification{}, "used = true").Error; err != nil {
		return fmt.Errorf("failed to delete used email verifications: %w", err)
	}
	return nil
}

// List 获取验证记录列表
func (r *emailVerificationRepository) List(ctx context.Context, offset, limit int) ([]*models.EmailVerification, error) {
	var verifications []*models.EmailVerification
	if err := r.db.WithContext(ctx).Offset(offset).Limit(limit).Find(&verifications).Error; err != nil {
		return nil, fmt.Errorf("failed to list email verifications: %w", err)
	}
	return verifications, nil
}

// Count 获取验证记录总数
func (r *emailVerificationRepository) Count(ctx context.Context) (int64, error) {
	var count int64
	if err := r.db.WithContext(ctx).Model(&models.EmailVerification{}).Count(&count).Error; err != nil {
		return 0, fmt.Errorf("failed to count email verifications: %w", err)
	}
	return count, nil
}

// CountByEmail 根据邮箱统计验证记录数量
func (r *emailVerificationRepository) CountByEmail(ctx context.Context, email string) (int64, error) {
	var count int64
	if err := r.db.WithContext(ctx).Model(&models.EmailVerification{}).Where("email = ?", email).Count(&count).Error; err != nil {
		return 0, fmt.Errorf("failed to count email verifications by email: %w", err)
	}
	return count, nil
}

// CountByUserID 根据用户ID统计验证记录数量
func (r *emailVerificationRepository) CountByUserID(ctx context.Context, userID string) (int64, error) {
	var count int64
	if err := r.db.WithContext(ctx).Model(&models.EmailVerification{}).Where("user_id = ?", userID).Count(&count).Error; err != nil {
		return 0, fmt.Errorf("failed to count email verifications by user id: %w", err)
	}
	return count, nil
}

// CountByType 根据类型统计验证记录数量
func (r *emailVerificationRepository) CountByType(ctx context.Context, verificationType models.VerificationType) (int64, error) {
	var count int64
	if err := r.db.WithContext(ctx).Model(&models.EmailVerification{}).Where("type = ?", verificationType).Count(&count).Error; err != nil {
		return 0, fmt.Errorf("failed to count email verifications by type: %w", err)
	}
	return count, nil
}

// GetExpiredVerifications 获取过期的验证记录
func (r *emailVerificationRepository) GetExpiredVerifications(ctx context.Context) ([]*models.EmailVerification, error) {
	var verifications []*models.EmailVerification
	if err := r.db.WithContext(ctx).Where("expires_at < ?", time.Now()).Find(&verifications).Error; err != nil {
		return nil, fmt.Errorf("failed to get expired email verifications: %w", err)
	}
	return verifications, nil
}

// GetUsedVerifications 获取已使用的验证记录
func (r *emailVerificationRepository) GetUsedVerifications(ctx context.Context) ([]*models.EmailVerification, error) {
	var verifications []*models.EmailVerification
	if err := r.db.WithContext(ctx).Where("used = true").Find(&verifications).Error; err != nil {
		return nil, fmt.Errorf("failed to get used email verifications: %w", err)
	}
	return verifications, nil
}

// GetByType 根据类型获取验证记录
func (r *emailVerificationRepository) GetByType(ctx context.Context, verificationType models.VerificationType) ([]*models.EmailVerification, error) {
	var verifications []*models.EmailVerification
	if err := r.db.WithContext(ctx).Where("type = ?", verificationType).Find(&verifications).Error; err != nil {
		return nil, fmt.Errorf("failed to get email verifications by type: %w", err)
	}
	return verifications, nil
}

// CleanupOldVerifications 清理旧的验证记录
func (r *emailVerificationRepository) CleanupOldVerifications(ctx context.Context, before time.Time) error {
	if err := r.db.WithContext(ctx).Delete(&models.EmailVerification{}, "created_at < ?", before).Error; err != nil {
		return fmt.Errorf("failed to cleanup old email verifications: %w", err)
	}
	return nil
}

// CleanupExpired 清理过期和已使用的验证记录
func (r *emailVerificationRepository) CleanupExpired(ctx context.Context) error {
	if err := r.db.WithContext(ctx).Delete(&models.EmailVerification{}, "expires_at < ? OR used = true", time.Now()).Error; err != nil {
		return fmt.Errorf("failed to cleanup expired email verifications: %w", err)
	}
	return nil
}

// GetExpired 获取过期的验证记录
func (r *emailVerificationRepository) GetExpired(ctx context.Context) ([]*models.EmailVerification, error) {
	var verifications []*models.EmailVerification
	if err := r.db.WithContext(ctx).Where("expires_at < ?", time.Now()).Find(&verifications).Error; err != nil {
		return nil, fmt.Errorf("failed to get expired email verifications: %w", err)
	}
	return verifications, nil
}

// GetRecentAttempts 获取最近的尝试次数
func (r *emailVerificationRepository) GetRecentAttempts(ctx context.Context, userID uuid.UUID, since time.Time) (int64, error) {
	var count int64
	if err := r.db.WithContext(ctx).Model(&models.EmailVerification{}).Where("user_id = ? AND created_at >= ?", userID, since).Count(&count).Error; err != nil {
		return 0, fmt.Errorf("failed to get recent email verification attempts: %w", err)
	}
	return count, nil
}