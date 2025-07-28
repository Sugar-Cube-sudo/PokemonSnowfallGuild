package health

import (
	"context"
	"sync"
	"time"

	"github.com/snowfall-guild/backend/gateway/internal/registry"
	logrus "github.com/sirupsen/logrus"
)

// HealthChecker 健康检查器
type HealthChecker struct {
	registry *registry.ServiceRegistry
	interval time.Duration
	ctx      context.Context
	cancel   context.CancelFunc
	wg       sync.WaitGroup
	running  bool
	mu       sync.RWMutex
}

// NewHealthChecker 创建健康检查器
func NewHealthChecker(registry *registry.ServiceRegistry) *HealthChecker {
	ctx, cancel := context.WithCancel(context.Background())

	return &HealthChecker{
		registry: registry,
		interval: 30 * time.Second, // 默认30秒检查一次
		ctx:      ctx,
		cancel:   cancel,
	}
}

// Start 启动健康检查
func (hc *HealthChecker) Start() {
	hc.mu.Lock()
	defer hc.mu.Unlock()

	if hc.running {
		return
	}

	hc.running = true
	logrus.Info("Starting health checker...")

	// 立即执行一次健康检查
	hc.checkAllServices()

	// 启动定期健康检查
	hc.wg.Add(1)
	go hc.healthCheckLoop()

	logrus.Infof("Health checker started with interval: %v", hc.interval)
}

// Stop 停止健康检查
func (hc *HealthChecker) Stop() {
	hc.mu.Lock()
	defer hc.mu.Unlock()

	if !hc.running {
		return
	}

	logrus.Info("Stopping health checker...")
	hc.running = false
	hc.cancel()
	hc.wg.Wait()
	logrus.Info("Health checker stopped")
}

// IsRunning 检查是否正在运行
func (hc *HealthChecker) IsRunning() bool {
	hc.mu.RLock()
	defer hc.mu.RUnlock()
	return hc.running
}

// SetInterval 设置检查间隔
func (hc *HealthChecker) SetInterval(interval time.Duration) {
	hc.mu.Lock()
	defer hc.mu.Unlock()
	hc.interval = interval
	logrus.Infof("Health check interval updated to: %v", interval)
}

// healthCheckLoop 健康检查循环
func (hc *HealthChecker) healthCheckLoop() {
	defer hc.wg.Done()

	ticker := time.NewTicker(hc.interval)
	defer ticker.Stop()

	for {
		select {
		case <-hc.ctx.Done():
			return
		case <-ticker.C:
			hc.checkAllServices()
		}
	}
}

// checkAllServices 检查所有服务
func (hc *HealthChecker) checkAllServices() {
	start := time.Now()
	logrus.Debug("Starting health check for all services")

	services := hc.registry.GetAllServices()
	var wg sync.WaitGroup

	for name := range services {
		wg.Add(1)
		go func(serviceName string) {
			defer wg.Done()
			hc.checkService(serviceName)
		}(name)
	}

	wg.Wait()

	duration := time.Since(start)
	logrus.Debugf("Health check completed in %v", duration)

	// 记录健康检查统计
	hc.logHealthStats()
}

// checkService 检查单个服务
func (hc *HealthChecker) checkService(serviceName string) {
	start := time.Now()

	err := hc.registry.CheckServiceHealth(serviceName)
	duration := time.Since(start)

	if err != nil {
		logrus.Warnf("Health check failed for service %s (took %v): %v", serviceName, duration, err)
	} else {
		logrus.Debugf("Health check passed for service %s (took %v)", serviceName, duration)
	}
}

// logHealthStats 记录健康统计信息
func (hc *HealthChecker) logHealthStats() {
	stats := hc.registry.GetServiceStats()

	total := stats["total"].(int)
	healthy := stats["healthy"].(int)
	unhealthy := stats["unhealthy"].(int)

	logrus.Infof("Service health summary: %d total, %d healthy, %d unhealthy", total, healthy, unhealthy)

	// 如果有不健康的服务，记录详细信息
	if unhealthy > 0 {
		services := stats["services"].(map[string]interface{})
		for name, details := range services {
			serviceInfo := details.(map[string]interface{})
			if serviceInfo["status"].(string) != "healthy" {
				logrus.Warnf("Unhealthy service: %s (status: %s, failures: %v)",
					name,
					serviceInfo["status"],
					serviceInfo["failCount"])
			}
		}
	}
}

// CheckService 手动检查单个服务
func (hc *HealthChecker) CheckService(serviceName string) error {
	return hc.registry.CheckServiceHealth(serviceName)
}

// GetServiceStatus 获取服务状态
func (hc *HealthChecker) GetServiceStatus(serviceName string) (registry.ServiceStatus, bool) {
	service, exists := hc.registry.GetService(serviceName)
	if !exists {
		return registry.ServiceStatusUnknown, false
	}
	return service.Status, true
}

// GetHealthStats 获取健康统计信息
func (hc *HealthChecker) GetHealthStats() map[string]interface{} {
	return hc.registry.GetServiceStats()
}

// IsServiceHealthy 检查服务是否健康
func (hc *HealthChecker) IsServiceHealthy(serviceName string) bool {
	service, exists := hc.registry.GetHealthyService(serviceName)
	return exists && service != nil
}

// GetUnhealthyServices 获取不健康的服务列表
func (hc *HealthChecker) GetUnhealthyServices() []string {
	var unhealthy []string
	services := hc.registry.GetAllServices()

	for name, service := range services {
		if !service.IsHealthy() {
			unhealthy = append(unhealthy, name)
		}
	}

	return unhealthy
}

// GetHealthyServices 获取健康的服务列表
func (hc *HealthChecker) GetHealthyServices() []string {
	var healthy []string
	services := hc.registry.GetAllServices()

	for name, service := range services {
		if service.IsHealthy() {
			healthy = append(healthy, name)
		}
	}

	return healthy
}

// WaitForService 等待服务变为健康状态
func (hc *HealthChecker) WaitForService(serviceName string, timeout time.Duration) bool {
	ctx, cancel := context.WithTimeout(context.Background(), timeout)
	defer cancel()

	ticker := time.NewTicker(1 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return false
		case <-ticker.C:
			if hc.IsServiceHealthy(serviceName) {
				return true
			}
		}
	}
}

// ForceHealthCheck 强制执行健康检查
func (hc *HealthChecker) ForceHealthCheck() {
	logrus.Info("Forcing health check for all services")
	hc.checkAllServices()
}

// GetLastCheckTime 获取最后检查时间
func (hc *HealthChecker) GetLastCheckTime(serviceName string) (time.Time, bool) {
	service, exists := hc.registry.GetService(serviceName)
	if !exists {
		return time.Time{}, false
	}
	return service.LastCheck, true
}