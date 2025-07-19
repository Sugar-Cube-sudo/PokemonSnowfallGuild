'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { Module } from '@/lib/moduleLoader';
import { Users, TrendingUp, Calendar, Activity, Settings, Eye, EyeOff } from 'lucide-react';

// 模拟多维度会员数据
const memberTrendData = [
  { month: '1月', total: 1180, new: 45, renewed: 89, overdue: 12 },
  { month: '2月', total: 1205, new: 52, renewed: 76, overdue: 15 },
  { month: '3月', total: 1247, new: 68, renewed: 94, overdue: 18 },
  { month: '4月', total: 1289, new: 71, renewed: 102, overdue: 22 },
  { month: '5月', total: 1324, new: 58, renewed: 87, overdue: 19 },
  { month: '6月', total: 1356, new: 63, renewed: 95, overdue: 16 }
];

const memberActivityData = [
  { type: '活跃度', value: 85 },
  { type: '参与度', value: 78 },
  { type: '逾期占比', value: 12 },
  { type: '忠诚度', value: 88 },
  { type: '推荐度', value: 76 }
];

const gameTimeDistributionData = [
  { timeRange: '0-2小时', count: 234 },
  { timeRange: '2-5小时', count: 456 },
  { timeRange: '5-10小时', count: 389 },
  { timeRange: '10-20小时', count: 267 },
  { timeRange: '20+小时', count: 156 }
];

// 图表配置接口
interface ChartConfig {
  showTrend: boolean;
  showGameTime: boolean;
  showActivity: boolean;
  showOverdueComparison: boolean;
}

// 默认配置
const defaultConfig: ChartConfig = {
  showTrend: true,
  showGameTime: true,
  showActivity: true,
  showOverdueComparison: true
};

// 本地存储键名
const CONFIG_STORAGE_KEY = 'member-analytics-config';

function MemberAnalyticsComponent() {
  // 状态管理
  const [config, setConfig] = useState<ChartConfig>(defaultConfig);
  const [showSettings, setShowSettings] = useState(false);

  // 从本地存储加载配置
  useEffect(() => {
    try {
      const savedConfig = localStorage.getItem(CONFIG_STORAGE_KEY);
      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig);
        setConfig({ ...defaultConfig, ...parsedConfig });
      }
    } catch (error) {
      console.warn('Failed to load analytics config:', error);
    }
  }, []);

  // 保存配置到本地存储
  const saveConfig = (newConfig: ChartConfig) => {
    try {
      localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(newConfig));
      setConfig(newConfig);
    } catch (error) {
      console.warn('Failed to save analytics config:', error);
    }
  };

  // 切换图表显示状态
  const toggleChart = (chartKey: keyof ChartConfig) => {
    const newConfig = { ...config, [chartKey]: !config[chartKey] };
    saveConfig(newConfig);
  };

  // 计算流失度（基于逾期人数）
  const calculateChurnRate = (overdueCount: number) => {
    // 流失度 = 逾期人数，随逾期人数增加而增长
    return overdueCount;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="font-medium text-gray-900 dark:text-gray-100 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
              {entry.dataKey === 'overdue' && ' (流失度=逾期人数)'}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              会员数据分析
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              多维度数据展示 • 个性化配置
            </p>
          </div>
        </div>
        
        {/* 设置按钮 */}
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          title="图表显示设置"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* 设置面板 */}
      {showSettings && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
        >
          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">图表显示设置</h4>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.showTrend}
                onChange={() => toggleChart('showTrend')}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">会员增长趋势</span>
            </label>
            
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.showGameTime}
                onChange={() => toggleChart('showGameTime')}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">游戏时长分布</span>
            </label>
            
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.showActivity}
                onChange={() => toggleChart('showActivity')}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">会员活跃度</span>
            </label>
            
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.showOverdueComparison}
                onChange={() => toggleChart('showOverdueComparison')}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">新增/逾期对比</span>
            </label>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 会员趋势图 */}
        {config.showTrend && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <h4 className="font-medium text-gray-900 dark:text-gray-100">会员增长趋势</h4>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={memberTrendData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="month" 
                    className="text-xs text-gray-600 dark:text-gray-400"
                  />
                  <YAxis className="text-xs text-gray-600 dark:text-gray-400" />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.1}
                    strokeWidth={2}
                    name="总会员数"
                  />
                  <Line
                    type="monotone"
                    dataKey="new"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                    name="新增会员"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* 游戏时长分布 */}
        {config.showGameTime && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-green-600" />
              <h4 className="font-medium text-gray-900 dark:text-gray-100">游戏时长分布</h4>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={gameTimeDistributionData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="timeRange" 
                    className="text-xs text-gray-600 dark:text-gray-400"
                  />
                  <YAxis className="text-xs text-gray-600 dark:text-gray-400" />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="count" 
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                    name="会员数量"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* 会员活跃度雷达图 */}
        {config.showActivity && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-purple-600" />
              <h4 className="font-medium text-gray-900 dark:text-gray-100">会员活跃度</h4>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={memberActivityData}>
                  <PolarGrid className="opacity-30" />
                  <PolarAngleAxis 
                    dataKey="type" 
                    className="text-xs text-gray-600 dark:text-gray-400"
                  />
                  <PolarRadiusAxis 
                    angle={90} 
                    domain={[0, 100]} 
                    className="text-xs text-gray-600 dark:text-gray-400"
                  />
                  <Radar
                    name="活跃度"
                    dataKey="value"
                    stroke="#8b5cf6"
                    fill="#8b5cf6"
                    fillOpacity={0.1}
                    strokeWidth={2}
                  />
                  <Tooltip content={<CustomTooltip />} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* 月度新增/逾期对比 */}
        {config.showOverdueComparison && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-orange-600" />
              <h4 className="font-medium text-gray-900 dark:text-gray-100">新增/逾期对比</h4>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={memberTrendData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="month" 
                    className="text-xs text-gray-600 dark:text-gray-400"
                  />
                  <YAxis className="text-xs text-gray-600 dark:text-gray-400" />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="new" 
                    fill="#10b981"
                    radius={[2, 2, 0, 0]}
                    name="新增"
                  />
                  <Bar 
                    dataKey="overdue" 
                    fill="#ef4444"
                    radius={[2, 2, 0, 0]}
                    name="逾期"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* 数据摘要 */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">85%</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">平均活跃度</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">+13%</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">月增长率</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">92%</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">满意度</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">1.4%</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">流失率</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default Module({
  id: 'member-analytics',
  name: '会员数据分析',
  position: 'main',
  order: 3
})(MemberAnalyticsComponent);