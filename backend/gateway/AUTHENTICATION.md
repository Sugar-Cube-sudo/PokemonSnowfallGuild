# API网关认证集成说明

## 概述

本文档说明了API网关如何集成JWT认证服务，实现安全的用户认证和权限验证。

## 认证流程

### 1. JWT Token验证

网关使用共享的认证中间件来验证JWT token：

```go
// 在main.go中设置可选认证中间件
v1.Use(middleware.OptionalAuthMiddleware(cfg.JWT.Secret))
```

### 2. 用户上下文设置

认证中间件验证JWT token后，会将用户信息设置到Gin上下文中：

- `userId`: 用户ID (uuid.UUID)
- `username`: 用户名 (string)
- `role`: 用户角色 (types.UserRole)
- `permissions`: 用户权限列表 ([]types.Permission)
- `tokenType`: Token类型 (string)

### 3. 路由级别的认证和权限检查

在`gateway.go`中，网关会根据路由配置检查认证和权限：

```go
// 检查认证要求
if routeConfig.RequireAuth {
    if !g.isAuthenticated(c) {
        // 返回401未认证错误
        return
    }
}

// 检查权限要求
if len(routeConfig.Permissions) > 0 {
    if !g.hasPermissions(c, routeConfig.Permissions) {
        // 返回403权限不足错误
        return
    }
}
```

## 配置说明

### JWT配置

在`config.yaml`中配置JWT相关参数：

```yaml
jwt:
  secret: "snowfall-guild-jwt-secret-key-32-chars-minimum-for-security"
  accessTokenTTL: "24h"
  refreshTokenTTL: "168h"
  issuer: "snowfall-guild"
  audience: "snowfall-guild-users"
```

### 路由配置

为每个路由配置认证和权限要求：

```yaml
routes:
  # 需要认证的路由
  - path: "/api/v1/users/*"
    service: "user"
    requireAuth: true
  
  # 需要特定权限的路由
  - path: "/api/v1/reports/*"
    service: "report"
    requireAuth: true
    permissions:
      - "VIEW_REPORTS"
```

## 权限系统

### 角色定义

系统支持以下用户角色：

- `SUPER_ADMIN`: 超级管理员，拥有所有权限
- `ADMIN`: 管理员，拥有大部分管理权限
- `MODERATOR`: 版主，拥有内容管理权限
- `USER`: 普通用户，拥有基础权限

### 权限定义

系统定义了以下权限：

- `USER_READ`: 用户信息读取
- `USER_WRITE`: 用户信息写入
- `MEMBER_UPDATE`: 会员信息更新
- `VIEW_REPORTS`: 查看报表
- `MANAGE_REPORTS`: 管理报表
- `FORUM_READ`: 论坛读取
- `FORUM_WRITE`: 论坛写入
- `FORUM_MODERATE`: 论坛管理
- `MESSAGE_READ`: 消息读取
- `MESSAGE_WRITE`: 消息写入
- `SYSTEM_ADMIN`: 系统管理

### 角色权限映射

权限通过`types.RolePermissions`映射到角色：

```go
var RolePermissions = map[UserRole][]Permission{
    RoleSuperAdmin: {
        // 所有权限
    },
    RoleAdmin: {
        // 管理员权限
    },
    RoleModerator: {
        // 版主权限
    },
    RoleUser: {
        // 普通用户权限
    },
}
```

## 安全最佳实践

### 1. JWT Secret管理

- 使用至少32字符的强密钥
- 在生产环境中使用环境变量
- 定期轮换密钥

### 2. Token过期时间

- Access Token: 24小时
- Refresh Token: 7天
- 根据安全需求调整

### 3. 权限最小化原则

- 只授予必要的权限
- 定期审查用户权限
- 使用角色而非直接权限分配

### 4. 错误处理

网关会返回标准的API错误响应：

```json
{
  "success": false,
  "error": {
    "type": "https://api.snowfall-guild.com/errors/unauthorized",
    "title": "认证失败",
    "status": 401,
    "detail": "无效的认证令牌",
    "instance": "/api/v1/users/profile",
    "code": "INVALID_TOKEN"
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "requestId": "req-123456"
}
```

## 使用示例

### 1. 获取认证Token

```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "user@example.com",
    "password": "password123"
  }'
```

### 2. 使用Token访问受保护资源

```bash
curl -X GET http://localhost:8080/api/v1/users/profile \
  -H "Authorization: Bearer <your-jwt-token>"
```

### 3. 访问需要特定权限的资源

```bash
curl -X GET http://localhost:8080/api/v1/reports/summary \
  -H "Authorization: Bearer <admin-jwt-token>"
```

## 故障排除

### 常见错误

1. **401 Unauthorized**: Token无效或过期
2. **403 Forbidden**: 权限不足
3. **400 Bad Request**: Token格式错误

### 调试建议

1. 检查JWT secret配置
2. 验证Token格式和内容
3. 确认用户权限设置
4. 查看网关日志

## 总结

通过集成共享的认证中间件，API网关现在能够：

1. 验证JWT token的有效性
2. 提取用户信息和权限
3. 根据路由配置进行认证和权限检查
4. 提供统一的错误响应格式
5. 支持灵活的权限控制

这确保了整个系统的安全性，同时提供了良好的用户体验。