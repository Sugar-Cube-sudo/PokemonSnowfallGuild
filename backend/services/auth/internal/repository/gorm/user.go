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

// userRepository 用户仓储GORM实现
type userRepository struct {
	db *gorm.DB
}

// NewUserRepository 创建新的用户仓储
func NewUserRepository(db *gorm.DB) repository.UserRepository {
	return &userRepository{db: db}
}

// Create 创建用户
func (r *userRepository) Create(ctx context.Context, user *models.User) error {
	if err := r.db.WithContext(ctx).Create(user).Error; err != nil {
		return fmt.Errorf("failed to create user: %w", err)
	}
	return nil
}

// GetByID 根据ID获取用户
func (r *userRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.User, error) {
	var user models.User
	if err := r.db.WithContext(ctx).Where("id = ?", id).First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, repository.ErrUserNotFound
		}
		return nil, fmt.Errorf("failed to get user by id: %w", err)
	}
	return &user, nil
}

// GetByEmail 根据邮箱获取用户
func (r *userRepository) GetByEmail(ctx context.Context, email string) (*models.User, error) {
	var user models.User
	if err := r.db.WithContext(ctx).Where("email = ?", email).First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, repository.ErrUserNotFound
		}
		return nil, fmt.Errorf("failed to get user by email: %w", err)
	}
	return &user, nil
}

// GetByUsername 根据用户名获取用户
func (r *userRepository) GetByUsername(ctx context.Context, username string) (*models.User, error) {
	var user models.User
	if err := r.db.WithContext(ctx).Where("username = ?", username).First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, repository.ErrUserNotFound
		}
		return nil, fmt.Errorf("failed to get user by username: %w", err)
	}
	return &user, nil
}

// GetByPhone 根据手机号获取用户
func (r *userRepository) GetByPhone(ctx context.Context, phone string) (*models.User, error) {
	var user models.User
	if err := r.db.WithContext(ctx).Where("phone = ?", phone).First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, repository.ErrUserNotFound
		}
		return nil, fmt.Errorf("failed to get user by phone: %w", err)
	}
	return &user, nil
}

// Update 更新用户
func (r *userRepository) Update(ctx context.Context, user *models.User) error {
	user.UpdatedAt = time.Now()
	if err := r.db.WithContext(ctx).Save(user).Error; err != nil {
		return fmt.Errorf("failed to update user: %w", err)
	}
	return nil
}

// UpdatePassword 更新用户密码
func (r *userRepository) UpdatePassword(ctx context.Context, userID uuid.UUID, hashedPassword string) error {
	if err := r.db.WithContext(ctx).Model(&models.User{}).Where("id = ?", userID).Updates(map[string]interface{}{
		"password_hash": hashedPassword,
		"updated_at":    time.Now(),
	}).Error; err != nil {
		return fmt.Errorf("failed to update user password: %w", err)
	}
	return nil
}

// UpdateStatus 更新用户状态
func (r *userRepository) UpdateStatus(ctx context.Context, userID uuid.UUID, status string) error {
	if err := r.db.WithContext(ctx).Model(&models.User{}).Where("id = ?", userID).Updates(map[string]interface{}{
		"status":     status,
		"updated_at": time.Now(),
	}).Error; err != nil {
		return fmt.Errorf("failed to update user status: %w", err)
	}
	return nil
}

// UpdateLastLoginAt 更新最后登录时间
func (r *userRepository) UpdateLastLoginAt(ctx context.Context, userID uuid.UUID, lastLoginAt time.Time) error {
	if err := r.db.WithContext(ctx).Model(&models.User{}).Where("id = ?", userID).Updates(map[string]interface{}{
		"last_login_at": lastLoginAt,
		"updated_at":     time.Now(),
	}).Error; err != nil {
		return fmt.Errorf("failed to update user last login at: %w", err)
	}
	return nil
}

// UpdateEmailVerified 更新邮箱验证状态
func (r *userRepository) UpdateEmailVerified(ctx context.Context, userID uuid.UUID, verified bool) error {
	updates := map[string]interface{}{
		"email_verified": verified,
		"updated_at":     time.Now(),
	}
	if verified {
		now := time.Now()
		updates["email_verified_at"] = &now
	}

	if err := r.db.WithContext(ctx).Model(&models.User{}).Where("id = ?", userID).Updates(updates).Error; err != nil {
		return fmt.Errorf("failed to update user email verified: %w", err)
	}
	return nil
}

// UpdatePhoneVerified 更新手机验证状态
func (r *userRepository) UpdatePhoneVerified(ctx context.Context, userID uuid.UUID, verified bool) error {
	updates := map[string]interface{}{
		"phone_verified": verified,
		"updated_at":     time.Now(),
	}
	if verified {
		now := time.Now()
		updates["phone_verified_at"] = &now
	}

	if err := r.db.WithContext(ctx).Model(&models.User{}).Where("id = ?", userID).Updates(updates).Error; err != nil {
		return fmt.Errorf("failed to update user phone verified: %w", err)
	}
	return nil
}

// UpdateTwoFactorEnabled 更新双因素认证状态
func (r *userRepository) UpdateTwoFactorEnabled(ctx context.Context, userID uuid.UUID, enabled bool) error {
	if err := r.db.WithContext(ctx).Model(&models.User{}).Where("id = ?", userID).Updates(map[string]interface{}{
		"two_factor_enabled": enabled,
		"updated_at":         time.Now(),
	}).Error; err != nil {
		return fmt.Errorf("failed to update user two factor enabled: %w", err)
	}
	return nil
}

// IncrementLoginAttempts 增加登录尝试次数
func (r *userRepository) IncrementLoginAttempts(ctx context.Context, userID uuid.UUID) error {
	if err := r.db.WithContext(ctx).Model(&models.User{}).Where("id = ?", userID).Updates(map[string]interface{}{
		"login_attempts": gorm.Expr("login_attempts + 1"),
		"updated_at":     time.Now(),
	}).Error; err != nil {
		return fmt.Errorf("failed to increment user login attempts: %w", err)
	}
	return nil
}

// ResetLoginAttempts 重置登录尝试次数
func (r *userRepository) ResetLoginAttempts(ctx context.Context, userID uuid.UUID) error {
	if err := r.db.WithContext(ctx).Model(&models.User{}).Where("id = ?", userID).Updates(map[string]interface{}{
		"login_attempts": 0,
		"locked_until":   nil,
		"updated_at":     time.Now(),
	}).Error; err != nil {
		return fmt.Errorf("failed to reset user login attempts: %w", err)
	}
	return nil
}

// LockUser 锁定用户
func (r *userRepository) LockUser(ctx context.Context, userID uuid.UUID, until time.Time) error {
	if err := r.db.WithContext(ctx).Model(&models.User{}).Where("id = ?", userID).Updates(map[string]interface{}{
		"locked_until": &until,
		"updated_at":   time.Now(),
	}).Error; err != nil {
		return fmt.Errorf("failed to lock user: %w", err)
	}
	return nil
}

// UnlockUser 解锁用户
func (r *userRepository) UnlockUser(ctx context.Context, userID uuid.UUID) error {
	if err := r.db.WithContext(ctx).Model(&models.User{}).Where("id = ?", userID).Updates(map[string]interface{}{
		"locked_until":   nil,
		"login_attempts": 0,
		"updated_at":     time.Now(),
	}).Error; err != nil {
		return fmt.Errorf("failed to unlock user: %w", err)
	}
	return nil
}

// Delete 删除用户
func (r *userRepository) Delete(ctx context.Context, userID uuid.UUID) error {
	if err := r.db.WithContext(ctx).Delete(&models.User{}, "id = ?", userID).Error; err != nil {
		return fmt.Errorf("failed to delete user: %w", err)
	}
	return nil
}

// List 获取用户列表
func (r *userRepository) List(ctx context.Context, offset, limit int, filters map[string]interface{}) ([]*models.User, int64, error) {
	var users []*models.User
	var total int64
	
	query := r.db.WithContext(ctx).Model(&models.User{})
	
	// 应用过滤器
	for key, value := range filters {
		query = query.Where(key+" = ?", value)
	}
	
	// 获取总数
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to count users: %w", err)
	}
	
	// 获取数据
	if err := query.Offset(offset).Limit(limit).Find(&users).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to list users: %w", err)
	}
	
	return users, total, nil
}

// Search 搜索用户
func (r *userRepository) Search(ctx context.Context, query string, offset, limit int) ([]*models.User, int64, error) {
	var users []*models.User
	var total int64
	
	searchQuery := r.db.WithContext(ctx).Model(&models.User{}).Where(
		"username ILIKE ? OR email ILIKE ?", 
		"%"+query+"%", "%"+query+"%",
	)
	
	// 获取总数
	if err := searchQuery.Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to count search results: %w", err)
	}
	
	// 获取数据
	if err := searchQuery.Offset(offset).Limit(limit).Find(&users).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to search users: %w", err)
	}
	
	return users, total, nil
}

// GetUserCount 获取用户总数
func (r *userRepository) GetUserCount(ctx context.Context) (int64, error) {
	var count int64
	if err := r.db.WithContext(ctx).Model(&models.User{}).Count(&count).Error; err != nil {
		return 0, fmt.Errorf("failed to count users: %w", err)
	}
	return count, nil
}

// GetActiveUserCount 获取活跃用户数量
func (r *userRepository) GetActiveUserCount(ctx context.Context, since time.Time) (int64, error) {
	var count int64
	if err := r.db.WithContext(ctx).Model(&models.User{}).Where(
		"last_login_at > ? AND status = ?", since, "active",
	).Count(&count).Error; err != nil {
		return 0, fmt.Errorf("failed to count active users: %w", err)
	}
	return count, nil
}

// GetUsersByRole 根据角色获取用户
func (r *userRepository) GetUsersByRole(ctx context.Context, role string) ([]*models.User, error) {
	var users []*models.User
	if err := r.db.WithContext(ctx).Where("role = ?", role).Find(&users).Error; err != nil {
		return nil, fmt.Errorf("failed to get users by role: %w", err)
	}
	return users, nil
}

// GetPasswordHistory 获取密码历史
func (r *userRepository) GetPasswordHistory(ctx context.Context, userID uuid.UUID, limit int) ([]*models.PasswordHistory, error) {
	var history []*models.PasswordHistory
	if err := r.db.WithContext(ctx).Where("user_id = ?", userID).Order("created_at DESC").Limit(limit).Find(&history).Error; err != nil {
		return nil, fmt.Errorf("failed to get password history: %w", err)
	}
	return history, nil
}

// AddPasswordHistory 添加密码历史
func (r *userRepository) AddPasswordHistory(ctx context.Context, history *models.PasswordHistory) error {
	if err := r.db.WithContext(ctx).Create(history).Error; err != nil {
		return fmt.Errorf("failed to add password history: %w", err)
	}
	return nil
}

// CountByStatus 根据状态统计用户数量
func (r *userRepository) CountByStatus(ctx context.Context, status string) (int64, error) {
	var count int64
	if err := r.db.WithContext(ctx).Model(&models.User{}).Where("status = ?", status).Count(&count).Error; err != nil {
		return 0, fmt.Errorf("failed to count users by status: %w", err)
	}
	return count, nil
}

// CountByRole 根据角色统计用户数量
func (r *userRepository) CountByRole(ctx context.Context, role string) (int64, error) {
	var count int64
	if err := r.db.WithContext(ctx).Model(&models.User{}).Where("role = ?", role).Count(&count).Error; err != nil {
		return 0, fmt.Errorf("failed to count users by role: %w", err)
	}
	return count, nil
}

// ExistsByEmail 检查邮箱是否存在
func (r *userRepository) ExistsByEmail(ctx context.Context, email string) (bool, error) {
	var count int64
	if err := r.db.WithContext(ctx).Model(&models.User{}).Where("email = ?", email).Count(&count).Error; err != nil {
		return false, fmt.Errorf("failed to check email exists: %w", err)
	}
	return count > 0, nil
}

// ExistsByUsername 检查用户名是否存在
func (r *userRepository) ExistsByUsername(ctx context.Context, username string) (bool, error) {
	var count int64
	if err := r.db.WithContext(ctx).Model(&models.User{}).Where("username = ?", username).Count(&count).Error; err != nil {
		return false, fmt.Errorf("failed to check username exists: %w", err)
	}
	return count > 0, nil
}

// ExistsByPhone 检查手机号是否存在
func (r *userRepository) ExistsByPhone(ctx context.Context, phone string) (bool, error) {
	var count int64
	if err := r.db.WithContext(ctx).Model(&models.User{}).Where("phone = ?", phone).Count(&count).Error; err != nil {
		return false, fmt.Errorf("failed to check phone exists: %w", err)
	}
	return count > 0, nil
}

// GetActiveUsers 获取活跃用户
func (r *userRepository) GetActiveUsers(ctx context.Context, since time.Time) ([]*models.User, error) {
	var users []*models.User
	if err := r.db.WithContext(ctx).Where("last_login_at > ? AND status = ?", since, "active").Find(&users).Error; err != nil {
		return nil, fmt.Errorf("failed to get active users: %w", err)
	}
	return users, nil
}

// GetLockedUsers 获取被锁定的用户
func (r *userRepository) GetLockedUsers(ctx context.Context) ([]*models.User, error) {
	var users []*models.User
	if err := r.db.WithContext(ctx).Where("locked_until IS NOT NULL AND locked_until > ?", time.Now()).Find(&users).Error; err != nil {
		return nil, fmt.Errorf("failed to get locked users: %w", err)
	}
	return users, nil
}

// GetExpiredLocks 获取锁定已过期的用户
func (r *userRepository) GetExpiredLocks(ctx context.Context) ([]*models.User, error) {
	var users []*models.User
	if err := r.db.WithContext(ctx).Where("locked_until IS NOT NULL AND locked_until <= ?", time.Now()).Find(&users).Error; err != nil {
		return nil, fmt.Errorf("failed to get expired locks: %w", err)
	}
	return users, nil
}

// CleanupExpiredLocks 清理过期的锁定
func (r *userRepository) CleanupExpiredLocks(ctx context.Context) error {
	if err := r.db.WithContext(ctx).Model(&models.User{}).Where("locked_until IS NOT NULL AND locked_until <= ?", time.Now()).Updates(map[string]interface{}{
		"locked_until":   nil,
		"login_attempts": 0,
		"updated_at":     time.Now(),
	}).Error; err != nil {
		return fmt.Errorf("failed to cleanup expired locks: %w", err)
	}
	return nil
}