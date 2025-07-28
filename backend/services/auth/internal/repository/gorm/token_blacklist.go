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

// tokenBlacklistRepository 令牌黑名单仓储GORM实现
type tokenBlacklistRepository struct {
	db *gorm.DB
}

// NewTokenBlacklistRepository 创建新的令牌黑名单仓储
func NewTokenBlacklistRepository(db *gorm.DB) repository.TokenBlacklistRepository {
	return &tokenBlacklistRepository{db: db}
}

// Create 创建令牌黑名单记录
func (r *tokenBlacklistRepository) Create(ctx context.Context, token *models.TokenBlacklist) error {
	if err := r.db.WithContext(ctx).Create(token).Error; err != nil {
		return fmt.Errorf("failed to create token blacklist: %w", err)
	}
	return nil
}

// GetByID 根据ID获取令牌黑名单记录
func (r *tokenBlacklistRepository) GetByID(ctx context.Context, id string) (*models.TokenBlacklist, error) {
	var token models.TokenBlacklist
	if err := r.db.WithContext(ctx).Where("id = ?", id).First(&token).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, repository.ErrTokenBlacklistNotFound
		}
		return nil, fmt.Errorf("failed to get token blacklist by id: %w", err)
	}
	return &token, nil
}

// GetByTokenHash 根据令牌哈希获取黑名单记录
func (r *tokenBlacklistRepository) GetByTokenHash(ctx context.Context, tokenHash string) (*models.TokenBlacklist, error) {
	var token models.TokenBlacklist
	if err := r.db.WithContext(ctx).Where("token_hash = ?", tokenHash).First(&token).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, repository.ErrTokenBlacklistNotFound
		}
		return nil, fmt.Errorf("failed to get token blacklist by token hash: %w", err)
	}
	return &token, nil
}

// GetByJTI 根据JTI获取黑名单记录
func (r *tokenBlacklistRepository) GetByJTI(ctx context.Context, jti string) (*models.TokenBlacklist, error) {
	var token models.TokenBlacklist
	if err := r.db.WithContext(ctx).Where("jti = ?", jti).First(&token).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, repository.ErrTokenBlacklistNotFound
		}
		return nil, fmt.Errorf("failed to get token blacklist by jti: %w", err)
	}
	return &token, nil
}

// GetByUserID 根据用户ID获取黑名单记录列表
func (r *tokenBlacklistRepository) GetByUserID(ctx context.Context, userID string) ([]*models.TokenBlacklist, error) {
	var tokens []*models.TokenBlacklist
	if err := r.db.WithContext(ctx).Where("user_id = ?", userID).Find(&tokens).Error; err != nil {
		return nil, fmt.Errorf("failed to get token blacklist by user id: %w", err)
	}
	return tokens, nil
}

// GetByTokenType 根据令牌类型获取黑名单记录列表
func (r *tokenBlacklistRepository) GetByTokenType(ctx context.Context, tokenType string) ([]*models.TokenBlacklist, error) {
	var tokens []*models.TokenBlacklist
	if err := r.db.WithContext(ctx).Where("token_type = ?", tokenType).Find(&tokens).Error; err != nil {
		return nil, fmt.Errorf("failed to get token blacklist by token type: %w", err)
	}
	return tokens, nil
}

// GetByReason 根据原因获取黑名单记录列表
func (r *tokenBlacklistRepository) GetByReason(ctx context.Context, reason string) ([]*models.TokenBlacklist, error) {
	var tokens []*models.TokenBlacklist
	if err := r.db.WithContext(ctx).Where("reason = ?", reason).Find(&tokens).Error; err != nil {
		return nil, fmt.Errorf("failed to get token blacklist by reason: %w", err)
	}
	return tokens, nil
}

// GetActiveByTokenHash 根据令牌哈希获取活跃的黑名单记录
func (r *tokenBlacklistRepository) GetActiveByTokenHash(ctx context.Context, tokenHash string) (*models.TokenBlacklist, error) {
	var token models.TokenBlacklist
	if err := r.db.WithContext(ctx).Where("token_hash = ? AND expires_at > ?", tokenHash, time.Now()).First(&token).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, repository.ErrTokenBlacklistNotFound
		}
		return nil, fmt.Errorf("failed to get active token blacklist by token hash: %w", err)
	}
	return &token, nil
}

// GetActiveByJTI 根据JTI获取活跃的黑名单记录
func (r *tokenBlacklistRepository) GetActiveByJTI(ctx context.Context, jti string) (*models.TokenBlacklist, error) {
	var token models.TokenBlacklist
	if err := r.db.WithContext(ctx).Where("jti = ? AND expires_at > ?", jti, time.Now()).First(&token).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, repository.ErrTokenBlacklistNotFound
		}
		return nil, fmt.Errorf("failed to get active token blacklist by jti: %w", err)
	}
	return &token, nil
}

// GetActiveByUserID 根据用户ID获取活跃的黑名单记录列表
func (r *tokenBlacklistRepository) GetActiveByUserID(ctx context.Context, userID string) ([]*models.TokenBlacklist, error) {
	var tokens []*models.TokenBlacklist
	if err := r.db.WithContext(ctx).Where("user_id = ? AND expires_at > ?", userID, time.Now()).Find(&tokens).Error; err != nil {
		return nil, fmt.Errorf("failed to get active token blacklist by user id: %w", err)
	}
	return tokens, nil
}

// Update 更新令牌黑名单记录
func (r *tokenBlacklistRepository) Update(ctx context.Context, token *models.TokenBlacklist) error {
	token.UpdatedAt = time.Now()
	if err := r.db.WithContext(ctx).Save(token).Error; err != nil {
		return fmt.Errorf("failed to update token blacklist: %w", err)
	}
	return nil
}

// UpdateReason 更新黑名单原因
func (r *tokenBlacklistRepository) UpdateReason(ctx context.Context, id, reason string) error {
	if err := r.db.WithContext(ctx).Model(&models.TokenBlacklist{}).Where("id = ?", id).Updates(map[string]interface{}{
		"reason":     reason,
		"updated_at": time.Now(),
	}).Error; err != nil {
		return fmt.Errorf("failed to update token blacklist reason: %w", err)
	}
	return nil
}

// UpdateExpiresAt 更新过期时间
func (r *tokenBlacklistRepository) UpdateExpiresAt(ctx context.Context, id string, expiresAt time.Time) error {
	if err := r.db.WithContext(ctx).Model(&models.TokenBlacklist{}).Where("id = ?", id).Updates(map[string]interface{}{
		"expires_at": expiresAt,
		"updated_at": time.Now(),
	}).Error; err != nil {
		return fmt.Errorf("failed to update token blacklist expires at: %w", err)
	}
	return nil
}

// Delete 删除令牌黑名单记录
func (r *tokenBlacklistRepository) Delete(ctx context.Context, id uuid.UUID) error {
	if err := r.db.WithContext(ctx).Delete(&models.TokenBlacklist{}, "id = ?", id).Error; err != nil {
		return fmt.Errorf("failed to delete token blacklist: %w", err)
	}
	return nil
}

// DeleteByTokenHash 根据令牌哈希删除黑名单记录
func (r *tokenBlacklistRepository) DeleteByTokenHash(ctx context.Context, tokenHash string) error {
	if err := r.db.WithContext(ctx).Delete(&models.TokenBlacklist{}, "token_hash = ?", tokenHash).Error; err != nil {
		return fmt.Errorf("failed to delete token blacklist by token hash: %w", err)
	}
	return nil
}

// DeleteByJTI 根据JTI删除黑名单记录
func (r *tokenBlacklistRepository) DeleteByJTI(ctx context.Context, jti string) error {
	if err := r.db.WithContext(ctx).Delete(&models.TokenBlacklist{}, "jti = ?", jti).Error; err != nil {
		return fmt.Errorf("failed to delete token blacklist by jti: %w", err)
	}
	return nil
}

// DeleteByUserID 删除用户的所有黑名单记录
func (r *tokenBlacklistRepository) DeleteByUserID(ctx context.Context, userID string) error {
	if err := r.db.WithContext(ctx).Delete(&models.TokenBlacklist{}, "user_id = ?", userID).Error; err != nil {
		return fmt.Errorf("failed to delete token blacklist by user id: %w", err)
	}
	return nil
}

// DeleteExpired 删除过期的黑名单记录
func (r *tokenBlacklistRepository) DeleteExpired(ctx context.Context) error {
	if err := r.db.WithContext(ctx).Delete(&models.TokenBlacklist{}, "expires_at < ?", time.Now()).Error; err != nil {
		return fmt.Errorf("failed to delete expired token blacklist: %w", err)
	}
	return nil
}

// List 获取令牌黑名单记录列表
func (r *tokenBlacklistRepository) List(ctx context.Context, offset, limit int) ([]*models.TokenBlacklist, error) {
	var tokens []*models.TokenBlacklist
	if err := r.db.WithContext(ctx).Offset(offset).Limit(limit).Find(&tokens).Error; err != nil {
		return nil, fmt.Errorf("failed to list token blacklist: %w", err)
	}
	return tokens, nil
}

// Count 获取令牌黑名单记录总数
func (r *tokenBlacklistRepository) Count(ctx context.Context) (int64, error) {
	var count int64
	if err := r.db.WithContext(ctx).Model(&models.TokenBlacklist{}).Count(&count).Error; err != nil {
		return 0, fmt.Errorf("failed to count token blacklist: %w", err)
	}
	return count, nil
}

// CountByUserID 根据用户ID统计黑名单记录数量
func (r *tokenBlacklistRepository) CountByUserID(ctx context.Context, userID string) (int64, error) {
	var count int64
	if err := r.db.WithContext(ctx).Model(&models.TokenBlacklist{}).Where("user_id = ?", userID).Count(&count).Error; err != nil {
		return 0, fmt.Errorf("failed to count token blacklist by user id: %w", err)
	}
	return count, nil
}

// CountByTokenType 根据令牌类型统计黑名单记录数量
func (r *tokenBlacklistRepository) CountByTokenType(ctx context.Context, tokenType string) (int64, error) {
	var count int64
	if err := r.db.WithContext(ctx).Model(&models.TokenBlacklist{}).Where("token_type = ?", tokenType).Count(&count).Error; err != nil {
		return 0, fmt.Errorf("failed to count token blacklist by token type: %w", err)
	}
	return count, nil
}

// CountByReason 根据原因统计黑名单记录数量
func (r *tokenBlacklistRepository) CountByReason(ctx context.Context, reason string) (int64, error) {
	var count int64
	if err := r.db.WithContext(ctx).Model(&models.TokenBlacklist{}).Where("reason = ?", reason).Count(&count).Error; err != nil {
		return 0, fmt.Errorf("failed to count token blacklist by reason: %w", err)
	}
	return count, nil
}

// CountActiveByUserID 根据用户ID统计活跃黑名单记录数量
func (r *tokenBlacklistRepository) CountActiveByUserID(ctx context.Context, userID string) (int64, error) {
	var count int64
	if err := r.db.WithContext(ctx).Model(&models.TokenBlacklist{}).Where("user_id = ? AND expires_at > ?", userID, time.Now()).Count(&count).Error; err != nil {
		return 0, fmt.Errorf("failed to count active token blacklist by user id: %w", err)
	}
	return count, nil
}

// ExistsByTokenHash 检查令牌哈希是否在黑名单中
func (r *tokenBlacklistRepository) ExistsByTokenHash(ctx context.Context, tokenHash string) (bool, error) {
	var count int64
	if err := r.db.WithContext(ctx).Model(&models.TokenBlacklist{}).Where("token_hash = ?", tokenHash).Count(&count).Error; err != nil {
		return false, fmt.Errorf("failed to check token blacklist exists by token hash: %w", err)
	}
	return count > 0, nil
}

// ExistsByJTI 检查JTI是否在黑名单中
func (r *tokenBlacklistRepository) ExistsByJTI(ctx context.Context, jti string) (bool, error) {
	var count int64
	if err := r.db.WithContext(ctx).Model(&models.TokenBlacklist{}).Where("jti = ?", jti).Count(&count).Error; err != nil {
		return false, fmt.Errorf("failed to check token blacklist exists by jti: %w", err)
	}
	return count > 0, nil
}

// ExistsActiveByTokenHash 检查令牌哈希是否在活跃黑名单中
func (r *tokenBlacklistRepository) ExistsActiveByTokenHash(ctx context.Context, tokenHash string) (bool, error) {
	var count int64
	if err := r.db.WithContext(ctx).Model(&models.TokenBlacklist{}).Where("token_hash = ? AND expires_at > ?", tokenHash, time.Now()).Count(&count).Error; err != nil {
		return false, fmt.Errorf("failed to check active token blacklist exists by token hash: %w", err)
	}
	return count > 0, nil
}

// ExistsActiveByJTI 检查JTI是否在活跃黑名单中
func (r *tokenBlacklistRepository) ExistsActiveByJTI(ctx context.Context, jti string) (bool, error) {
	var count int64
	if err := r.db.WithContext(ctx).Model(&models.TokenBlacklist{}).Where("jti = ? AND expires_at > ?", jti, time.Now()).Count(&count).Error; err != nil {
		return false, fmt.Errorf("failed to check active token blacklist exists by jti: %w", err)
	}
	return count > 0, nil
}

// GetExpiredTokens 获取过期的黑名单记录
func (r *tokenBlacklistRepository) GetExpiredTokens(ctx context.Context) ([]*models.TokenBlacklist, error) {
	var tokens []*models.TokenBlacklist
	if err := r.db.WithContext(ctx).Where("expires_at < ?", time.Now()).Find(&tokens).Error; err != nil {
		return nil, fmt.Errorf("failed to get expired token blacklist: %w", err)
	}
	return tokens, nil
}

// GetTokensByTimeRange 根据时间范围获取黑名单记录
func (r *tokenBlacklistRepository) GetTokensByTimeRange(ctx context.Context, startTime, endTime time.Time) ([]*models.TokenBlacklist, error) {
	var tokens []*models.TokenBlacklist
	if err := r.db.WithContext(ctx).Where("created_at BETWEEN ? AND ?", startTime, endTime).Find(&tokens).Error; err != nil {
		return nil, fmt.Errorf("failed to get token blacklist by time range: %w", err)
	}
	return tokens, nil
}

// GetStatsByReason 根据原因获取统计信息
func (r *tokenBlacklistRepository) GetStatsByReason(ctx context.Context) (map[string]int64, error) {
	type result struct {
		Reason string `json:"reason"`
		Count  int64  `json:"count"`
	}

	var results []result
	if err := r.db.WithContext(ctx).Model(&models.TokenBlacklist{}).Select("reason, COUNT(*) as count").Group("reason").Find(&results).Error; err != nil {
		return nil, fmt.Errorf("failed to get token blacklist stats by reason: %w", err)
	}

	stats := make(map[string]int64)
	for _, r := range results {
		stats[r.Reason] = r.Count
	}

	return stats, nil
}

// GetStatsByTokenType 根据令牌类型获取统计信息
func (r *tokenBlacklistRepository) GetStatsByTokenType(ctx context.Context) (map[string]int64, error) {
	type result struct {
		TokenType string `json:"token_type"`
		Count     int64  `json:"count"`
	}

	var results []result
	if err := r.db.WithContext(ctx).Model(&models.TokenBlacklist{}).Select("token_type, COUNT(*) as count").Group("token_type").Find(&results).Error; err != nil {
		return nil, fmt.Errorf("failed to get token blacklist stats by token type: %w", err)
	}

	stats := make(map[string]int64)
	for _, r := range results {
		stats[r.TokenType] = r.Count
	}

	return stats, nil
}

// CleanupOldTokens 清理旧的黑名单记录
func (r *tokenBlacklistRepository) CleanupOldTokens(ctx context.Context, before time.Time) error {
	if err := r.db.WithContext(ctx).Delete(&models.TokenBlacklist{}, "created_at < ?", before).Error; err != nil {
		return fmt.Errorf("failed to cleanup old token blacklist: %w", err)
	}
	return nil
}

// CleanupExpired 清理过期的令牌
func (r *tokenBlacklistRepository) CleanupExpired(ctx context.Context) error {
	if err := r.db.WithContext(ctx).Delete(&models.TokenBlacklist{}, "expires_at < ?", time.Now()).Error; err != nil {
		return fmt.Errorf("failed to cleanup expired tokens: %w", err)
	}
	return nil
}

// AddToken 添加令牌到黑名单
func (r *tokenBlacklistRepository) AddToken(ctx context.Context, tokenHash string, expiresAt time.Time, reason string) error {
	token := &models.TokenBlacklist{
		TokenHash: tokenHash,
		Reason:    reason,
		ExpiresAt: expiresAt,
	}

	if err := r.db.WithContext(ctx).Create(token).Error; err != nil {
		return fmt.Errorf("failed to add token to blacklist: %w", err)
	}
	return nil
}

// GetExpired 获取过期的令牌
func (r *tokenBlacklistRepository) GetExpired(ctx context.Context) ([]*models.TokenBlacklist, error) {
	var tokens []*models.TokenBlacklist
	if err := r.db.WithContext(ctx).Where("expires_at < ?", time.Now()).Find(&tokens).Error; err != nil {
		return nil, fmt.Errorf("failed to get expired tokens: %w", err)
	}
	return tokens, nil
}

// RemoveToken 移除令牌
func (r *tokenBlacklistRepository) RemoveToken(ctx context.Context, tokenHash string) error {
	if err := r.db.WithContext(ctx).Delete(&models.TokenBlacklist{}, "token_hash = ?", tokenHash).Error; err != nil {
		return fmt.Errorf("failed to remove token: %w", err)
	}
	return nil
}

// IsTokenBlacklisted 检查令牌是否在黑名单中
func (r *tokenBlacklistRepository) IsTokenBlacklisted(ctx context.Context, tokenHash string) (bool, error) {
	var count int64
	if err := r.db.WithContext(ctx).Model(&models.TokenBlacklist{}).Where("token_hash = ? AND expires_at > ?", tokenHash, time.Now()).Count(&count).Error; err != nil {
		return false, fmt.Errorf("failed to check token blacklist: %w", err)
	}
	return count > 0, nil
}
