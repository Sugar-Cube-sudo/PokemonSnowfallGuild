'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings, 
  Users, 
  Clock, 
  Shield, 
  Database, 
  Activity,
  X,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole, Permission } from '@/types/auth';
import { hasPermission } from '@/lib/auth';
import UserManagement from './UserManagement';
import ApprovalManagement from './ApprovalManagement';
import SecuritySettings from './SecuritySettings';
import SystemMonitoring from './SystemMonitoring';

interface SystemSettingsProps {
  onClose: () => void;
}

type SettingsView = 'main' | 'users' | 'approvals' | 'security' | 'system';

export default function SystemSettings({ onClose }: SystemSettingsProps) {
  const { state } = useAuth();
  const [currentView, setCurrentView] = useState<SettingsView>('main');

  // 检查权限
  const canManageUsers = hasPermission(state.user, Permission.USER_CREATE) || 
                        hasPermission(state.user, Permission.USER_UPDATE) || 
                        hasPermission(state.user, Permission.USER_DELETE);
  const canApproveRequests = state.user?.role === UserRole.SUPER_ADMIN;
  const canManageSecurity = state.user?.role === UserRole.SUPER_ADMIN;
  const canManageSystem = state.user?.role === UserRole.SUPER_ADMIN;

  // 设置菜单项
  const menuItems = [
    {
      id: 'users' as SettingsView,
      title: '用户管理',
      description: '管理系统用户、角色和权限',
      icon: Users,
      color: 'from-blue-500 to-purple-600',
      available: canManageUsers,
      stats: '12 个用户'
    },
    {
      id: 'approvals' as SettingsView,
      title: '审核管理',
      description: '处理管理员操作审核请求',
      icon: Clock,
      color: 'from-orange-500 to-red-600',
      available: canApproveRequests,
      stats: '3 个待审核'
    },
    {
      id: 'security' as SettingsView,
      title: '安全设置',
      description: '配置系统安全策略和访问控制',
      icon: Shield,
      color: 'from-green-500 to-teal-600',
      available: canManageSecurity,
      stats: '安全等级: 高'
    },
    {
      id: 'system' as SettingsView,
      title: '系统监控',
      description: '查看系统状态和性能指标',
      icon: Activity,
      color: 'from-purple-500 to-pink-600',
      available: canManageSystem,
      stats: '运行正常'
    }
  ];

  const availableItems = menuItems.filter(item => item.available);

  const handleMenuClick = (viewId: SettingsView) => {
    setCurrentView(viewId);
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'users':
        return <UserManagement onClose={() => setCurrentView('main')} />;
      case 'approvals':
        return <ApprovalManagement onClose={() => setCurrentView('main')} />;
      case 'security':
        return <SecuritySettings onClose={() => setCurrentView('main')} />;
      case 'system':
        return <SystemMonitoring onClose={() => setCurrentView('main')} />;
      default:
        return null;
    }
  };

  if (currentView !== 'main') {
    return (
      <AnimatePresence mode="wait">
        {renderCurrentView()}
      </AnimatePresence>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
      >
        {/* 头部 */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <Settings className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">系统设置</h2>
                <p className="text-gray-300 text-sm">管理系统配置和用户权限</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-300">当前用户</p>
                <p className="font-semibold">{state.user?.username}</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center hover:bg-white/30 transition-colors"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        </div>

        {/* 主要内容 */}
        <div className="p-6">
          {availableItems.length === 0 ? (
            <div className="text-center py-12">
              <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                权限不足
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                您没有访问系统设置的权限
              </p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  管理功能
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  选择要管理的功能模块
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {availableItems.map((item, index) => {
                  const IconComponent = item.icon;
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleMenuClick(item.id)}
                      className="group cursor-pointer bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 transition-all duration-300 shadow-sm hover:shadow-md"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className={`w-12 h-12 bg-gradient-to-br ${item.color} rounded-lg flex items-center justify-center text-white shadow-lg`}>
                          <IconComponent className="w-6 h-6" />
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
                      </div>
                      
                      <div className="mb-3">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                          {item.title}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded-full">
                          {item.stats}
                        </span>
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* 快速统计 */}
              <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  系统概览
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white mx-auto mb-2">
                      <Users className="w-4 h-4" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">12</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">总用户数</p>
                  </div>
                  <div className="text-center">
                    <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white mx-auto mb-2">
                      <Clock className="w-4 h-4" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">3</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">待审核</p>
                  </div>
                  <div className="text-center">
                    <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center text-white mx-auto mb-2">
                      <Shield className="w-4 h-4" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">高</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">安全等级</p>
                  </div>
                  <div className="text-center">
                    <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center text-white mx-auto mb-2">
                      <Activity className="w-4 h-4" />
                    </div>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">正常</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">系统状态</p>
                  </div>
                </div>
              </div>

              {/* 最近活动 */}
              <div className="mt-6">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  最近活动
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">用户 john_doe 申请角色升级</span>
                    <span className="text-xs text-gray-500 ml-auto">2分钟前</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">新用户 alice_smith 注册成功</span>
                    <span className="text-xs text-gray-500 ml-auto">15分钟前</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="w-2 h-2 bg-orange-500 rounded-full" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">管理员 admin_user 重置了用户密码</span>
                    <span className="text-xs text-gray-500 ml-auto">1小时前</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}