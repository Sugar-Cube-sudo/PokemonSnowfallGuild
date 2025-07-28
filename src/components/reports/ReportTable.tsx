'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Download, 
  Users, 
  Lock, 
  Unlock,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { 
  Report, 
  ReportRow, 
  TableField, 
  TableEditState, 
  CollaborationState,
  ExportFormat,
  ExportOptions
} from '@/types/report';
import { User } from '@/types/auth';
import { useAuth } from '@/contexts/AuthContext';
import { 
  canEditReport, 
  canDeleteReport, 
  addReportRow, 
  updateReportRow, 
  deleteReportRow,
  getCollaborationState,
  exportReportData
} from '@/lib/reportSystem';
import DragDropField from './DragDropField';
import ExportModal from './ExportModal';

interface ReportTableProps {
  report: Report;
  onReportUpdate: () => void;
}

export default function ReportTable({ report, onReportUpdate }: ReportTableProps) {
  const { state } = useAuth();
  const [editState, setEditState] = useState<TableEditState>({
    editingCell: null,
    selectedRows: [],
    draggedField: null,
    isAddingRow: false
  });
  const [collaborationState, setCollaborationState] = useState<CollaborationState | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [newRowData, setNewRowData] = useState<Record<string, any>>({});
  const [editingValue, setEditingValue] = useState<any>('');
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const tableRef = useRef<HTMLDivElement>(null);

  const canEdit = canEditReport(report, state.user!);
  const canDelete = canDeleteReport(report, state.user!);

  // 计算总金额
  useEffect(() => {
    const feeField = report.config.fields.find(field => 
      field.id === 'membershipFee' || field.name === '会费金额' || field.name === '会费'
    );
    
    if (feeField) {
      const total = report.rows.reduce((sum, row) => {
        const amount = parseFloat(row.data[feeField.id]) || 0;
        return sum + amount;
      }, 0);
      setTotalAmount(total);
    }
  }, [report.rows, report.config.fields]);

  // 获取协作状态
  useEffect(() => {
    const interval = setInterval(() => {
      const state = getCollaborationState(report.id);
      setCollaborationState(state);
    }, 2000);

    return () => clearInterval(interval);
  }, [report.id]);

  // 开始编辑单元格
  const startEditing = useCallback((rowId: string, fieldId: string, currentValue: any) => {
    if (!canEdit) return;
    
    setEditState(prev => ({
      ...prev,
      editingCell: { rowId, fieldId }
    }));
    setEditingValue(currentValue || '');
  }, [canEdit]);

  // 保存编辑
  const saveEdit = useCallback(async () => {
    if (!editState.editingCell || !state.user) return;

    const { rowId, fieldId } = editState.editingCell;
    const success = await updateReportRow(report.id, rowId, fieldId, editingValue, state.user);
    
    if (success) {
      setEditState(prev => ({ ...prev, editingCell: null }));
      setEditingValue('');
      onReportUpdate();
    }
  }, [editState.editingCell, editingValue, report.id, state.user, onReportUpdate]);

  // 取消编辑
  const cancelEdit = useCallback(() => {
    setEditState(prev => ({ ...prev, editingCell: null }));
    setEditingValue('');
  }, []);

  // 添加新行
  const addNewRow = useCallback(async () => {
    if (!state.user) return;

    const success = await addReportRow(report.id, newRowData, state.user);
    if (success) {
      setNewRowData({});
      setEditState(prev => ({ ...prev, isAddingRow: false }));
      onReportUpdate();
    }
  }, [report.id, newRowData, state.user, onReportUpdate]);

  // 删除行
  const deleteRow = useCallback(async (rowId: string) => {
    if (!state.user || !canDelete) return;
    
    if (window.confirm('确定要删除这一行数据吗？此操作不可撤销。')) {
      const success = await deleteReportRow(report.id, rowId, state.user);
      if (success) {
        onReportUpdate();
      }
    }
  }, [report.id, state.user, canDelete, onReportUpdate]);

  // 导出数据
  const handleExport = useCallback(async (options: ExportOptions) => {
    if (!state.user) return;

    const result = await exportReportData(report.id, options, state.user);
    if (result) {
      // 创建下载链接
      const blob = new Blob([result.data], { type: result.mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.filename;
      
      try {
        document.body.appendChild(a);
        a.click();
        // 安全地移除元素
        if (a.parentNode === document.body) {
          document.body.removeChild(a);
        }
      } catch (error) {
        console.warn('Failed to download file:', error);
      } finally {
        URL.revokeObjectURL(url);
      }
    }
    setShowExportModal(false);
  }, [report.id, state.user]);

  // 渲染单元格内容
  const renderCellContent = useCallback((row: ReportRow, field: TableField) => {
    const isEditing = editState.editingCell?.rowId === row.id && 
                     editState.editingCell?.fieldId === field.id;
    const value = row.data[field.id];

    if (isEditing) {
      return (
        <div className="flex items-center space-x-2">
          {field.type === 'select' ? (
            <select
              value={editingValue}
              onChange={(e) => setEditingValue(e.target.value)}
              className="flex-1 px-2 py-1 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            >
              <option value="">请选择</option>
              {field.options?.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          ) : field.type === 'boolean' ? (
            <input
              type="checkbox"
              checked={editingValue}
              onChange={(e) => setEditingValue(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              autoFocus
            />
          ) : field.type === 'date' ? (
            <input
              type="date"
              value={editingValue}
              onChange={(e) => setEditingValue(e.target.value)}
              className="flex-1 px-2 py-1 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          ) : (
            <input
              type={field.type === 'number' ? 'number' : 'text'}
              value={editingValue}
              onChange={(e) => setEditingValue(e.target.value)}
              className="flex-1 px-2 py-1 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveEdit();
                if (e.key === 'Escape') cancelEdit();
              }}
            />
          )}
          <button
            onClick={saveEdit}
            className="p-1 text-green-600 hover:text-green-800"
            title="保存"
          >
            <Save className="w-4 h-4" />
          </button>
          <button
            onClick={cancelEdit}
            className="p-1 text-red-600 hover:text-red-800"
            title="取消"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      );
    }

    // 显示值
    const displayValue = field.type === 'boolean' 
      ? (value ? '是' : '否')
      : field.type === 'date'
      ? (value ? new Date(value).toLocaleDateString('zh-CN') : '')
      : (value || '');

    return (
      <div 
        className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded ${
          canEdit ? 'group' : ''
        }`}
        onClick={() => canEdit && startEditing(row.id, field.id, value)}
      >
        <span className={field.type === 'boolean' && value ? 'text-green-600' : ''}>
          {displayValue}
        </span>
        {canEdit && (
          <Edit3 className="w-3 h-3 ml-2 opacity-0 group-hover:opacity-100 inline transition-opacity" />
        )}
      </div>
    );
  }, [editState.editingCell, editingValue, canEdit, startEditing, saveEdit, cancelEdit]);

  // 渲染协作状态指示器
  const renderCollaborationIndicator = useCallback((rowId: string, fieldId: string) => {
    if (!collaborationState) return null;

    const editingUser = collaborationState.activeUsers.find(
      user => user.editingCell?.rowId === rowId && user.editingCell?.fieldId === fieldId
    );

    if (!editingUser || editingUser.userId === state.user?.id) return null;

    return (
      <div className="absolute top-0 right-0 -mt-1 -mr-1">
        <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse" title={`${editingUser.username} 正在编辑`} />
      </div>
    );
  }, [collaborationState, state.user?.id]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
      {/* 表格头部 */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {report.config.name}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {report.config.description}
            </p>
            {/* 总金额显示 */}
            {report.config.fields.some(field => 
              field.id === 'membershipFee' || field.name === '会费金额' || field.name === '会费'
            ) && (
              <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                <span>总金额：¥{totalAmount.toLocaleString()}</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            {/* 协作状态 */}
            {collaborationState && collaborationState.activeUsers.length > 1 && (
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <Users className="w-4 h-4" />
                <span>{collaborationState.activeUsers.length} 人在线</span>
                <div className="flex -space-x-1">
                  {collaborationState.activeUsers.slice(0, 3).map(user => (
                    <div
                      key={user.userId}
                      className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs text-white font-medium border-2 border-white dark:border-gray-800"
                      title={user.username}
                    >
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 同步状态 */}
            {collaborationState && (
              <div className="flex items-center space-x-1">
                {collaborationState.syncStatus === 'synced' && (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                )}
                {collaborationState.syncStatus === 'syncing' && (
                  <Clock className="w-4 h-4 text-yellow-500 animate-spin" />
                )}
                {collaborationState.syncStatus === 'conflict' && (
                  <AlertCircle className="w-4 h-4 text-red-500" />
                )}
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex items-center space-x-2">
              {canEdit && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setEditState(prev => ({ ...prev, isAddingRow: true }))}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>添加行</span>
                </motion.button>
              )}
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowExportModal(true)}
                className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>导出</span>
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* 表格内容 */}
      <div className="overflow-x-auto" ref={tableRef}>
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              {report.config.fields.map(field => (
                <th
                  key={field.id}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  <div className="flex items-center space-x-2">
                    <span>{field.name}</span>
                    {field.required && (
                      <span className="text-red-500">*</span>
                    )}
                  </div>
                </th>
              ))}
              {(canEdit || canDelete) && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  操作
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {/* 现有数据行 */}
            {report.rows.map((row, index) => (
              <motion.tr
                key={row.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                {report.config.fields.map(field => (
                  <td key={field.id} className="px-6 py-4 whitespace-nowrap relative">
                    {renderCellContent(row, field)}
                    {renderCollaborationIndicator(row.id, field.id)}
                  </td>
                ))}
                {(canEdit || canDelete) && (
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {canDelete && (
                        <button
                          onClick={() => deleteRow(row.id)}
                          className="p-1 text-red-600 hover:text-red-800 transition-colors"
                          title="删除行"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </motion.tr>
            ))}

            {/* 添加新行 */}
            <AnimatePresence>
              {editState.isAddingRow && (
                <motion.tr
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-blue-50 dark:bg-blue-900/20"
                >
                  {report.config.fields.map(field => (
                    <td key={field.id} className="px-6 py-4">
                      {field.type === 'select' ? (
                        <select
                          value={newRowData[field.id] || ''}
                          onChange={(e) => setNewRowData(prev => ({ ...prev, [field.id]: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">请选择</option>
                          {field.options?.map(option => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      ) : field.type === 'boolean' ? (
                        <input
                          type="checkbox"
                          checked={newRowData[field.id] || false}
                          onChange={(e) => setNewRowData(prev => ({ ...prev, [field.id]: e.target.checked }))}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      ) : field.type === 'date' ? (
                        <input
                          type="date"
                          value={newRowData[field.id] || ''}
                          onChange={(e) => setNewRowData(prev => ({ ...prev, [field.id]: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <input
                          type={field.type === 'number' ? 'number' : 'text'}
                          value={newRowData[field.id] || ''}
                          onChange={(e) => setNewRowData(prev => ({ ...prev, [field.id]: e.target.value }))}
                          placeholder={field.name}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      )}
                    </td>
                  ))}
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={addNewRow}
                        className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        title="保存"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setEditState(prev => ({ ...prev, isAddingRow: false }));
                          setNewRowData({});
                        }}
                        className="p-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        title="取消"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* 空状态 */}
      {report.rows.length === 0 && !editState.isAddingRow && (
        <div className="text-center py-12">
          <div className="text-gray-400 dark:text-gray-600 mb-4">
            <Users className="w-16 h-16 mx-auto mb-4" />
            <p className="text-lg font-medium">暂无数据</p>
            <p className="text-sm">点击"添加行"开始录入数据</p>
          </div>
        </div>
      )}

      {/* 导出模态框 */}
      <AnimatePresence>
        {showExportModal && (
          <ExportModal
            isOpen={showExportModal}
            fields={report.config.fields}
            totalRows={report.rows.length}
            onExport={handleExport}
            onClose={() => setShowExportModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}