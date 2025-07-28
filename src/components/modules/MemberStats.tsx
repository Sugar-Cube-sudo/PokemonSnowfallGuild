'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Crown, Calendar, Gift, AlertTriangle, FileText, Plus, DollarSign, TrendingUp } from 'lucide-react';
import { Module } from '@/lib/moduleLoader';
import { useAuth } from '@/contexts/AuthContext';
import { hasPermission, Permission } from '@/lib/auth';
import { getReports } from '@/lib/reportSystem';
import { Report } from '@/types/report';

interface MemberStatsType {
  total: number;
  annual: number;
  monthly: number;
  free: number;
  overdue: number;
  totalFees: number;
  annualFees: number;
  monthlyFees: number;
  freeFees: number;
}

interface MemberStatsProps {
  onOpenReports?: () => void;
}

function MemberStatsComponent({ onOpenReports }: MemberStatsProps) {
  const { state } = useAuth();
  const user = state.user;
  const [memberStats, setMemberStats] = useState<MemberStatsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 权限检查
  const canViewReports = user && hasPermission(user, Permission.VIEW_REPORTS);
  const canManageReports = user && hasPermission(user, Permission.MANAGE_REPORTS);

  // 从报表数据计算会员统计
  const calculateMemberStats = (reports: Report[]): MemberStatsType => {
    let total = 0;
    let annual = 0;
    let monthly = 0;
    let free = 0;
    let overdue = 0;
    let totalFees = 0;
    let annualFees = 0;
    let monthlyFees = 0;
    let freeFees = 0;

    reports.forEach(report => {
      report.data.forEach(row => {
        // 查找会员类型字段
        const memberTypeField = report.config.fields.find(f => f.id === 'memberType' || f.name === '会员类型');
        const overdueField = report.config.fields.find(f => f.id === 'isOverdue' || f.name === '是否逾期');
        const feeField = report.config.fields.find(f => f.id === 'membershipFee' || f.name === '会费' || f.id === 'fee');
        
        if (memberTypeField) {
          const memberType = row.data[memberTypeField.id];
          const isOverdue = overdueField ? row.data[overdueField.id] : false;
          const fee = feeField ? (Number(row.data[feeField.id]) || 0) : 0;
          
          total++;
          
          if (isOverdue) {
            overdue++;
          } else {
            switch (memberType) {
              case '年费':
                annual++;
                if (fee > 0) {
                  annualFees += fee;
                  totalFees += fee;
                }
                break;
              case '月费':
                monthly++;
                if (fee > 0) {
                  monthlyFees += fee;
                  totalFees += fee;
                }
                break;
              case '免费':
                free++;
                if (fee > 0) {
                  freeFees += fee;
                  totalFees += fee;
                }
                break;
            }
          }
        }
      });
    });

    return { total, annual, monthly, free, overdue, totalFees, annualFees, monthlyFees, freeFees };
  };

  // 加载数据
  useEffect(() => {
    const loadData = async () => {
      if (!user || !canViewReports) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const reports = await getReports(user);
        const stats = calculateMemberStats(reports);
        setMemberStats(stats);
      } catch (err) {
        setError('加载会员统计失败');
        console.error('加载会员统计失败:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, canViewReports]);

  // 权限不足
  if (!canViewReports) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>您没有查看会员统计的权限</p>
        </div>
      </div>
    );
  }

  // 加载中
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {[...Array(5)].map((_, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 animate-pulse">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-lg"></div>
              <div className="w-16 h-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
            </div>
            <div className="w-20 h-4 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
            <div className="w-full h-1 bg-gray-300 dark:bg-gray-600 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="text-center text-red-500">
          <AlertTriangle className="w-12 h-12 mx-auto mb-3" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  // 无数据状态
  if (!memberStats || memberStats.total === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-200 dark:border-gray-700">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">暂无会员数据</h3>
          <p className="text-sm mb-4">请在报表管理中录入会员信息以查看统计数据</p>
          
          {canManageReports && onOpenReports && (
            <button
              onClick={onOpenReports}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 mx-auto"
            >
              <Plus className="w-4 h-4" />
              <span>录入会员数据</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // 生成统计配置
  const statsConfig = [
    {
      label: '会员总数',
      value: memberStats.total,
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      textColor: 'text-blue-600',
      type: 'count'
    },
    {
      label: '总会费收入',
      value: memberStats.totalFees,
      icon: DollarSign,
      color: 'from-emerald-500 to-emerald-600',
      textColor: 'text-emerald-600',
      type: 'currency'
    },
    {
      label: '年费会员',
      value: memberStats.annual,
      subValue: memberStats.annualFees,
      icon: Crown,
      color: 'from-yellow-500 to-yellow-600',
      textColor: 'text-yellow-600',
      type: 'mixed'
    },
    {
      label: '月费会员',
      value: memberStats.monthly,
      subValue: memberStats.monthlyFees,
      icon: Calendar,
      color: 'from-green-500 to-green-600',
      textColor: 'text-green-600',
      type: 'mixed'
    },
    {
      label: '免费会员',
      value: memberStats.free,
      subValue: memberStats.freeFees,
      icon: Gift,
      color: 'from-purple-500 to-purple-600',
      textColor: 'text-purple-600',
      type: 'mixed'
    },
    {
      label: '逾期未续费',
      value: memberStats.overdue,
      icon: AlertTriangle,
      color: 'from-red-500 to-red-600',
      textColor: 'text-red-600',
      type: 'count'
    }
  ];
  return (
    <div className="space-y-6">
      {/* 总会费收入突出显示 */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-xl p-6 border border-emerald-200 dark:border-emerald-800"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-4 bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                实时总会费收入
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                当前报表数据统计的总收入金额
              </p>
            </div>
          </div>
          <div className="text-right">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
              className="text-3xl font-bold text-emerald-600 dark:text-emerald-400"
            >
              ¥{memberStats.totalFees.toLocaleString()}
            </motion.div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              实时更新
            </p>
          </div>
        </div>
      </motion.div>

      {/* 详细统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {statsConfig.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              whileHover={{ scale: 1.05, y: -5 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg bg-gradient-to-r ${stat.color}`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="text-right">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.1 + 0.3, type: 'spring', stiffness: 200 }}
                    className={`text-2xl font-bold ${stat.textColor}`}
                  >
                    {stat.type === 'currency' ? `¥${stat.value.toLocaleString()}` : stat.value.toLocaleString()}
                  </motion.div>
                  {stat.type === 'mixed' && stat.subValue !== undefined && stat.subValue > 0 && (
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      ¥{stat.subValue.toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {stat.label}
              </h3>
              {stat.type === 'mixed' && stat.subValue !== undefined && stat.subValue > 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  收入金额
                </p>
              )}
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ delay: index * 0.1 + 0.5, duration: 0.8 }}
                className={`h-1 bg-gradient-to-r ${stat.color} rounded-full mt-2`}
              />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// 导出模块配置
const MemberStatsModule = {
  name: 'MemberStats',
  component: MemberStatsComponent,
  position: 'main' as const,
  order: 1,
  props: {}
};

export { MemberStatsModule as Module };
export default MemberStatsComponent;