package config

import (
	"fmt"
	"time"

	"github.com/spf13/viper"
)

// Config 网关配置结构
type Config struct {
	Server       ServerConfig       `mapstructure:"server"`
	Services     ServicesConfig     `mapstructure:"services"`
	Redis        RedisConfig        `mapstructure:"redis"`
	JWT          JWTConfig          `mapstructure:"jwt"`
	CORS         CORSConfig         `mapstructure:"cors"`
	RateLimit    RateLimitConfig    `mapstructure:"rateLimit"`
	Log          LogConfig          `mapstructure:"log"`
	Security     SecurityConfig     `mapstructure:"security"`
	Monitoring   MonitoringConfig   `mapstructure:"monitoring"`
	LoadBalancer LoadBalancerConfig `mapstructure:"loadBalancer"`
	Cache        CacheConfig        `mapstructure:"cache"`
	Routes       []RouteConfig      `mapstructure:"routes"`
}

// ServerConfig 服务器配置
type ServerConfig struct {
	Host         string        `mapstructure:"host"`
	Port         int           `mapstructure:"port"`
	Mode         string        `mapstructure:"mode"`
	ReadTimeout  time.Duration `mapstructure:"readTimeout"`
	WriteTimeout time.Duration `mapstructure:"writeTimeout"`
	IdleTimeout  time.Duration `mapstructure:"idleTimeout"`
}

// ServiceConfig 单个服务配置
type ServiceConfig struct {
	URL         string        `mapstructure:"url"`
	HealthCheck string        `mapstructure:"healthCheck"`
	Timeout     time.Duration `mapstructure:"timeout"`
	Retries     int           `mapstructure:"retries"`
}

// ServicesConfig 所有服务配置
type ServicesConfig struct {
	Auth        ServiceConfig `mapstructure:"auth"`
	User        ServiceConfig `mapstructure:"user"`
	Forum       ServiceConfig `mapstructure:"forum"`
	Message     ServiceConfig `mapstructure:"message"`
	Report      ServiceConfig `mapstructure:"report"`
	Pokemon     ServiceConfig `mapstructure:"pokemon"`
	FileStorage ServiceConfig `mapstructure:"fileStorage"`
}

// RedisConfig Redis配置
type RedisConfig struct {
	Host         string        `mapstructure:"host"`
	Port         int           `mapstructure:"port"`
	Password     string        `mapstructure:"password"`
	DB           int           `mapstructure:"db"`
	PoolSize     int           `mapstructure:"poolSize"`
	MinIdleConns int           `mapstructure:"minIdleConns"`
	DialTimeout  time.Duration `mapstructure:"dialTimeout"`
	ReadTimeout  time.Duration `mapstructure:"readTimeout"`
	WriteTimeout time.Duration `mapstructure:"writeTimeout"`
}

// JWTConfig JWT配置
type JWTConfig struct {
	Secret          string        `mapstructure:"secret"`
	AccessTokenTTL  time.Duration `mapstructure:"accessTokenTTL"`
	RefreshTokenTTL time.Duration `mapstructure:"refreshTokenTTL"`
	Issuer          string        `mapstructure:"issuer"`
	Audience        string        `mapstructure:"audience"`
}

// CORSConfig CORS配置
type CORSConfig struct {
	AllowOrigins     []string `mapstructure:"allowOrigins"`
	AllowMethods     []string `mapstructure:"allowMethods"`
	AllowHeaders     []string `mapstructure:"allowHeaders"`
	ExposeHeaders    []string `mapstructure:"exposeHeaders"`
	AllowCredentials bool     `mapstructure:"allowCredentials"`
	MaxAge           int      `mapstructure:"maxAge"`
}

// RateLimitConfig 限流配置
type RateLimitConfig struct {
	Enabled bool          `mapstructure:"enabled"`
	RPS     int           `mapstructure:"rps"`
	Burst   int           `mapstructure:"burst"`
	Window  time.Duration `mapstructure:"window"`
}

// LogConfig 日志配置
type LogConfig struct {
	Level      string `mapstructure:"level"`
	Format     string `mapstructure:"format"`
	Output     string `mapstructure:"output"`
	FilePath   string `mapstructure:"filePath"`
	MaxSize    int    `mapstructure:"maxSize"`
	MaxBackups int    `mapstructure:"maxBackups"`
	MaxAge     int    `mapstructure:"maxAge"`
	Compress   bool   `mapstructure:"compress"`
}

// SecurityConfig 安全配置
type SecurityConfig struct {
	PasswordMinLength      int           `mapstructure:"passwordMinLength"`
	PasswordRequireSpecial bool          `mapstructure:"passwordRequireSpecial"`
	PasswordRequireNumber  bool          `mapstructure:"passwordRequireNumber"`
	PasswordRequireUpper   bool          `mapstructure:"passwordRequireUpper"`
	PasswordRequireLower   bool          `mapstructure:"passwordRequireLower"`
	MaxLoginAttempts       int           `mapstructure:"maxLoginAttempts"`
	LockoutDuration        time.Duration `mapstructure:"lockoutDuration"`
	TwoFactorEnabled       bool          `mapstructure:"twoFactorEnabled"`
}

// MonitoringConfig 监控配置
type MonitoringConfig struct {
	Enabled       bool   `mapstructure:"enabled"`
	MetricsPath   string `mapstructure:"metricsPath"`
	HealthPath    string `mapstructure:"healthPath"`
	ReadinessPath string `mapstructure:"readinessPath"`
	LivenessPath  string `mapstructure:"livenessPath"`
}

// LoadBalancerConfig 负载均衡配置
type LoadBalancerConfig struct {
	Strategy            string        `mapstructure:"strategy"`
	HealthCheckInterval time.Duration `mapstructure:"healthCheckInterval"`
	MaxRetries          int           `mapstructure:"maxRetries"`
	RetryDelay          time.Duration `mapstructure:"retryDelay"`
}

// CacheRouteConfig 缓存路由配置
type CacheRouteConfig struct {
	Path string        `mapstructure:"path"`
	TTL  time.Duration `mapstructure:"ttl"`
}

// CacheConfig 缓存配置
type CacheConfig struct {
	Enabled    bool               `mapstructure:"enabled"`
	DefaultTTL time.Duration      `mapstructure:"defaultTTL"`
	MaxSize    int                `mapstructure:"maxSize"`
	Routes     []CacheRouteConfig `mapstructure:"routes"`
}

// RouteConfig 路由配置
type RouteConfig struct {
	Path        string        `mapstructure:"path"`
	Service     string        `mapstructure:"service"`
	StripPrefix bool          `mapstructure:"stripPrefix"`
	Timeout     time.Duration `mapstructure:"timeout"`
	Retries     int           `mapstructure:"retries"`
	RequireAuth bool          `mapstructure:"requireAuth"`
	Permissions []string      `mapstructure:"permissions"`
}

// LoadConfig 加载配置
func LoadConfig() (*Config, error) {
	viper.SetConfigName("config")
	viper.SetConfigType("yaml")
	viper.AddConfigPath("./configs")
	viper.AddConfigPath("../configs")
	viper.AddConfigPath(".")

	// 设置环境变量前缀
	viper.SetEnvPrefix("GATEWAY")
	viper.AutomaticEnv()

	// 设置默认值
	setDefaults()

	// 读取配置文件
	if err := viper.ReadInConfig(); err != nil {
		return nil, fmt.Errorf("failed to read config file: %w", err)
	}

	var config Config
	if err := viper.Unmarshal(&config); err != nil {
		return nil, fmt.Errorf("failed to unmarshal config: %w", err)
	}

	// 验证配置
	if err := validateConfig(&config); err != nil {
		return nil, fmt.Errorf("invalid config: %w", err)
	}

	return &config, nil
}

// setDefaults 设置默认值
func setDefaults() {
	// 服务器默认值
	viper.SetDefault("server.host", "0.0.0.0")
	viper.SetDefault("server.port", 8080)
	viper.SetDefault("server.mode", "debug")
	viper.SetDefault("server.readTimeout", "30s")
	viper.SetDefault("server.writeTimeout", "30s")
	viper.SetDefault("server.idleTimeout", "120s")

	// Redis默认值
	viper.SetDefault("redis.host", "localhost")
	viper.SetDefault("redis.port", 6379)
	viper.SetDefault("redis.db", 0)
	viper.SetDefault("redis.poolSize", 10)
	viper.SetDefault("redis.minIdleConns", 2)
	viper.SetDefault("redis.dialTimeout", "5s")
	viper.SetDefault("redis.readTimeout", "3s")
	viper.SetDefault("redis.writeTimeout", "3s")

	// JWT默认值
	viper.SetDefault("jwt.accessTokenTTL", "24h")
	viper.SetDefault("jwt.refreshTokenTTL", "168h")
	viper.SetDefault("jwt.issuer", "snowfall-guild")
	viper.SetDefault("jwt.audience", "snowfall-guild-users")

	// 限流默认值
	viper.SetDefault("rateLimit.enabled", true)
	viper.SetDefault("rateLimit.rps", 100)
	viper.SetDefault("rateLimit.burst", 200)
	viper.SetDefault("rateLimit.window", "1m")

	// 日志默认值
	viper.SetDefault("log.level", "info")
	viper.SetDefault("log.format", "json")
	viper.SetDefault("log.output", "stdout")

	// 监控默认值
	viper.SetDefault("monitoring.enabled", true)
	viper.SetDefault("monitoring.metricsPath", "/metrics")
	viper.SetDefault("monitoring.healthPath", "/health")
	viper.SetDefault("monitoring.readinessPath", "/ready")
	viper.SetDefault("monitoring.livenessPath", "/live")

	// 负载均衡默认值
	viper.SetDefault("loadBalancer.strategy", "round_robin")
	viper.SetDefault("loadBalancer.healthCheckInterval", "30s")
	viper.SetDefault("loadBalancer.maxRetries", 3)
	viper.SetDefault("loadBalancer.retryDelay", "1s")

	// 缓存默认值
	viper.SetDefault("cache.enabled", true)
	viper.SetDefault("cache.defaultTTL", "5m")
	viper.SetDefault("cache.maxSize", 1000)
}

// validateConfig 验证配置
func validateConfig(config *Config) error {
	if config.Server.Port <= 0 || config.Server.Port > 65535 {
		return fmt.Errorf("invalid server port: %d", config.Server.Port)
	}

	if config.JWT.Secret == "" {
		return fmt.Errorf("JWT secret is required")
	}

	if len(config.JWT.Secret) < 32 {
		return fmt.Errorf("JWT secret must be at least 32 characters")
	}

	if config.RateLimit.RPS <= 0 {
		return fmt.Errorf("rate limit RPS must be positive")
	}

	if config.RateLimit.Burst <= 0 {
		return fmt.Errorf("rate limit burst must be positive")
	}

	return nil
}

// GetServiceConfig 获取服务配置
func (c *Config) GetServiceConfig(serviceName string) (*ServiceConfig, bool) {
	switch serviceName {
	case "auth":
		return &c.Services.Auth, true
	case "user":
		return &c.Services.User, true
	case "forum":
		return &c.Services.Forum, true
	case "message":
		return &c.Services.Message, true
	case "report":
		return &c.Services.Report, true
	case "pokemon":
		return &c.Services.Pokemon, true
	case "fileStorage":
		return &c.Services.FileStorage, true
	default:
		return nil, false
	}
}

// GetRedisAddr 获取Redis地址
func (c *Config) GetRedisAddr() string {
	return fmt.Sprintf("%s:%d", c.Redis.Host, c.Redis.Port)
}
