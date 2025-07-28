package proxy

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/http/httputil"
	"net/url"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	logrus "github.com/sirupsen/logrus"
	"github.com/snowfall-guild/backend/gateway/internal/config"
	"github.com/snowfall-guild/backend/gateway/internal/registry"
	"github.com/snowfall-guild/backend/shared/utils"
)

// ProxyManager 代理管理器
type ProxyManager struct {
	config   *config.Config
	registry *registry.ServiceRegistry
	proxies  map[string]*httputil.ReverseProxy
	mu       sync.RWMutex
	client   *http.Client
}

// NewProxyManager 创建代理管理器
func NewProxyManager(cfg *config.Config, registry *registry.ServiceRegistry) *ProxyManager {
	client := &http.Client{
		Timeout: 30 * time.Second,
		Transport: &http.Transport{
			MaxIdleConns:        100,
			MaxIdleConnsPerHost: 10,
			IdleConnTimeout:     90 * time.Second,
		},
	}

	pm := &ProxyManager{
		config:   cfg,
		registry: registry,
		proxies:  make(map[string]*httputil.ReverseProxy),
		client:   client,
	}

	// 初始化代理
	pm.initializeProxies()

	return pm
}

// initializeProxies 初始化所有服务的代理
func (pm *ProxyManager) initializeProxies() {
	services := pm.registry.GetAllServices()

	for name, service := range services {
		pm.createProxy(name, service.URL)
	}
}

// createProxy 创建单个服务的代理
func (pm *ProxyManager) createProxy(serviceName, serviceURL string) {
	target, err := url.Parse(serviceURL)
	if err != nil {
		logrus.Errorf("Failed to parse service URL %s: %v", serviceURL, err)
		return
	}

	proxy := httputil.NewSingleHostReverseProxy(target)

	// 自定义Director
	originalDirector := proxy.Director
	proxy.Director = func(req *http.Request) {
		originalDirector(req)
		// 设置Host头
		req.Host = target.Host
		// 添加自定义头
		req.Header.Set("X-Forwarded-Proto", "http")
		req.Header.Set("X-Gateway-Service", serviceName)
		req.Header.Set("X-Gateway-Time", time.Now().UTC().Format(time.RFC3339))
	}

	// 自定义错误处理
	proxy.ErrorHandler = pm.createErrorHandler(serviceName)

	// 自定义响应修改
	proxy.ModifyResponse = pm.createResponseModifier(serviceName)

	pm.mu.Lock()
	pm.proxies[serviceName] = proxy
	pm.mu.Unlock()

	logrus.Infof("Created proxy for service %s -> %s", serviceName, serviceURL)
}

// createErrorHandler 创建错误处理器
func (pm *ProxyManager) createErrorHandler(serviceName string) func(http.ResponseWriter, *http.Request, error) {
	return func(w http.ResponseWriter, r *http.Request, err error) {
		logrus.Errorf("Proxy error for service %s: %v", serviceName, err)

		// 更新服务状态
		pm.registry.UpdateServiceStatus(serviceName, registry.ServiceStatusUnhealthy)

		// 返回错误响应
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadGateway)

		errorResp := map[string]interface{}{
			"error": map[string]interface{}{
				"code":    "SERVICE_UNAVAILABLE",
				"message": fmt.Sprintf("Service %s is currently unavailable", serviceName),
				"service": serviceName,
			},
			"timestamp": time.Now().UTC(),
			"requestId": r.Header.Get("X-Request-ID"),
		}

		json.NewEncoder(w).Encode(errorResp)
	}
}

// createResponseModifier 创建响应修改器
func (pm *ProxyManager) createResponseModifier(serviceName string) func(*http.Response) error {
	return func(resp *http.Response) error {
		// 添加响应头
		resp.Header.Set("X-Gateway-Service", serviceName)
		resp.Header.Set("X-Gateway-Time", time.Now().UTC().Format(time.RFC3339))

		// 如果响应成功，更新服务状态为健康
		if resp.StatusCode >= 200 && resp.StatusCode < 400 {
			pm.registry.UpdateServiceStatus(serviceName, registry.ServiceStatusHealthy)
		}

		return nil
	}
}

// ProxyRequest 代理请求
func (pm *ProxyManager) ProxyRequest(c *gin.Context, serviceName string) {
	start := time.Now()

	// 检查服务是否可用
	if !pm.registry.IsServiceAvailable(serviceName) {
		logrus.Warnf("Service %s is not available", serviceName)
		utils.ErrorResponse(c, http.StatusServiceUnavailable, "https://api.snowfall-guild.com/errors/service-unavailable",
			"Service unavailable", fmt.Sprintf("Service %s is currently unavailable", serviceName), "SERVICE_UNAVAILABLE")
		return
	}

	// 获取代理
	proxy := pm.getProxy(serviceName)
	if proxy == nil {
		logrus.Errorf("No proxy found for service %s", serviceName)
		utils.ErrorResponse(c, http.StatusInternalServerError, "https://api.snowfall-guild.com/errors/internal-server-error",
			"Proxy not found", fmt.Sprintf("Proxy for service %s not found", serviceName), "PROXY_NOT_FOUND")
		return
	}

	// 记录请求
	logrus.Infof("Proxying request to service %s: %s %s", serviceName, c.Request.Method, c.Request.URL.Path)

	// 设置超时
	service, _ := pm.registry.GetService(serviceName)
	if service != nil && service.Timeout > 0 {
		ctx, cancel := context.WithTimeout(c.Request.Context(), service.Timeout)
		defer cancel()
		c.Request = c.Request.WithContext(ctx)
	}

	// 执行代理
	proxy.ServeHTTP(c.Writer, c.Request)

	// 记录响应时间
	duration := time.Since(start)
	logrus.Debugf("Request to service %s completed in %v", serviceName, duration)
}

// getProxy 获取服务代理
func (pm *ProxyManager) getProxy(serviceName string) *httputil.ReverseProxy {
	pm.mu.RLock()
	defer pm.mu.RUnlock()

	return pm.proxies[serviceName]
}

// UpdateProxy 更新服务代理
func (pm *ProxyManager) UpdateProxy(serviceName, serviceURL string) error {
	_, err := url.Parse(serviceURL)
	if err != nil {
		return fmt.Errorf("failed to parse service URL: %w", err)
	}

	pm.createProxy(serviceName, serviceURL)
	logrus.Infof("Updated proxy for service %s -> %s", serviceName, serviceURL)

	return nil
}

// RemoveProxy 移除服务代理
func (pm *ProxyManager) RemoveProxy(serviceName string) {
	pm.mu.Lock()
	defer pm.mu.Unlock()

	delete(pm.proxies, serviceName)
	logrus.Infof("Removed proxy for service %s", serviceName)
}

// ForwardRequest 转发请求（带重试机制）
func (pm *ProxyManager) ForwardRequest(c *gin.Context, serviceName string) {
	service, exists := pm.registry.GetService(serviceName)
	if !exists {
		utils.ErrorResponse(c, http.StatusNotFound, "https://api.snowfall-guild.com/errors/not-found",
			"Service not found", fmt.Sprintf("Service %s not found", serviceName), "SERVICE_NOT_FOUND")
		return
	}

	maxRetries := service.Retries
	if maxRetries <= 0 {
		maxRetries = 3
	}

	var lastErr error
	for attempt := 0; attempt <= maxRetries; attempt++ {
		if attempt > 0 {
			logrus.Warnf("Retrying request to service %s (attempt %d/%d)", serviceName, attempt, maxRetries)
			time.Sleep(time.Duration(attempt) * time.Second) // 指数退避
		}

		// 检查服务是否健康
		if !pm.registry.IsServiceAvailable(serviceName) {
			lastErr = fmt.Errorf("service %s is not available", serviceName)
			continue
		}

		// 尝试转发请求
		err := pm.forwardSingleRequest(c, serviceName)
		if err == nil {
			return // 成功
		}

		lastErr = err
		logrus.Warnf("Request to service %s failed (attempt %d/%d): %v", serviceName, attempt+1, maxRetries+1, err)
	}

	// 所有重试都失败了
	logrus.Errorf("All retries failed for service %s: %v", serviceName, lastErr)
	utils.ErrorResponse(c, http.StatusBadGateway, "https://api.snowfall-guild.com/errors/bad-gateway",
		"Service error", fmt.Sprintf("Service %s is currently unavailable after %d retries", serviceName, maxRetries), "SERVICE_ERROR")
}

// forwardSingleRequest 转发单个请求
func (pm *ProxyManager) forwardSingleRequest(c *gin.Context, serviceName string) error {
	service, exists := pm.registry.GetHealthyService(serviceName)
	if !exists {
		return fmt.Errorf("healthy service %s not found", serviceName)
	}

	// 构建目标URL
	targetURL := service.URL + c.Request.URL.Path
	if c.Request.URL.RawQuery != "" {
		targetURL += "?" + c.Request.URL.RawQuery
	}

	// 读取请求体
	var bodyBytes []byte
	if c.Request.Body != nil {
		bodyBytes, _ = io.ReadAll(c.Request.Body)
		c.Request.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))
	}

	// 创建新请求
	req, err := http.NewRequestWithContext(c.Request.Context(), c.Request.Method, targetURL, bytes.NewBuffer(bodyBytes))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	// 复制头部
	for key, values := range c.Request.Header {
		for _, value := range values {
			req.Header.Add(key, value)
		}
	}

	// 添加代理头部
	req.Header.Set("X-Forwarded-For", c.ClientIP())
	req.Header.Set("X-Forwarded-Proto", "http")
	req.Header.Set("X-Gateway-Service", serviceName)
	req.Header.Set("X-Gateway-Time", time.Now().UTC().Format(time.RFC3339))

	// 设置超时
	client := pm.client
	if service.Timeout > 0 {
		client = &http.Client{
			Timeout:   service.Timeout,
			Transport: pm.client.Transport,
		}
	}

	// 发送请求
	resp, err := client.Do(req)
	if err != nil {
		pm.registry.UpdateServiceStatus(serviceName, registry.ServiceStatusUnhealthy)
		return fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()

	// 更新服务状态
	if resp.StatusCode >= 200 && resp.StatusCode < 400 {
		pm.registry.UpdateServiceStatus(serviceName, registry.ServiceStatusHealthy)
	}

	// 复制响应头
	for key, values := range resp.Header {
		for _, value := range values {
			c.Header(key, value)
		}
	}

	// 添加网关头部
	c.Header("X-Gateway-Service", serviceName)
	c.Header("X-Gateway-Time", time.Now().UTC().Format(time.RFC3339))

	// 设置状态码
	c.Status(resp.StatusCode)

	// 复制响应体
	_, err = io.Copy(c.Writer, resp.Body)
	if err != nil {
		return fmt.Errorf("failed to copy response body: %w", err)
	}

	return nil
}

// GetProxyStats 获取代理统计信息
func (pm *ProxyManager) GetProxyStats() map[string]interface{} {
	pm.mu.RLock()
	defer pm.mu.RUnlock()

	stats := make(map[string]interface{})
	stats["totalProxies"] = len(pm.proxies)
	stats["proxies"] = make(map[string]interface{})

	for name := range pm.proxies {
		service, exists := pm.registry.GetService(name)
		if exists {
			stats["proxies"].(map[string]interface{})[name] = map[string]interface{}{
				"url":       service.URL,
				"status":    service.Status.String(),
				"lastCheck": service.LastCheck,
			}
		}
	}

	return stats
}
