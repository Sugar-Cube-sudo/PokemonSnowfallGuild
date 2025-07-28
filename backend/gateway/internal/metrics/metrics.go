package metrics

import (
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

// MetricsHandler 指标处理器
type MetricsHandler struct {
	registry *prometheus.Registry

	// HTTP指标
	httpRequestsTotal    *prometheus.CounterVec
	httpRequestDuration  *prometheus.HistogramVec
	httpRequestsInFlight *prometheus.GaugeVec
	httpResponseSize     *prometheus.HistogramVec

	// 服务指标
	serviceHealth        *prometheus.GaugeVec
	serviceRequestsTotal *prometheus.CounterVec
	serviceResponseTime  *prometheus.HistogramVec
	serviceErrors        *prometheus.CounterVec

	// 网关指标
	gatewayUptime      prometheus.Gauge
	gatewayConnections prometheus.Gauge
	gatewayMemoryUsage prometheus.Gauge
	gatewayGoroutines  prometheus.Gauge
}

// NewMetricsHandler 创建指标处理器
func NewMetricsHandler() *MetricsHandler {
	registry := prometheus.NewRegistry()

	m := &MetricsHandler{
		registry: registry,
	}

	// 初始化指标
	m.initMetrics()

	// 注册指标
	m.registerMetrics()

	return m
}

// initMetrics 初始化指标
func (m *MetricsHandler) initMetrics() {
	// HTTP指标
	m.httpRequestsTotal = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "gateway_http_requests_total",
			Help: "Total number of HTTP requests",
		},
		[]string{"method", "path", "status", "service"},
	)

	m.httpRequestDuration = prometheus.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "gateway_http_request_duration_seconds",
			Help:    "HTTP request duration in seconds",
			Buckets: prometheus.DefBuckets,
		},
		[]string{"method", "path", "service"},
	)

	m.httpRequestsInFlight = prometheus.NewGaugeVec(
		prometheus.GaugeOpts{
			Name: "gateway_http_requests_in_flight",
			Help: "Number of HTTP requests currently being processed",
		},
		[]string{"service"},
	)

	m.httpResponseSize = prometheus.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "gateway_http_response_size_bytes",
			Help:    "HTTP response size in bytes",
			Buckets: []float64{100, 1000, 10000, 100000, 1000000},
		},
		[]string{"method", "path", "service"},
	)

	// 服务指标
	m.serviceHealth = prometheus.NewGaugeVec(
		prometheus.GaugeOpts{
			Name: "gateway_service_health",
			Help: "Service health status (1=healthy, 0=unhealthy)",
		},
		[]string{"service", "url"},
	)

	m.serviceRequestsTotal = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "gateway_service_requests_total",
			Help: "Total number of requests to services",
		},
		[]string{"service", "status"},
	)

	m.serviceResponseTime = prometheus.NewHistogramVec(
		prometheus.HistogramOpts{
			Name:    "gateway_service_response_time_seconds",
			Help:    "Service response time in seconds",
			Buckets: prometheus.DefBuckets,
		},
		[]string{"service"},
	)

	m.serviceErrors = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "gateway_service_errors_total",
			Help: "Total number of service errors",
		},
		[]string{"service", "error_type"},
	)

	// 网关指标
	m.gatewayUptime = prometheus.NewGauge(
		prometheus.GaugeOpts{
			Name: "gateway_uptime_seconds",
			Help: "Gateway uptime in seconds",
		},
	)

	m.gatewayConnections = prometheus.NewGauge(
		prometheus.GaugeOpts{
			Name: "gateway_active_connections",
			Help: "Number of active connections",
		},
	)

	m.gatewayMemoryUsage = prometheus.NewGauge(
		prometheus.GaugeOpts{
			Name: "gateway_memory_usage_bytes",
			Help: "Gateway memory usage in bytes",
		},
	)

	m.gatewayGoroutines = prometheus.NewGauge(
		prometheus.GaugeOpts{
			Name: "gateway_goroutines",
			Help: "Number of goroutines",
		},
	)
}

// registerMetrics 注册指标
func (m *MetricsHandler) registerMetrics() {
	// HTTP指标
	m.registry.MustRegister(m.httpRequestsTotal)
	m.registry.MustRegister(m.httpRequestDuration)
	m.registry.MustRegister(m.httpRequestsInFlight)
	m.registry.MustRegister(m.httpResponseSize)

	// 服务指标
	m.registry.MustRegister(m.serviceHealth)
	m.registry.MustRegister(m.serviceRequestsTotal)
	m.registry.MustRegister(m.serviceResponseTime)
	m.registry.MustRegister(m.serviceErrors)

	// 网关指标
	m.registry.MustRegister(m.gatewayUptime)
	m.registry.MustRegister(m.gatewayConnections)
	m.registry.MustRegister(m.gatewayMemoryUsage)
	m.registry.MustRegister(m.gatewayGoroutines)

	// 注册Go运行时指标
	m.registry.MustRegister(prometheus.NewGoCollector())
	m.registry.MustRegister(prometheus.NewProcessCollector(prometheus.ProcessCollectorOpts{}))
}

// Handler 返回Prometheus HTTP处理器
func (m *MetricsHandler) Handler() http.Handler {
	return promhttp.HandlerFor(m.registry, promhttp.HandlerOpts{})
}

// MetricsMiddleware 指标中间件
func (m *MetricsHandler) MetricsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		path := c.FullPath()
		if path == "" {
			path = c.Request.URL.Path
		}

		// 获取服务名称
		service := m.extractServiceName(c)

		// 增加进行中的请求计数
		m.httpRequestsInFlight.WithLabelValues(service).Inc()
		defer m.httpRequestsInFlight.WithLabelValues(service).Dec()

		// 处理请求
		c.Next()

		// 记录指标
		duration := time.Since(start).Seconds()
		status := strconv.Itoa(c.Writer.Status())
		method := c.Request.Method

		// HTTP指标
		m.httpRequestsTotal.WithLabelValues(method, path, status, service).Inc()
		m.httpRequestDuration.WithLabelValues(method, path, service).Observe(duration)

		// 响应大小
		responseSize := float64(c.Writer.Size())
		if responseSize > 0 {
			m.httpResponseSize.WithLabelValues(method, path, service).Observe(responseSize)
		}

		// 服务指标
		if service != "" {
			m.serviceRequestsTotal.WithLabelValues(service, status).Inc()
			m.serviceResponseTime.WithLabelValues(service).Observe(duration)

			// 记录错误
			if c.Writer.Status() >= 400 {
				errorType := m.getErrorType(c.Writer.Status())
				m.serviceErrors.WithLabelValues(service, errorType).Inc()
			}
		}
	}
}

// extractServiceName 从请求中提取服务名称
func (m *MetricsHandler) extractServiceName(c *gin.Context) string {
	// 从路径中提取服务名称
	path := c.Request.URL.Path
	if len(path) > 8 && path[:8] == "/api/v1/" {
		parts := strings.Split(path[8:], "/")
		if len(parts) > 0 {
			switch parts[0] {
			case "auth":
				return "auth"
			case "users":
				return "user"
			case "forum":
				return "forum"
			case "messages":
				return "message"
			case "reports":
				return "report"
			case "pokemon":
				return "pokemon"
			case "files":
				return "fileStorage"
			}
		}
	}

	// 从头部获取
	if service := c.GetHeader("X-Gateway-Service"); service != "" {
		return service
	}

	return "unknown"
}

// getErrorType 根据状态码获取错误类型
func (m *MetricsHandler) getErrorType(statusCode int) string {
	switch {
	case statusCode >= 400 && statusCode < 500:
		return "client_error"
	case statusCode >= 500:
		return "server_error"
	default:
		return "unknown"
	}
}

// UpdateServiceHealth 更新服务健康状态
func (m *MetricsHandler) UpdateServiceHealth(serviceName, serviceURL string, healthy bool) {
	value := 0.0
	if healthy {
		value = 1.0
	}
	m.serviceHealth.WithLabelValues(serviceName, serviceURL).Set(value)
}

// UpdateGatewayUptime 更新网关运行时间
func (m *MetricsHandler) UpdateGatewayUptime(uptime float64) {
	m.gatewayUptime.Set(uptime)
}

// UpdateActiveConnections 更新活跃连接数
func (m *MetricsHandler) UpdateActiveConnections(count float64) {
	m.gatewayConnections.Set(count)
}

// UpdateMemoryUsage 更新内存使用量
func (m *MetricsHandler) UpdateMemoryUsage(bytes float64) {
	m.gatewayMemoryUsage.Set(bytes)
}

// UpdateGoroutines 更新协程数量
func (m *MetricsHandler) UpdateGoroutines(count float64) {
	m.gatewayGoroutines.Set(count)
}

// RecordServiceError 记录服务错误
func (m *MetricsHandler) RecordServiceError(serviceName, errorType string) {
	m.serviceErrors.WithLabelValues(serviceName, errorType).Inc()
}

// RecordServiceRequest 记录服务请求
func (m *MetricsHandler) RecordServiceRequest(serviceName, status string) {
	m.serviceRequestsTotal.WithLabelValues(serviceName, status).Inc()
}

// RecordServiceResponseTime 记录服务响应时间
func (m *MetricsHandler) RecordServiceResponseTime(serviceName string, duration float64) {
	m.serviceResponseTime.WithLabelValues(serviceName).Observe(duration)
}

// GetMetricsSnapshot 获取指标快照
func (m *MetricsHandler) GetMetricsSnapshot() (map[string]interface{}, error) {
	metricFamilies, err := m.registry.Gather()
	if err != nil {
		return nil, err
	}

	snapshot := make(map[string]interface{})
	for _, mf := range metricFamilies {
		metrics := make([]map[string]interface{}, 0)
		for _, metric := range mf.GetMetric() {
			m := map[string]interface{}{
				"labels": make(map[string]string),
			}

			// 添加标签
			for _, label := range metric.GetLabel() {
				m["labels"].(map[string]string)[label.GetName()] = label.GetValue()
			}

			// 添加值
			if counter := metric.GetCounter(); counter != nil {
				m["value"] = counter.GetValue()
				m["type"] = "counter"
			} else if gauge := metric.GetGauge(); gauge != nil {
				m["value"] = gauge.GetValue()
				m["type"] = "gauge"
			} else if histogram := metric.GetHistogram(); histogram != nil {
				m["count"] = histogram.GetSampleCount()
				m["sum"] = histogram.GetSampleSum()
				m["type"] = "histogram"
			}

			metrics = append(metrics, m)
		}
		snapshot[mf.GetName()] = metrics
	}

	return snapshot, nil
}
