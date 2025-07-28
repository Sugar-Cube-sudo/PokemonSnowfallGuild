'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Users,
  MessageSquare,
  Shield,
  Clock,
  AlertTriangle,
  Eye,
  EyeOff,
  Hash,
  Volume,
  VolumeX,
  Ban,
  CheckCircle,
  XCircle,
  Calendar,
  Filter
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  ForumChannel,
  ChannelType,
  ChannelStatus,
  CreateChannelRequest,
  UpdateChannelRequest,
  ChannelSpeakingRules,
  ForbiddenWordViolation
} from '@/types/forum';
import {
  getChannels,
  getChannelById,
  createChannel,
  updateChannel,
  deleteChannel,
  getForbiddenWordViolations
} from '@/lib/channelService';
import { UserRole } from '@/types/auth';
import RoleBadge from '@/components/RoleBadge';

interface ChannelFormData {
  name: string;
  description: string;
  type: ChannelType;
  icon: string;
  maxMembers: number;
  isPrivate: boolean;
  allowedRoles: UserRole[];
  speakingRules: ChannelSpeakingRules;
  forbiddenWords: string[];
  curfewEnabled: boolean;
  curfewStartHour: number;
  curfewEndHour: number;
}

interface ChannelManagementState {
  channels: ForumChannel[];
  violations: ForbiddenWordViolation[];
  loading: boolean;
  showCreateModal: boolean;
  showEditModal: boolean;
  showViolationsModal: boolean;
  editingChannel: ForumChannel | null;
  formData: ChannelFormData;
  newForbiddenWord: string;
  filterType: ChannelType | 'all';
  filterStatus: ChannelStatus | 'all';
}

const defaultFormData: ChannelFormData = {
  name: '',
  description: '',
  type: ChannelType.GENERAL,
  icon: '💬',
  maxMembers: 100,
  isPrivate: false,
  allowedRoles: [UserRole.USER, UserRole.ADMIN, UserRole.SUPER_ADMIN],
  speakingRules: {
    slowMode: false,
    slowModeInterval: 5,
    slowModeSeconds: 5,
    requireApproval: false,
    allowImages: true,
    allowLinks: true,
    maxMessageLength: 2000,
    allowMentions: true,
    allowAtAll: true
  },
  forbiddenWords: [],
  curfewEnabled: false,
  curfewStartHour: 22,
  curfewEndHour: 6
};

export default function ChannelManagement() {
  const { user } = useAuth();
  const [state, setState] = useState<ChannelManagementState>({
    channels: [],
    violations: [],
    loading: true,
    showCreateModal: false,
    showEditModal: false,
    showViolationsModal: false,
    editingChannel: null,
    formData: { ...defaultFormData },
    newForbiddenWord: '',
    filterType: 'all',
    filterStatus: 'all'
  });

  // 检查管理员权限
  const isAdmin = user && (user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN);

  // 加载频道列表
  const loadChannels = async () => {
    try {
      const channels = await getChannels({
        type: state.filterType === 'all' ? undefined : state.filterType,
        status: state.filterStatus === 'all' ? undefined : state.filterStatus
      });
      setState(prev => ({ ...prev, channels, loading: false }));
    } catch (error) {
      console.error('加载频道失败:', error);
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  // 加载违规记录
  const loadViolations = async () => {
    try {
      const violations = await getForbiddenWordViolations();
      setState(prev => ({ ...prev, violations }));
    } catch (error) {
      console.error('加载违规记录失败:', error);
    }
  };

  // 创建频道
  const handleCreateChannel = async () => {
    if (!user || !isAdmin) return;
    
    try {
      const channelData: CreateChannelRequest = {
        ...state.formData,
        creatorId: user.id
      };
      
      const result = await createChannel(user.id, user.username || user.gameNickname || 'Unknown', channelData);
      alert('频道创建成功！');
      setState(prev => ({
        ...prev,
        showCreateModal: false,
        formData: { ...defaultFormData }
      }));
      loadChannels();
    } catch (error) {
      console.error('创建频道失败:', error);
      alert('创建频道失败');
    }
  };

  // 更新频道
  const handleUpdateChannel = async () => {
    if (!user || !isAdmin || !state.editingChannel) return;
    
    try {
      const updateData: UpdateChannelRequest = {
        ...state.formData
      };
      
      const result = await updateChannel(state.editingChannel.id, updateData);
      if (result) {
        alert('频道更新成功！');
        setState(prev => ({
          ...prev,
          showEditModal: false,
          editingChannel: null,
          formData: { ...defaultFormData }
        }));
        loadChannels();
      } else {
        alert('更新失败');
      }
    } catch (error) {
      console.error('更新频道失败:', error);
      alert('更新频道失败');
    }
  };

  // 删除频道
  const handleDeleteChannel = async (channelId: string) => {
    if (!user || !isAdmin) return;
    
    if (!confirm('确定要删除这个频道吗？此操作不可恢复！')) return;
    
    try {
      const result = await deleteChannel(channelId);
      if (result.success) {
        alert('频道删除成功！');
        loadChannels();
      } else {
        alert(result.message || '删除失败');
      }
    } catch (error) {
      console.error('删除频道失败:', error);
      alert('删除频道失败');
    }
  };

  // 打开编辑模态框
  const openEditModal = async (channel: ForumChannel) => {
    try {
      const fullChannel = await getChannelById(channel.id);
      if (fullChannel) {
        setState(prev => ({
          ...prev,
          showEditModal: true,
          editingChannel: fullChannel,
          formData: {
            name: fullChannel.name,
            description: fullChannel.description,
            type: fullChannel.type,
            icon: fullChannel.icon || '💬',
            maxMembers: fullChannel.maxMembers || 100,
            isPrivate: fullChannel.isPrivate || false,
            allowedRoles: fullChannel.allowedRoles || [UserRole.USER, UserRole.ADMIN, UserRole.SUPER_ADMIN],
            speakingRules: fullChannel.speakingRules,
            forbiddenWords: fullChannel.forbiddenWords || [],
            curfewEnabled: fullChannel.curfewEnabled || false,
            curfewStartHour: fullChannel.curfewStartHour || 22,
            curfewEndHour: fullChannel.curfewEndHour || 6
          }
        }));
      }
    } catch (error) {
      console.error('加载频道详情失败:', error);
    }
  };

  // 添加违禁词
  const addForbiddenWord = () => {
    if (!state.newForbiddenWord.trim()) return;
    
    setState(prev => ({
      ...prev,
      formData: {
        ...prev.formData,
        forbiddenWords: [...prev.formData.forbiddenWords, state.newForbiddenWord.trim()]
      },
      newForbiddenWord: ''
    }));
  };

  // 删除违禁词
  const removeForbiddenWord = (index: number) => {
    setState(prev => ({
      ...prev,
      formData: {
        ...prev.formData,
        forbiddenWords: prev.formData.forbiddenWords.filter((_, i) => i !== index)
      }
    }));
  };

  // 关闭模态框
  const closeModals = () => {
    setState(prev => ({
      ...prev,
      showCreateModal: false,
      showEditModal: false,
      showViolationsModal: false,
      editingChannel: null,
      formData: { ...defaultFormData },
      newForbiddenWord: ''
    }));
  };

  // 获取频道类型名称
  const getChannelTypeName = (type: ChannelType) => {
    switch (type) {
      case ChannelType.GENERAL: return '综合讨论';
      case ChannelType.PVP: return 'PVP对战';
      case ChannelType.TRADE: return '交易频道';
      case ChannelType.HELP: return '帮助频道';
      case ChannelType.ANNOUNCEMENT: return '公告频道';
      default: return '未知类型';
    }
  };

  // 获取频道状态名称
  const getChannelStatusName = (status: ChannelStatus) => {
    switch (status) {
      case ChannelStatus.ACTIVE: return '活跃';
      case ChannelStatus.CLOSED: return '关闭';
      case ChannelStatus.ARCHIVED: return '归档';
      default: return '未知状态';
    }
  };

  // 格式化时间
  const formatTime = (date: Date) => {
    return date.toLocaleString('zh-CN');
  };

  useEffect(() => {
    if (isAdmin) {
      loadChannels();
      loadViolations();
    }
  }, [isAdmin, state.filterType, state.filterStatus]);

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">访问被拒绝</h1>
          <p className="text-gray-600">您需要管理员权限才能访问此页面</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* 页面头部 */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                <Settings className="w-8 h-8 text-blue-500" />
                频道管理
              </h1>
              <p className="text-gray-600 mt-2">管理论坛频道、设置规则和监控违规行为</p>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setState(prev => ({ ...prev, showViolationsModal: true }))}
                className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors flex items-center gap-2"
              >
                <AlertTriangle className="w-4 h-4" />
                违规记录 ({state.violations.length})
              </button>
              
              <button
                onClick={() => setState(prev => ({ ...prev, showCreateModal: true }))}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                创建频道
              </button>
            </div>
          </div>
          
          {/* 筛选器 */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">筛选:</span>
            </div>
            
            <select
              value={state.filterType}
              onChange={(e) => setState(prev => ({ ...prev, filterType: e.target.value as ChannelType | 'all' }))}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">所有类型</option>
              <option value={ChannelType.GENERAL}>综合讨论</option>
              <option value={ChannelType.PVP}>PVP对战</option>
              <option value={ChannelType.TRADE}>交易频道</option>
              <option value={ChannelType.HELP}>帮助频道</option>
              <option value={ChannelType.ANNOUNCEMENT}>公告频道</option>
            </select>
            
            <select
              value={state.filterStatus}
              onChange={(e) => setState(prev => ({ ...prev, filterStatus: e.target.value as ChannelStatus | 'all' }))}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">所有状态</option>
              <option value={ChannelStatus.ACTIVE}>活跃</option>
              <option value={ChannelStatus.CLOSED}>关闭</option>
              <option value={ChannelStatus.ARCHIVED}>归档</option>
            </select>
          </div>
        </div>
        
        {/* 频道列表 */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <Hash className="w-5 h-5 text-blue-500" />
              频道列表 ({state.channels.length})
            </h2>
          </div>
          
          {state.loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">加载中...</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {state.channels.map((channel) => (
                <motion.div
                  key={channel.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-2xl">{channel.icon || '💬'}</div>
                      
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-lg font-semibold text-gray-800">{channel.name}</h3>
                          
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            channel.status === ChannelStatus.ACTIVE
                              ? 'bg-green-100 text-green-700'
                              : channel.status === ChannelStatus.CLOSED
                              ? 'bg-red-100 text-red-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {getChannelStatusName(channel.status)}
                          </span>
                          
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                            {getChannelTypeName(channel.type)}
                          </span>
                          
                          {channel.isPrivate && (
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium flex items-center gap-1">
                              <EyeOff className="w-3 h-3" />
                              私有
                            </span>
                          )}
                          
                          {channel.curfewEnabled && (
                            <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              宵禁
                            </span>
                          )}
                        </div>
                        
                        <p className="text-gray-600 mb-2">{channel.description}</p>
                        
                        <div className="flex items-center gap-6 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {channel.memberCount}/{channel.maxMembers} 成员
                          </span>
                          
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-4 h-4" />
                            {channel.messageCount} 消息
                          </span>
                          
                          <span>创建于 {formatTime(channel.createdAt)}</span>
                          
                          {channel.forbiddenWords.length > 0 && (
                            <span className="flex items-center gap-1">
                              <Ban className="w-4 h-4" />
                              {channel.forbiddenWords.length} 违禁词
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditModal(channel)}
                        className="p-2 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => handleDeleteChannel(channel.id)}
                        className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
              
              {state.channels.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  <Hash className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>暂无频道</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* 创建/编辑频道模态框 */}
      <AnimatePresence>
        {(state.showCreateModal || state.showEditModal) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={closeModals}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-800">
                    {state.showCreateModal ? '创建频道' : '编辑频道'}
                  </h2>
                  <button
                    onClick={closeModals}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                {/* 基本信息 */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800">基本信息</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">频道名称</label>
                      <input
                        type="text"
                        value={state.formData.name}
                        onChange={(e) => setState(prev => ({
                          ...prev,
                          formData: { ...prev.formData, name: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="输入频道名称"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">频道图标</label>
                      <input
                        type="text"
                        value={state.formData.icon}
                        onChange={(e) => setState(prev => ({
                          ...prev,
                          formData: { ...prev.formData, icon: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="输入表情符号"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">频道描述</label>
                    <textarea
                      value={state.formData.description}
                      onChange={(e) => setState(prev => ({
                        ...prev,
                        formData: { ...prev.formData, description: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                      placeholder="输入频道描述"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">频道类型</label>
                      <select
                        value={state.formData.type}
                        onChange={(e) => setState(prev => ({
                          ...prev,
                          formData: { ...prev.formData, type: e.target.value as ChannelType }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value={ChannelType.GENERAL}>综合讨论</option>
                        <option value={ChannelType.PVP}>PVP对战</option>
                        <option value={ChannelType.TRADE}>交易频道</option>
                        <option value={ChannelType.HELP}>帮助频道</option>
                        <option value={ChannelType.ANNOUNCEMENT}>公告频道</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">最大成员数</label>
                      <input
                        type="number"
                        value={state.formData.maxMembers}
                        onChange={(e) => setState(prev => ({
                          ...prev,
                          formData: { ...prev.formData, maxMembers: parseInt(e.target.value) || 100 }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="1"
                        max="1000"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isPrivate"
                      checked={state.formData.isPrivate}
                      onChange={(e) => setState(prev => ({
                        ...prev,
                        formData: { ...prev.formData, isPrivate: e.target.checked }
                      }))}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="isPrivate" className="text-sm text-gray-700">私有频道（需要邀请才能加入）</label>
                  </div>
                </div>
                
                {/* 发言规则 */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800">发言规则</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="allowImages"
                          checked={state.formData.speakingRules.allowImages}
                          onChange={(e) => setState(prev => ({
                            ...prev,
                            formData: {
                              ...prev.formData,
                              speakingRules: {
                                ...prev.formData.speakingRules,
                                allowImages: e.target.checked
                              }
                            }
                          }))}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="allowImages" className="text-sm text-gray-700">允许发送图片</label>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="allowLinks"
                          checked={state.formData.speakingRules.allowLinks}
                          onChange={(e) => setState(prev => ({
                            ...prev,
                            formData: {
                              ...prev.formData,
                              speakingRules: {
                                ...prev.formData.speakingRules,
                                allowLinks: e.target.checked
                              }
                            }
                          }))}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="allowLinks" className="text-sm text-gray-700">允许发送链接</label>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="allowMentions"
                          checked={state.formData.speakingRules.allowMentions}
                          onChange={(e) => setState(prev => ({
                            ...prev,
                            formData: {
                              ...prev.formData,
                              speakingRules: {
                                ...prev.formData.speakingRules,
                                allowMentions: e.target.checked
                              }
                            }
                          }))}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="allowMentions" className="text-sm text-gray-700">允许@提及用户</label>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="requireApproval"
                          checked={state.formData.speakingRules.requireApproval}
                          onChange={(e) => setState(prev => ({
                            ...prev,
                            formData: {
                              ...prev.formData,
                              speakingRules: {
                                ...prev.formData.speakingRules,
                                requireApproval: e.target.checked
                              }
                            }
                          }))}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="requireApproval" className="text-sm text-gray-700">消息需要审核</label>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">慢速模式（秒）</label>
                        <input
                          type="number"
                          value={state.formData.speakingRules.slowModeSeconds}
                          onChange={(e) => setState(prev => ({
                            ...prev,
                            formData: {
                              ...prev.formData,
                              speakingRules: {
                                ...prev.formData.speakingRules,
                                slowModeSeconds: parseInt(e.target.value) || 0
                              }
                            }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          min="0"
                          max="3600"
                          placeholder="0表示无限制"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* 违禁词设置 */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800">违禁词设置</h3>
                  
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={state.newForbiddenWord}
                      onChange={(e) => setState(prev => ({ ...prev, newForbiddenWord: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addForbiddenWord();
                        }
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="输入违禁词"
                    />
                    <button
                      onClick={addForbiddenWord}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      添加
                    </button>
                  </div>
                  
                  {state.formData.forbiddenWords.length > 0 && (
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="flex flex-wrap gap-2">
                        {state.formData.forbiddenWords.map((word, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm"
                          >
                            {word}
                            <button
                              onClick={() => removeForbiddenWord(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* 宵禁设置 */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800">宵禁设置</h3>
                  
                  <div className="flex items-center gap-2 mb-4">
                    <input
                      type="checkbox"
                      id="curfewEnabled"
                      checked={state.formData.curfewEnabled}
                      onChange={(e) => setState(prev => ({
                        ...prev,
                        formData: { ...prev.formData, curfewEnabled: e.target.checked }
                      }))}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="curfewEnabled" className="text-sm text-gray-700">启用宵禁模式</label>
                  </div>
                  
                  {state.formData.curfewEnabled && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">宵禁开始时间</label>
                        <select
                          value={state.formData.curfewStartHour}
                          onChange={(e) => setState(prev => ({
                            ...prev,
                            formData: { ...prev.formData, curfewStartHour: parseInt(e.target.value) }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          {Array.from({ length: 24 }, (_, i) => (
                            <option key={i} value={i}>{i.toString().padStart(2, '0')}:00</option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">宵禁结束时间</label>
                        <select
                          value={state.formData.curfewEndHour}
                          onChange={(e) => setState(prev => ({
                            ...prev,
                            formData: { ...prev.formData, curfewEndHour: parseInt(e.target.value) }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          {Array.from({ length: 24 }, (_, i) => (
                            <option key={i} value={i}>{i.toString().padStart(2, '0')}:00</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                <button
                  onClick={closeModals}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={state.showCreateModal ? handleCreateChannel : handleUpdateChannel}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {state.showCreateModal ? '创建' : '保存'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* 违规记录模态框 */}
      <AnimatePresence>
        {state.showViolationsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={closeModals}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
            >
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <AlertTriangle className="w-6 h-6 text-yellow-500" />
                    违规记录
                  </h2>
                  <button
                    onClick={closeModals}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <div className="max-h-[70vh] overflow-y-auto">
                {state.violations.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
                    <p>暂无违规记录</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {state.violations.map((violation) => (
                      <div key={violation.id} className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="font-semibold text-gray-800">{violation.userName}</span>
                              <RoleBadge role={violation.userRole} size="sm" />
                              <span className="text-sm text-gray-500">{formatTime(violation.violationTime)}</span>
                            </div>
                            
                            <div className="mb-2">
                              <span className="text-sm text-gray-600">频道: </span>
                              <span className="font-medium">{violation.channelName}</span>
                            </div>
                            
                            <div className="mb-2">
                              <span className="text-sm text-gray-600">违禁词: </span>
                              <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-sm font-medium">
                                {violation.forbiddenWord}
                              </span>
                            </div>
                            
                            <div className="bg-gray-50 p-3 rounded-lg">
                              <span className="text-sm text-gray-600">原始消息: </span>
                              <p className="text-gray-800">{violation.originalMessage}</p>
                            </div>
                            
                            {violation.muteEndAt && (
                              <div className="mt-2 text-sm text-orange-600">
                                禁言至: {formatTime(violation.muteEndAt)}
                              </div>
                            )}
                          </div>
                          
                          <div className="ml-4">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              violation.muteEndAt && violation.muteEndAt > new Date()
                                ? 'bg-red-100 text-red-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {violation.muteEndAt && violation.muteEndAt > new Date() ? '禁言中' : '已解除'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}