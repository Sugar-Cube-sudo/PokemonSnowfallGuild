'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DollarSign, 
  Plus, 
  Edit, 
  Trash2, 
  Calendar, 
  Filter,
  Download,
  TrendingUp,
  PieChart,
  BarChart3
} from 'lucide-react';
import { Module } from '@/lib/moduleLoader';
import { useAuth } from '@/contexts/AuthContext';
import { hasPermission, Permission } from '@/lib/auth';

// 会费流水记录类型
interface MembershipFeeRecord {
  id: string;
  date: Date;
  memberType: '年费' | '月费' | '免费';
  amount: number;
  memberName: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

// 统计数据类型
interface FeeStatistics {
  totalAmount: number;
  yearlyTotal: number;
  monthlyTotal: number;
  freeTotal: number;
  weeklyStats: { week: string; amount: number }[];
  monthlyStats: { month: string; amount: number }[];
  yearlyStats: { year: string; amount: number }[];
}

// 时间范围类型
type TimeRange = 'week' | 'month' | 'year' | 'all';

function MembershipFeeReportComponent() {
  const { state } = useAuth();
  const user = state.user;
  const [feeRecords, setFeeRecords] = useState<MembershipFeeRecord[]>([]);
  const [statistics, setStatistics] = useState<FeeStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MembershipFeeRecord | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [selectedMemberType, setSelectedMemberType] = useState<string>('all');

  // 新增/编辑表单状态
  const [formData, setFormData] = useState<{
    date: string;
    memberType: '年费' | '月费' | '免费';
    amount: number;
    memberName: string;
    description: string;
  }>({
    date: new Date().toISOString().split('T')[0],
    memberType: '年费',
    amount: 0,
    memberName: '',
    description: ''
  });

  // 权限检查
  const canManageFees = user && (hasPermission(user, Permission.MANAGE_REPORTS) || hasPermission(user, Permission.ADMIN));

  // 模拟数据加载
  useEffect(() => {
    const loadMockData = () => {
      const mockRecords: MembershipFeeRecord[] = [
        {
          id: '1',
          date: new Date('2024-07-15'),
          memberType: '年费',
          amount: 98765,
          memberName: '训练师小智',
          description: '年费会员续费',
          createdAt: new Date('2024-07-15'),
          updatedAt: new Date('2024-07-15')
        },
        {
          id: '2',
          date: new Date('2024-07-20'),
          memberType: '月费',
          amount: 8888,
          memberName: '训练师小霞',
          description: '月费会员',
          createdAt: new Date('2024-07-20'),
          updatedAt: new Date('2024-07-20')
        },
        {
          id: '3',
          date: new Date('2024-07-25'),
          memberType: '年费',
          amount: 12000,
          memberName: '训练师小刚',
          description: '年费会员新加入',
          createdAt: new Date('2024-07-25'),
          updatedAt: new Date('2024-07-25')
        },
        {
          id: '4',
          date: new Date('2024-08-01'),
          memberType: '免费',
          amount: 0,
          memberName: '训练师小茂',
          description: '免费会员',
          createdAt: new Date('2024-08-01'),
          updatedAt: new Date('2024-08-01')
        },
        {
          id: '5',
          date: new Date('2024-08-10'),
          memberType: '月费',
          amount: 999,
          memberName: '训练师小遥',
          description: '月费会员续费',
          createdAt: new Date('2024-08-10'),
          updatedAt: new Date('2024-08-10')
        }
      ];
      
      setFeeRecords(mockRecords);
      calculateStatistics(mockRecords);
      setLoading(false);
    };

    loadMockData();
  }, []);

  // 计算统计数据
  const calculateStatistics = (records: MembershipFeeRecord[]) => {
    const now = new Date();
    const filteredRecords = filterRecordsByTimeRange(records, timeRange);
    
    const totalAmount = filteredRecords.reduce((sum, record) => sum + record.amount, 0);
    const yearlyTotal = filteredRecords.filter(r => r.memberType === '年费').reduce((sum, r) => sum + r.amount, 0);
    const monthlyTotal = filteredRecords.filter(r => r.memberType === '月费').reduce((sum, r) => sum + r.amount, 0);
    const freeTotal = filteredRecords.filter(r => r.memberType === '免费').reduce((sum, r) => sum + r.amount, 0);

    // 按周统计
    const weeklyStats = generateWeeklyStats(filteredRecords);
    // 按月统计
    const monthlyStats = generateMonthlyStats(filteredRecords);
    // 按年统计
    const yearlyStats = generateYearlyStats(filteredRecords);

    setStatistics({
      totalAmount,
      yearlyTotal,
      monthlyTotal,
      freeTotal,
      weeklyStats,
      monthlyStats,
      yearlyStats
    });
  };

  // 根据时间范围过滤记录
  const filterRecordsByTimeRange = (records: MembershipFeeRecord[], range: TimeRange) => {
    const now = new Date();
    const startDate = new Date();

    switch (range) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case 'all':
        return records;
    }

    return records.filter(record => record.date >= startDate);
  };

  // 生成周统计
  const generateWeeklyStats = (records: MembershipFeeRecord[]) => {
    const weeks: { [key: string]: number } = {};
    records.forEach(record => {
      const weekKey = getWeekKey(record.date);
      weeks[weekKey] = (weeks[weekKey] || 0) + record.amount;
    });
    return Object.entries(weeks).map(([week, amount]) => ({ week, amount }));
  };

  // 生成月统计
  const generateMonthlyStats = (records: MembershipFeeRecord[]) => {
    const months: { [key: string]: number } = {};
    records.forEach(record => {
      const monthKey = `${record.date.getFullYear()}-${String(record.date.getMonth() + 1).padStart(2, '0')}`;
      months[monthKey] = (months[monthKey] || 0) + record.amount;
    });
    return Object.entries(months).map(([month, amount]) => ({ month, amount }));
  };

  // 生成年统计
  const generateYearlyStats = (records: MembershipFeeRecord[]) => {
    const years: { [key: string]: number } = {};
    records.forEach(record => {
      const yearKey = record.date.getFullYear().toString();
      years[yearKey] = (years[yearKey] || 0) + record.amount;
    });
    return Object.entries(years).map(([year, amount]) => ({ year, amount }));
  };

  // 获取周标识
  const getWeekKey = (date: Date) => {
    const year = date.getFullYear();
    const week = Math.ceil((date.getDate() - date.getDay() + 1) / 7);
    return `${year}-W${week}`;
  };

  // 处理添加记录
  const handleAddRecord = () => {
    if (!formData.memberName || formData.amount <= 0) {
      alert('请填写完整信息');
      return;
    }

    const newRecord: MembershipFeeRecord = {
      id: Date.now().toString(),
      date: new Date(formData.date),
      memberType: formData.memberType,
      amount: formData.amount,
      memberName: formData.memberName,
      description: formData.description,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const updatedRecords = [...feeRecords, newRecord];
    setFeeRecords(updatedRecords);
    calculateStatistics(updatedRecords);
    setShowAddForm(false);
    resetForm();
  };

  // 处理编辑记录
  const handleEditRecord = (record: MembershipFeeRecord) => {
    setEditingRecord(record);
    setFormData({
      date: record.date.toISOString().split('T')[0],
      memberType: record.memberType,
      amount: record.amount,
      memberName: record.memberName,
      description: record.description || ''
    });
    setShowAddForm(true);
  };

  // 处理更新记录
  const handleUpdateRecord = () => {
    if (!editingRecord || !formData.memberName || formData.amount <= 0) {
      alert('请填写完整信息');
      return;
    }

    const updatedRecord: MembershipFeeRecord = {
      ...editingRecord,
      date: new Date(formData.date),
      memberType: formData.memberType,
      amount: formData.amount,
      memberName: formData.memberName,
      description: formData.description,
      updatedAt: new Date()
    };

    const updatedRecords = feeRecords.map(record => 
      record.id === editingRecord.id ? updatedRecord : record
    );
    setFeeRecords(updatedRecords);
    calculateStatistics(updatedRecords);
    setShowAddForm(false);
    setEditingRecord(null);
    resetForm();
  };

  // 处理删除记录
  const handleDeleteRecord = (recordId: string) => {
    if (confirm('确定要删除这条记录吗？')) {
      const updatedRecords = feeRecords.filter(record => record.id !== recordId);
      setFeeRecords(updatedRecords);
      calculateStatistics(updatedRecords);
    }
  };

  // 重置表单
  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      memberType: '年费',
      amount: 0,
      memberName: '',
      description: ''
    });
  };

  // 导出数据
  const handleExport = () => {
    const csvContent = [
      ['日期', '会员类型', '金额', '会员姓名', '备注'],
      ...feeRecords.map(record => [
        record.date.toLocaleDateString(),
        record.memberType,
        record.amount.toString(),
        record.memberName,
        record.description || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `会费流水_${new Date().toLocaleDateString()}.csv`;
    link.click();
  };

  // 重新计算统计数据当时间范围或筛选条件改变时
  useEffect(() => {
    if (feeRecords.length > 0) {
      calculateStatistics(feeRecords);
    }
  }, [timeRange, selectedMemberType]);

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700"
      >
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </motion.div>
    );
  }

  const filteredRecords = selectedMemberType === 'all' 
    ? feeRecords 
    : feeRecords.filter(record => record.memberType === selectedMemberType);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700"
    >
      {/* 标题栏 */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                会费流水报表
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                管理和统计会员费用收入
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {canManageFees && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAddForm(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>新增记录</span>
              </motion.button>
            )}
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleExport}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>导出</span>
            </motion.button>
          </div>
        </div>
      </div>

      {/* 统计卡片 */}
      {statistics && (
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 dark:text-green-400 font-medium">总收入</p>
                  <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                    ¥{statistics.totalAmount.toLocaleString()}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500" />
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">年费收入</p>
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                    ¥{statistics.yearlyTotal.toLocaleString()}
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">月费收入</p>
                  <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                    ¥{statistics.monthlyTotal.toLocaleString()}
                  </p>
                </div>
                <BarChart3 className="w-8 h-8 text-purple-500" />
              </div>
            </div>
            

            <div className="bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20 p-4 rounded-lg border border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">免费收入</p>
                  <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">
                    ¥{statistics.freeTotal.toLocaleString()}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-gray-500" />
              </div>
            </div>
          </div>

          {/* 筛选控件 */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">时间范围:</span>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as TimeRange)}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
              >
                <option value="week">最近一周</option>
                <option value="month">最近一月</option>
                <option value="year">最近一年</option>
                <option value="all">全部</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">会员类型:</span>
              <select
                value={selectedMemberType}
                onChange={(e) => setSelectedMemberType(e.target.value)}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
              >
                <option value="all">全部</option>
                <option value="年费">年费</option>
                <option value="月费">月费</option>
                <option value="免费">免费</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* 流水记录表格 */}
      <div className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">日期</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">会员类型</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">金额</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">会员姓名</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">备注</th>
                {canManageFees && (
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">操作</th>
                )}
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((record, index) => (
                <motion.tr
                  key={record.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <td className="py-3 px-4 text-gray-900 dark:text-gray-100">
                    {record.date.toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      record.memberType === '年费' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' :
                      record.memberType === '月费' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                    }`}>
                      {record.memberType}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-medium text-green-600 dark:text-green-400">
                    ¥{record.amount.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-gray-900 dark:text-gray-100">
                    {record.memberName}
                  </td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                    {record.description || '-'}
                  </td>
                  {canManageFees && (
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEditRecord(record)}
                          className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                          title="编辑"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteRecord(record.id)}
                          className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                          title="删除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  )}
                </motion.tr>
              ))}
            </tbody>
          </table>
          
          {filteredRecords.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              暂无会费流水记录
            </div>
          )}
        </div>
      </div>

      {/* 新增/编辑表单模态框 */}
      <AnimatePresence>
        {showAddForm && (
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
              className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                {editingRecord ? '编辑会费记录' : '新增会费记录'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    日期
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    会员类型
                  </label>
                  <select
                    value={formData.memberType}
                    onChange={(e) => setFormData({ ...formData, memberType: e.target.value as '年费' | '月费' | '免费' })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="年费">年费</option>
                    <option value="月费">月费</option>
                    <option value="免费">免费</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    金额
                  </label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="请输入金额"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    会员姓名
                  </label>
                  <input
                    type="text"
                    value={formData.memberName}
                    onChange={(e) => setFormData({ ...formData, memberName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="请输入会员姓名"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    备注
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="请输入备注信息（可选）"
                    rows={3}
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingRecord(null);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  取消
                </button>
                <button
                  onClick={editingRecord ? handleUpdateRecord : handleAddRecord}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  {editingRecord ? '更新' : '添加'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// 模块配置
const MembershipFeeReportModule = {
  name: 'MembershipFeeReport',
  component: MembershipFeeReportComponent,
  position: 'main' as const,
  order: 3,
  props: {}
};

export { MembershipFeeReportModule as Module };
export default MembershipFeeReportComponent;