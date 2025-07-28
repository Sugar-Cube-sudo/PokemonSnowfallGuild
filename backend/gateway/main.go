package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	logrus "github.com/sirupsen/logrus"
	"github.com/snowfall-guild/backend/gateway/internal/config"
	"github.com/snowfall-guild/backend/gateway/internal/gateway"
	"github.com/snowfall-guild/backend/gateway/internal/health"
	"github.com/snowfall-guild/backend/gateway/internal/metrics"
	"github.com/snowfall-guild/backend/gateway/internal/proxy"
	"github.com/snowfall-guild/backend/gateway/internal/registry"
	sharedConfig "github.com/snowfall-guild/backend/shared/config"
	"github.com/snowfall-guild/backend/shared/middleware"
	"github.com/snowfall-guild/backend/shared/utils"
)

func main() {
	// 加载配置
	cfg, err := config.LoadConfig()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// 设置日志
	setupLogger(cfg)

	logrus.Info("Starting Pokemon Snowfall Guild API Gateway...")

	// 设置Gin模式
	gin.SetMode(cfg.Server.Mode)

	// 创建服务注册中心
	serviceRegistry := registry.NewServiceRegistry(cfg)

	// 启动健康检查
	healthChecker := health.NewHealthChecker(serviceRegistry)
	go healthChecker.Start()

	// 创建代理管理器
	proxyManager := proxy.NewProxyManager(cfg, serviceRegistry)

	// 创建网关
	gatewayServer := gateway.NewGateway(cfg, proxyManager, healthChecker)

	// 设置路由
	router := setupRouter(cfg, gatewayServer)

	// 创建HTTP服务器
	server := &http.Server{
		Addr:         fmt.Sprintf("%s:%d", cfg.Server.Host, cfg.Server.Port),
		Handler:      router,
		ReadTimeout:  cfg.Server.ReadTimeout,
		WriteTimeout: cfg.Server.WriteTimeout,
		IdleTimeout:  cfg.Server.IdleTimeout,
	}

	// 启动服务器
	go func() {
		logrus.Infof("Gateway server starting on %s", server.Addr)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logrus.Fatalf("Failed to start server: %v", err)
		}
	}()

	// 等待中断信号
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	logrus.Info("Shutting down gateway server...")

	// 优雅关闭
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	// 停止健康检查
	healthChecker.Stop()

	// 关闭HTTP服务器
	if err := server.Shutdown(ctx); err != nil {
		logrus.Errorf("Gateway server forced to shutdown: %v", err)
	} else {
		logrus.Info("Gateway server exited gracefully")
	}
}

func setupLogger(cfg *config.Config) {
	// 设置日志级别
	level, err := logrus.ParseLevel(cfg.Log.Level)
	if err != nil {
		level = logrus.InfoLevel
	}
	logrus.SetLevel(level)

	// 设置日志格式
	if cfg.Log.Format == "json" {
		logrus.SetFormatter(&logrus.JSONFormatter{
			TimestampFormat: time.RFC3339,
		})
	} else {
		logrus.SetFormatter(&logrus.TextFormatter{
			FullTimestamp:   true,
			TimestampFormat: time.RFC3339,
		})
	}

	// 设置日志输出
	if cfg.Log.Output == "file" && cfg.Log.FilePath != "" {
		file, err := os.OpenFile(cfg.Log.FilePath, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)
		if err != nil {
			logrus.Warnf("Failed to open log file, using stdout: %v", err)
		} else {
			logrus.SetOutput(file)
		}
	}
}

func setupRouter(cfg *config.Config, gatewayServer *gateway.Gateway) *gin.Engine {
	router := gin.New()

	// 设置中间件
	sharedCfg := &sharedConfig.Config{
		CORS: sharedConfig.CORSConfig{
			AllowOrigins:     cfg.CORS.AllowOrigins,
			AllowMethods:     cfg.CORS.AllowMethods,
			AllowHeaders:     cfg.CORS.AllowHeaders,
			ExposeHeaders:    cfg.CORS.ExposeHeaders,
			AllowCredentials: cfg.CORS.AllowCredentials,
			MaxAge:           cfg.CORS.MaxAge,
		},
		RateLimit: sharedConfig.RateLimitConfig{
			Enabled: cfg.RateLimit.Enabled,
			RPS:     cfg.RateLimit.RPS,
			Burst:   cfg.RateLimit.Burst,
			Window:  time.Minute,
		},
	}
	middleware.SetupMiddlewares(router, sharedCfg, logrus.StandardLogger())

	// 健康检查路由
	router.GET(cfg.Monitoring.HealthPath, gatewayServer.HealthCheck)
	router.GET(cfg.Monitoring.ReadinessPath, gatewayServer.ReadinessCheck)
	router.GET(cfg.Monitoring.LivenessPath, gatewayServer.LivenessCheck)

	// 监控指标路由
	if cfg.Monitoring.Enabled {
		metricsHandler := metrics.NewMetricsHandler()
		router.GET(cfg.Monitoring.MetricsPath, gin.WrapH(metricsHandler.Handler()))
	}

	// API路由组
	api := router.Group("/api")
	{
		v1 := api.Group("/v1")
		// 添加可选认证中间件，用于验证JWT token并设置用户上下文
		v1.Use(middleware.OptionalAuthMiddleware(cfg.JWT.Secret))
		{
			// 代理所有API请求
			v1.Any("/*path", gatewayServer.ProxyRequest)
		}
	}

	// 根路径
	router.GET("/", func(c *gin.Context) {
		utils.SuccessResponse(c, gin.H{
			"service": "Pokemon Snowfall Guild API Gateway",
			"version": "1.0.0",
			"status":  "running",
			"time":    time.Now().UTC(),
		}, "Gateway is running")
	})

	// 404处理
	router.NoRoute(func(c *gin.Context) {
		utils.ErrorResponse(c, http.StatusNotFound, "https://api.snowfall-guild.com/errors/not-found", "Route not found", "The requested route was not found", "ROUTE_NOT_FOUND")
	})

	return router
}
