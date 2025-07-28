'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  TrendingUp, 
  Users, 
  Calendar,
  AlertCircle,
  Plus,
  Eye,
  BarChart3
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { hasPermission, Permission } from '@/lib/auth';
import { Report, ReportStats } from '@/types/report';
import { getReports, getReportStats } from '@/lib/reportSystem';

interface ReportModuleProps {
  onOpenReports?: () => void;
}

export default function ReportModule({ onOpenReports }: ReportModuleProps) {
  const { state } = useAuth();
  const user = state.user;
  const [reports, setReports] = useState<Report[]>([]);
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 权限检查
  const canViewReports = user && hasPermission(user, Permission.VIEW_REPORTS);
  const canManageReports = user && hasPermission(user, Permission.MANAGE_REPORTS);

  // 加载数据
  useEffect(() => {
    const loadData = async () => {
      if (!user || !canViewReports) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const [userReports, reportStats] = await Promise.all([
          getReports(user),
          getReportStats('default-member-report')
        ]);
        
        setReports(userReports);
        setStats(reportStats);
      } catch (err) {
        setError('加载报表数据失败');
        console.error('加载报表数据失败:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, canViewReports]);

  if (!canViewReports) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>您没有查看报表的权限</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600 dark:text-gray-400">加载中...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="text-center text-red-500">
          <AlertCircle className="w-12 h-12 mx-auto mb-3" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  // 没有数据时的提示
  if (reports.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            数据报表
          </h3>
          <FileText className="w-5 h-5 text-gray-400" />
        </div>
        
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
          <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <h4 className="text-lg font-medium mb-2">暂无数据</h4>
          <p className="text-sm mb-4">请在报表管理中创建和录入数据</p>
          
          {canManageReports && onOpenReports && (
            <button
              onClick={onOpenReports}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 mx-auto"
            >
              <Plus className="w-4 h-4" />
              <span>创建报表</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // 计算汇总数据
  const totalRows = reports.reduce((sum, report) => sum + report.data.length, 0);
  const recentReports = reports
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 3);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          数据报表
        </h3>
        <div className="flex items-center space-x-2">
          {onOpenReports && (
            <button
              onClick={onOpenReports}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              title="打开报表管理"
            >
              <Eye className="w-4 h-4" />
            </button>
          )}
          <FileText className="w-5 h-5 text-gray-400" />
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">报表总数</p>
              <p className="text-2xl font-bold">{reports.length}</p>
            </div>
            <FileText className="w-8 h-8 text-blue-200" />
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">数据总量</p>
              <p className="text-2xl font-bold">{totalRows}</p>
            </div>
            <Users className="w-8 h-8 text-green-200" />
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">今日更新</p>
              <p className="text-2xl font-bold">{stats?.todayUpdates || 0}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-200" />
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-4 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">活跃用户</p>
              <p className="text-2xl font-bold">{stats?.activeUsers || 0}</p>
            </div>
            <Calendar className="w-8 h-8 text-orange-200" />
          </div>
        </motion.div>
      </div>

      {/* 最近报表 */}
      <div>
        <h4 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-3">
          最近更新的报表
        </h4>
        
        <div className="space-y-3">
          {recentReports.map((report, index) => (
            <motion.div
              key={report.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer"
              onClick={onOpenReports}
            >
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {report.config.name}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {report.data.length} 条数据 • {report.config.fields.length} 个字段
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {new Date(report.updatedAt).toLocaleDateString()}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {new Date(report.updatedAt).toLocaleTimeString()}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
        
        {onOpenReports && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onOpenReports}
              className="w-full px-4 py-2 text-blue-600 dark:text-blue-400 border border-blue-600 dark:border-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors flex items-center justify-center space-x-2"
            >
              <Eye className="w-4 h-4" />
              <span>查看所有报表</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// 注册模块
export const Module = {
  name: 'ReportModule',
  component: ReportModule,
  position: 'main' as const,
  order: 2,
  props: {}
};