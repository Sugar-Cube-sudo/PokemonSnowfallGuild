// 认证相关类型定义

// 用户角色枚举
export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  USER = 'user'
}

// 权限枚举
export enum Permission {
  // 用户管理权限
  USER_CREATE = 'user:create',
  USER_READ = 'user:read',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',
  
  // 会员管理权限
  MEMBER_CREATE = 'member:create',
  MEMBER_READ = 'member:read',
  MEMBER_UPDATE = 'member:update',
  MEMBER_DELETE = 'member:delete',
  
  // 系统管理权限
  SYSTEM_CONFIG = 'system:config',
  SYSTEM_LOGS = 'system:logs',
  SYSTEM_BACKUP = 'system:backup',
  
  // 数据统计权限
  STATS_VIEW = 'stats:view',
  STATS_EXPORT = 'stats:export'
}

// 用户组
export interface UserGroup {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  createdAt: Date;
  updatedAt: Date;
}

// 用户信息
export interface User {
  id: string;
  username: string;
  email?: string;
  role: UserRole;
  groups: UserGroup[];
  permissions: Permission[];
  isDefaultPassword: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  requirePasswordChange?: boolean;
}

// 登录请求
export interface LoginRequest {
  username: string;
  password: string;
  twoFactorCode?: string; // 二次验证码
}

// 登录响应
export interface LoginResponse {
  success: boolean;
  user?: User;
  token?: string;
  requirePasswordChange?: boolean;
  message?: string;
}

// 密码修改请求
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// 密码强度验证结果
export interface PasswordStrength {
  score: number; // 0-4
  feedback: string[];
  isValid: boolean;
}

// 认证状态
export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

// 创建用户请求
export interface CreateUserRequest {
  username: string;
  email?: string;
  role: UserRole;
  groupIds: string[];
  additionalPermissions?: Permission[];
  initialPassword?: string;
}

// 审核状态枚举
export enum ApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

// 审核请求
export interface ApprovalRequest {
  id: string;
  type: 'USER_UPDATE' | 'USER_DELETE' | 'PASSWORD_RESET' | 'member_update' | 'member_create' | 'member_delete';
  requesterId: string;
  requesterName: string;
  requesterRole: UserRole;
  targetUserId: string;
  targetUserName: string;
  changes: any;
  reason: string;
  status: ApprovalStatus;
  createdAt: Date;
  reviewedAt?: Date;
  reviewerId?: string;
  reviewerName?: string;
  reviewComment?: string;
  // 兼容旧字段
  requestedBy?: string;
  requestedAt?: Date;
  data?: any;
  originalData?: any;
  reviewedBy?: string;
}

// 用户管理请求
export interface UserManagementRequest {
  action: 'create' | 'update' | 'delete' | 'reset_password';
  targetUserId?: string;
  userData?: Partial<User>;
  newPassword?: string;
}

// 角色标识配置
export interface RoleBadge {
  role: UserRole;
  label: string;
  color: string;
  bgColor: string;
  icon: string;
}