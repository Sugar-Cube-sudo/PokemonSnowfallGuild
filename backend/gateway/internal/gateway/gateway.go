package gateway

import (
	"net/http"
	"runtime"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/snowfall-guild/backend/gateway/internal/config"
	"github.com/snowfall-guild/backend/gateway/internal/health"
	"github.com/snowfall-guild/backend/gateway/internal/proxy"
	"github.com/snowfall-guild/backend/shared/middleware"
	"github.com/snowfall-guild/backend/shared/types"
	"github.com/snowfall-guild/backend/shared/utils"
	logrus "github.com/sirupsen/logrus"
)

// Gateway 网关结构
type Gateway struct {
	config       *config.Config
	proxyManager *proxy.ProxyManager
	healthChecker *health.HealthChecker
	startTime    time.Time
}

// NewGateway 创建网关实例
func NewGateway(cfg *config.Config, proxyManager *proxy.ProxyManager, healthChecker *health.HealthChecker) *Gateway {
	return &Gateway{
		config:        cfg,
		proxyManager:  proxyManager,
		healthChecker: healthChecker,
		startTime:     time.Now(),
	}
}

// ProxyRequest 代理请求处理
func (g *Gateway) ProxyRequest(c *gin.Context) {
	path := c.Param("path")
	if path == "" {
		path = c.Request.URL.Path
	}

	// 移除前导斜杠
	path = strings.TrimPrefix(path, "/")

	// 确定目标服务
	serviceName := g.determineService(path)
	if serviceName == "" {
		logrus.Warnf("No service found for path: %s", path)
		utils.ErrorResponse(c, http.StatusNotFound, "https://api.snowfall-guild.com/errors/not-found", "Service not found", "No service found for this path", "SERVICE_NOT_FOUND")
		return
	}

	// 检查路由配置
	routeConfig := g.findRouteConfig(c.Request.URL.Path)
	if routeConfig != nil {
		// 检查认证要求
		if routeConfig.RequireAuth {
			if !g.isAuthenticated(c) {
				utils.ErrorResponse(c, http.StatusUnauthorized, "https://api.snowfall-guild.com/errors/unauthorized", "Authentication required", "This endpoint requires authentication", "AUTHENTICATION_REQUIRED")
				return
			}
		}

		// 检查权限要求
		if len(routeConfig.Permissions) > 0 {
			if !g.hasPermissions(c, routeConfig.Permissions) {
				utils.ErrorResponse(c, http.StatusForbidden, "https://api.snowfall-guild.com/errors/forbidden", "Insufficient permissions", "You don't have the required permissions", "INSUFFICIENT_PERMISSIONS")
				return
			}
		}
	}

	// 记录请求
	logrus.Infof("Routing request %s %s to service %s", c.Request.Method, c.Request.URL.Path, serviceName)

	// 转发请求
	g.proxyManager.ForwardRequest(c, serviceName)
}

// determineService 根据路径确定目标服务
func (g *Gateway) determineService(path string) string {
	// 移除API版本前缀
	path = strings.TrimPrefix(path, "api/v1/")

	// 根据路径前缀确定服务
	switch {
	case strings.HasPrefix(path, "auth"):
		return "auth"
	case strings.HasPrefix(path, "users"):
		return "user"
	case strings.HasPrefix(path, "forum"):
		return "forum"
	case strings.HasPrefix(path, "messages"):
		return "message"
	case strings.HasPrefix(path, "reports"):
		return "report"
	case strings.HasPrefix(path, "pokemon"):
		return "pokemon"
	case strings.HasPrefix(path, "files"):
		return "fileStorage"
	default:
		return ""
	}
}

// findRouteConfig 查找路由配置
func (g *Gateway) findRouteConfig(path string) *config.RouteConfig {
	for _, route := range g.config.Routes {
		if g.matchPath(route.Path, path) {
			return &route
		}
	}
	return nil
}

// matchPath 匹配路径
func (g *Gateway) matchPath(pattern, path string) bool {
	// 简单的通配符匹配
	if strings.HasSuffix(pattern, "/*") {
		prefix := pattern[:len(pattern)-2]
		return strings.HasPrefix(path, prefix)
	}
	return pattern == path
}

// isAuthenticated 检查是否已认证
func (g *Gateway) isAuthenticated(c *gin.Context) bool {
	// 从上下文获取用户ID，如果存在说明已通过认证中间件验证
	userID, exists := c.Get("userId")
	if !exists {
		return false
	}

	// 检查用户ID是否有效
	if userID == nil {
		return false
	}

	return true
}

// hasPermissions 检查是否有所需权限
func (g *Gateway) hasPermissions(c *gin.Context, requiredPermissions []string) bool {
	// 从上下文获取用户权限（已通过认证中间件设置）
	permissions, exists := c.Get("permissions")
	if !exists {
		return false
	}

	userPermissions, ok := permissions.([]types.Permission)
	if !ok {
		return false
	}

	// 检查是否有所需权限
	for _, required := range requiredPermissions {
		found := false
		for _, userPerm := range userPermissions {
			if string(userPerm) == required {
				found = true
				break
			}
		}
		if !found {
			return false
		}
	}

	return true
}



// HealthCheck 健康检查处理
func (g *Gateway) HealthCheck(c *gin.Context) {
	stats := g.healthChecker.GetHealthStats()

	total := stats["total"].(int)
	healthy := stats["healthy"].(int)
	unhealthy := stats["unhealthy"].(int)

	status := "healthy"
	statusCode := http.StatusOK

	// 如果有超过一半的服务不健康，则网关状态为不健康
	if unhealthy > total/2 {
		status = "unhealthy"
		statusCode = http.StatusServiceUnavailable
	}

	response := gin.H{
		"status":    status,
		"timestamp": time.Now().UTC(),
		"uptime":    time.Since(g.startTime).Seconds(),
		"version":   "1.0.0",
		"services": gin.H{
			"total":     total,
			"healthy":   healthy,
			"unhealthy": unhealthy,
		},
		"gateway": gin.H{
			"goroutines": runtime.NumGoroutine(),
			"memory":     g.getMemoryStats(),
		},
	}

	c.JSON(statusCode, response)
}

// ReadinessCheck 就绪检查
func (g *Gateway) ReadinessCheck(c *gin.Context) {
	// 检查关键服务是否健康
	criticalServices := []string{"auth", "user"}
	allReady := true

	for _, service := range criticalServices {
		if !g.healthChecker.IsServiceHealthy(service) {
			allReady = false
			break
		}
	}

	status := "ready"
	statusCode := http.StatusOK

	if !allReady {
		status = "not ready"
		statusCode = http.StatusServiceUnavailable
	}

	response := gin.H{
		"status":    status,
		"timestamp": time.Now().UTC(),
		"critical_services": criticalServices,
	}

	c.JSON(statusCode, response)
}

// LivenessCheck 存活检查
func (g *Gateway) LivenessCheck(c *gin.Context) {
	// 简单的存活检查
	response := gin.H{
		"status":    "alive",
		"timestamp": time.Now().UTC(),
		"uptime":    time.Since(g.startTime).Seconds(),
	}

	c.JSON(http.StatusOK, response)
}

// getMemoryStats 获取内存统计
func (g *Gateway) getMemoryStats() gin.H {
	var m runtime.MemStats
	runtime.ReadMemStats(&m)

	return gin.H{
		"alloc":      m.Alloc,
		"totalAlloc": m.TotalAlloc,
		"sys":        m.Sys,
		"numGC":      m.NumGC,
	}
}

// GetStats 获取网关统计信息
func (g *Gateway) GetStats(c *gin.Context) {
	healthStats := g.healthChecker.GetHealthStats()
	proxyStats := g.proxyManager.GetProxyStats()

	stats := gin.H{
		"gateway": gin.H{
			"uptime":     time.Since(g.startTime).Seconds(),
			"version":    "1.0.0",
			"startTime":  g.startTime,
			"goroutines": runtime.NumGoroutine(),
			"memory":     g.getMemoryStats(),
		},
		"services": healthStats,
		"proxy":    proxyStats,
		"timestamp": time.Now().UTC(),
	}

	utils.SuccessResponse(c, stats, "Gateway statistics retrieved successfully")
}

// ForceHealthCheck 强制健康检查
func (g *Gateway) ForceHealthCheck(c *gin.Context) {
	g.healthChecker.ForceHealthCheck()
	utils.SuccessResponse(c, gin.H{
		"message":   "Health check triggered",
		"timestamp": time.Now().UTC(),
	}, "Health check triggered successfully")
}

// GetServiceStatus 获取特定服务状态
func (g *Gateway) GetServiceStatus(c *gin.Context) {
	serviceName := c.Param("service")
	if serviceName == "" {
		utils.ErrorResponse(c, http.StatusBadRequest, "https://api.snowfall-guild.com/errors/bad-request", "Invalid service", "Service name is required", "INVALID_SERVICE")
		return
	}

	status, exists := g.healthChecker.GetServiceStatus(serviceName)
	if !exists {
		utils.ErrorResponse(c, http.StatusNotFound, "https://api.snowfall-guild.com/errors/not-found", "Service not found", "The requested service was not found", "SERVICE_NOT_FOUND")
		return
	}

	lastCheck, _ := g.healthChecker.GetLastCheckTime(serviceName)

	response := gin.H{
		"service":   serviceName,
		"status":    status.String(),
		"lastCheck": lastCheck,
		"timestamp": time.Now().UTC(),
	}

	utils.SuccessResponse(c, response, "Service status retrieved successfully")
}

// SetupAdminRoutes 设置管理路由
func (g *Gateway) SetupAdminRoutes(router *gin.Engine) {
	admin := router.Group("/admin")
	admin.Use(middleware.RequirePermission("ADMIN"))
	{
		admin.GET("/stats", g.GetStats)
		admin.POST("/health-check", g.ForceHealthCheck)
		admin.GET("/services/:service/status", g.GetServiceStatus)
	}
}

// Shutdown 优雅关闭
func (g *Gateway) Shutdown() {
	logrus.Info("Shutting down gateway...")
	g.healthChecker.Stop()
	logrus.Info("Gateway shutdown completed")
}