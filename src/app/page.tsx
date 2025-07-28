'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, User, Settings, Mail, FileText, MessageSquare, BarChart3 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole, Permission } from '@/types/auth';
import { hasPermission } from '@/lib/auth';
import ModuleRenderer from '@/components/ModuleRenderer';
import RoleBadge from '@/components/RoleBadge';
import UserAvatar from '@/components/UserAvatar';
import UserSearch from '@/components/UserSearch';
import SystemSettings from '@/components/admin/SystemSettings';
import { MessageManagement, NotificationBadge } from '@/components/messages';
import ReportManagement from '@/components/reports/ReportManagement';
import MembershipFeeReportComponent from '@/components/modules/MembershipFeeReport';

import { AnimatedWrapper, PageTransition } from '@/components/animations/AnimationComponents';
import { useSettings } from '@/contexts/SettingsContext';
import { DiceButton } from '@/components/dice/DiceButton';
// 导入模块以触发注册
import '@/components/modules';

export default function Home() {
  const { state, logout } = useAuth();
  const { settings } = useSettings();
  const router = useRouter();
  const [showSettings, setShowSettings] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [showReports, setShowReports] = useState(false);
  const [showPageSelector, setShowPageSelector] = useState(false);

  // 检查用户权限，普通用户直接重定向到论坛
  useEffect(() => {
    if (state.user && state.user.role === UserRole.USER) {
      router.push('/forum');
    }
  }, [state.user, router]);

  const handleLogout = () => {
    logout();
  };

  const handleAvatarClick = () => {
    if (state.user?.id) {
      router.push(`/profile/${state.user.id}`);
    }
  };

  // 检查是否有系统设置权限
  const canAccessSettings = hasPermission(state.user, Permission.USER_CREATE) || 
                           hasPermission(state.user, Permission.USER_UPDATE) || 
                           hasPermission(state.user, Permission.USER_DELETE) ||
                           state.user?.role === UserRole.SUPER_ADMIN;

  // 检查是否有报表管理权限
  const canAccessReports = hasPermission(state.user, Permission.VIEW_REPORTS);

  // 检查是否为管理员（可以访问数据展示页面）
  const isAdmin = state.user?.role === UserRole.SUPER_ADMIN || 
                  state.user?.role === UserRole.ADMIN || 
                  state.user?.role === UserRole.MODERATOR;

  const handleGoToForum = () => {
    router.push('/forum');
  };

  // 如果是普通用户，显示加载状态（因为会被重定向）
  if (state.user?.role === UserRole.USER) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">正在跳转到论坛...</p>
        </div>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen relative overflow-hidden">
        
        {/* 装饰性动画元素 */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {settings.animation.enabled && (
            <>
              <motion.div
                className="absolute top-20 left-10 w-32 h-32 bg-blue-200/20 dark:bg-blue-500/10 rounded-full blur-xl"
                animate={{
                  x: [0, 100, 0],
                  y: [0, -50, 0],
                  scale: [1, 1.2, 1]
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              <motion.div
                className="absolute top-40 right-20 w-24 h-24 bg-purple-200/20 dark:bg-purple-500/10 rounded-full blur-xl"
                animate={{
                  x: [0, -80, 0],
                  y: [0, 60, 0],
                  scale: [1, 0.8, 1]
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1
                }}
              />
              <motion.div
                className="absolute bottom-20 left-1/3 w-40 h-40 bg-indigo-200/15 dark:bg-indigo-500/8 rounded-full blur-2xl"
                animate={{
                  x: [0, 120, 0],
                  y: [0, -80, 0],
                  scale: [1, 1.3, 1]
                }}
                transition={{
                  duration: 10,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 2
                }}
              />
            </>
          )}
        </div>
        
        {/* 主要内容 */}
        <div className="relative z-10">
          {/* 页面头部 */}
          <AnimatedWrapper animation="slideIn" delay={0}>
            <header className="backdrop-blur-xl border-b border-gray-200/30 dark:border-gray-700/30 shadow-xl">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* 顶部导航栏 */}
                <div className="flex items-center justify-between py-4">
                  {/* 左侧：标题和描述 */}
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg">
                        <BarChart3 className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
                          落雪公会管理系统
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                          Pokemon Snowfall Guild Management System
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* 右侧：用户信息 */}
                  <div className="flex items-center space-x-4">
                    <UserAvatar 
                      user={state.user} 
                      size="md" 
                      className="flex-shrink-0"
                      clickable={true}
                      onClick={handleAvatarClick}
                    />
                    
                    {/* 用户信息 */}
                    <div className="text-right hidden sm:block">
                      <div className="flex items-center space-x-3 text-sm text-gray-700 dark:text-gray-300">
                        <span className="font-medium">欢迎，{state.user?.gameNickname || state.user?.username}</span>
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
                  </div>
                </div>
                
                {/* 导航栏 */}
                <div className="border-t border-gray-200/50 dark:border-gray-700/50">
                  <div className="flex items-center justify-between py-3">
                    {/* 左侧：页面切换 */}
                    <div className="flex items-center space-x-3">
                      {isAdmin && (
                        <>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleGoToForum}
                            className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
                          >
                            <MessageSquare className="w-4 h-4" />
                            <span>进入论坛</span>
                          </motion.button>
                          
                          <div className="flex items-center space-x-2 px-3 py-2 bg-gray-100 dark:bg-gray-700/50 rounded-lg">
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                            <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                              数据展示模式
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                    
                    {/* 右侧：功能按钮 */}
                    <div className="flex items-center space-x-2">
                       {/* 用户搜索 */}
                       <UserSearch currentUser={state.user} />
                       
                       {/* 分隔线 */}
                       <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
                       
                       {/* 消息通知 */}
                       <NotificationBadge
                         onClick={() => setShowMessages(true)}
                         className="relative"
                       />
                       
                       {/* 报表管理 */}
                       {canAccessReports && (
                         <motion.button
                           whileHover={{ scale: 1.02 }}
                           whileTap={{ scale: 0.98 }}
                           onClick={() => setShowReports(true)}
                           className="flex items-center space-x-2 px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-all duration-200 font-medium"
                           title="报表管理"
                         >
                           <FileText className="w-4 h-4" />
                           <span className="hidden lg:inline">报表</span>
                         </motion.button>
                       )}
                       
                       {canAccessSettings && (
                         <motion.button
                           whileHover={{ scale: 1.02 }}
                           whileTap={{ scale: 0.98 }}
                           onClick={() => setShowSettings(true)}
                           className="flex items-center space-x-2 px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-all duration-200 font-medium"
                           title="系统设置"
                         >
                           <Settings className="w-4 h-4" />
                           <span className="hidden lg:inline">设置</span>
                         </motion.button>
                       )}
                       
                       {/* 站内信入口 */}
                       <motion.button
                         whileHover={{ scale: 1.02 }}
                         whileTap={{ scale: 0.98 }}
                         onClick={() => setShowMessages(true)}
                         className="flex items-center space-x-2 px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200 font-medium"
                         title="站内信管理"
                       >
                         <Mail className="w-4 h-4" />
                         <span className="hidden lg:inline">消息</span>
                       </motion.button>
                       
                       {/* 分隔线 */}
                       <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />
                       
                       <motion.button
                         whileHover={{ scale: 1.02 }}
                         whileTap={{ scale: 0.98 }}
                         onClick={handleLogout}
                         className="flex items-center space-x-2 px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200 font-medium"
                         title="退出登录"
                       >
                         <LogOut className="w-4 h-4" />
                         <span className="hidden lg:inline">退出</span>
                       </motion.button>
                     </div>
                   </div>
                 </div>
               </div>
             </header>
             </AnimatedWrapper>

                 {/* 主要内容区域 */}
                 <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                   {/* 管理员提示 */}
                   {isAdmin && (
                     <AnimatedWrapper animation="fadeIn" delay={0.2}>
                       <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 mb-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
                         <div className="flex items-center justify-between">
                           <div className="flex items-center space-x-3">
                             <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                             <div>
                               <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                 数据展示页面
                               </h3>
                               <p className="text-sm text-gray-600 dark:text-gray-400">
                                 管理员专用页面，可以查看系统数据、会费流水和管理功能
                               </p>
                             </div>
                           </div>
                           <motion.button
                             whileHover={{ scale: 1.05 }}
                             whileTap={{ scale: 0.95 }}
                             onClick={handleGoToForum}
                             className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                           >
                             <MessageSquare className="w-4 h-4" />
                             <span>前往论坛</span>
                           </motion.button>
                         </div>
                       </div>
                     </AnimatedWrapper>
                   )}
             
                   {/* 会费流水报表 - 固定显示在数据展示页面 */}
                   {isAdmin && (
                     <AnimatedWrapper animation="slideIn" delay={0.4}>
                       <div className="mb-8">
                         <MembershipFeeReportComponent />
                       </div>
                     </AnimatedWrapper>
                   )}
             
                   <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                   {/* 左侧主要内容区域 */}
                   <div className="xl:col-span-3">
                       <AnimatedWrapper animation="slideIn" delay={0.6}>
                         <ModuleRenderer 
                           position="main" 
                           className="space-y-8"
                           moduleProps={{
                             onOpenReports: () => setShowReports(true)
                           }}
                         />
                       </AnimatedWrapper>
                     </div>

                   {/* 右侧边栏 */}
                   <div className="xl:col-span-1">
                       <AnimatedWrapper animation="slideIn" delay={0.8}>
                         <ModuleRenderer 
                           position="sidebar" 
                           className="space-y-6"
                           moduleProps={{
                             onViewAll: () => setShowMessages(true)
                           }}
                         />
                       </AnimatedWrapper>
                     </div>
                   </div>
                 </main>

                 {/* 页脚 */}
                 <AnimatedWrapper animation="fadeIn" delay={1}>
                   <footer className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border-t border-gray-200/20 dark:border-gray-700/20 mt-16">
                     <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                       <div className="text-center text-gray-600 dark:text-gray-400">
                         <p>© 2024 落雪公会 Pokemon Snowfall Guild. All rights reserved.</p>
                         <p className="text-sm mt-1">Powered by Next.js & Tailwind CSS</p>
                       </div>
                     </div>
                   </footer>
                 </AnimatedWrapper>
               </div>
               
               {/* 骰子按钮 */}
               <DiceButton />
               


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
             
             {/* 报表管理模态框 */}
             <AnimatePresence>
               {showReports && (
                 <motion.div
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   exit={{ opacity: 0 }}
                   className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                 >
                   <motion.div
                     initial={{ scale: 0.95, opacity: 0 }}
                     animate={{ scale: 1, opacity: 1 }}
                     exit={{ scale: 0.95, opacity: 0 }}
                     className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full h-full max-w-7xl max-h-[95vh] overflow-hidden"
                   >
                     <ReportManagement onClose={() => setShowReports(false)} />
                   </motion.div>
                 </motion.div>
               )}
             </AnimatePresence>
             </div>
           </PageTransition>
         );
       }
