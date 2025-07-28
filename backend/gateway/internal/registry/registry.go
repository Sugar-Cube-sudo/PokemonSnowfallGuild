package registry

import (
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/snowfall-guild/backend/gateway/internal/config"
	logrus "github.com/sirupsen/logrus"
)

// ServiceStatus 服务状态
type ServiceStatus int

const (
	ServiceStatusUnknown ServiceStatus = iota
	ServiceStatusHealthy
	ServiceStatusUnhealthy
	ServiceStatusDown
)

func (s ServiceStatus) String() string {
	switch s {
	case ServiceStatusHealthy:
		return "healthy"
	case ServiceStatusUnhealthy:
		return "unhealthy"
	case ServiceStatusDown:
		return "down"
	default:
		return "unknown"
	}
}

// ServiceInstance 服务实例
type ServiceInstance struct {
	Name        string        `json:"name"`
	URL         string        `json:"url"`
	HealthCheck string        `json:"healthCheck"`
	Status      ServiceStatus `json:"status"`
	LastCheck   time.Time     `json:"lastCheck"`
	Timeout     time.Duration `json:"timeout"`
	Retries     int           `json:"retries"`
	FailCount   int           `json:"failCount"`
	Weight      int           `json:"weight"`
}

// IsHealthy 检查服务是否健康
func (si *ServiceInstance) IsHealthy() bool {
	return si.Status == ServiceStatusHealthy
}

// ServiceRegistry 服务注册中心
type ServiceRegistry struct {
	services map[string]*ServiceInstance
	mu       sync.RWMutex
	config   *config.Config
	client   *http.Client
}

// NewServiceRegistry 创建服务注册中心
func NewServiceRegistry(cfg *config.Config) *ServiceRegistry {
	client := &http.Client{
		Timeout: 10 * time.Second,
	}

	registry := &ServiceRegistry{
		services: make(map[string]*ServiceInstance),
		config:   cfg,
		client:   client,
	}

	// 注册所有服务
	registry.registerServices()

	return registry
}

// registerServices 注册所有服务
func (sr *ServiceRegistry) registerServices() {
	services := map[string]config.ServiceConfig{
		"auth":        sr.config.Services.Auth,
		"user":        sr.config.Services.User,
		"forum":       sr.config.Services.Forum,
		"message":     sr.config.Services.Message,
		"report":      sr.config.Services.Report,
		"pokemon":     sr.config.Services.Pokemon,
		"fileStorage": sr.config.Services.FileStorage,
	}

	for name, cfg := range services {
		instance := &ServiceInstance{
			Name:        name,
			URL:         cfg.URL,
			HealthCheck: cfg.HealthCheck,
			Status:      ServiceStatusUnknown,
			Timeout:     cfg.Timeout,
			Retries:     cfg.Retries,
			Weight:      100, // 默认权重
		}
		sr.services[name] = instance
		logrus.Infof("Registered service: %s at %s", name, cfg.URL)
	}
}

// GetService 获取服务实例
func (sr *ServiceRegistry) GetService(name string) (*ServiceInstance, bool) {
	sr.mu.RLock()
	defer sr.mu.RUnlock()

	service, exists := sr.services[name]
	return service, exists
}

// GetHealthyService 获取健康的服务实例
func (sr *ServiceRegistry) GetHealthyService(name string) (*ServiceInstance, bool) {
	sr.mu.RLock()
	defer sr.mu.RUnlock()

	service, exists := sr.services[name]
	if !exists {
		return nil, false
	}

	if service.IsHealthy() {
		return service, true
	}

	return nil, false
}

// GetAllServices 获取所有服务
func (sr *ServiceRegistry) GetAllServices() map[string]*ServiceInstance {
	sr.mu.RLock()
	defer sr.mu.RUnlock()

	services := make(map[string]*ServiceInstance)
	for name, service := range sr.services {
		services[name] = service
	}

	return services
}

// UpdateServiceStatus 更新服务状态
func (sr *ServiceRegistry) UpdateServiceStatus(name string, status ServiceStatus) {
	sr.mu.Lock()
	defer sr.mu.Unlock()

	if service, exists := sr.services[name]; exists {
		oldStatus := service.Status
		service.Status = status
		service.LastCheck = time.Now()

		if status == ServiceStatusHealthy {
			service.FailCount = 0
		} else {
			service.FailCount++
		}

		if oldStatus != status {
			logrus.Infof("Service %s status changed from %s to %s", name, oldStatus, status)
		}
	}
}

// CheckServiceHealth 检查服务健康状态
func (sr *ServiceRegistry) CheckServiceHealth(name string) error {
	service, exists := sr.GetService(name)
	if !exists {
		return fmt.Errorf("service %s not found", name)
	}

	if service.HealthCheck == "" {
		// 如果没有健康检查端点，假设服务健康
		sr.UpdateServiceStatus(name, ServiceStatusHealthy)
		return nil
	}

	healthURL := service.URL + service.HealthCheck
	req, err := http.NewRequest("GET", healthURL, nil)
	if err != nil {
		sr.UpdateServiceStatus(name, ServiceStatusUnhealthy)
		return fmt.Errorf("failed to create health check request: %w", err)
	}

	// 设置超时
	client := &http.Client{
		Timeout: service.Timeout,
	}

	resp, err := client.Do(req)
	if err != nil {
		sr.UpdateServiceStatus(name, ServiceStatusUnhealthy)
		return fmt.Errorf("health check failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 200 && resp.StatusCode < 300 {
		sr.UpdateServiceStatus(name, ServiceStatusHealthy)
		return nil
	}

	sr.UpdateServiceStatus(name, ServiceStatusUnhealthy)
	return fmt.Errorf("health check returned status %d", resp.StatusCode)
}

// CheckAllServicesHealth 检查所有服务健康状态
func (sr *ServiceRegistry) CheckAllServicesHealth() {
	services := sr.GetAllServices()

	for name := range services {
		go func(serviceName string) {
			if err := sr.CheckServiceHealth(serviceName); err != nil {
				logrus.Warnf("Health check failed for service %s: %v", serviceName, err)
			}
		}(name)
	}
}

// GetServiceStats 获取服务统计信息
func (sr *ServiceRegistry) GetServiceStats() map[string]interface{} {
	sr.mu.RLock()
	defer sr.mu.RUnlock()

	stats := make(map[string]interface{})
	healthyCount := 0
	unhealthyCount := 0
	totalCount := len(sr.services)

	serviceDetails := make(map[string]interface{})

	for name, service := range sr.services {
		if service.IsHealthy() {
			healthyCount++
		} else {
			unhealthyCount++
		}

		serviceDetails[name] = map[string]interface{}{
			"status":     service.Status.String(),
			"url":        service.URL,
			"lastCheck":  service.LastCheck,
			"failCount":  service.FailCount,
			"weight":     service.Weight,
		}
	}

	stats["total"] = totalCount
	stats["healthy"] = healthyCount
	stats["unhealthy"] = unhealthyCount
	stats["services"] = serviceDetails
	stats["lastUpdate"] = time.Now()

	return stats
}

// IsServiceAvailable 检查服务是否可用
func (sr *ServiceRegistry) IsServiceAvailable(name string) bool {
	service, exists := sr.GetHealthyService(name)
	if !exists {
		return false
	}

	// 检查失败次数是否超过阈值
	maxFailures := 5
	if service.FailCount >= maxFailures {
		return false
	}

	return true
}

// GetServiceURL 获取服务URL
func (sr *ServiceRegistry) GetServiceURL(name string) (string, error) {
	service, exists := sr.GetHealthyService(name)
	if !exists {
		return "", fmt.Errorf("healthy service %s not found", name)
	}

	return service.URL, nil
}

// RegisterService 动态注册服务
func (sr *ServiceRegistry) RegisterService(name, url, healthCheck string, timeout time.Duration, retries int) {
	sr.mu.Lock()
	defer sr.mu.Unlock()

	instance := &ServiceInstance{
		Name:        name,
		URL:         url,
		HealthCheck: healthCheck,
		Status:      ServiceStatusUnknown,
		Timeout:     timeout,
		Retries:     retries,
		Weight:      100,
	}

	sr.services[name] = instance
	logrus.Infof("Dynamically registered service: %s at %s", name, url)
}

// UnregisterService 注销服务
func (sr *ServiceRegistry) UnregisterService(name string) {
	sr.mu.Lock()
	defer sr.mu.Unlock()

	if _, exists := sr.services[name]; exists {
		delete(sr.services, name)
		logrus.Infof("Unregistered service: %s", name)
	}
}