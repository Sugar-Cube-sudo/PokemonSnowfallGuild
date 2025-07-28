# Pokemon Snowfall Guild - Backend

这是Pokemon Snowfall Guild项目的后端微服务架构。

## 项目结构

```
backend/
├── gateway/                 # API网关 (Go)
│   ├── cmd/                # 主程序入口
│   ├── internal/           # 内部业务逻辑
│   ├── pkg/                # 可复用包
│   ├── configs/            # 配置文件
│   ├── api/                # API定义
│   └── go.mod              # Go模块文件
├── services/               # 微服务
│   ├── auth/               # 认证服务 (Go)
│   ├── user-service/       # 用户管理服务 (Python/FastAPI)
│   ├── forum/              # 论坛服务 (Go)
│   ├── message/            # 消息服务 (Go)
│   ├── report-service/     # 举报服务 (Python/FastAPI)
│   ├── pokemon-service/    # 宝可梦数据服务 (Go)
│   └── file-storage/       # 文件存储服务 (Go)
├── shared/                 # 共享代码和配置
│   ├── proto/              # Protocol Buffers定义
│   ├── config/             # 共享配置
│   ├── utils/              # 工具函数
│   ├── middleware/         # 中间件
│   └── types/              # 共享类型定义
├── deployments/            # 部署配置
├── scripts/                # 构建和部署脚本
└── docs/                   # 文档
```

## 技术栈

### Go服务
- **框架**: Gin Web Framework
- **数据库**: PostgreSQL (使用GORM)
- **缓存**: Redis
- **认证**: JWT
- **API文档**: Swagger
- **监控**: Prometheus + Grafana
- **日志**: Logrus
- **配置管理**: Viper

### Python服务
- **框架**: FastAPI
- **数据库**: PostgreSQL (使用SQLAlchemy)
- **缓存**: Redis
- **认证**: JWT
- **API文档**: 自动生成的OpenAPI
- **监控**: Prometheus
- **日志**: Structlog
- **配置管理**: Pydantic Settings

## 开发环境设置

### 前置要求
- Python 3.11+
- Go 1.21+
- uv (Python包管理器)
- PostgreSQL
- Redis

### 安装依赖

#### Go服务
```bash
# 进入各个Go服务目录
cd gateway
go mod tidy

cd ../services/auth
go mod tidy

# 其他Go服务类似...
```

#### Python服务
```bash
# 用户服务
cd services/user-service
uv sync

# 举报服务
cd ../report-service
uv sync
```

### 运行服务

#### 启动API网关
```bash
cd gateway
go run cmd/main.go
```

#### 启动Python服务
```bash
# 用户服务
cd services/user-service
uv run uvicorn app.main:app --reload --port 8001

# 举报服务
cd services/report-service
uv run uvicorn app.main:app --reload --port 8002
```

## 服务端口分配

- API Gateway: 8080
- Auth Service: 8081
- User Service: 8001
- Forum Service: 8082
- Message Service: 8083
- Report Service: 8002
- Pokemon Service: 8084
- File Storage Service: 8085

## API文档

各服务启动后，可以通过以下地址访问API文档：

- User Service: http://localhost:8001/docs
- Report Service: http://localhost:8002/docs
- 其他服务的Swagger文档将在实现后提供

## 数据库迁移

### Python服务 (使用Alembic)
```bash
cd services/user-service
uv run alembic upgrade head
```

### Go服务 (使用GORM AutoMigrate)
服务启动时会自动执行数据库迁移。

## 开发指南

1. **代码风格**
   - Go: 使用 `gofmt` 和 `golint`
   - Python: 使用 `black`, `isort`, `ruff`

2. **测试**
   - Go: 使用内置的 `testing` 包
   - Python: 使用 `pytest`

3. **日志**
   - 统一使用结构化日志
   - 包含请求ID用于链路追踪

4. **错误处理**
   - 统一的错误响应格式
   - 适当的HTTP状态码

## 部署

部署配置和脚本位于 `deployments/` 和 `scripts/` 目录中。

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 许可证

MIT License