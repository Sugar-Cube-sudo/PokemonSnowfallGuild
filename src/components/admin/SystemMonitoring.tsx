'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  Server,
  Database,
  Cpu,
  HardDrive,
  Wifi,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ArrowLeft,
  RefreshCw,
  Download,
  TrendingUp,
  TrendingDown,
  Zap,
  Globe,
  Shield,
  BarChart3
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useAuth } from '@/contexts/AuthContext';

interface SystemMonitoringProps {
  onClose: () => void;
}

interface SystemMetrics {
  cpu: {
    usage: number;
    cores: number;
    temperature: number;
    processes: number;
  };
  memory: {
    used: number;
    total: number;
    available: number;
    cached: number;
  };
  disk: {
    used: number;
    total: number;
    available: number;
    readSpeed: number;
    writeSpeed: number;
  };
  network: {
    inbound: number;
    outbound: number;
    connections: number;
    latency: number;
  };
  database: {
    connections: number;
    queries: number;
    slowQueries: number;
    size: number;
  };
  application: {
    uptime: number;
    requests: number;
    errors: number;
    responseTime: number;
  };
}

interface PerformanceData {
  timestamp: string;
  cpu: number;
  memory: number;
  network: number;
  requests: number;
}

interface SystemAlert {
  id: string;
  type: 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  resolved: boolean;
}

const mockSystemMetrics: SystemMetrics = {
  cpu: {
    usage: 45.2,
    cores: 8,
    temperature: 62,
    processes: 156
  },
  memory: {
    used: 6.4,
    total: 16,
    available: 9.6,
    cached: 2.1
  },
  disk: {
    used: 128.5,
    total: 512,
    available: 383.5,
    readSpeed: 245.8,
    writeSpeed: 189.3
  },
  network: {
    inbound: 12.5,
    outbound: 8.3,
    connections: 42,
    latency: 15
  },
  database: {
    connections: 18,
    queries: 1247,
    slowQueries: 3,
    size: 2.8
  },
  application: {
    uptime: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    requests: 15420,
    errors: 12,
    responseTime: 145
  }
};

const mockPerformanceData: PerformanceData[] = [
  { timestamp: '00:00', cpu: 35, memory: 42, network: 15, requests: 120 },
  { timestamp: '04:00', cpu: 28, memory: 38, network: 12, requests: 85 },
  { timestamp: '08:00', cpu: 52, memory: 48, network: 25, requests: 280 },
  { timestamp: '12:00', cpu: 68, memory: 55, network: 35, requests: 420 },
  { timestamp: '16:00', cpu: 45, memory: 51, network: 28, requests: 350 },
  { timestamp: '20:00', cpu: 38, memory: 46, network: 22, requests: 180 },
  { timestamp: '24:00', cpu: 32, memory: 40, network: 18, requests: 95 }
];

const mockSystemAlerts: SystemAlert[] = [
  {
    id: '1',
    type: 'warning',
    title: 'CPU使用率偏高',
    message: 'CPU使用率持续超过80%，建议检查系统负载',
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    resolved: false
  },
  {
    id: '2',
    type: 'error',
    title: '数据库连接异常',
    message: '检测到3个慢查询，可能影响系统性能',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    resolved: false
  },
  {
    id: '3',
    type: 'info',
    title: '系统更新完成',
    message: '安全补丁已成功安装，系统重启完成',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
    resolved: true
  }
];

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function SystemMonitoring({ onClose }: SystemMonitoringProps) {
  const { state } = useAuth();
  const [metrics, setMetrics] = useState<SystemMetrics>(mockSystemMetrics);
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>(mockPerformanceData);
  const [alerts, setAlerts] = useState<SystemAlert[]>(mockSystemAlerts);
  const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'alerts' | 'logs'>('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30); // seconds

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (autoRefresh) {
      interval = setInterval(() => {
        refreshMetrics();
      }, refreshInterval * 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, refreshInterval]);

  const refreshMetrics = async () => {
    setIsLoading(true);
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 模拟数据更新
      setMetrics(prev => ({
        ...prev,
        cpu: {
          ...prev.cpu,
          usage: Math.max(20, Math.min(90, prev.cpu.usage + (Math.random() - 0.5) * 10))
        },
        memory: {
          ...prev.memory,
          used: Math.max(4, Math.min(14, prev.memory.used + (Math.random() - 0.5) * 2))
        }
      }));
    } catch (error) {
      console.error('Failed to refresh metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatUptime = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    const days = Math.floor(seconds / (24 * 3600));
    const hours = Math.floor((seconds % (24 * 3600)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}天 ${hours}小时 ${minutes}分钟`;
  };

  const getStatusColor = (value: number, thresholds: { warning: number; critical: number }) => {
    if (value >= thresholds.critical) return 'text-red-600 bg-red-100 dark:bg-red-900/20';
    if (value >= thresholds.warning) return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
    return 'text-green-600 bg-green-100 dark:bg-green-900/20';
  };

  const getAlertIcon = (type: SystemAlert['type']) => {
    switch (type) {
      case 'error': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'info': return <CheckCircle className="w-4 h-4 text-blue-600" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const resolveAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, resolved: true } : alert
    ));
  };

  const exportReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      metrics,
      alerts: alerts.filter(alert => !alert.resolved),
      performanceData
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const tabs = [
    { id: 'overview' as const, name: '系统概览', icon: Server },
    { id: 'performance' as const, name: '性能监控', icon: BarChart3 },
    { id: 'alerts' as const, name: '系统警报', icon: AlertTriangle },
    { id: 'logs' as const, name: '系统日志', icon: Clock }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden"
      >
        {/* 头部 */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center hover:bg-white/30 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </motion.button>
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">系统监控</h2>
                <p className="text-purple-100 text-sm">实时监控系统状态和性能指标</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                    className="rounded border-white/30 text-purple-600 focus:ring-purple-500 bg-white/20"
                  />
                  <span className="text-sm">自动刷新</span>
                </label>
                <select
                  value={refreshInterval}
                  onChange={(e) => setRefreshInterval(parseInt(e.target.value))}
                  disabled={!autoRefresh}
                  className="bg-white/20 border border-white/30 rounded-lg px-2 py-1 text-sm disabled:opacity-50"
                >
                  <option value={10}>10秒</option>
                  <option value={30}>30秒</option>
                  <option value={60}>1分钟</option>
                  <option value={300}>5分钟</option>
                </select>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={refreshMetrics}
                disabled={isLoading}
                className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span>刷新</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={exportReport}
                className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>导出报告</span>
              </motion.button>
            </div>
          </div>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* 侧边栏 */}
          <div className="w-64 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 p-4">
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <motion.button
                    key={tab.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-purple-600 text-white shadow-lg'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800'
                    }`}
                  >
                    <IconComponent className="w-5 h-5" />
                    <span className="font-medium">{tab.name}</span>
                  </motion.button>
                );
              })}
            </nav>

            {/* 快速状态 */}
            <div className="mt-6 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">系统状态</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 dark:text-gray-400">CPU</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(metrics.cpu.usage, { warning: 70, critical: 85 })}`}>
                    {metrics.cpu.usage.toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 dark:text-gray-400">内存</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor((metrics.memory.used / metrics.memory.total) * 100, { warning: 80, critical: 90 })}`}>
                    {((metrics.memory.used / metrics.memory.total) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 dark:text-gray-400">磁盘</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor((metrics.disk.used / metrics.disk.total) * 100, { warning: 80, critical: 90 })}`}>
                    {((metrics.disk.used / metrics.disk.total) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 主要内容 */}
          <div className="flex-1 overflow-y-auto p-6">
            <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  {/* 系统概览卡片 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* CPU */}
                    <div className="bg-white dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                          <Cpu className="w-6 h-6 text-blue-600" />
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(metrics.cpu.usage, { warning: 70, critical: 85 })}`}>
                          {metrics.cpu.usage.toFixed(1)}%
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">CPU使用率</h3>
                      <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex justify-between">
                          <span>核心数:</span>
                          <span>{metrics.cpu.cores}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>温度:</span>
                          <span>{metrics.cpu.temperature}°C</span>
                        </div>
                        <div className="flex justify-between">
                          <span>进程数:</span>
                          <span>{metrics.cpu.processes}</span>
                        </div>
                      </div>
                    </div>

                    {/* 内存 */}
                    <div className="bg-white dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                          <Zap className="w-6 h-6 text-green-600" />
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor((metrics.memory.used / metrics.memory.total) * 100, { warning: 80, critical: 90 })}`}>
                          {((metrics.memory.used / metrics.memory.total) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">内存使用</h3>
                      <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex justify-between">
                          <span>已用:</span>
                          <span>{metrics.memory.used.toFixed(1)} GB</span>
                        </div>
                        <div className="flex justify-between">
                          <span>总计:</span>
                          <span>{metrics.memory.total} GB</span>
                        </div>
                        <div className="flex justify-between">
                          <span>缓存:</span>
                          <span>{metrics.memory.cached.toFixed(1)} GB</span>
                        </div>
                      </div>
                    </div>

                    {/* 磁盘 */}
                    <div className="bg-white dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                          <HardDrive className="w-6 h-6 text-orange-600" />
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor((metrics.disk.used / metrics.disk.total) * 100, { warning: 80, critical: 90 })}`}>
                          {((metrics.disk.used / metrics.disk.total) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">磁盘使用</h3>
                      <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex justify-between">
                          <span>已用:</span>
                          <span>{metrics.disk.used.toFixed(1)} GB</span>
                        </div>
                        <div className="flex justify-between">
                          <span>总计:</span>
                          <span>{metrics.disk.total} GB</span>
                        </div>
                        <div className="flex justify-between">
                          <span>读取:</span>
                          <span>{metrics.disk.readSpeed.toFixed(1)} MB/s</span>
                        </div>
                      </div>
                    </div>

                    {/* 网络 */}
                    <div className="bg-white dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                          <Wifi className="w-6 h-6 text-purple-600" />
                        </div>
                        <span className="px-3 py-1 rounded-full text-sm font-medium text-green-600 bg-green-100 dark:bg-green-900/20">
                          正常
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">网络状态</h3>
                      <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex justify-between">
                          <span>入站:</span>
                          <span>{metrics.network.inbound.toFixed(1)} MB/s</span>
                        </div>
                        <div className="flex justify-between">
                          <span>出站:</span>
                          <span>{metrics.network.outbound.toFixed(1)} MB/s</span>
                        </div>
                        <div className="flex justify-between">
                          <span>延迟:</span>
                          <span>{metrics.network.latency} ms</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 应用程序状态 */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600 shadow-sm">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">应用程序状态</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                            <Clock className="w-6 h-6 text-blue-600" />
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">运行时间</p>
                          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {formatUptime(metrics.application.uptime)}
                          </p>
                        </div>
                        <div className="text-center">
                          <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                            <TrendingUp className="w-6 h-6 text-green-600" />
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">总请求数</p>
                          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {metrics.application.requests.toLocaleString()}
                          </p>
                        </div>
                        <div className="text-center">
                          <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                            <XCircle className="w-6 h-6 text-red-600" />
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">错误数</p>
                          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {metrics.application.errors}
                          </p>
                        </div>
                        <div className="text-center">
                          <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                            <Zap className="w-6 h-6 text-yellow-600" />
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">响应时间</p>
                          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {metrics.application.responseTime} ms
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600 shadow-sm">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">数据库状态</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                            <Database className="w-6 h-6 text-blue-600" />
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">连接数</p>
                          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {metrics.database.connections}
                          </p>
                        </div>
                        <div className="text-center">
                          <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                            <BarChart3 className="w-6 h-6 text-green-600" />
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">查询数</p>
                          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {metrics.database.queries.toLocaleString()}
                          </p>
                        </div>
                        <div className="text-center">
                          <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                            <AlertTriangle className="w-6 h-6 text-orange-600" />
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">慢查询</p>
                          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {metrics.database.slowQueries}
                          </p>
                        </div>
                        <div className="text-center">
                          <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                            <HardDrive className="w-6 h-6 text-purple-600" />
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">数据库大小</p>
                          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {metrics.database.size.toFixed(1)} GB
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'performance' && (
                <motion.div
                  key="performance"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">性能趋势图</h3>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* CPU和内存使用率 */}
                      <div className="bg-white dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600 shadow-sm">
                        <h4 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-4">CPU & 内存使用率</h4>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={performanceData}>
                              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                              <XAxis dataKey="timestamp" className="text-xs" />
                              <YAxis className="text-xs" />
                              <Tooltip />
                              <Line
                                type="monotone"
                                dataKey="cpu"
                                stroke="#3b82f6"
                                strokeWidth={2}
                                name="CPU使用率"
                              />
                              <Line
                                type="monotone"
                                dataKey="memory"
                                stroke="#10b981"
                                strokeWidth={2}
                                name="内存使用率"
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* 网络流量 */}
                      <div className="bg-white dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600 shadow-sm">
                        <h4 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-4">网络流量</h4>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={performanceData}>
                              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                              <XAxis dataKey="timestamp" className="text-xs" />
                              <YAxis className="text-xs" />
                              <Tooltip />
                              <Area
                                type="monotone"
                                dataKey="network"
                                stroke="#8b5cf6"
                                fill="#8b5cf6"
                                fillOpacity={0.1}
                                name="网络使用率"
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* 请求数量 */}
                      <div className="bg-white dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600 shadow-sm">
                        <h4 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-4">请求数量</h4>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={performanceData}>
                              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                              <XAxis dataKey="timestamp" className="text-xs" />
                              <YAxis className="text-xs" />
                              <Tooltip />
                              <Bar
                                dataKey="requests"
                                fill="#f59e0b"
                                radius={[4, 4, 0, 0]}
                                name="请求数量"
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* 资源使用分布 */}
                      <div className="bg-white dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600 shadow-sm">
                        <h4 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-4">资源使用分布</h4>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={[
                                  { name: 'CPU', value: metrics.cpu.usage },
                                  { name: '内存', value: (metrics.memory.used / metrics.memory.total) * 100 },
                                  { name: '磁盘', value: (metrics.disk.used / metrics.disk.total) * 100 },
                                  { name: '网络', value: 25 }
                                ]}
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                dataKey="value"
                                label={({ name, value }) => `${name}: ${value ? value.toFixed(1) : 0}%`}
                              >
                                {COLORS.map((color, index) => (
                                  <Cell key={`cell-${index}`} fill={color} />
                                ))}
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'alerts' && (
                <motion.div
                  key="alerts"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">系统警报</h3>
                    
                    <div className="space-y-4">
                      {alerts.map((alert) => (
                        <motion.div
                          key={alert.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`bg-white dark:bg-gray-700 rounded-lg border p-4 shadow-sm ${
                            alert.resolved ? 'opacity-60' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3">
                              {getAlertIcon(alert.type)}
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <h4 className="font-medium text-gray-900 dark:text-gray-100">
                                    {alert.title}
                                  </h4>
                                  {alert.resolved && (
                                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-600 text-xs rounded-full">
                                      已解决
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                  {alert.message}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {alert.timestamp.toLocaleString()}
                                </p>
                              </div>
                            </div>
                            {!alert.resolved && (
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => resolveAlert(alert.id)}
                                className="px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors"
                              >
                                标记为已解决
                              </motion.button>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'logs' && (
                <motion.div
                  key="logs"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">系统日志</h3>
                    
                    <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm text-green-400 h-96 overflow-y-auto">
                      <div className="space-y-1">
                        <div>[2024-01-15 10:30:15] INFO: System startup completed successfully</div>
                        <div>[2024-01-15 10:30:16] INFO: Database connection established</div>
                        <div>[2024-01-15 10:30:17] INFO: Web server started on port 3000</div>
                        <div>[2024-01-15 10:35:22] WARN: High CPU usage detected (85%)</div>
                        <div>[2024-01-15 10:40:33] INFO: User authentication successful for admin_user</div>
                        <div>[2024-01-15 10:45:44] ERROR: Database query timeout after 30 seconds</div>
                        <div>[2024-01-15 10:50:55] INFO: System backup completed successfully</div>
                        <div>[2024-01-15 10:55:11] WARN: Memory usage approaching threshold (88%)</div>
                        <div>[2024-01-15 11:00:22] INFO: Scheduled maintenance task completed</div>
                        <div>[2024-01-15 11:05:33] INFO: Cache cleared successfully</div>
                        <div>[2024-01-15 11:10:44] WARN: Suspicious login attempt from IP 192.168.1.100</div>
                        <div>[2024-01-15 11:15:55] INFO: Security scan completed - no threats detected</div>
                        <div>[2024-01-15 11:20:11] INFO: Performance optimization applied</div>
                        <div>[2024-01-15 11:25:22] INFO: System health check passed</div>
                        <div className="text-yellow-400">[2024-01-15 11:30:33] WARN: Disk space usage at 85%</div>
                        <div className="text-red-400">[2024-01-15 11:35:44] ERROR: Failed to connect to external API</div>
                        <div>[2024-01-15 11:40:55] INFO: External API connection restored</div>
                        <div>[2024-01-15 11:45:11] INFO: User session cleanup completed</div>
                        <div>[2024-01-15 11:50:22] INFO: System metrics updated</div>
                        <div className="animate-pulse">[2024-01-15 11:55:33] INFO: Real-time monitoring active</div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}