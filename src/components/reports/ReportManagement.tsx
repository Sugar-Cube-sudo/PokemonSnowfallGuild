'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  FileText, 
  Users, 
  Calendar, 
  Download, 
  Settings,
  Eye,
  Edit,
  Trash2,
  Share2,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { hasPermission, Permission } from '@/lib/auth';
import { 
  Report, 
  ReportConfig, 
  TableField, 
  ReportStats,
  CollaborationState,
  DEFAULT_FIELDS
} from '@/types/report';
import { 
  reportSystem,
  createReport,
  getReports,
  deleteReport,
  getReportStats
} from '@/lib/reportSystem';
import ReportTable from './ReportTable';
import DragDropField from './DragDropField';

interface ReportManagementProps {
  onClose?: () => void;
}

export default function ReportManagement({ onClose }: ReportManagementProps) {
  const { state } = useAuth();
  const user = state.user;
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [reportStats, setReportStats] = useState<ReportStats | null>(null);
  const [collaborationStatus, setCollaborationStatus] = useState<CollaborationState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 新建报表表单状态
  const [newReportConfig, setNewReportConfig] = useState<Partial<ReportConfig>>({
    name: '',
    description: '',
    fields: [...DEFAULT_FIELDS],
    permissions: {
      canView: [],
      canEdit: [],
      canDelete: [],
      isPublic: false
    },
    showInDataDisplay: true
  });

  // 权限检查
  const canCreateReports = user && hasPermission(user, Permission.MANAGE_REPORTS);
  const canManageAllReports = user && hasPermission(user, Permission.ADMIN);

  // 加载报表列表
  const loadReports = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const userReports = await getReports(user);
      setReports(userReports);
      
      // 加载统计信息
      const stats = await getReportStats('default-member-report');
      setReportStats(stats);
    } catch (err) {
      setError('加载报表失败');
      console.error('加载报表失败:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // 创建新报表
  const handleCreateReport = useCallback(async () => {
    if (!user || !newReportConfig.name || !newReportConfig.fields?.length) {
      setError('请填写完整的报表信息');
      return;
    }

    try {
      const reportConfig = {
        name: newReportConfig.name,
        description: newReportConfig.description || '',
        fields: newReportConfig.fields,
        permissions: newReportConfig.permissions || {
          canView: [],
          canEdit: [],
          canDelete: [],
          isPublic: false
        },
        isDefault: false,
        showInDataDisplay: newReportConfig.showInDataDisplay ?? true
      };

      const newReport = await createReport(reportConfig, user);
      setReports(prev => [...prev, newReport]);
      setShowCreateForm(false);
      setNewReportConfig({
        name: '',
        description: '',
        fields: [...DEFAULT_FIELDS],
        permissions: {
          canView: [],
          canEdit: [],
          canDelete: [],
          isPublic: false
        },
        showInDataDisplay: true
      });
      setSelectedReport(newReport);
    } catch (err) {
      setError('创建报表失败');
      console.error('创建报表失败:', err);
    }
  }, [user, newReportConfig]);

  // 删除报表
  const handleDeleteReport = useCallback(async (reportId: string) => {
    if (!user) return;
    
    if (!confirm('确定要删除这个报表吗？此操作不可恢复。')) {
      return;
    }

    try {
      await deleteReport(reportId, user.id);
      setReports(prev => prev.filter(r => r.id !== reportId));
      if (selectedReport?.id === reportId) {
        setSelectedReport(null);
      }
    } catch (err) {
      setError('删除报表失败');
      console.error('删除报表失败:', err);
    }
  }, [user, selectedReport]);

  // 初始化协作状态监听
  useEffect(() => {
    if (selectedReport) {
      const unsubscribe = reportSystem.subscribeToCollaboration(
        selectedReport.id,
        (status) => setCollaborationStatus(status)
      );
      return unsubscribe;
    }
  }, [selectedReport]);

  // 初始化加载
  useEffect(() => {
    loadReports();
  }, [loadReports]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600 dark:text-gray-400">加载中...</span>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* 头部 */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              报表管理
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              创建和管理数据报表，支持多人协作编辑
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* 统计信息 */}
            {reportStats && (
              <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center space-x-1">
                  <FileText className="w-4 h-4" />
                  <span>{reportStats.totalReports} 个报表</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Users className="w-4 h-4" />
                  <span>{reportStats.totalRows} 条数据</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>今日 {reportStats.todayUpdates} 次更新</span>
                </div>
              </div>
            )}
            
            {canCreateReports && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>新建报表</span>
              </button>
            )}
            
            {onClose && (
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                关闭
              </button>
            )}
          </div>
        </div>
        
        {/* 错误提示 */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg flex items-center space-x-2"
            >
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
              <span className="text-red-700 dark:text-red-300">{error}</span>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
              >
                ×
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* 左侧报表列表 */}
        <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
          <div className="p-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              报表列表
            </h2>
            
            {reports.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>暂无报表</p>
                {canCreateReports && (
                  <p className="text-sm mt-1">点击上方按钮创建第一个报表</p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {reports.map(report => (
                  <motion.div
                    key={report.id}
                    whileHover={{ scale: 1.02 }}
                    className={`
                      p-3 rounded-lg border cursor-pointer transition-all
                      ${selectedReport?.id === report.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }
                    `}
                    onClick={() => setSelectedReport(report)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 dark:text-gray-100">
                          {report.config.name}
                        </h3>
                        {report.config.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {report.config.description}
                          </p>
                        )}
                        <div className="flex items-center space-x-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
                          <span>{report.data.length} 条数据</span>
                          <span>{report.config.fields.length} 个字段</span>
                          <span>更新于 {new Date(report.updatedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-1 ml-2">
                        {/* 协作状态指示器 */}
                        {collaborationStatus && selectedReport?.id === report.id && (
                          <div className="flex items-center space-x-1">
                            {collaborationStatus.activeUsers.length > 1 && (
                              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="多人在线" />
                            )}
                            {collaborationStatus.hasConflicts && (
                              <div className="w-2 h-2 bg-red-500 rounded-full" title="存在冲突" />
                            )}
                            {collaborationStatus.syncStatus === 'syncing' && (
                              <Clock className="w-3 h-3 text-yellow-500 animate-spin" />
                            )}
                          </div>
                        )}
                        
                        {/* 操作按钮 */}
                        <div className="flex items-center space-x-1">
                          {user && reportSystem.canEditReport(report, user) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                // TODO: 编辑报表配置
                              }}
                              className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                              title="编辑配置"
                            >
                              <Settings className="w-3 h-3" />
                            </button>
                          )}
                          
                          {user && reportSystem.canDeleteReport(report, user) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteReport(report.id);
                              }}
                              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                              title="删除报表"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 右侧内容区域 */}
        <div className="flex-1 overflow-hidden">
          {selectedReport ? (
            <ReportTable
              report={selectedReport}
              onReportUpdate={() => {
                loadReports();
              }}
            />
          ) : (
            <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
              <div className="text-center text-gray-500 dark:text-gray-400">
                <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">选择一个报表开始编辑</h3>
                <p>从左侧列表中选择报表，或创建新的报表</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 创建报表模态框 */}
      <AnimatePresence>
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowCreateForm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    创建新报表
                  </h2>
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-6">
                  {/* 基本信息 */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          报表名称 *
                        </label>
                        <input
                          type="text"
                          value={newReportConfig.name || ''}
                          onChange={(e) => setNewReportConfig(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                          placeholder="输入报表名称"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          描述
                        </label>
                        <input
                          type="text"
                          value={newReportConfig.description || ''}
                          onChange={(e) => setNewReportConfig(prev => ({ ...prev, description: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                          placeholder="输入报表描述（可选）"
                        />
                      </div>
                    </div>
                    
                    {/* 显示设置 */}
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="showInDataDisplay"
                        checked={newReportConfig.showInDataDisplay || false}
                        onChange={(e) => setNewReportConfig(prev => ({ ...prev, showInDataDisplay: e.target.checked }))}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                      />
                      <label htmlFor="showInDataDisplay" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        在数据展示页面显示此报表
                      </label>
                    </div>
                  </div>

                  {/* 字段配置 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                      字段配置 *
                    </label>
                    <DragDropField
                      fields={newReportConfig.fields || []}
                      onFieldsChange={(fields) => setNewReportConfig(prev => ({ ...prev, fields }))}
                    />
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => setShowCreateForm(false)}
                      className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleCreateReport}
                      disabled={!newReportConfig.name || !newReportConfig.fields?.length}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>创建报表</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}