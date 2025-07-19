'use client';

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { AuthState, User, LoginRequest, ChangePasswordRequest, CreateUserRequest } from '@/types/auth';
import { authenticateUser, updateUserPassword, createUser, getAllUsers, deleteUser, resetUserPassword, updateUser } from '@/lib/auth';

// 认证动作类型
type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_USER'; payload: User }
  | { type: 'CLEAR_ERROR' };

// 初始状态
const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  token: null,
  loading: false,
  error: null
};

// 认证reducer
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN_START':
      return {
        ...state,
        loading: true,
        error: null
      };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        loading: false,
        error: null
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
        loading: false,
        error: action.payload
      };
    case 'LOGOUT':
      return {
        ...initialState
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };
    default:
      return state;
  }
}

// 认证上下文类型
interface AuthContextType {
  state: AuthState;
  login: (credentials: LoginRequest) => Promise<{ success: boolean; requirePasswordChange?: boolean; message?: string; needTwoFactor?: boolean }>;
  logout: () => void;
  changePassword: (data: ChangePasswordRequest) => Promise<{ success: boolean; message?: string }>;
  clearError: () => void;
  // 用户管理功能
  createUser: (userData: CreateUserRequest) => Promise<{ success: boolean; user?: User; message?: string }>;
  getAllUsers: () => Promise<{ success: boolean; users?: User[]; message?: string }>;
  deleteUser: (userId: string) => Promise<{ success: boolean; message?: string }>;
  resetUserPassword: (userId: string, newPassword: string) => Promise<{ success: boolean; message?: string }>;
  updateUser: (userId: string, userData: Partial<User>) => Promise<{ success: boolean; user?: User; message?: string }>;
}

// 创建上下文
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 认证提供者组件
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // 从localStorage恢复认证状态
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const userStr = localStorage.getItem('auth_user');
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        dispatch({ type: 'LOGIN_SUCCESS', payload: { user, token } });
      } catch (error) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      }
    }
  }, []);

  // 登录函数
  const login = async (credentials: LoginRequest) => {
    dispatch({ type: 'LOGIN_START' });
    
    try {
      const user = await authenticateUser(credentials.username, credentials.password, credentials.twoFactorCode);
      
      if (user) {
        const token = `token_${Date.now()}_${Math.random()}`; // 模拟token生成
        
        // 保存到localStorage
        localStorage.setItem('auth_token', token);
        localStorage.setItem('auth_user', JSON.stringify(user));
        
        dispatch({ type: 'LOGIN_SUCCESS', payload: { user, token } });
        
        return {
          success: true,
          requirePasswordChange: user.isDefaultPassword,
          message: user.isDefaultPassword ? '请修改默认密码' : '登录成功'
        };
      } else {
        dispatch({ type: 'LOGIN_FAILURE', payload: '用户名或密码错误' });
        return {
          success: false,
          message: '用户名或密码错误'
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '登录失败，请稍后重试';
      
      dispatch({ type: 'LOGIN_FAILURE', payload: errorMessage });
      return {
        success: false,
        message: errorMessage
      };
    }
  };

  // 登出函数
  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    dispatch({ type: 'LOGOUT' });
  };

  // 修改密码函数
  const changePassword = async (data: ChangePasswordRequest) => {
    if (!state.user) {
      return { success: false, message: '用户未登录' };
    }

    if (data.newPassword !== data.confirmPassword) {
      return { success: false, message: '两次输入的密码不一致' };
    }

    try {
      const success = await updateUserPassword(state.user.id, data.newPassword);
      
      if (success) {
        const updatedUser = {
          ...state.user,
          isDefaultPassword: false,
          updatedAt: new Date()
        };
        
        localStorage.setItem('auth_user', JSON.stringify(updatedUser));
        dispatch({ type: 'UPDATE_USER', payload: updatedUser });
        
        return { success: true, message: '密码修改成功' };
      } else {
        return { success: false, message: '密码修改失败' };
      }
    } catch (error) {
      return { success: false, message: '密码修改失败，请稍后重试' };
    }
  };

  // 清除错误
  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  // 创建用户
  const createUserFunc = async (userData: CreateUserRequest) => {
    try {
      const newUser = await createUser({
        ...userData,
        groups: [],
        permissions: [],
        isDefaultPassword: true,
        requirePasswordChange: true,
        createdBy: state.user?.id
      });
      
      return {
        success: true,
        user: newUser,
        message: '用户创建成功'
      };
    } catch (error) {
      return {
        success: false,
        message: '用户创建失败'
      };
    }
  };

  // 获取所有用户
  const getAllUsersFunc = async () => {
    try {
      const users = await getAllUsers();
      return {
        success: true,
        users,
        message: '获取用户列表成功'
      };
    } catch (error) {
      return {
        success: false,
        message: '获取用户列表失败'
      };
    }
  };

  // 删除用户
  const deleteUserFunc = async (userId: string) => {
    try {
      const success = await deleteUser(userId);
      return {
        success,
        message: success ? '用户删除成功' : '用户删除失败'
      };
    } catch (error) {
      return {
        success: false,
        message: '用户删除失败'
      };
    }
  };

  // 重置用户密码
  const resetUserPasswordFunc = async (userId: string, newPassword: string) => {
    try {
      const success = await resetUserPassword(userId, newPassword);
      return {
        success,
        message: success ? '密码重置成功' : '密码重置失败'
      };
    } catch (error) {
      return {
        success: false,
        message: '密码重置失败'
      };
    }
  };

  // 更新用户
  const updateUserFunc = async (userId: string, userData: Partial<User>) => {
    try {
      const updatedUser = await updateUser(userId, userData);
      return {
        success: !!updatedUser,
        user: updatedUser || undefined,
        message: updatedUser ? '用户更新成功' : '用户更新失败'
      };
    } catch (error) {
      return {
        success: false,
        message: '用户更新失败'
      };
    }
  };

  const value: AuthContextType = {
    state,
    login,
    logout,
    changePassword,
    clearError,
    createUser: createUserFunc,
    getAllUsers: getAllUsersFunc,
    deleteUser: deleteUserFunc,
    resetUserPassword: resetUserPasswordFunc,
    updateUser: updateUserFunc
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// 使用认证上下文的Hook
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}