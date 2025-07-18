'use client';

import { motion } from 'framer-motion';
import ModuleRenderer from '@/components/ModuleRenderer';
// 导入模块以触发注册
import '@/components/modules';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      {/* 页面标题 */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                落雪公会管理系统
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Pokemon Snowfall Guild Management System
              </p>
            </div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
              className="text-4xl"
            >
              ❄️
            </motion.div>
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
    </div>
  );
}
