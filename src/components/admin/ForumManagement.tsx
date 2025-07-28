'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Trash2,
  Calendar,
  Users,
  Plus,
  Filter,
  Search,
  ArrowLeft,
  AlertTriangle,
  FileText,
  Activity,
  Hash
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole, Permission } from '@/types/auth';
import { 
  ForumPost, 
  PostStatus, 
  PostModerationRequest,
  PostModerationLog,
  CreateActivityRequest,
  ForumActivity
} from '@/types/forum';
import { 
  getPendingPosts, 
  moderatePost, 
  getModerationLogs,
  createActivityPost,
  deletePost,
  getForumActivities
} from '@/lib/forumService';
import { hasPermission } from '@/lib/auth';
import CreateActivityModal from './CreateActivityModal';
import ChannelManagement from '../forum/ChannelManagement';

interface ForumManagementProps {
  onClose: () => void;
}

type ManagementView = 'pending' | 'activities' | 'logs' | 'channels';

export default function ForumManagement({ onClose }: ForumManagementProps) {
  const { state } = useAuth();
  const [currentView, setCurrentView] = useState<ManagementView>('pending');
  const [pendingPosts, setPendingPosts] = useState<ForumPost[]>([]);
  const [activities, setActivities] = useState<ForumActivity[]>([]);
  const [moderationLogs, setModerationLogs] = useState<PostModerationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateActivity, setShowCreateActivity] = useState(false);
  const [selectedPost, setSelectedPost] = useState<ForumPost | null>(null);
  const [showPostDetail, setShowPostDetail] = useState(false);

  // 检查权限
  const canModerate = hasPermission(state.user, Permission.FORUM_MODERATE);
  const canManageActivities = hasPermission(state.user, Permission.FORUM_MANAGE_ACTIVITIES);
  const canCreateActivities = hasPermission(state.user, Permission.FORUM_CREATE_ACTIVITIES);
  const canDeletePosts = hasPermission(state.user, Permission.FORUM_DELETE_POSTS);

  useEffect(() => {
    loadData();
  }, [currentView]);

  const loadData = async () => {
    try {
      setLoading(true);
      switch (currentView) {
        case 'pending':
          if (canModerate) {
            const posts = await getPendingPosts();
            setPendingPosts(posts);
          }
          break;
        case 'activities':
          if (canManageActivities) {
            const activitiesData = await getForumActivities();
            setActivities(activitiesData);
          }
          break;
        case 'logs':
          if (canModerate) {
            const logs = await getModerationLogs();
            setModerationLogs(logs);
          }
          break;
      }
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleModeratePost = async (postId: string, action: 'approve' | 'reject', reason?: string) => {
    if (!state.user || !canModerate) return;
    
    try {
      setProcessing(postId);
      const moderationData: PostModerationRequest = {
        postId,
        action,
        reason,
        moderatorNote: `由 ${state.user.username} 执行${action === 'approve' ? '审核通过' : '审核拒绝'}操作`
      };
      
      const result = await moderatePost(state.user.id, state.user.username, moderationData);
      
      if (result.success) {
        // 重新加载待审核帖子列表
        const posts = await getPendingPosts();
        setPendingPosts(posts);
      }
    } catch (error) {
      console.error('审核操作失败:', error);
    } finally {
      setProcessing(null);
    }
  };

  const handleDeletePost = async (postId: string, reason?: string) => {
    if (!state.user || !canDeletePosts) return;
    
    if (!window.confirm('确定要删除这个帖子吗？此操作不可撤销。')) {
      return;
    }
    
    try {
      setProcessing(postId);
      const result = await deletePost(state.user.id, state.user.username, postId, reason);
      
      if (result.success) {
        // 重新加载数据
        loadData();
      }
    } catch (error) {
      console.error('删除帖子失败:', error);
    } finally {
      setProcessing(null);
    }
  };

  const handleCreateActivity = async (activityData: CreateActivityRequest) => {
    if (!state.user || !canCreateActivities) return;
    
    try {
      const result = await createActivityPost(
        state.user.id,
        state.user.username,
        state.user.role,
        activityData
      );
      
      if (result) {
        setShowCreateActivity(false);
        // 重新加载活动列表
        if (currentView === 'activities') {
          const activitiesData = await getForumActivities();
          setActivities(activitiesData);
        }
      }
    } catch (error) {
      console.error('创建活动失败:', error);
    }
  };

  const filteredPendingPosts = pendingPosts.filter(post =>
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.authorName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredActivities = activities.filter(activity =>
    activity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    activity.organizerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredLogs = moderationLogs.filter(log =>
    log.moderatorName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: PostStatus) => {
    switch (status) {
      case PostStatus.PENDING:
        return 'text-orange-600 bg-orange-100 dark:bg-orange-900/30';
      case PostStatus.ACTIVE:
        return 'text-green-600 bg-green-100 dark:bg-green-900/30';
      case PostStatus.REJECTED:
        return 'text-red-600 bg-red-100 dark:bg-red-900/30';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900/30';
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'approve':
        return 'text-green-600';
      case 'reject':
        return 'text-red-600';
      case 'delete':
        return 'text-red-600';
      default:
        return 'text-gray-600';
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
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">论坛管理</h2>
                <p className="text-blue-100 text-sm">管理帖子审核、活动发布和论坛内容</p>
              </div>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </motion.button>
          </div>
        </div>

        {/* 导航标签 */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex space-x-1 p-4">
            {canModerate && (
              <button
                onClick={() => setCurrentView('pending')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  currentView === 'pending'
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Clock className="w-4 h-4 inline mr-2" />
                待审核帖子
              </button>
            )}
            
            {canManageActivities && (
              <button
                onClick={() => setCurrentView('activities')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  currentView === 'activities'
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Activity className="w-4 h-4 inline mr-2" />
                活动管理
              </button>
            )}
            
            {canModerate && (
              <button
                onClick={() => setCurrentView('logs')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  currentView === 'logs'
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <FileText className="w-4 h-4 inline mr-2" />
                审核日志
              </button>
            )}
            
            {canModerate && (
              <button
                onClick={() => setCurrentView('channels')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  currentView === 'channels'
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Hash className="w-4 h-4 inline mr-2" />
                频道管理
              </button>
            )}
          </div>
        </div>

        {/* 工具栏 */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-64 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>
            
            {currentView === 'activities' && canCreateActivities && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCreateActivity(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200"
              >
                <Plus className="w-4 h-4" />
                <span>创建活动</span>
              </motion.button>
            )}
          </div>
        </div>

        {/* 内容区域 */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-3 text-gray-600 dark:text-gray-400">加载中...</span>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {/* 待审核帖子 */}
              {currentView === 'pending' && (
                <motion.div
                  key="pending"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  {filteredPendingPosts.length === 0 ? (
                    <div className="text-center py-12">
                      <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        暂无待审核帖子
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400">
                        所有帖子都已处理完毕
                      </p>
                    </div>
                  ) : (
                    filteredPendingPosts.map((post) => (
                      <motion.div
                        key={post.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6 border border-gray-200 dark:border-gray-600"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-3">
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {post.title}
                              </h3>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                getStatusColor(post.status)
                              }`}>
                                待审核
                              </span>
                            </div>
                            
                            <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
                              <span>作者: {post.authorName}</span>
                              <span>•</span>
                              <span>发布时间: {post.createdAt.toLocaleString()}</span>
                              <span>•</span>
                              <span>类型: {post.type === 'discussion' ? '交流帖' : '租借帖'}</span>
                            </div>
                            
                            <div 
                              className="text-gray-700 dark:text-gray-300 line-clamp-3"
                              ref={(el) => {
                                if (el) {
                                  const truncatedContent = post.content.substring(0, 200) + '...';
                                  if (el.innerHTML !== truncatedContent) {
                                    el.innerHTML = truncatedContent;
                                  }
                                }
                              }}
                            />
                          </div>
                          
                          <div className="flex items-center space-x-2 ml-4">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => {
                                setSelectedPost(post);
                                setShowPostDetail(true);
                              }}
                              className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                              title="查看详情"
                            >
                              <Eye className="w-4 h-4" />
                            </motion.button>
                            
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleModeratePost(post.id, 'approve')}
                              disabled={processing === post.id}
                              className="p-2 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors disabled:opacity-50"
                              title="审核通过"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </motion.button>
                            
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => {
                                const reason = window.prompt('请输入拒绝原因（可选）:');
                                if (reason !== null) {
                                  handleModeratePost(post.id, 'reject', reason || undefined);
                                }
                              }}
                              disabled={processing === post.id}
                              className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50"
                              title="审核拒绝"
                            >
                              <XCircle className="w-4 h-4" />
                            </motion.button>
                            
                            {canDeletePosts && (
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => {
                                  const reason = window.prompt('请输入删除原因（可选）:');
                                  if (reason !== null) {
                                    handleDeletePost(post.id, reason || undefined);
                                  }
                                }}
                                disabled={processing === post.id}
                                className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50"
                                title="删除帖子"
                              >
                                <Trash2 className="w-4 h-4" />
                              </motion.button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </motion.div>
              )}
              
              {/* 活动管理 */}
              {currentView === 'activities' && (
                <motion.div
                  key="activities"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  {filteredActivities.length === 0 ? (
                    <div className="text-center py-12">
                      <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        暂无活动
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400">
                        还没有创建任何活动
                      </p>
                    </div>
                  ) : (
                    filteredActivities.map((activity) => (
                      <motion.div
                        key={activity.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6 border border-gray-200 dark:border-gray-600"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-3">
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {activity.title}
                              </h3>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                activity.status === 'active' ? 'text-green-600 bg-green-100 dark:bg-green-900/30' :
                                activity.status === 'upcoming' ? 'text-blue-600 bg-blue-100 dark:bg-blue-900/30' :
                                'text-gray-600 bg-gray-100 dark:bg-gray-900/30'
                              }`}>
                                {activity.status === 'active' ? '进行中' :
                                 activity.status === 'upcoming' ? '即将开始' :
                                 activity.status === 'ended' ? '已结束' : '已取消'}
                              </span>
                            </div>
                            
                            <p className="text-gray-700 dark:text-gray-300 mb-4">
                              {activity.description}
                            </p>
                            
                            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
                              <div>
                                <span className="font-medium">活动时间:</span>
                                <br />
                                {activity.startTime.toLocaleString()} - {activity.endTime.toLocaleString()}
                              </div>
                              <div>
                                <span className="font-medium">报名情况:</span>
                                <br />
                                {activity.currentParticipants} / {activity.maxParticipants || '无限制'} 人
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </motion.div>
              )}
              
              {/* 审核日志 */}
              {currentView === 'logs' && (
                <motion.div
                  key="logs"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  {filteredLogs.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        暂无审核日志
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400">
                        还没有任何审核操作记录
                      </p>
                    </div>
                  ) : (
                    filteredLogs.map((log) => (
                      <motion.div
                        key={log.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-200 dark:border-gray-600"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className={`w-2 h-2 rounded-full ${
                              log.action === 'approve' ? 'bg-green-500' :
                              log.action === 'reject' ? 'bg-red-500' :
                              'bg-gray-500'
                            }`} />
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {log.moderatorName}
                                </span>
                                <span className={`text-sm font-medium ${
                                  getActionColor(log.action)
                                }`}>
                                  {log.action === 'approve' ? '审核通过' :
                                   log.action === 'reject' ? '审核拒绝' : '删除帖子'}
                                </span>
                                <span className="text-sm text-gray-500">
                                  帖子 ID: {log.postId}
                                </span>
                              </div>
                              {log.reason && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                  原因: {log.reason}
                                </p>
                              )}
                              {log.note && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                  备注: {log.note}
                                </p>
                              )}
                            </div>
                          </div>
                          <span className="text-sm text-gray-500">
                            {log.createdAt.toLocaleString()}
                          </span>
                        </div>
                      </motion.div>
                    ))
                  )}
                </motion.div>
              )}
              
              {/* 频道管理 */}
              {currentView === 'channels' && (
                <motion.div
                  key="channels"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="-m-6"
                >
                  <ChannelManagement />
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </motion.div>
      
      {/* 创建活动模态框 */}
      {showCreateActivity && (
        <CreateActivityModal
          isOpen={showCreateActivity}
          onClose={() => setShowCreateActivity(false)}
          onActivityCreated={handleCreateActivity}
        />
      )}
      
      {/* 帖子详情模态框 */}
      {showPostDetail && selectedPost && (
        <PostDetailModal
          post={selectedPost}
          onClose={() => {
            setShowPostDetail(false);
            setSelectedPost(null);
          }}
          onModerate={handleModeratePost}
          onDelete={handleDeletePost}
          canModerate={canModerate}
          canDelete={canDeletePosts}
          processing={processing === selectedPost.id}
        />
      )}
    </div>
  );
}

// 帖子详情模态框组件
interface PostDetailModalProps {
  post: ForumPost;
  onClose: () => void;
  onModerate: (postId: string, action: 'approve' | 'reject', reason?: string) => void;
  onDelete: (postId: string, reason?: string) => void;
  canModerate: boolean;
  canDelete: boolean;
  processing: boolean;
}

function PostDetailModal({ 
  post, 
  onClose, 
  onModerate, 
  onDelete, 
  canModerate, 
  canDelete, 
  processing 
}: PostDetailModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-60 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden"
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              帖子详情
            </h3>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {post.title}
              </h2>
              <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                <span>作者: {post.authorName}</span>
                <span>•</span>
                <span>发布时间: {post.createdAt.toLocaleString()}</span>
                <span>•</span>
                <span>类型: {post.type === 'discussion' ? '交流帖' : '租借帖'}</span>
              </div>
            </div>
            
            <div 
              className="prose dark:prose-invert max-w-none"
              ref={(el) => {
                if (el && el.innerHTML !== post.content) {
                  el.innerHTML = post.content;
                }
              }}
            />
            
            {post.tags && post.tags.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">标签:</span>
                {post.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {(canModerate || canDelete) && (
          <div className="p-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-end space-x-3">
              {canModerate && (
                <>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onModerate(post.id, 'approve')}
                    disabled={processing}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>审核通过</span>
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      const reason = window.prompt('请输入拒绝原因（可选）:');
                      if (reason !== null) {
                        onModerate(post.id, 'reject', reason || undefined);
                      }
                    }}
                    disabled={processing}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>审核拒绝</span>
                  </motion.button>
                </>
              )}
              
              {canDelete && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    const reason = window.prompt('请输入删除原因（可选）:');
                    if (reason !== null) {
                      onDelete(post.id, reason || undefined);
                    }
                  }}
                  disabled={processing}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>删除帖子</span>
                </motion.button>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}