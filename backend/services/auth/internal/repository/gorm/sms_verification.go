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

// smsVerificationRepository 短信验证仓储GORM实现
type smsVerificationRepository struct {
	db *gorm.DB
}

// NewSMSVerificationRepository 创建新的短信验证仓储
func NewSMSVerificationRepository(db *gorm.DB) repository.SMSVerificationRepository {
	return &smsVerificationRepository{db: db}
}

// Create 创建短信验证记录
func (r *smsVerificationRepository) Create(ctx context.Context, verification *models.SMSVerification) error {
	if err := r.db.WithContext(ctx).Create(verification).Error; err != nil {
		return fmt.Errorf("failed to create sms verification: %w", err)
	}
	return nil
}

// GetByID 根据ID获取短信验证记录
func (r *smsVerificationRepository) GetByID(ctx context.Context, id string) (*models.SMSVerification, error) {
	var verification models.SMSVerification
	if err := r.db.WithContext(ctx).Where("id = ?", id).First(&verification).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, repository.ErrSMSVerificationNotFound
		}
		return nil, fmt.Errorf("failed to get sms verification by id: %w", err)
	}
	return &verification, nil
}

// GetByCode 根据验证码获取短信验证记录
func (r *smsVerificationRepository) GetByCode(ctx context.Context, code string) (*models.SMSVerification, error) {
	var verification models.SMSVerification
	if err := r.db.WithContext(ctx).Where("code = ?", code).First(&verification).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, repository.ErrSMSVerificationNotFound
		}
		return nil, fmt.Errorf("failed to get sms verification by code: %w", err)
	}
	return &verification, nil
}

// GetByPhoneAndCode 根据手机号和验证码获取短信验证记录
func (r *smsVerificationRepository) GetByPhoneAndCode(ctx context.Context, phone, code string) (*models.SMSVerification, error) {
	var verification models.SMSVerification
	if err := r.db.WithContext(ctx).Where("phone = ? AND code = ?", phone, code).First(&verification).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, repository.ErrSMSVerificationNotFound
		}
		return nil, fmt.Errorf("failed to get sms verification by phone and code: %w", err)
	}
	return &verification, nil
}

// GetByPhone 根据手机号获取验证记录列表
func (r *smsVerificationRepository) GetByPhone(ctx context.Context, phone string) ([]*models.SMSVerification, error) {
	var verifications []*models.SMSVerification
	if err := r.db.WithContext(ctx).Where("phone = ?", phone).Find(&verifications).Error; err != nil {
		return nil, fmt.Errorf("failed to get sms verifications by phone: %w", err)
	}
	return verifications, nil
}

// GetByUserID 根据用户ID获取验证记录
func (r *smsVerificationRepository) GetByUserID(ctx context.Context, userID uuid.UUID) (*models.SMSVerification, error) {
	var verification models.SMSVerification
	if err := r.db.WithContext(ctx).Where("user_id = ?", userID).First(&verification).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, repository.ErrSMSVerificationNotFound
		}
		return nil, fmt.Errorf("failed to get sms verification by user id: %w", err)
	}
	return &verification, nil
}

// GetActiveByPhone 根据手机号获取活跃的验证记录
func (r *smsVerificationRepository) GetActiveByPhone(ctx context.Context, phone string) (*models.SMSVerification, error) {
	var verification models.SMSVerification
	if err := r.db.WithContext(ctx).Where("phone = ? AND expires_at > ? AND used = false", phone, time.Now()).First(&verification).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, repository.ErrSMSVerificationNotFound
		}
		return nil, fmt.Errorf("failed to get active sms verification by phone: %w", err)
	}
	return &verification, nil
}

// GetActiveByUserID 根据用户ID获取活跃的验证记录
func (r *smsVerificationRepository) GetActiveByUserID(ctx context.Context, userID string) (*models.SMSVerification, error) {
	var verification models.SMSVerification
	if err := r.db.WithContext(ctx).Where("user_id = ? AND expires_at > ? AND used = false", userID, time.Now()).First(&verification).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, repository.ErrSMSVerificationNotFound
		}
		return nil, fmt.Errorf("failed to get active sms verification by user id: %w", err)
	}
	return &verification, nil
}

// Update 更新短信验证记录
func (r *smsVerificationRepository) Update(ctx context.Context, verification *models.SMSVerification) error {
	verification.UpdatedAt = time.Now()
	if err := r.db.WithContext(ctx).Save(verification).Error; err != nil {
		return fmt.Errorf("failed to update sms verification: %w", err)
	}
	return nil
}

// MarkAsUsed 标记为已使用
func (r *smsVerificationRepository) MarkAsUsed(ctx context.Context, id uuid.UUID) error {
	now := time.Now()
	if err := r.db.WithContext(ctx).Model(&models.SMSVerification{}).Where("id = ?", id).Updates(map[string]interface{}{
		"used":       true,
		"used_at":    &now,
		"updated_at": now,
	}).Error; err != nil {
		return fmt.Errorf("failed to mark sms verification as used: %w", err)
	}
	return nil
}

// MarkAsUsedByCode 根据验证码标记为已使用
func (r *smsVerificationRepository) MarkAsUsedByCode(ctx context.Context, code string) error {
	now := time.Now()
	if err := r.db.WithContext(ctx).Model(&models.SMSVerification{}).Where("code = ?", code).Updates(map[string]interface{}{
		"used":       true,
		"used_at":    &now,
		"updated_at": now,
	}).Error; err != nil {
		return fmt.Errorf("failed to mark sms verification as used by code: %w", err)
	}
	return nil
}

// IncrementAttempts 增加尝试次数
func (r *smsVerificationRepository) IncrementAttempts(ctx context.Context, id string) error {
	if err := r.db.WithContext(ctx).Model(&models.SMSVerification{}).Where("id = ?", id).Updates(map[string]interface{}{
		"attempts":   gorm.Expr("attempts + 1"),
		"updated_at": time.Now(),
	}).Error; err != nil {
		return fmt.Errorf("failed to increment sms verification attempts: %w", err)
	}
	return nil
}

// Delete 删除短信验证记录
func (r *smsVerificationRepository) Delete(ctx context.Context, id uuid.UUID) error {
	if err := r.db.WithContext(ctx).Delete(&models.SMSVerification{}, "id = ?", id).Error; err != nil {
		return fmt.Errorf("failed to delete sms verification: %w", err)
	}
	return nil
}

// DeleteByPhone 删除手机号的所有验证记录
func (r *smsVerificationRepository) DeleteByPhone(ctx context.Context, phone string) error {
	if err := r.db.WithContext(ctx).Delete(&models.SMSVerification{}, "phone = ?", phone).Error; err != nil {
		return fmt.Errorf("failed to delete sms verifications by phone: %w", err)
	}
	return nil
}

// DeleteByUserID 删除用户的所有验证记录
func (r *smsVerificationRepository) DeleteByUserID(ctx context.Context, userID uuid.UUID) error {
	if err := r.db.WithContext(ctx).Delete(&models.SMSVerification{}, "user_id = ?", userID).Error; err != nil {
		return fmt.Errorf("failed to delete sms verifications by user id: %w", err)
	}
	return nil
}

// DeleteExpired 删除过期的验证记录
func (r *smsVerificationRepository) DeleteExpired(ctx context.Context) error {
	if err := r.db.WithContext(ctx).Delete(&models.SMSVerification{}, "expires_at < ?", time.Now()).Error; err != nil {
		return fmt.Errorf("failed to delete expired sms verifications: %w", err)
	}
	return nil
}

// DeleteUsed 删除已使用的验证记录
func (r *smsVerificationRepository) DeleteUsed(ctx context.Context) error {
	if err := r.db.WithContext(ctx).Delete(&models.SMSVerification{}, "used = true").Error; err != nil {
		return fmt.Errorf("failed to delete used sms verifications: %w", err)
	}
	return nil
}

// GetExpired 获取过期的验证记录
func (r *smsVerificationRepository) GetExpired(ctx context.Context) ([]*models.SMSVerification, error) {
	var verifications []*models.SMSVerification
	if err := r.db.WithContext(ctx).Where("expires_at < ?", time.Now()).Find(&verifications).Error; err != nil {
		return nil, fmt.Errorf("failed to get expired sms verifications: %w", err)
	}
	return verifications, nil
}

// GetRecentAttempts 获取最近的尝试次数
func (r *smsVerificationRepository) GetRecentAttempts(ctx context.Context, phone string, since time.Time) (int64, error) {
	var count int64
	if err := r.db.WithContext(ctx).Model(&models.SMSVerification{}).Where("phone = ? AND created_at > ?", phone, since).Count(&count).Error; err != nil {
		return 0, fmt.Errorf("failed to get recent sms verification attempts count: %w", err)
	}
	return count, nil
}

// List 获取验证记录列表
func (r *smsVerificationRepository) List(ctx context.Context, offset, limit int) ([]*models.SMSVerification, error) {
	var verifications []*models.SMSVerification
	if err := r.db.WithContext(ctx).Offset(offset).Limit(limit).Find(&verifications).Error; err != nil {
		return nil, fmt.Errorf("failed to list sms verifications: %w", err)
	}
	return verifications, nil
}

// Count 获取验证记录总数
func (r *smsVerificationRepository) Count(ctx context.Context) (int64, error) {
	var count int64
	if err := r.db.WithContext(ctx).Model(&models.SMSVerification{}).Count(&count).Error; err != nil {
		return 0, fmt.Errorf("failed to count sms verifications: %w", err)
	}
	return count, nil
}

// CountByPhone 根据手机号统计验证记录数量
func (r *smsVerificationRepository) CountByPhone(ctx context.Context, phone string) (int64, error) {
	var count int64
	if err := r.db.WithContext(ctx).Model(&models.SMSVerification{}).Where("phone = ?", phone).Count(&count).Error; err != nil {
		return 0, fmt.Errorf("failed to count sms verifications by phone: %w", err)
	}
	return count, nil
}

// CountByUserID 根据用户ID统计验证记录数量
func (r *smsVerificationRepository) CountByUserID(ctx context.Context, userID string) (int64, error) {
	var count int64
	if err := r.db.WithContext(ctx).Model(&models.SMSVerification{}).Where("user_id = ?", userID).Count(&count).Error; err != nil {
		return 0, fmt.Errorf("failed to count sms verifications by user id: %w", err)
	}
	return count, nil
}

// CountByType 根据类型统计验证记录数量
func (r *smsVerificationRepository) CountByType(ctx context.Context, verificationType models.VerificationType) (int64, error) {
	var count int64
	if err := r.db.WithContext(ctx).Model(&models.SMSVerification{}).Where("type = ?", verificationType).Count(&count).Error; err != nil {
		return 0, fmt.Errorf("failed to count sms verifications by type: %w", err)
	}
	return count, nil
}

// GetExpiredVerifications 获取过期的验证记录
func (r *smsVerificationRepository) GetExpiredVerifications(ctx context.Context) ([]*models.SMSVerification, error) {
	var verifications []*models.SMSVerification
	if err := r.db.WithContext(ctx).Where("expires_at < ?", time.Now()).Find(&verifications).Error; err != nil {
		return nil, fmt.Errorf("failed to get expired sms verifications: %w", err)
	}
	return verifications, nil
}

// GetUsedVerifications 获取已使用的验证记录
func (r *smsVerificationRepository) GetUsedVerifications(ctx context.Context) ([]*models.SMSVerification, error) {
	var verifications []*models.SMSVerification
	if err := r.db.WithContext(ctx).Where("used = true").Find(&verifications).Error; err != nil {
		return nil, fmt.Errorf("failed to get used sms verifications: %w", err)
	}
	return verifications, nil
}

// GetByType 根据类型获取验证记录
func (r *smsVerificationRepository) GetByType(ctx context.Context, verificationType models.VerificationType) ([]*models.SMSVerification, error) {
	var verifications []*models.SMSVerification
	if err := r.db.WithContext(ctx).Where("type = ?", verificationType).Find(&verifications).Error; err != nil {
		return nil, fmt.Errorf("failed to get sms verifications by type: %w", err)
	}
	return verifications, nil
}

// CleanupOldVerifications 清理旧的验证记录
func (r *smsVerificationRepository) CleanupOldVerifications(ctx context.Context, before time.Time) error {
	if err := r.db.WithContext(ctx).Delete(&models.SMSVerification{}, "created_at < ?", before).Error; err != nil {
		return fmt.Errorf("failed to cleanup old sms verifications: %w", err)
	}
	return nil
}

// CleanupExpired 清理过期和已使用的验证记录
func (r *smsVerificationRepository) CleanupExpired(ctx context.Context) error {
	if err := r.db.WithContext(ctx).Delete(&models.SMSVerification{}, "expires_at < ? OR used = true", time.Now()).Error; err != nil {
		return fmt.Errorf("failed to cleanup expired sms verifications: %w", err)
	}
	return nil
}