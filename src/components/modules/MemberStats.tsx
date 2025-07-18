'use client';

import { motion } from 'framer-motion';
import { Users, Crown, Calendar, Gift, AlertTriangle } from 'lucide-react';
import { Module } from '@/lib/moduleLoader';
import { MemberStats as MemberStatsType } from '@/types';

// 模拟数据
const mockData: MemberStatsType = {
  total: 1247,
  annual: 342,
  monthly: 589,
  free: 268,
  overdue: 48
};

const statsConfig = [
  {
    label: '会员总数',
    value: mockData.total,
    icon: Users,
    color: 'from-blue-500 to-blue-600',
    textColor: 'text-blue-600'
  },
  {
    label: '年费会员',
    value: mockData.annual,
    icon: Crown,
    color: 'from-yellow-500 to-yellow-600',
    textColor: 'text-yellow-600'
  },
  {
    label: '月费会员',
    value: mockData.monthly,
    icon: Calendar,
    color: 'from-green-500 to-green-600',
    textColor: 'text-green-600'
  },
  {
    label: '免费会员',
    value: mockData.free,
    icon: Gift,
    color: 'from-purple-500 to-purple-600',
    textColor: 'text-purple-600'
  },
  {
    label: '逾期未续费',
    value: mockData.overdue,
    icon: AlertTriangle,
    color: 'from-red-500 to-red-600',
    textColor: 'text-red-600'
  }
];

function MemberStatsComponent() {
  return (
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
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.1 + 0.3, type: 'spring', stiffness: 200 }}
                className={`text-2xl font-bold ${stat.textColor}`}
              >
                {stat.value.toLocaleString()}
              </motion.div>
            </div>
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {stat.label}
            </h3>
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
  );
}

export default Module({
  id: 'member-stats',
  name: '会员统计',
  position: 'main',
  order: 1
})(MemberStatsComponent);