package config

import (
	"fmt"
	"time"

	"github.com/spf13/viper"
)

// Config 应用配置
type Config struct {
	Server      ServerConfig      `mapstructure:"server"`
	Database    DatabaseConfig    `mapstructure:"database"`
	Redis       RedisConfig       `mapstructure:"redis"`
	JWT         JWTConfig         `mapstructure:"jwt"`
	Password    PasswordConfig    `mapstructure:"password"`
	Session     SessionConfig     `mapstructure:"session"`
	TwoFactor   TwoFactorConfig   `mapstructure:"twoFactor"`
	Email       EmailConfig       `mapstructure:"email"`
	SMS         SMSConfig         `mapstructure:"sms"`
	OAuth       OAuthConfig       `mapstructure:"oauth"`
	Security    SecurityConfig    `mapstructure:"security"`
	Logging     LoggingConfig     `mapstructure:"logging"`
	Monitoring  MonitoringConfig  `mapstructure:"monitoring"`
	External    ExternalConfig    `mapstructure:"external"`
	Cache       CacheConfig       `mapstructure:"cache"`
	Development DevelopmentConfig `mapstructure:"development"`
}

// ServerConfig 服务器配置
type ServerConfig struct {
	Host            string        `mapstructure:"host"`
	Port            int           `mapstructure:"port"`
	Mode            string        `mapstructure:"mode"`
	ReadTimeout     time.Duration `mapstructure:"readTimeout"`
	WriteTimeout    time.Duration `mapstructure:"writeTimeout"`
	IdleTimeout     time.Duration `mapstructure:"idleTimeout"`
	ShutdownTimeout time.Duration `mapstructure:"shutdownTimeout"`
	TLS             TLSConfig     `mapstructure:"tls"`
	CORS            CORSConfig    `mapstructure:"cors"`
}

// TLSConfig TLS配置
type TLSConfig struct {
	Enabled  bool   `mapstructure:"enabled"`
	CertFile string `mapstructure:"certFile"`
	KeyFile  string `mapstructure:"keyFile"`
}

// CORSConfig CORS配置
type CORSConfig struct {
	AllowOrigins     []string      `mapstructure:"allowOrigins"`
	AllowMethods     []string      `mapstructure:"allowMethods"`
	AllowHeaders     []string      `mapstructure:"allowHeaders"`
	ExposeHeaders    []string      `mapstructure:"exposeHeaders"`
	AllowCredentials bool          `mapstructure:"allowCredentials"`
	MaxAge           time.Duration `mapstructure:"maxAge"`
}

// DatabaseConfig 数据库配置
type DatabaseConfig struct {
	Host            string          `mapstructure:"host"`
	Port            int             `mapstructure:"port"`
	User            string          `mapstructure:"user"`
	Password        string          `mapstructure:"password"`
	DBName          string          `mapstructure:"dbname"`
	SSLMode         string          `mapstructure:"sslmode"`
	Timezone        string          `mapstructure:"timezone"`
	MaxOpenConns    int             `mapstructure:"maxOpenConns"`
	MaxIdleConns    int             `mapstructure:"maxIdleConns"`
	ConnMaxLifetime time.Duration   `mapstructure:"connMaxLifetime"`
	ConnMaxIdleTime time.Duration   `mapstructure:"connMaxIdleTime"`
	Migration       MigrationConfig `mapstructure:"migration"`
}

// MigrationConfig 迁移配置
type MigrationConfig struct {
	Enabled     bool   `mapstructure:"enabled"`
	Path        string `mapstructure:"path"`
	AutoMigrate bool   `mapstructure:"autoMigrate"`
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
	IdleTimeout  time.Duration `mapstructure:"idleTimeout"`
}

// JWTConfig JWT配置
type JWTConfig struct {
	SecretKey            string        `mapstructure:"secretKey"`
	AccessTokenExpiry    time.Duration `mapstructure:"accessTokenExpiry"`
	RefreshTokenExpiry   time.Duration `mapstructure:"refreshTokenExpiry"`
	TwoFactorTokenExpiry time.Duration `mapstructure:"twoFactorTokenExpiry"`
	Issuer               string        `mapstructure:"issuer"`
	Audience             string        `mapstructure:"audience"`
	Algorithm            string        `mapstructure:"algorithm"`
}

// PasswordConfig 密码配置
type PasswordConfig struct {
	MinLength      int  `mapstructure:"minLength"`
	MaxLength      int  `mapstructure:"maxLength"`
	RequireUpper   bool `mapstructure:"requireUpper"`
	RequireLower   bool `mapstructure:"requireLower"`
	RequireNumber  bool `mapstructure:"requireNumber"`
	RequireSpecial bool `mapstructure:"requireSpecial"`
	HistoryCount   int  `mapstructure:"historyCount"`
	BcryptCost     int  `mapstructure:"bcryptCost"`
}

// SessionConfig 会话配置
type SessionConfig struct {
	MaxSessions        int           `mapstructure:"maxSessions"`
	InactivityTimeout  time.Duration `mapstructure:"inactivityTimeout"`
	AbsoluteTimeout    time.Duration `mapstructure:"absoluteTimeout"`
	RememberMeDuration time.Duration `mapstructure:"rememberMeDuration"`
	CleanupInterval    time.Duration `mapstructure:"cleanupInterval"`
}

// TwoFactorConfig 双因素认证配置
type TwoFactorConfig struct {
	Enabled      bool          `mapstructure:"enabled"`
	Issuer       string        `mapstructure:"issuer"`
	CodeLength   int           `mapstructure:"codeLength"`
	CodeExpiry   time.Duration `mapstructure:"codeExpiry"`
	BackupCodes  int           `mapstructure:"backupCodes"`
	RateLimitTTL time.Duration `mapstructure:"rateLimitTTL"`
	MaxAttempts  int           `mapstructure:"maxAttempts"`
}

// EmailConfig 邮箱配置
type EmailConfig struct {
	Enabled            bool           `mapstructure:"enabled"`
	VerificationExpiry time.Duration  `mapstructure:"verificationExpiry"`
	ResendCooldown     time.Duration  `mapstructure:"resendCooldown"`
	MaxAttempts        int            `mapstructure:"maxAttempts"`
	Templates          EmailTemplates `mapstructure:"templates"`
}

// EmailTemplates 邮件模板配置
type EmailTemplates struct {
	Verification  string `mapstructure:"verification"`
	PasswordReset string `mapstructure:"passwordReset"`
	Welcome       string `mapstructure:"welcome"`
	SecurityAlert string `mapstructure:"securityAlert"`
}

// SMSConfig 短信配置
type SMSConfig struct {
	Enabled            bool          `mapstructure:"enabled"`
	Provider           string        `mapstructure:"provider"`
	VerificationExpiry time.Duration `mapstructure:"verificationExpiry"`
	ResendCooldown     time.Duration `mapstructure:"resendCooldown"`
	MaxAttempts        int           `mapstructure:"maxAttempts"`
	CodeLength         int           `mapstructure:"codeLength"`
}

// OAuthConfig OAuth配置
type OAuthConfig struct {
	Google  OAuthProviderConfig `mapstructure:"google"`
	GitHub  OAuthProviderConfig `mapstructure:"github"`
	Discord OAuthProviderConfig `mapstructure:"discord"`
}

// OAuthProviderConfig OAuth提供商配置
type OAuthProviderConfig struct {
	Enabled      bool     `mapstructure:"enabled"`
	ClientID     string   `mapstructure:"clientId"`
	ClientSecret string   `mapstructure:"clientSecret"`
	RedirectURL  string   `mapstructure:"redirectUrl"`
	Scopes       []string `mapstructure:"scopes"`
}

// SecurityConfig 安全配置
type SecurityConfig struct {
	RateLimit   RateLimitConfig  `mapstructure:"rateLimit"`
	Encryption  EncryptionConfig `mapstructure:"encryption"`
	Audit       AuditConfig      `mapstructure:"audit"`
	IPWhitelist []string         `mapstructure:"ipWhitelist"`
	IPBlacklist []string         `mapstructure:"ipBlacklist"`
}

// RateLimitConfig 限流配置
type RateLimitConfig struct {
	Enabled         bool          `mapstructure:"enabled"`
	Requests        int           `mapstructure:"requests"`
	Window          time.Duration `mapstructure:"window"`
	Burst           int           `mapstructure:"burst"`
	CleanupInterval time.Duration `mapstructure:"cleanupInterval"`
	LoginAttempts   struct {
		MaxAttempts int           `mapstructure:"maxAttempts"`
		Window      time.Duration `mapstructure:"window"`
		LockoutTime time.Duration `mapstructure:"lockoutTime"`
	} `mapstructure:"loginAttempts"`
}

// EncryptionConfig 加密配置
type EncryptionConfig struct {
	Key       string `mapstructure:"key"`
	Algorithm string `mapstructure:"algorithm"`
}

// AuditConfig 审计配置
type AuditConfig struct {
	Enabled          bool          `mapstructure:"enabled"`
	RetentionPeriod  time.Duration `mapstructure:"retentionPeriod"`
	LogLevel         string        `mapstructure:"logLevel"`
	IncludeIP        bool          `mapstructure:"includeIP"`
	IncludeUserAgent bool          `mapstructure:"includeUserAgent"`
}

// LoggingConfig 日志配置
type LoggingConfig struct {
	Level      string `mapstructure:"level"`
	Format     string `mapstructure:"format"`
	Output     string `mapstructure:"output"`
	FilePath   string `mapstructure:"filePath"`
	MaxSize    int    `mapstructure:"maxSize"`
	MaxBackups int    `mapstructure:"maxBackups"`
	MaxAge     int    `mapstructure:"maxAge"`
	Compress   bool   `mapstructure:"compress"`
}

// MonitoringConfig 监控配置
type MonitoringConfig struct {
	Enabled   bool   `mapstructure:"enabled"`
	Port      int    `mapstructure:"port"`
	Path      string `mapstructure:"path"`
	Namespace string `mapstructure:"namespace"`
	Subsystem string `mapstructure:"subsystem"`
}

// ExternalConfig 外部服务配置
type ExternalConfig struct {
	UserService  ServiceConfig `mapstructure:"userService"`
	EmailService ServiceConfig `mapstructure:"emailService"`
	SMSService   ServiceConfig `mapstructure:"smsService"`
}

// ServiceConfig 服务配置
type ServiceConfig struct {
	URL     string        `mapstructure:"url"`
	Timeout time.Duration `mapstructure:"timeout"`
	Retries int           `mapstructure:"retries"`
	APIKey  string        `mapstructure:"apiKey"`
}

// CacheConfig 缓存配置
type CacheConfig struct {
	DefaultTTL      time.Duration `mapstructure:"defaultTTL"`
	CleanupInterval time.Duration `mapstructure:"cleanupInterval"`
	MaxSize         int64         `mapstructure:"maxSize"`
}

// DevelopmentConfig 开发配置
type DevelopmentConfig struct {
	Enabled      bool `mapstructure:"enabled"`
	DebugMode    bool `mapstructure:"debugMode"`
	MockExternal bool `mapstructure:"mockExternal"`
	SeedData     bool `mapstructure:"seedData"`
}

// LoadConfig 加载配置
func LoadConfig(configPath string) (*Config, error) {
	viper.SetConfigFile(configPath)
	viper.SetConfigType("yaml")

	// 设置环境变量前缀
	viper.SetEnvPrefix("AUTH")
	viper.AutomaticEnv()

	// 设置默认值
	setDefaults()

	// 读取配置文件
	if err := viper.ReadInConfig(); err != nil {
		return nil, fmt.Errorf("failed to read config file: %w", err)
	}

	// 解析配置
	var config Config
	if err := viper.Unmarshal(&config); err != nil {
		return nil, fmt.Errorf("failed to unmarshal config: %w", err)
	}

	// 验证配置
	if err := validateConfig(&config); err != nil {
		return nil, fmt.Errorf("config validation failed: %w", err)
	}

	return &config, nil
}

// setDefaults 设置默认值
func setDefaults() {
	// 服务器默认值
	viper.SetDefault("server.host", "0.0.0.0")
	viper.SetDefault("server.port", 8001)
	viper.SetDefault("server.mode", "release")
	viper.SetDefault("server.readTimeout", "30s")
	viper.SetDefault("server.writeTimeout", "30s")
	viper.SetDefault("server.idleTimeout", "120s")
	viper.SetDefault("server.shutdownTimeout", "30s")

	// TLS默认值
	viper.SetDefault("server.tls.enabled", false)

	// CORS默认值
	viper.SetDefault("server.cors.allowOrigins", []string{"*"})
	viper.SetDefault("server.cors.allowMethods", []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"})
	viper.SetDefault("server.cors.allowHeaders", []string{"*"})
	viper.SetDefault("server.cors.allowCredentials", true)
	viper.SetDefault("server.cors.maxAge", "12h")

	// 数据库默认值
	viper.SetDefault("database.host", "localhost")
	viper.SetDefault("database.port", 5432)
	viper.SetDefault("database.sslmode", "disable")
	viper.SetDefault("database.timezone", "UTC")
	viper.SetDefault("database.maxOpenConns", 25)
	viper.SetDefault("database.maxIdleConns", 5)
	viper.SetDefault("database.connMaxLifetime", "1h")
	viper.SetDefault("database.connMaxIdleTime", "30m")
	viper.SetDefault("database.migration.enabled", true)
	viper.SetDefault("database.migration.path", "./migrations")
	viper.SetDefault("database.migration.autoMigrate", false)

	// Redis默认值
	viper.SetDefault("redis.host", "localhost")
	viper.SetDefault("redis.port", 6379)
	viper.SetDefault("redis.db", 0)
	viper.SetDefault("redis.poolSize", 10)
	viper.SetDefault("redis.minIdleConns", 2)
	viper.SetDefault("redis.dialTimeout", "5s")
	viper.SetDefault("redis.readTimeout", "3s")
	viper.SetDefault("redis.writeTimeout", "3s")
	viper.SetDefault("redis.idleTimeout", "5m")

	// JWT默认值
	viper.SetDefault("jwt.accessTokenExpiry", "15m")
	viper.SetDefault("jwt.refreshTokenExpiry", "7d")
	viper.SetDefault("jwt.twoFactorTokenExpiry", "5m")
	viper.SetDefault("jwt.issuer", "pokemon-snowfall-guild")
	viper.SetDefault("jwt.audience", "pokemon-snowfall-guild")
	viper.SetDefault("jwt.algorithm", "HS256")

	// 密码默认值
	viper.SetDefault("password.minLength", 8)
	viper.SetDefault("password.maxLength", 128)
	viper.SetDefault("password.requireUpper", true)
	viper.SetDefault("password.requireLower", true)
	viper.SetDefault("password.requireNumber", true)
	viper.SetDefault("password.requireSpecial", true)
	viper.SetDefault("password.historyCount", 5)
	viper.SetDefault("password.bcryptCost", 12)

	// 会话默认值
	viper.SetDefault("session.maxSessions", 5)
	viper.SetDefault("session.inactivityTimeout", "30m")
	viper.SetDefault("session.absoluteTimeout", "24h")
	viper.SetDefault("session.rememberMeDuration", "30d")
	viper.SetDefault("session.cleanupInterval", "1h")

	// 双因素认证默认值
	viper.SetDefault("twoFactor.enabled", true)
	viper.SetDefault("twoFactor.issuer", "Pokemon Snowfall Guild")
	viper.SetDefault("twoFactor.codeLength", 6)
	viper.SetDefault("twoFactor.codeExpiry", "30s")
	viper.SetDefault("twoFactor.backupCodes", 10)
	viper.SetDefault("twoFactor.rateLimitTTL", "1m")
	viper.SetDefault("twoFactor.maxAttempts", 3)

	// 邮箱默认值
	viper.SetDefault("email.enabled", true)
	viper.SetDefault("email.verificationExpiry", "24h")
	viper.SetDefault("email.resendCooldown", "1m")
	viper.SetDefault("email.maxAttempts", 3)

	// 短信默认值
	viper.SetDefault("sms.enabled", false)
	viper.SetDefault("sms.provider", "twilio")
	viper.SetDefault("sms.verificationExpiry", "10m")
	viper.SetDefault("sms.resendCooldown", "1m")
	viper.SetDefault("sms.maxAttempts", 3)
	viper.SetDefault("sms.codeLength", 6)

	// OAuth默认值
	viper.SetDefault("oauth.google.enabled", false)
	viper.SetDefault("oauth.github.enabled", false)
	viper.SetDefault("oauth.discord.enabled", false)

	// 安全默认值
	viper.SetDefault("security.rateLimit.enabled", true)
	viper.SetDefault("security.rateLimit.requests", 100)
	viper.SetDefault("security.rateLimit.window", "1m")
	viper.SetDefault("security.rateLimit.burst", 10)
	viper.SetDefault("security.rateLimit.cleanupInterval", "5m")
	viper.SetDefault("security.rateLimit.loginAttempts.maxAttempts", 5)
	viper.SetDefault("security.rateLimit.loginAttempts.window", "15m")
	viper.SetDefault("security.rateLimit.loginAttempts.lockoutTime", "30m")
	viper.SetDefault("security.audit.enabled", true)
	viper.SetDefault("security.audit.retentionPeriod", "90d")
	viper.SetDefault("security.audit.logLevel", "info")
	viper.SetDefault("security.audit.includeIP", true)
	viper.SetDefault("security.audit.includeUserAgent", true)

	// 日志默认值
	viper.SetDefault("logging.level", "info")
	viper.SetDefault("logging.format", "json")
	viper.SetDefault("logging.output", "stdout")
	viper.SetDefault("logging.maxSize", 100)
	viper.SetDefault("logging.maxBackups", 3)
	viper.SetDefault("logging.maxAge", 28)
	viper.SetDefault("logging.compress", true)

	// 监控默认值
	viper.SetDefault("monitoring.enabled", true)
	viper.SetDefault("monitoring.port", 9001)
	viper.SetDefault("monitoring.path", "/metrics")
	viper.SetDefault("monitoring.namespace", "auth")
	viper.SetDefault("monitoring.subsystem", "service")

	// 外部服务默认值
	viper.SetDefault("external.userService.timeout", "30s")
	viper.SetDefault("external.userService.retries", 3)
	viper.SetDefault("external.emailService.timeout", "30s")
	viper.SetDefault("external.emailService.retries", 3)
	viper.SetDefault("external.smsService.timeout", "30s")
	viper.SetDefault("external.smsService.retries", 3)

	// 缓存默认值
	viper.SetDefault("cache.defaultTTL", "1h")
	viper.SetDefault("cache.cleanupInterval", "10m")
	viper.SetDefault("cache.maxSize", 1000)

	// 开发默认值
	viper.SetDefault("development.enabled", false)
	viper.SetDefault("development.debugMode", false)
	viper.SetDefault("development.mockExternal", false)
	viper.SetDefault("development.seedData", false)
}

// validateConfig 验证配置
func validateConfig(config *Config) error {
	// 验证必需的配置项
	if config.JWT.SecretKey == "" {
		return fmt.Errorf("JWT secret key is required")
	}

	if config.Database.Host == "" {
		return fmt.Errorf("database host is required")
	}

	if config.Database.User == "" {
		return fmt.Errorf("database user is required")
	}

	if config.Database.DBName == "" {
		return fmt.Errorf("database name is required")
	}

	// 验证端口范围
	if config.Server.Port < 1 || config.Server.Port > 65535 {
		return fmt.Errorf("server port must be between 1 and 65535")
	}

	if config.Database.Port < 1 || config.Database.Port > 65535 {
		return fmt.Errorf("database port must be between 1 and 65535")
	}

	if config.Redis.Port < 1 || config.Redis.Port > 65535 {
		return fmt.Errorf("redis port must be between 1 and 65535")
	}

	// 验证密码策略
	if config.Password.MinLength < 1 {
		return fmt.Errorf("password minimum length must be at least 1")
	}

	if config.Password.MaxLength < config.Password.MinLength {
		return fmt.Errorf("password maximum length must be greater than minimum length")
	}

	// 验证bcrypt成本
	if config.Password.BcryptCost < 4 || config.Password.BcryptCost > 31 {
		return fmt.Errorf("bcrypt cost must be between 4 and 31")
	}

	return nil
}

// GetDSN 获取数据库连接字符串
func (c *Config) GetDSN() string {
	return fmt.Sprintf("host=%s port=%d user=%s password=%s dbname=%s sslmode=%s TimeZone=%s",
		c.Database.Host,
		c.Database.Port,
		c.Database.User,
		c.Database.Password,
		c.Database.DBName,
		c.Database.SSLMode,
		c.Database.Timezone,
	)
}

// GetRedisAddr 获取Redis地址
func (c *Config) GetRedisAddr() string {
	return fmt.Sprintf("%s:%d", c.Redis.Host, c.Redis.Port)
}

// IsProduction 是否为生产环境
func (c *Config) IsProduction() bool {
	return c.Server.Mode == "release"
}

// IsDevelopment 是否为开发环境
func (c *Config) IsDevelopment() bool {
	return c.Development.Enabled
}
