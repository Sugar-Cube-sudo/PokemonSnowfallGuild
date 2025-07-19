import { User, Permission, PasswordStrength, UserRole } from '@/types/auth';

// 默认管理员账号
export const DEFAULT_ADMIN = {
  username: 'admin',
  password: 'admin123',
  email: 'admin@snowfall-guild.com'
};

// 超级管理员二次验证码
export const SUPER_ADMIN_2FA_CODE = 'oscar4471';

// 角色标识配置
export const ROLE_BADGES: Record<UserRole, { label: string; color: string; bgColor: string; icon: string }> = {
  [UserRole.SUPER_ADMIN]: {
    label: '超级管理员',
    color: 'text-purple-700',
    bgColor: 'bg-purple-100',
    icon: '👑'
  },
  [UserRole.ADMIN]: {
    label: '管理员',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    icon: '🛡️'
  },
  [UserRole.MODERATOR]: {
    label: '版主',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    icon: '⚡'
  },
  [UserRole.USER]: {
    label: '普通用户',
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
    icon: '👤'
  }
};

// 密码强度验证
export function validatePasswordStrength(password: string): PasswordStrength {
  const requirements = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumbers: /\d/.test(password),
    hasSpecialChars: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
  };

  const metRequirements = Object.values(requirements).filter(Boolean).length;
  const score = Math.min(metRequirements, 4);
  const isStrong = score >= 4 && requirements.minLength;

  const feedback: string[] = [];
  if (!requirements.minLength) feedback.push('密码长度至少8位');
  if (!requirements.hasUppercase) feedback.push('包含至少一个大写字母');
  if (!requirements.hasLowercase) feedback.push('包含至少一个小写字母');
  if (!requirements.hasNumbers) feedback.push('包含至少一个数字');
  if (!requirements.hasSpecialChars) feedback.push('包含至少一个特殊字符');

  return {
    score,
    feedback,
    isValid: isStrong
  };
}

// 权限检查
export function hasPermission(user: User | null, permission: Permission): boolean {
  if (!user) return false;
  
  // 超级管理员拥有所有权限
  if (user.role === UserRole.SUPER_ADMIN) return true;
  
  // 检查用户直接权限
  if (user.permissions.includes(permission)) return true;
  
  // 检查用户组权限
  return user.groups.some(group => group.permissions.includes(permission));
}

// 检查多个权限（需要全部满足）
export function hasAllPermissions(user: User | null, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(user, permission));
}

// 检查多个权限（满足任一即可）
export function hasAnyPermission(user: User | null, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(user, permission));
}

// 角色权限映射
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.SUPER_ADMIN]: Object.values(Permission),
  [UserRole.ADMIN]: [
    Permission.USER_CREATE,
    Permission.USER_READ,
    Permission.USER_UPDATE,
    Permission.MEMBER_CREATE,
    Permission.MEMBER_READ,
    Permission.MEMBER_UPDATE,
    Permission.MEMBER_DELETE,
    Permission.STATS_VIEW,
    Permission.STATS_EXPORT,
    Permission.SYSTEM_LOGS
  ],
  [UserRole.MODERATOR]: [
    Permission.USER_READ,
    Permission.MEMBER_READ,
    Permission.MEMBER_UPDATE,
    Permission.STATS_VIEW
  ],
  [UserRole.USER]: [
    Permission.MEMBER_READ,
    Permission.STATS_VIEW
  ]
};

// 获取角色默认权限
export function getRolePermissions(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

// 模拟用户数据存储（实际项目中应该使用数据库）
let users: User[] = [
  {
    id: '1',
    username: 'admin',
    email: 'admin@snowfall-guild.com',
    role: UserRole.SUPER_ADMIN,
    groups: [],
    permissions: Object.values(Permission),
    isDefaultPassword: true,
    requirePasswordChange: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// 模拟登录验证
export async function authenticateUser(username: string, password: string, twoFactorCode?: string): Promise<User | null> {
  // 模拟异步操作
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const user = users.find(u => u.username === username);
  if (!user) return null;
  
  // 简单密码验证（实际项目中应该使用哈希验证）
  if (user.isDefaultPassword && password === DEFAULT_ADMIN.password) {
    // 超级管理员需要二次验证
    if (user.role === UserRole.SUPER_ADMIN) {
      if (!twoFactorCode || twoFactorCode !== SUPER_ADMIN_2FA_CODE) {
        return null;
      }
    }
    return user;
  }
  
  // 这里应该验证哈希密码
  return null;
}

// 更新用户密码
export async function updateUserPassword(userId: string, newPassword: string): Promise<boolean> {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const userIndex = users.findIndex(u => u.id === userId);
  if (userIndex === -1) return false;
  
  users[userIndex] = {
    ...users[userIndex],
    isDefaultPassword: false,
    updatedAt: new Date()
  };
  
  return true;
}

// 创建新用户
export async function createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const newUser: User = {
    ...userData,
    id: Date.now().toString(),
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  users.push(newUser);
  return newUser;
}

// 获取所有用户
export async function getAllUsers(): Promise<User[]> {
  await new Promise(resolve => setTimeout(resolve, 200));
  return [...users];
}

// 删除用户
export async function deleteUser(userId: string): Promise<boolean> {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const userIndex = users.findIndex(u => u.id === userId);
  if (userIndex === -1) return false;
  
  users.splice(userIndex, 1);
  return true;
}

// 重置用户密码
export async function resetUserPassword(userId: string, newPassword: string): Promise<boolean> {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const userIndex = users.findIndex(u => u.id === userId);
  if (userIndex === -1) return false;
  
  users[userIndex] = {
    ...users[userIndex],
    isDefaultPassword: true,
    requirePasswordChange: true,
    updatedAt: new Date()
  };
  
  return true;
}

// 更新用户信息
export async function updateUser(userId: string, userData: Partial<User>): Promise<User | null> {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const userIndex = users.findIndex(u => u.id === userId);
  if (userIndex === -1) return null;
  
  users[userIndex] = {
    ...users[userIndex],
    ...userData,
    updatedAt: new Date()
  };
  
  return users[userIndex];
}