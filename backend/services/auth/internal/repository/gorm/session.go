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

// sessionRepository 会话仓储GORM实现
type sessionRepository struct {
	db *gorm.DB
}

// NewSessionRepository 创建新的会话仓储
func NewSessionRepository(db *gorm.DB) repository.SessionRepository {
	return &sessionRepository{db: db}
}

// Create 创建会话
func (r *sessionRepository) Create(ctx context.Context, session *models.Session) error {
	if err := r.db.WithContext(ctx).Create(session).Error; err != nil {
		return fmt.Errorf("failed to create session: %w", err)
	}
	return nil
}

// GetByID 根据ID获取会话
func (r *sessionRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.Session, error) {
	var session models.Session
	if err := r.db.WithContext(ctx).Where("id = ?", id).First(&session).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, repository.ErrSessionNotFound
		}
		return nil, fmt.Errorf("failed to get session by id: %w", err)
	}
	return &session, nil
}

// GetByUserID 根据用户ID获取会话列表
func (r *sessionRepository) GetByUserID(ctx context.Context, userID string) ([]*models.Session, error) {
	var sessions []*models.Session
	if err := r.db.WithContext(ctx).Where("user_id = ?", userID).Find(&sessions).Error; err != nil {
		return nil, fmt.Errorf("failed to get sessions by user id: %w", err)
	}
	return sessions, nil
}

// GetByRefreshToken 根据刷新令牌获取会话
func (r *sessionRepository) GetByRefreshToken(ctx context.Context, refreshToken string) (*models.Session, error) {
	var session models.Session
	if err := r.db.WithContext(ctx).Where("refresh_token = ?", refreshToken).First(&session).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, repository.ErrSessionNotFound
		}
		return nil, fmt.Errorf("failed to get session by refresh token: %w", err)
	}
	return &session, nil
}

// GetActiveByUserID 根据用户ID获取活跃会话列表
func (r *sessionRepository) GetActiveByUserID(ctx context.Context, userID string) ([]*models.Session, error) {
	var sessions []*models.Session
	if err := r.db.WithContext(ctx).Where("user_id = ? AND expires_at > ? AND revoked = false", userID, time.Now()).Find(&sessions).Error; err != nil {
		return nil, fmt.Errorf("failed to get active sessions by user id: %w", err)
	}
	return sessions, nil
}

// Update 更新会话
func (r *sessionRepository) Update(ctx context.Context, session *models.Session) error {
	session.UpdatedAt = time.Now()
	if err := r.db.WithContext(ctx).Save(session).Error; err != nil {
		return fmt.Errorf("failed to update session: %w", err)
	}
	return nil
}

// UpdateLastUsed 更新最后使用时间
func (r *sessionRepository) UpdateLastUsed(ctx context.Context, sessionID string) error {
	if err := r.db.WithContext(ctx).Model(&models.Session{}).Where("id = ?", sessionID).Updates(map[string]interface{}{
		"last_used_at": time.Now(),
		"updated_at":   time.Now(),
	}).Error; err != nil {
		return fmt.Errorf("failed to update session last used: %w", err)
	}
	return nil
}

// UpdateRefreshToken 更新刷新令牌
func (r *sessionRepository) UpdateRefreshToken(ctx context.Context, sessionID, refreshToken string, expiresAt time.Time) error {
	if err := r.db.WithContext(ctx).Model(&models.Session{}).Where("id = ?", sessionID).Updates(map[string]interface{}{
		"refresh_token": refreshToken,
		"expires_at":    expiresAt,
		"updated_at":    time.Now(),
	}).Error; err != nil {
		return fmt.Errorf("failed to update session refresh token: %w", err)
	}
	return nil
}

// Revoke 撤销会话
func (r *sessionRepository) Revoke(ctx context.Context, sessionID string) error {
	if err := r.db.WithContext(ctx).Model(&models.Session{}).Where("id = ?", sessionID).Updates(map[string]interface{}{
		"revoked":    true,
		"updated_at": time.Now(),
	}).Error; err != nil {
		return fmt.Errorf("failed to revoke session: %w", err)
	}
	return nil
}

// RevokeByUserID 撤销用户的所有会话
func (r *sessionRepository) RevokeByUserID(ctx context.Context, userID string) error {
	if err := r.db.WithContext(ctx).Model(&models.Session{}).Where("user_id = ?", userID).Updates(map[string]interface{}{
		"revoked":    true,
		"updated_at": time.Now(),
	}).Error; err != nil {
		return fmt.Errorf("failed to revoke sessions by user id: %w", err)
	}
	return nil
}

// RevokeByDeviceID 撤销设备的所有会话
func (r *sessionRepository) RevokeByDeviceID(ctx context.Context, deviceID string) error {
	if err := r.db.WithContext(ctx).Model(&models.Session{}).Where("device_id = ?", deviceID).Updates(map[string]interface{}{
		"revoked":    true,
		"updated_at": time.Now(),
	}).Error; err != nil {
		return fmt.Errorf("failed to revoke sessions by device id: %w", err)
	}
	return nil
}

// RevokeAllExcept 撤销除指定会话外的所有用户会话
func (r *sessionRepository) RevokeAllExcept(ctx context.Context, userID, exceptSessionID string) error {
	if err := r.db.WithContext(ctx).Model(&models.Session{}).Where("user_id = ? AND id != ?", userID, exceptSessionID).Updates(map[string]interface{}{
		"revoked":    true,
		"updated_at": time.Now(),
	}).Error; err != nil {
		return fmt.Errorf("failed to revoke all sessions except: %w", err)
	}
	return nil
}

// Delete 删除会话
func (r *sessionRepository) Delete(ctx context.Context, sessionID uuid.UUID) error {
	if err := r.db.WithContext(ctx).Delete(&models.Session{}, "id = ?", sessionID).Error; err != nil {
		return fmt.Errorf("failed to delete session: %w", err)
	}
	return nil
}

// DeleteByUserID 删除用户的所有会话
func (r *sessionRepository) DeleteByUserID(ctx context.Context, userID string) error {
	if err := r.db.WithContext(ctx).Delete(&models.Session{}, "user_id = ?", userID).Error; err != nil {
		return fmt.Errorf("failed to delete sessions by user id: %w", err)
	}
	return nil
}

// DeleteExpired 删除过期会话
func (r *sessionRepository) DeleteExpired(ctx context.Context) error {
	if err := r.db.WithContext(ctx).Delete(&models.Session{}, "expires_at < ?", time.Now()).Error; err != nil {
		return fmt.Errorf("failed to delete expired sessions: %w", err)
	}
	return nil
}

// DeleteRevoked 删除已撤销的会话
func (r *sessionRepository) DeleteRevoked(ctx context.Context) error {
	if err := r.db.WithContext(ctx).Delete(&models.Session{}, "revoked = true").Error; err != nil {
		return fmt.Errorf("failed to delete revoked sessions: %w", err)
	}
	return nil
}

// List 获取会话列表
func (r *sessionRepository) List(ctx context.Context, offset, limit int) ([]*models.Session, error) {
	var sessions []*models.Session
	if err := r.db.WithContext(ctx).Offset(offset).Limit(limit).Find(&sessions).Error; err != nil {
		return nil, fmt.Errorf("failed to list sessions: %w", err)
	}
	return sessions, nil
}

// Count 获取会话总数
func (r *sessionRepository) Count(ctx context.Context) (int64, error) {
	var count int64
	if err := r.db.WithContext(ctx).Model(&models.Session{}).Count(&count).Error; err != nil {
		return 0, fmt.Errorf("failed to count sessions: %w", err)
	}
	return count, nil
}

// CountByUserID 根据用户ID统计会话数量
func (r *sessionRepository) CountByUserID(ctx context.Context, userID string) (int64, error) {
	var count int64
	if err := r.db.WithContext(ctx).Model(&models.Session{}).Where("user_id = ?", userID).Count(&count).Error; err != nil {
		return 0, fmt.Errorf("failed to count sessions by user id: %w", err)
	}
	return count, nil
}

// CountActiveByUserID 根据用户ID统计活跃会话数量
func (r *sessionRepository) CountActiveByUserID(ctx context.Context, userID string) (int64, error) {
	var count int64
	if err := r.db.WithContext(ctx).Model(&models.Session{}).Where("user_id = ? AND expires_at > ? AND revoked = false", userID, time.Now()).Count(&count).Error; err != nil {
		return 0, fmt.Errorf("failed to count active sessions by user id: %w", err)
	}
	return count, nil
}

// GetExpiredSessions 获取过期会话
func (r *sessionRepository) GetExpiredSessions(ctx context.Context) ([]*models.Session, error) {
	var sessions []*models.Session
	if err := r.db.WithContext(ctx).Where("expires_at < ?", time.Now()).Find(&sessions).Error; err != nil {
		return nil, fmt.Errorf("failed to get expired sessions: %w", err)
	}
	return sessions, nil
}

// GetRevokedSessions 获取已撤销的会话
func (r *sessionRepository) GetRevokedSessions(ctx context.Context) ([]*models.Session, error) {
	var sessions []*models.Session
	if err := r.db.WithContext(ctx).Where("revoked = true").Find(&sessions).Error; err != nil {
		return nil, fmt.Errorf("failed to get revoked sessions: %w", err)
	}
	return sessions, nil
}

// GetSessionsByIP 根据IP地址获取会话
func (r *sessionRepository) GetSessionsByIP(ctx context.Context, ipAddress string) ([]*models.Session, error) {
	var sessions []*models.Session
	if err := r.db.WithContext(ctx).Where("ip_address = ?", ipAddress).Find(&sessions).Error; err != nil {
		return nil, fmt.Errorf("failed to get sessions by ip: %w", err)
	}
	return sessions, nil
}

// GetSessionsByUserAgent 根据用户代理获取会话
func (r *sessionRepository) GetSessionsByUserAgent(ctx context.Context, userAgent string) ([]*models.Session, error) {
	var sessions []*models.Session
	if err := r.db.WithContext(ctx).Where("user_agent = ?", userAgent).Find(&sessions).Error; err != nil {
		return nil, fmt.Errorf("failed to get sessions by user agent: %w", err)
	}
	return sessions, nil
}

// CleanupOldSessions 清理旧会话
func (r *sessionRepository) CleanupOldSessions(ctx context.Context, before time.Time) error {
	if err := r.db.WithContext(ctx).Delete(&models.Session{}, "created_at < ?", before).Error; err != nil {
		return fmt.Errorf("failed to cleanup old sessions: %w", err)
	}
	return nil
}

// CleanupExpiredSessions 清理过期会话
func (r *sessionRepository) CleanupExpiredSessions(ctx context.Context) error {
	if err := r.db.WithContext(ctx).Delete(&models.Session{}, "expires_at < ? OR revoked = true", time.Now()).Error; err != nil {
		return fmt.Errorf("failed to cleanup expired sessions: %w", err)
	}
	return nil
}

// DeactivateSession 停用指定会话
func (r *sessionRepository) DeactivateSession(ctx context.Context, id uuid.UUID) error {
	if err := r.db.WithContext(ctx).Model(&models.Session{}).Where("id = ?", id).Updates(map[string]interface{}{
		"revoked":    true,
		"updated_at": time.Now(),
	}).Error; err != nil {
		return fmt.Errorf("failed to deactivate session: %w", err)
	}
	return nil
}

// DeactivateExpiredSessions 停用过期会话
func (r *sessionRepository) DeactivateExpiredSessions(ctx context.Context) error {
	if err := r.db.WithContext(ctx).Model(&models.Session{}).Where("expires_at < ? AND revoked = false", time.Now()).Updates(map[string]interface{}{
		"revoked":    true,
		"updated_at": time.Now(),
	}).Error; err != nil {
		return fmt.Errorf("failed to deactivate expired sessions: %w", err)
	}
	return nil
}

// DeleteUserSessions 删除用户的所有会话
func (r *sessionRepository) DeleteUserSessions(ctx context.Context, userID uuid.UUID) error {
	if err := r.db.WithContext(ctx).Delete(&models.Session{}, "user_id = ?", userID).Error; err != nil {
		return fmt.Errorf("failed to delete user sessions: %w", err)
	}
	return nil
}

// DeleteUserSessionsExcept 删除用户的所有会话，除了指定的会话
func (r *sessionRepository) DeleteUserSessionsExcept(ctx context.Context, userID, exceptSessionID uuid.UUID) error {
	if err := r.db.WithContext(ctx).Delete(&models.Session{}, "user_id = ? AND id != ?", userID, exceptSessionID).Error; err != nil {
		return fmt.Errorf("failed to delete user sessions except: %w", err)
	}
	return nil
}

// GetActiveSessionCount 获取活跃会话数量
func (r *sessionRepository) GetActiveSessionCount(ctx context.Context) (int64, error) {
	var count int64
	if err := r.db.WithContext(ctx).Model(&models.Session{}).Where("expires_at > ? AND revoked = false", time.Now()).Count(&count).Error; err != nil {
		return 0, fmt.Errorf("failed to get active session count: %w", err)
	}
	return count, nil
}

// GetActiveUserSessions 获取用户的活跃会话
func (r *sessionRepository) GetActiveUserSessions(ctx context.Context, userID uuid.UUID) ([]*models.Session, error) {
	var sessions []*models.Session
	if err := r.db.WithContext(ctx).Where("user_id = ? AND expires_at > ? AND revoked = false", userID, time.Now()).Find(&sessions).Error; err != nil {
		return nil, fmt.Errorf("failed to get active user sessions: %w", err)
	}
	return sessions, nil
}

// GetByToken 根据令牌获取会话
func (r *sessionRepository) GetByToken(ctx context.Context, token string) (*models.Session, error) {
	var session models.Session
	if err := r.db.WithContext(ctx).Where("access_token = ? OR refresh_token = ?", token, token).First(&session).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, repository.ErrSessionNotFound
		}
		return nil, fmt.Errorf("failed to get session by token: %w", err)
	}
	return &session, nil
}

// GetUserSessionCount 获取用户会话数量
func (r *sessionRepository) GetUserSessionCount(ctx context.Context, userID uuid.UUID) (int64, error) {
	var count int64
	if err := r.db.WithContext(ctx).Model(&models.Session{}).Where("user_id = ?", userID).Count(&count).Error; err != nil {
		return 0, fmt.Errorf("failed to get user session count: %w", err)
	}
	return count, nil
}

// GetUserSessions 获取用户的所有会话
func (r *sessionRepository) GetUserSessions(ctx context.Context, userID uuid.UUID) ([]*models.Session, error) {
	var sessions []*models.Session
	if err := r.db.WithContext(ctx).Where("user_id = ?", userID).Find(&sessions).Error; err != nil {
		return nil, fmt.Errorf("failed to get user sessions: %w", err)
	}
	return sessions, nil
}

// UpdateLastUsedAt 更新会话最后使用时间
func (r *sessionRepository) UpdateLastUsedAt(ctx context.Context, id uuid.UUID, lastUsedAt time.Time) error {
	if err := r.db.WithContext(ctx).Model(&models.Session{}).Where("id = ?", id).Updates(map[string]interface{}{
		"last_used_at": lastUsedAt,
		"updated_at":   time.Now(),
	}).Error; err != nil {
		return fmt.Errorf("failed to update session last used at: %w", err)
	}
	return nil
}