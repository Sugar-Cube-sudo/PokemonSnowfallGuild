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

// oauthAccountRepository OAuth账户仓储GORM实现
type oauthAccountRepository struct {
	db *gorm.DB
}

// NewOAuthAccountRepository 创建新的OAuth账户仓储
func NewOAuthAccountRepository(db *gorm.DB) repository.OAuthAccountRepository {
	return &oauthAccountRepository{db: db}
}

// Create 创建OAuth账户
func (r *oauthAccountRepository) Create(ctx context.Context, account *models.OAuthAccount) error {
	if err := r.db.WithContext(ctx).Create(account).Error; err != nil {
		return fmt.Errorf("failed to create oauth account: %w", err)
	}
	return nil
}

// GetByID 根据ID获取OAuth账户
func (r *oauthAccountRepository) GetByID(ctx context.Context, id string) (*models.OAuthAccount, error) {
	var account models.OAuthAccount
	if err := r.db.WithContext(ctx).Where("id = ?", id).First(&account).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, repository.ErrOAuthAccountNotFound
		}
		return nil, fmt.Errorf("failed to get oauth account by id: %w", err)
	}
	return &account, nil
}

// GetByProviderAndProviderID 根据提供商和提供商ID获取OAuth账户
func (r *oauthAccountRepository) GetByProviderAndProviderID(ctx context.Context, provider models.OAuthProvider, providerID string) (*models.OAuthAccount, error) {
	var account models.OAuthAccount
	if err := r.db.WithContext(ctx).Where("provider = ? AND provider_id = ?", provider, providerID).First(&account).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, repository.ErrOAuthAccountNotFound
		}
		return nil, fmt.Errorf("failed to get oauth account by provider and provider id: %w", err)
	}
	return &account, nil
}

// GetByProviderAndID 根据提供商和提供商ID获取OAuth账户
func (r *oauthAccountRepository) GetByProviderAndID(ctx context.Context, provider models.OAuthProvider, providerID string) (*models.OAuthAccount, error) {
	var account models.OAuthAccount
	if err := r.db.WithContext(ctx).Where("provider = ? AND provider_id = ?", provider, providerID).First(&account).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, repository.ErrOAuthAccountNotFound
		}
		return nil, fmt.Errorf("failed to get oauth account by provider and provider id: %w", err)
	}
	return &account, nil
}

// GetByUserID 根据用户ID获取OAuth账户列表
func (r *oauthAccountRepository) GetByUserID(ctx context.Context, userID uuid.UUID) ([]*models.OAuthAccount, error) {
	var accounts []*models.OAuthAccount
	if err := r.db.WithContext(ctx).Where("user_id = ?", userID).Find(&accounts).Error; err != nil {
		return nil, fmt.Errorf("failed to get oauth accounts by user id: %w", err)
	}
	return accounts, nil
}

// GetByProvider 根据提供商获取OAuth账户列表
func (r *oauthAccountRepository) GetByProvider(ctx context.Context, provider models.OAuthProvider) ([]*models.OAuthAccount, error) {
	var accounts []*models.OAuthAccount
	if err := r.db.WithContext(ctx).Where("provider = ?", provider).Find(&accounts).Error; err != nil {
		return nil, fmt.Errorf("failed to get oauth accounts by provider: %w", err)
	}
	return accounts, nil
}

// GetByUserIDAndProvider 根据用户ID和提供商获取OAuth账户
func (r *oauthAccountRepository) GetByUserIDAndProvider(ctx context.Context, userID string, provider models.OAuthProvider) (*models.OAuthAccount, error) {
	var account models.OAuthAccount
	if err := r.db.WithContext(ctx).Where("user_id = ? AND provider = ?", userID, provider).First(&account).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, repository.ErrOAuthAccountNotFound
		}
		return nil, fmt.Errorf("failed to get oauth account by user id and provider: %w", err)
	}
	return &account, nil
}

// Update 更新OAuth账户
func (r *oauthAccountRepository) Update(ctx context.Context, account *models.OAuthAccount) error {
	account.UpdatedAt = time.Now()
	if err := r.db.WithContext(ctx).Save(account).Error; err != nil {
		return fmt.Errorf("failed to update oauth account: %w", err)
	}
	return nil
}

// UpdateAccessToken 更新访问令牌
func (r *oauthAccountRepository) UpdateAccessToken(ctx context.Context, id, accessToken string, expiresAt *time.Time) error {
	updates := map[string]interface{}{
		"access_token": accessToken,
		"updated_at":   time.Now(),
	}
	if expiresAt != nil {
		updates["expires_at"] = expiresAt
	}

	if err := r.db.WithContext(ctx).Model(&models.OAuthAccount{}).Where("id = ?", id).Updates(updates).Error; err != nil {
		return fmt.Errorf("failed to update oauth account access token: %w", err)
	}
	return nil
}

// UpdateRefreshToken 更新刷新令牌
func (r *oauthAccountRepository) UpdateRefreshToken(ctx context.Context, id, refreshToken string) error {
	if err := r.db.WithContext(ctx).Model(&models.OAuthAccount{}).Where("id = ?", id).Updates(map[string]interface{}{
		"refresh_token": refreshToken,
		"updated_at":    time.Now(),
	}).Error; err != nil {
		return fmt.Errorf("failed to update oauth account refresh token: %w", err)
	}
	return nil
}

// UpdateScope 更新权限范围
func (r *oauthAccountRepository) UpdateScope(ctx context.Context, id, scope string) error {
	if err := r.db.WithContext(ctx).Model(&models.OAuthAccount{}).Where("id = ?", id).Updates(map[string]interface{}{
		"scope":      scope,
		"updated_at": time.Now(),
	}).Error; err != nil {
		return fmt.Errorf("failed to update oauth account scope: %w", err)
	}
	return nil
}

// Delete 删除OAuth账户
func (r *oauthAccountRepository) Delete(ctx context.Context, id uuid.UUID) error {
	if err := r.db.WithContext(ctx).Delete(&models.OAuthAccount{}, "id = ?", id).Error; err != nil {
		return fmt.Errorf("failed to delete oauth account: %w", err)
	}
	return nil
}

// DeleteByUserID 删除用户的所有OAuth账户
func (r *oauthAccountRepository) DeleteByUserID(ctx context.Context, userID string) error {
	if err := r.db.WithContext(ctx).Delete(&models.OAuthAccount{}, "user_id = ?", userID).Error; err != nil {
		return fmt.Errorf("failed to delete oauth accounts by user id: %w", err)
	}
	return nil
}

// DeleteByProvider 删除指定提供商的所有OAuth账户
func (r *oauthAccountRepository) DeleteByProvider(ctx context.Context, provider models.OAuthProvider) error {
	if err := r.db.WithContext(ctx).Delete(&models.OAuthAccount{}, "provider = ?", provider).Error; err != nil {
		return fmt.Errorf("failed to delete oauth accounts by provider: %w", err)
	}
	return nil
}

// DeleteByUserIDAndProvider 删除用户指定提供商的OAuth账户
func (r *oauthAccountRepository) DeleteByUserIDAndProvider(ctx context.Context, userID string, provider models.OAuthProvider) error {
	if err := r.db.WithContext(ctx).Delete(&models.OAuthAccount{}, "user_id = ? AND provider = ?", userID, provider).Error; err != nil {
		return fmt.Errorf("failed to delete oauth account by user id and provider: %w", err)
	}
	return nil
}

// List 获取OAuth账户列表
func (r *oauthAccountRepository) List(ctx context.Context, offset, limit int) ([]*models.OAuthAccount, error) {
	var accounts []*models.OAuthAccount
	if err := r.db.WithContext(ctx).Offset(offset).Limit(limit).Find(&accounts).Error; err != nil {
		return nil, fmt.Errorf("failed to list oauth accounts: %w", err)
	}
	return accounts, nil
}

// Count 获取OAuth账户总数
func (r *oauthAccountRepository) Count(ctx context.Context) (int64, error) {
	var count int64
	if err := r.db.WithContext(ctx).Model(&models.OAuthAccount{}).Count(&count).Error; err != nil {
		return 0, fmt.Errorf("failed to count oauth accounts: %w", err)
	}
	return count, nil
}

// CountByProvider 根据提供商统计OAuth账户数量
func (r *oauthAccountRepository) CountByProvider(ctx context.Context, provider models.OAuthProvider) (int64, error) {
	var count int64
	if err := r.db.WithContext(ctx).Model(&models.OAuthAccount{}).Where("provider = ?", provider).Count(&count).Error; err != nil {
		return 0, fmt.Errorf("failed to count oauth accounts by provider: %w", err)
	}
	return count, nil
}

// CountByUserID 根据用户ID统计OAuth账户数量
func (r *oauthAccountRepository) CountByUserID(ctx context.Context, userID string) (int64, error) {
	var count int64
	if err := r.db.WithContext(ctx).Model(&models.OAuthAccount{}).Where("user_id = ?", userID).Count(&count).Error; err != nil {
		return 0, fmt.Errorf("failed to count oauth accounts by user id: %w", err)
	}
	return count, nil
}

// ExistsByProviderAndID 检查提供商和提供商ID是否存在
func (r *oauthAccountRepository) ExistsByProviderAndID(ctx context.Context, provider, providerID string) (bool, error) {
	var count int64
	if err := r.db.WithContext(ctx).Model(&models.OAuthAccount{}).Where("provider = ? AND provider_id = ?", provider, providerID).Count(&count).Error; err != nil {
		return false, fmt.Errorf("failed to check oauth account exists by provider and provider id: %w", err)
	}
	return count > 0, nil
}

// ExistsByUserIDAndProvider 检查用户ID和提供商是否存在
func (r *oauthAccountRepository) ExistsByUserIDAndProvider(ctx context.Context, userID string, provider models.OAuthProvider) (bool, error) {
	var count int64
	if err := r.db.WithContext(ctx).Model(&models.OAuthAccount{}).Where("user_id = ? AND provider = ?", userID, provider).Count(&count).Error; err != nil {
		return false, fmt.Errorf("failed to check oauth account exists by user id and provider: %w", err)
	}
	return count > 0, nil
}

// GetExpiredTokens 获取过期的令牌
func (r *oauthAccountRepository) GetExpiredTokens(ctx context.Context) ([]*models.OAuthAccount, error) {
	var accounts []*models.OAuthAccount
	if err := r.db.WithContext(ctx).Where("expires_at IS NOT NULL AND expires_at < ?", time.Now()).Find(&accounts).Error; err != nil {
		return nil, fmt.Errorf("failed to get expired oauth tokens: %w", err)
	}
	return accounts, nil
}

// CleanupExpiredTokens 清理过期的令牌
func (r *oauthAccountRepository) CleanupExpiredTokens(ctx context.Context) error {
	if err := r.db.WithContext(ctx).Model(&models.OAuthAccount{}).Where("expires_at IS NOT NULL AND expires_at < ?", time.Now()).Updates(map[string]interface{}{
		"access_token": "",
		"expires_at":   nil,
		"updated_at":   time.Now(),
	}).Error; err != nil {
		return fmt.Errorf("failed to cleanup expired oauth tokens: %w", err)
	}
	return nil
}

// GetAccountsWithRefreshToken 获取有刷新令牌的账户
func (r *oauthAccountRepository) GetAccountsWithRefreshToken(ctx context.Context) ([]*models.OAuthAccount, error) {
	var accounts []*models.OAuthAccount
	if err := r.db.WithContext(ctx).Where("refresh_token IS NOT NULL AND refresh_token != ''").Find(&accounts).Error; err != nil {
		return nil, fmt.Errorf("failed to get oauth accounts with refresh token: %w", err)
	}
	return accounts, nil
}

// GetAccountsWithoutRefreshToken 获取没有刷新令牌的账户
func (r *oauthAccountRepository) GetAccountsWithoutRefreshToken(ctx context.Context) ([]*models.OAuthAccount, error) {
	var accounts []*models.OAuthAccount
	if err := r.db.WithContext(ctx).Where("refresh_token IS NULL OR refresh_token = ''").Find(&accounts).Error; err != nil {
		return nil, fmt.Errorf("failed to get oauth accounts without refresh token: %w", err)
	}
	return accounts, nil
}

// LinkAccount 关联OAuth账户
func (r *oauthAccountRepository) LinkAccount(ctx context.Context, userID uuid.UUID, provider, providerID, email, name string, avatar *string) error {
	account := &models.OAuthAccount{
		ID:         uuid.New(),
		UserID:     userID,
		Provider:   provider,
		ProviderID: providerID,
		Email:      email,
		Name:       name,
		Avatar:     avatar,
		CreatedAt:  time.Now(),
		UpdatedAt:  time.Now(),
	}
	if err := r.db.WithContext(ctx).Create(account).Error; err != nil {
		return fmt.Errorf("failed to link oauth account: %w", err)
	}
	return nil
}

// UnlinkAccount 取消关联OAuth账户
func (r *oauthAccountRepository) UnlinkAccount(ctx context.Context, userID uuid.UUID, provider string) error {
	if err := r.db.WithContext(ctx).Delete(&models.OAuthAccount{}, "user_id = ? AND provider = ?", userID, provider).Error; err != nil {
		return fmt.Errorf("failed to unlink oauth account: %w", err)
	}
	return nil
}

// GetLinkedProviders 获取用户关联的提供商列表
func (r *oauthAccountRepository) GetLinkedProviders(ctx context.Context, userID uuid.UUID) ([]string, error) {
	var providers []string
	if err := r.db.WithContext(ctx).Model(&models.OAuthAccount{}).Where("user_id = ?", userID).Pluck("provider", &providers).Error; err != nil {
		return nil, fmt.Errorf("failed to get linked providers: %w", err)
	}
	return providers, nil
}

// GetUserByProviderAccount 根据提供商账户获取用户
func (r *oauthAccountRepository) GetUserByProviderAccount(ctx context.Context, provider, providerID string) (*models.User, error) {
	var user models.User
	if err := r.db.WithContext(ctx).Table("users").Joins("JOIN oauth_accounts ON users.id = oauth_accounts.user_id").Where("oauth_accounts.provider = ? AND oauth_accounts.provider_id = ?", provider, providerID).First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, repository.ErrUserNotFound
		}
		return nil, fmt.Errorf("failed to get user by provider account: %w", err)
	}
	return &user, nil
}