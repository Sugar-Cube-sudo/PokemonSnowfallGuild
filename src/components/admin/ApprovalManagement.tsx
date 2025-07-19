'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, 
  Check, 
  X, 
  Eye, 
  AlertCircle, 
  User, 
  Calendar,
  Filter,
  Search,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ApprovalRequest, ApprovalStatus, UserRole } from '@/types/auth';
import RoleBadge from '@/components/RoleBadge';

interface ApprovalManagementProps {
  onClose: () => void;
}

export default function ApprovalManagement({ onClose }: ApprovalManagementProps) {
  const { state } = useAuth();
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ApprovalStatus | 'all'>('all');
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // 模拟审核请求数据
  const mockRequests: ApprovalRequest[] = [
    {
      id: '1',
      type: 'USER_UPDATE',
      requesterId: 'admin1',
      requesterName: 'admin_user',
      requesterRole: UserRole.ADMIN,
      targetUserId: 'user1',
      targetUserName: 'john_doe',
      changes: {
        email: { from: 'john@old.com', to: 'john@new.com' },
        role: { from: UserRole.USER, to: UserRole.MODERATOR }
      },
      reason: '用户申请升级为版主，已通过内部评估',
      status: ApprovalStatus.PENDING,
      createdAt: new Date('2024-01-15T10:30:00'),
      reviewedAt: undefined,
      reviewerId: undefined,
      reviewerName: undefined,
      reviewComment: undefined
    },
    {
      id: '2',
      type: 'USER_DELETE',
      requesterId: 'admin2',
      requesterName: 'admin_user2',
      requesterRole: UserRole.ADMIN,
      targetUserId: 'user2',
      targetUserName: 'spam_user',
      changes: {},
      reason: '用户违反社区规定，发布垃圾信息',
      status: ApprovalStatus.APPROVED,
      createdAt: new Date('2024-01-14T15:20:00'),
      reviewedAt: new Date('2024-01-14T16:45:00'),
      reviewerId: 'super_admin',
      reviewerName: 'super_admin',
      reviewComment: '确认违规，同意删除'
    },
    {
      id: '3',
      type: 'PASSWORD_RESET',
      requesterId: 'admin1',
      requesterName: 'admin_user',
      requesterRole: UserRole.ADMIN,
      targetUserId: 'user3',
      targetUserName: 'forgot_password_user',
      changes: {},
      reason: '用户忘记密码，申请重置',
      status: ApprovalStatus.REJECTED,
      createdAt: new Date('2024-01-13T09:15:00'),
      reviewedAt: new Date('2024-01-13T11:30:00'),
      reviewerId: 'super_admin',
      reviewerName: 'super_admin',
      reviewComment: '用户可通过邮箱自助重置，无需管理员干预'
    }
  ];

  // 加载审核请求
  const loadRequests = async () => {
    setLoading(true);
    // 模拟API调用
    setTimeout(() => {
      setRequests(mockRequests);
      setLoading(false);
    }, 1000);
  };

  useEffect(() => {
    loadRequests();
  }, []);

  // 过滤请求
  const filteredRequests = requests.filter(request => {
    const matchesSearch = request.requesterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.targetUserName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.reason.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // 处理审核
  const handleApproval = async (requestId: string, approved: boolean, comment: string) => {
    // 模拟API调用
    setRequests(prev => prev.map(req => 
      req.id === requestId 
        ? {
            ...req,
            status: approved ? ApprovalStatus.APPROVED : ApprovalStatus.REJECTED,
            reviewedAt: new Date(),
            reviewerId: state.user?.id,
            reviewerName: state.user?.username,
            reviewComment: comment
          }
        : req
    ));
    setShowDetailModal(false);
    setSelectedRequest(null);
  };

  const getStatusColor = (status: ApprovalStatus) => {
    switch (status) {
      case ApprovalStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case ApprovalStatus.APPROVED:
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case ApprovalStatus.REJECTED:
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: ApprovalStatus) => {
    switch (status) {
      case ApprovalStatus.PENDING:
        return <Clock className="w-4 h-4" />;
      case ApprovalStatus.APPROVED:
        return <Check className="w-4 h-4" />;
      case ApprovalStatus.REJECTED:
        return <X className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'USER_UPDATE':
        return '用户信息修改';
      case 'USER_DELETE':
        return '用户删除';
      case 'PASSWORD_RESET':
        return '密码重置';
      default:
        return type;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden"
      >
        {/* 头部 */}
        <div className="bg-gradient-to-r from-orange-500 to-red-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">审核管理</h2>
                <p className="text-orange-100 text-sm">管理员操作审核</p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <X className="w-5 h-5" />
            </motion.button>
          </div>
        </div>

        {/* 工具栏 */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-1 gap-4">
              {/* 搜索框 */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="搜索申请人、目标用户或原因..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              {/* 状态过滤 */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as ApprovalStatus | 'all')}
                  className="pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="all">所有状态</option>
                  <option value={ApprovalStatus.PENDING}>待审核</option>
                  <option value={ApprovalStatus.APPROVED}>已批准</option>
                  <option value={ApprovalStatus.REJECTED}>已拒绝</option>
                </select>
              </div>
            </div>

            {/* 刷新按钮 */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={loadRequests}
              disabled={loading}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              刷新
            </motion.button>
          </div>
        </div>

        {/* 请求列表 */}
        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full"
              />
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">没有找到审核请求</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredRequests.map((request) => (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(request.status)}`}>
                          {getStatusIcon(request.status)}
                          {request.status === ApprovalStatus.PENDING ? '待审核' :
                           request.status === ApprovalStatus.APPROVED ? '已批准' : '已拒绝'}
                        </span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 rounded-full text-xs font-medium">
                          {getTypeLabel(request.type)}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">申请人</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-900 dark:text-gray-100">{request.requesterName}</span>
                            <RoleBadge role={request.requesterRole} size="sm" />
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">目标用户</span>
                          </div>
                          <span className="text-sm text-gray-900 dark:text-gray-100">{request.targetUserName}</span>
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">申请原因：</span>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{request.reason}</p>
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>申请时间: {request.createdAt.toLocaleString()}</span>
                        </div>
                        {request.reviewedAt && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>审核时间: {request.reviewedAt.toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                      
                      {request.reviewComment && (
                        <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-600 rounded text-sm">
                          <span className="font-medium text-gray-700 dark:text-gray-300">审核意见：</span>
                          <span className="text-gray-600 dark:text-gray-400 ml-1">{request.reviewComment}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setSelectedRequest(request);
                          setShowDetailModal(true);
                        }}
                        className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center hover:bg-blue-200 dark:hover:bg-blue-900/40 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* 详情模态框 */}
      <AnimatePresence>
        {showDetailModal && selectedRequest && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-60 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-auto"
            >
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  审核详情
                </h3>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        申请类型
                      </label>
                      <p className="text-sm text-gray-900 dark:text-gray-100">{getTypeLabel(selectedRequest.type)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        当前状态
                      </label>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedRequest.status)}`}>
                        {getStatusIcon(selectedRequest.status)}
                        {selectedRequest.status === ApprovalStatus.PENDING ? '待审核' :
                         selectedRequest.status === ApprovalStatus.APPROVED ? '已批准' : '已拒绝'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        申请人
                      </label>
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-gray-900 dark:text-gray-100">{selectedRequest.requesterName}</p>
                        <RoleBadge role={selectedRequest.requesterRole} size="sm" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        目标用户
                      </label>
                      <p className="text-sm text-gray-900 dark:text-gray-100">{selectedRequest.targetUserName}</p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      申请原因
                    </label>
                    <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                      {selectedRequest.reason}
                    </p>
                  </div>
                  
                  {Object.keys(selectedRequest.changes).length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        变更内容
                      </label>
                      <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg space-y-2">
                        {Object.entries(selectedRequest.changes).map(([key, change]) => (
                          <div key={key} className="text-sm">
                            <span className="font-medium text-gray-700 dark:text-gray-300">{key}:</span>
                            <span className="text-red-600 dark:text-red-400 ml-2">{String((change as any).from)}</span>
                            <span className="text-gray-500 mx-2">→</span>
                            <span className="text-green-600 dark:text-green-400">{String((change as any).to)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        申请时间
                      </label>
                      <p className="text-sm text-gray-900 dark:text-gray-100">{selectedRequest.createdAt.toLocaleString()}</p>
                    </div>
                    {selectedRequest.reviewedAt && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          审核时间
                        </label>
                        <p className="text-sm text-gray-900 dark:text-gray-100">{selectedRequest.reviewedAt.toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                  
                  {selectedRequest.reviewComment && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        审核意见
                      </label>
                      <p className="text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                        {selectedRequest.reviewComment}
                      </p>
                    </div>
                  )}
                  
                  {selectedRequest.status === ApprovalStatus.PENDING && state.user?.role === UserRole.SUPER_ADMIN && (
                    <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        审核意见
                      </label>
                      <textarea
                        placeholder="请输入审核意见..."
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                        rows={3}
                        id="reviewComment"
                      />
                      
                      <div className="flex gap-3 mt-4">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            const comment = (document.getElementById('reviewComment') as HTMLTextAreaElement)?.value || '';
                            handleApproval(selectedRequest.id, false, comment);
                          }}
                          className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                        >
                          <X className="w-4 h-4" />
                          拒绝
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            const comment = (document.getElementById('reviewComment') as HTMLTextAreaElement)?.value || '';
                            handleApproval(selectedRequest.id, true, comment);
                          }}
                          className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                        >
                          <Check className="w-4 h-4" />
                          批准
                        </motion.button>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end mt-6">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setShowDetailModal(false);
                      setSelectedRequest(null);
                    }}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    关闭
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}