'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, User, Settings, Mail } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole, Permission } from '@/types/auth';
import { hasPermission } from '@/lib/auth';
import ModuleRenderer from '@/components/ModuleRenderer';
import RoleBadge from '@/components/RoleBadge';
import SystemSettings from '@/components/admin/SystemSettings';
import { MessageManagement, NotificationBadge } from '@/components/messages';
// 导入模块以触发注册
import '@/components/modules';

export default function Home() {
  const { state, logout } = useAuth();
  const [showSettings, setShowSettings] = useState(false);
  const [showMessages, setShowMessages] = useState(false);

  const handleLogout = () => {
    logout();
  };

  // 检查是否有系统设置权限
  const canAccessSettings = hasPermission(state.user, Permission.USER_CREATE) || 
                           hasPermission(state.user, Permission.USER_UPDATE) || 
                           hasPermission(state.user, Permission.USER_DELETE) ||
                           state.user?.role === UserRole.SUPER_ADMIN;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900">
      {/* 页面头部 */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-b border-gray-200/20 dark:border-gray-700/20 shadow-lg"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                落雪公会管理系统
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Pokemon Snowfall Guild Management System
              </p>
            </div>
            
            {/* 用户信息和操作 */}
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="flex items-center space-x-3 text-sm text-gray-700 dark:text-gray-300">
                  <User className="w-4 h-4" />
                  <span>欢迎，{state.user?.username}</span>
                  {state.user?.role && (
                    <RoleBadge role={state.user.role} size="sm" />
                  )}
                </div>
                <div className="flex items-center justify-end gap-2 mt-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    在线状态
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {/* 消息通知 */}
                <NotificationBadge
                  onClick={() => setShowMessages(true)}
                  className="relative"
                />
                
                {canAccessSettings && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowSettings(true)}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors relative group"
                    title="系统设置"
                  >
                    <Settings className="w-5 h-5" />
                    {/* 设置按钮的动画效果 */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      animate={{ rotate: [0, 180, 360] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    />
                  </motion.button>
                )}
                
                {/* 站内信入口 */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowMessages(true)}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors relative group"
                  title="站内信管理"
                >
                  <Mail className="w-5 h-5" />
                  {/* 信封按钮的动画效果 */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                  />
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLogout}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  title="退出登录"
                >
                  <LogOut className="w-5 h-5" />
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* 主要内容区域 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* 左侧主要内容区域 */}
          <div className="xl:col-span-3">
            <ModuleRenderer 
              position="main" 
              className="space-y-8"
            />
          </div>

          {/* 右侧边栏 */}
          <div className="xl:col-span-1">
            <ModuleRenderer 
              position="sidebar" 
              className="space-y-6"
              moduleProps={{
                onViewAll: () => setShowMessages(true)
              }}
            />
          </div>
        </div>
      </main>

      {/* 页脚 */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
        className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-16"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-gray-600 dark:text-gray-400">
            <p>© 2024 落雪公会 Pokemon Snowfall Guild. All rights reserved.</p>
            <p className="text-sm mt-1">Powered by Next.js & Tailwind CSS</p>
          </div>
        </div>
      </motion.footer>

      {/* 系统设置模态框 */}
      <AnimatePresence>
        {showSettings && (
          <SystemSettings onClose={() => setShowSettings(false)} />
        )}
      </AnimatePresence>
      
      {/* 消息管理模态框 */}
      <AnimatePresence>
        {showMessages && (
          <div className="fixed inset-0 z-50">
            <MessageManagement />
            <button
              onClick={() => setShowMessages(false)}
              className="absolute top-4 right-4 p-2 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 rounded-lg shadow-lg transition-colors z-10"
              title="关闭消息管理"
            >
              ✕
            </button>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
