# Snow 项目部署指南

本文档详细介绍了如何使用自动化脚本和 Docker 部署 Snow 项目。

## 📋 目录

- [快速开始](#快速开始)
- [自动化脚本使用](#自动化脚本使用)
- [Docker 部署](#docker-部署)
- [环境配置](#环境配置)
- [监控和日志](#监控和日志)
- [故障排除](#故障排除)

## 🚀 快速开始

### 前置要求

- Node.js 18+ 
- npm 或 yarn
- Docker 和 Docker Compose (用于容器化部署)
- PowerShell (Windows) 或 Bash (Linux/macOS)

### 本地开发

```powershell
# 使用自动化脚本启动开发服务器
.\build.ps1 -Action dev

# 或者指定端口
.\build.ps1 -Action dev -Port 3001
```

## 🛠️ 自动化脚本使用

### 脚本功能

`build.ps1` 脚本提供以下功能：

| 操作 | 描述 | 示例 |
|------|------|------|
| `dev` | 启动开发服务器 | `.\build.ps1 -Action dev` |
| `build` | 构建生产版本 | `.\build.ps1 -Action build` |
| `docker` | 构建 Docker 镜像 | `.\build.ps1 -Action docker` |
| `deploy` | 构建并部署 Docker 容器 | `.\build.ps1 -Action deploy` |
| `clean` | 清理项目文件 | `.\build.ps1 -Action clean` |
| `help` | 显示帮助信息 | `.\build.ps1 -Action help` |

### 参数说明

- `-Environment`: 构建环境 (默认: production)
- `-Port`: 端口号 (默认: 3000)
- `-Verbose`: 显示详细输出

### 使用示例

```powershell
# 开发模式
.\build.ps1 -Action dev -Port 3001 -Verbose

# 生产构建
.\build.ps1 -Action build -Environment production

# Docker 部署
.\build.ps1 -Action deploy -Port 8080

# 清理项目
.\build.ps1 -Action clean
```

## 🐳 Docker 部署

### 单容器部署

```powershell
# 使用自动化脚本
.\build.ps1 -Action docker
.\build.ps1 -Action deploy

# 或手动执行
docker build -t snow-app .
docker run -d --name snow-app -p 3000:3000 snow-app
```

### 多服务部署 (推荐)

使用 Docker Compose 部署完整的应用栈：

```bash
# 复制环境变量文件
cp .env.docker .env

# 编辑环境变量
nano .env

# 启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f app
```

### 生产环境部署

```bash
# 启动生产环境 (包含 Nginx)
docker-compose --profile production up -d

# 启动监控服务
docker-compose --profile monitoring up -d

# 启动所有服务
docker-compose --profile production --profile monitoring up -d
```

## ⚙️ 环境配置

### 环境变量配置

1. 复制环境变量模板：
   ```bash
   cp .env.docker .env
   ```

2. 编辑 `.env` 文件，修改以下关键配置：

   ```env
   # 数据库密码 (必须修改)
   POSTGRES_PASSWORD=your-secure-password
   
   # JWT 密钥 (必须修改)
   JWT_SECRET=your-super-secret-jwt-key
   
   # 会话密钥 (必须修改)
   SESSION_SECRET=your-session-secret-key
   
   # 应用域名
   NEXT_PUBLIC_API_URL=https://yourdomain.com
   ```

### 数据库初始化

创建 `scripts/init-db.sql` 文件来初始化数据库：

```sql
-- 创建数据库表
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 插入默认管理员用户
INSERT INTO users (username, email, password_hash) 
VALUES ('admin', 'admin@example.com', '$2b$10$...')
ON CONFLICT (username) DO NOTHING;
```

## 📊 监控和日志

### 应用监控

启用监控服务后，可以访问：

- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3001 (admin/admin)

### 日志查看

```bash
# 查看应用日志
docker-compose logs -f app

# 查看数据库日志
docker-compose logs -f db

# 查看所有服务日志
docker-compose logs -f

# 查看最近 100 行日志
docker-compose logs --tail=100 app
```

### 健康检查

```bash
# 检查服务健康状态
docker-compose ps

# 手动健康检查
curl http://localhost:3000/api/health
```

## 🔧 故障排除

### 常见问题

#### 1. 端口冲突

```bash
# 检查端口占用
netstat -tulpn | grep :3000

# 修改端口
export PORT=3001
docker-compose up -d
```

#### 2. 数据库连接失败

```bash
# 检查数据库状态
docker-compose exec db pg_isready

# 重启数据库
docker-compose restart db

# 查看数据库日志
docker-compose logs db
```

#### 3. 内存不足

```bash
# 检查容器资源使用
docker stats

# 增加 Docker 内存限制
# 在 docker-compose.yml 中添加：
services:
  app:
    deploy:
      resources:
        limits:
          memory: 1G
```

#### 4. 构建失败

```bash
# 清理 Docker 缓存
docker system prune -a

# 重新构建
docker-compose build --no-cache
```

### 性能优化

#### 1. 数据库优化

```sql
-- 创建索引
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);
```

#### 2. Redis 缓存配置

创建 `config/redis.conf`：

```conf
# 内存策略
maxmemory 256mb
maxmemory-policy allkeys-lru

# 持久化
save 900 1
save 300 10
save 60 10000
```

#### 3. Nginx 配置

创建 `config/nginx.conf`：

```nginx
events {
    worker_connections 1024;
}

http {
    upstream app {
        server app:3000;
    }
    
    server {
        listen 80;
        
        location / {
            proxy_pass http://app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
    }
}
```

## 🔐 安全建议

1. **更改默认密码**: 修改所有默认密码
2. **使用 HTTPS**: 在生产环境中启用 SSL/TLS
3. **限制访问**: 配置防火墙规则
4. **定期备份**: 设置数据库自动备份
5. **监控日志**: 定期检查安全日志

## 📝 维护任务

### 定期备份

```bash
# 数据库备份
docker-compose exec db pg_dump -U postgres snow_db > backup.sql

# 恢复数据库
docker-compose exec -T db psql -U postgres snow_db < backup.sql
```

### 更新应用

```bash
# 拉取最新代码
git pull origin main

# 重新构建和部署
.\build.ps1 -Action deploy

# 或使用 Docker Compose
docker-compose build app
docker-compose up -d app
```

### 清理资源

```bash
# 清理未使用的镜像
docker image prune -a

# 清理未使用的卷
docker volume prune

# 完整清理
docker system prune -a --volumes
```

## 📞 支持

如果遇到问题，请：

1. 查看日志文件
2. 检查环境变量配置
3. 确认所有依赖服务正常运行
4. 参考本文档的故障排除部分

---

**注意**: 在生产环境中部署前，请确保已经修改了所有默认密码和密钥，并进行了充分的测试。