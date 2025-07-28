import { User, Permission, PasswordStrength, UserRole, RegisterRequest } from '@/types/auth';
import { initializeUserProfile } from './userProfile';

// 重新导出Permission枚举以便其他模块使用
export { Permission } from '@/types/auth';

// 默认管理员账号
export const DEFAULT_ADMIN = {
  username: 'admin',
  password: 'admin123',
  email: 'admin@snowfall-guild.com'
};

// 生成唯一ID
function generateUniqueId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// 检查唯一ID是否已存在
function isUniqueIdTaken(uniqueId: string): boolean {
  return users.some(user => user.uniqueId === uniqueId);
}

// 生成不重复的唯一ID
function generateUniqueUserId(): string {
  let uniqueId;
  do {
    uniqueId = generateUniqueId();
  } while (isUniqueIdTaken(uniqueId));
  return uniqueId;
}

// 超级管理员二次验证码
export const SUPER_ADMIN_2FA_CODE = 'oscar4471';

// 二次验证失败跟踪
interface TwoFactorAttempt {
  username: string;
  failedAttempts: number;
  lastFailedAt: Date;
  blockedUntil?: Date;
}

let twoFactorAttempts: TwoFactorAttempt[] = [];

// 检查用户是否被禁止登录
export function isUserBlocked(username: string): { blocked: boolean; blockedUntil?: Date } {
  const attempt = twoFactorAttempts.find(a => a.username === username);
  if (!attempt || !attempt.blockedUntil) {
    return { blocked: false };
  }
  
  const now = new Date();
  if (now < attempt.blockedUntil) {
    return { blocked: true, blockedUntil: attempt.blockedUntil };
  }
  
  // 解除封禁
  attempt.blockedUntil = undefined;
  attempt.failedAttempts = 0;
  return { blocked: false };
}

// 记录二次验证失败
export function recordTwoFactorFailure(username: string): { failedAttempts: number; blocked: boolean; blockedUntil?: Date } {
  let attempt = twoFactorAttempts.find(a => a.username === username);
  
  if (!attempt) {
    attempt = {
      username,
      failedAttempts: 0,
      lastFailedAt: new Date()
    };
    twoFactorAttempts.push(attempt);
  }
  
  attempt.failedAttempts++;
  attempt.lastFailedAt = new Date();
  
  // 5次失败后禁止24小时
  if (attempt.failedAttempts >= 5) {
    attempt.blockedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24小时后
    return {
      failedAttempts: attempt.failedAttempts,
      blocked: true,
      blockedUntil: attempt.blockedUntil
    };
  }
  
  return {
    failedAttempts: attempt.failedAttempts,
    blocked: false
  };
}

// 重置二次验证失败次数
export function resetTwoFactorFailures(username: string): void {
  const attemptIndex = twoFactorAttempts.findIndex(a => a.username === username);
  if (attemptIndex !== -1) {
    twoFactorAttempts.splice(attemptIndex, 1);
  }
}

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
    Permission.SYSTEM_LOGS,
    Permission.VIEW_REPORTS,
    Permission.MANAGE_REPORTS,
    Permission.CREATE_REPORTS,
    Permission.EDIT_REPORTS,
    Permission.DELETE_REPORTS,
    Permission.EXPORT_REPORTS
  ],
  [UserRole.MODERATOR]: [
    Permission.USER_READ,
    Permission.MEMBER_READ,
    Permission.MEMBER_UPDATE,
    Permission.STATS_VIEW,
    Permission.VIEW_REPORTS,
    Permission.EDIT_REPORTS,
    Permission.EXPORT_REPORTS
  ],
  [UserRole.USER]: [
    Permission.MEMBER_READ,
    Permission.STATS_VIEW,
    Permission.VIEW_REPORTS
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
    gameNickname: 'admin',
    uniqueId: 'ADMIN1',
    email: 'admin@snowfall-guild.com',
    role: UserRole.SUPER_ADMIN,
    groups: [],
    permissions: Object.values(Permission),
    isDefaultPassword: true,
    requirePasswordChange: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    profile: {
      onlineTime: 0,
      joinedAt: new Date()
    },
    stats: {
      followersCount: 0,
      followingCount: 0,
      likesReceived: 0,
      postsCount: 0,
      repliesCount: 0,
      lastActiveAt: new Date()
    },
    privacySettings: {
      showProfile: true,
      showStats: true,
      showOnlineTime: true,
      showPokemonShowcase: true,
      showTeamShowcase: true,
      showActivity: true,
      allowFollow: true
    },
    pokemonShowcase: {
      id: 'showcase_1',
      title: '管理员的宝可梦展柜',
      description: '系统管理员的宝可梦收藏',
      pokemons: [],
      isPublic: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  },
  {
    id: 'user1',
    username: 'ash',
    gameNickname: '小智',
    uniqueId: 'ASH001',
    email: 'ash@pokemon.com',
    role: UserRole.USER,
    groups: [],
    permissions: [],
    isDefaultPassword: false,
    lastLoginAt: new Date('2024-01-15'),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15'),
    createdBy: 'system',
    requirePasswordChange: false,
    avatarUrl: '/avatars/ash.png',
    profile: {
      onlineTime: 1440,
      joinedAt: new Date('2024-01-01')
    },
    stats: {
      followersCount: 150,
      followingCount: 80,
      likesReceived: 320,
      postsCount: 45,
      repliesCount: 128,
      lastActiveAt: new Date('2024-01-15')
    },
    privacySettings: {
      showProfile: true,
      showStats: true,
      showOnlineTime: true,
      showPokemonShowcase: true,
      showTeamShowcase: true,
      showActivity: true,
      allowFollow: true
    },
    pokemonShowcase: {
      id: 'showcase_user1',
      title: '小智的宝可梦展柜',
      description: '我和我的宝可梦伙伴们的冒险记录',
      pokemons: [],
      isPublic: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-15')
    }
  },
  {
    id: 'user2',
    username: 'misty',
    gameNickname: '小霞',
    uniqueId: 'MISTY02',
    email: 'misty@pokemon.com',
    role: UserRole.USER,
    groups: [],
    permissions: [],
    isDefaultPassword: false,
    lastLoginAt: new Date('2024-01-14'),
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-14'),
    createdBy: 'system',
    requirePasswordChange: false,
    avatarUrl: '/avatars/misty.png',
    profile: {
      onlineTime: 960,
      joinedAt: new Date('2024-01-02')
    },
    stats: {
      followersCount: 120,
      followingCount: 95,
      likesReceived: 280,
      postsCount: 38,
      repliesCount: 92,
      lastActiveAt: new Date('2024-01-14')
    },
    privacySettings: {
      showProfile: true,
      showStats: true,
      showOnlineTime: false,
      showPokemonShowcase: true,
      showTeamShowcase: true,
      showActivity: true,
      allowFollow: true
    },
    pokemonShowcase: {
      id: 'showcase_user2',
      title: '小霞的水系宝可梦',
      description: '水系宝可梦是最棒的！',
      pokemons: [],
      isPublic: true,
      createdAt: new Date('2024-01-02'),
      updatedAt: new Date('2024-01-14')
    }
  },
  {
    id: 'user3',
    username: 'brock',
    gameNickname: '小刚',
    uniqueId: 'BROCK03',
    email: 'brock@pokemon.com',
    role: UserRole.USER,
    groups: [],
    permissions: [],
    isDefaultPassword: false,
    lastLoginAt: new Date('2024-01-13'),
    createdAt: new Date('2024-01-03'),
    updatedAt: new Date('2024-01-13'),
    createdBy: 'system',
    requirePasswordChange: false,
    avatarUrl: '/avatars/brock.png',
    profile: {
      onlineTime: 720,
      joinedAt: new Date('2024-01-03')
    },
    stats: {
      followersCount: 200,
      followingCount: 60,
      likesReceived: 450,
      postsCount: 52,
      repliesCount: 156,
      lastActiveAt: new Date('2024-01-13')
    },
    privacySettings: {
      showProfile: true,
      showStats: false,
      showOnlineTime: true,
      showPokemonShowcase: false,
      showTeamShowcase: false,
      showActivity: true,
      allowFollow: true
    },
    pokemonShowcase: {
      id: 'showcase_user3',
      title: '小刚的岩石宝可梦',
      description: '坚硬如岩石的意志！',
      pokemons: [],
      isPublic: false,
      createdAt: new Date('2024-01-03'),
      updatedAt: new Date('2024-01-13')
    }
  },
  {
    id: 'test',
    username: 'testuser',
    gameNickname: '测试用户',
    uniqueId: 'TEST001',
    email: 'test@snowfall-guild.com',
    role: UserRole.USER,
    groups: [],
    permissions: [],
    isDefaultPassword: false,
    lastLoginAt: new Date(),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date(),
    createdBy: 'system',
    requirePasswordChange: false,
    avatarUrl: '/avatars/test.png',
    profile: {
      onlineTime: 2880, // 48小时
      joinedAt: new Date('2024-01-01')
    },
    stats: {
      followersCount: 88,
      followingCount: 42,
      likesReceived: 156,
      postsCount: 23,
      repliesCount: 67,
      lastActiveAt: new Date()
    },
    privacySettings: {
      showProfile: true,
      showStats: true,
      showOnlineTime: true,
      showPokemonShowcase: true,
      showTeamShowcase: true,
      showActivity: true,
      allowFollow: true
    },
    pokemonShowcase: {
      id: 'showcase_test',
      title: '测试用户的宝可梦展柜',
      description: '这是一个测试用户的宝可梦收藏展示',
      pokemons: [],
      isPublic: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date()
    }
  }
];

// 模拟登录验证
export async function authenticateUser(username: string, password: string, twoFactorCode?: string): Promise<User | null> {
  // 模拟异步操作
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // 检查用户是否被禁止登录（仅针对超级管理员验证失败）
  if (twoFactorCode) {
    const blockStatus = isUserBlocked(username);
    if (blockStatus.blocked) {
      throw new Error(`账户已被锁定，请在 ${blockStatus.blockedUntil?.toLocaleString()} 后重试`);
    }
  }
  
  // 如果提供了验证密钥，检查是否为超级管理员
  if (twoFactorCode) {
    if (twoFactorCode === SUPER_ADMIN_2FA_CODE && username === 'admin' && password === DEFAULT_ADMIN.password) {
      // 超级管理员验证成功，重置失败次数
      resetTwoFactorFailures(username);
      const superAdmin = users.find(u => u.role === UserRole.SUPER_ADMIN);
      return superAdmin || null;
    } else {
      // 验证密钥错误
      const failureResult = recordTwoFactorFailure(username);
      if (failureResult.blocked) {
        throw new Error(`验证密钥错误次数过多，账户已被锁定24小时。如果您不是超级管理员，请留空验证密钥字段尝试普通登录。`);
      } else {
        throw new Error(`验证密钥错误，还剩 ${5 - failureResult.failedAttempts} 次机会。如果您不是超级管理员，请留空此字段。`);
      }
    }
  }
  
  // 普通用户登录（验证密钥为空）
  const user = users.find(u => (u.username === username || u.gameNickname === username) && u.role !== UserRole.SUPER_ADMIN);

  if (!user) {
    // 检查是否尝试用超级管理员账号但未提供验证密钥
    if (username === 'admin') {
      throw new Error('超级管理员登录需要填写验证密钥，如果您不是超级管理员，请使用其他账号登录。');
    }
    return null;
  }
  
  // 简单密码验证（实际项目中应该使用哈希验证）
  if (user.isDefaultPassword && password === DEFAULT_ADMIN.password) {
    return user;
  }

  // 验证注册用户的密码（从localStorage获取）
  try {
    const userPasswords = JSON.parse(localStorage.getItem('userPasswords') || '{}');
    // 尝试用username或gameNickname验证密码
    if ((userPasswords[username] && userPasswords[username] === password) || 
        (user.gameNickname && userPasswords[user.gameNickname] && userPasswords[user.gameNickname] === password)) {
      return user;
    }
  } catch (error) {
    console.error('Failed to load user passwords:', error);
  }

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
    requirePasswordChange: false,
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

// 用户注册功能
export async function registerUser(registerData: RegisterRequest): Promise<{ success: boolean; user?: User; message?: string }> {
  const { gameNickname, password, confirmPassword, avatar } = registerData;

  // 验证密码确认
  if (password !== confirmPassword) {
    return {
      success: false,
      message: '两次输入的密码不一致'
    };
  }

  // 验证密码强度
  const passwordStrength = validatePasswordStrength(password);
  if (!passwordStrength.isValid) {
    return {
      success: false,
      message: `密码强度不足：${passwordStrength.feedback.join('、')}`
    };
  }

  // 检查游戏昵称是否已存在
  const existingUser = users.find(u => u.gameNickname?.toLowerCase() === gameNickname.toLowerCase() || u.username.toLowerCase() === gameNickname.toLowerCase());
  if (existingUser) {
    return {
      success: false,
      message: '游戏昵称已存在，请选择其他昵称'
    };
  }

  // 处理头像上传（模拟）
  let avatarUrl: string | undefined;
  if (avatar) {
    // 在实际应用中，这里应该上传到服务器或云存储
    // 现在我们模拟生成一个本地URL
    avatarUrl = URL.createObjectURL(avatar);
    
    // 保存头像到localStorage（实际应用中应该上传到服务器）
    const reader = new FileReader();
    reader.onload = () => {
      const avatars = JSON.parse(localStorage.getItem('avatars') || '{}');
      avatars[gameNickname] = reader.result;
      localStorage.setItem('avatars', JSON.stringify(avatars));
    };
    reader.readAsDataURL(avatar);
  }

  // 创建新用户
  const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const registeredUser: User = {
    id: userId,
    username: gameNickname, // 使用游戏昵称作为用户名
    gameNickname,
    uniqueId: generateUniqueUserId(), // 生成唯一ID
    role: UserRole.USER, // 注册用户默认为普通用户
    groups: [],
    permissions: getRolePermissions(UserRole.USER),
    isDefaultPassword: false,
    requirePasswordChange: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    avatarUrl,
    profile: {
      onlineTime: 0,
      joinedAt: new Date()
    },
    stats: {
      followersCount: 0,
      followingCount: 0,
      likesReceived: 0,
      postsCount: 0,
      repliesCount: 0,
      lastActiveAt: new Date()
    },
    privacySettings: {
      showProfile: true,
      showStats: true,
      showOnlineTime: true,
      showPokemonShowcase: true,
      showTeamShowcase: true,
      showActivity: true,
      allowFollow: true
    },
    pokemonShowcase: {
      id: `showcase_${userId}`,
      title: `${gameNickname}的宝可梦展柜`,
      description: '这里展示我最珍贵的宝可梦伙伴们',
      pokemons: [],
      isPublic: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  };

  // 存储密码到localStorage（实际应用中应该加密存储到服务器）
  try {
    const userPasswords = JSON.parse(localStorage.getItem('userPasswords') || '{}');
    userPasswords[gameNickname] = password;
    localStorage.setItem('userPasswords', JSON.stringify(userPasswords));
  } catch (error) {
    console.error('Failed to save user password:', error);
  }

  // 添加用户到用户列表
  users.push(registeredUser);

  // 初始化用户资料到userProfile系统
  await initializeUserProfile(userId, gameNickname);

  return {
    success: true,
    user: registeredUser,
    message: '注册成功'
  };
}