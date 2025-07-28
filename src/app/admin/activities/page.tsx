'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Calendar, 
  Users, 
  Gift, 
  Edit, 
  Trash2, 
  Eye,
  Clock,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/auth';
import { 
  ForumActivity, 
  ActivityStatus, 
  ActivityRestrictionType,
  CreateActivityRequest,
  ActivityReward,
  ActivityRestriction
} from '@/types/forum';
import { 
  getForumActivities, 
  createActivity, 
  getActivityParticipants 
} from '@/lib/forumService';
import { useRouter } from 'next/navigation';

export default function AdminActivitiesPage() {
  const { state } = useAuth();
  const user = state.user;
  const router = useRouter();
  const [activities, setActivities] = useState<ForumActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 表单状态
  const [formData, setFormData] = useState<CreateActivityRequest>({
    title: '',
    description: '',
    startTime: new Date(),
    endTime: new Date(),
    registrationDeadline: new Date(),
    rewards: [],
    restrictions: [{
      type: ActivityRestrictionType.NONE
    }],
    maxParticipants: undefined
  });

  const [newReward, setNewReward] = useState<Omit<ActivityReward, 'id'>>({ 
    type: 'item', 
    name: '', 
    description: '',
    quantity: 1 
  });
  const [newRestriction, setNewRestriction] = useState<ActivityRestriction>({ 
    type: ActivityRestrictionType.ROLE
  });

  useEffect(() => {
    // 检查权限
    if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN)) {
      router.push('/forum');
      return;
    }
    
    loadActivities();
  }, [user, router]);

  const loadActivities = async () => {
    try {
      const data = await getForumActivities();
      setActivities(data);
    } catch (error) {
      console.error('加载活动失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.description.trim()) {
      setMessage({ type: 'error', text: '请填写活动标题和描述' });
      return;
    }

    setCreating(true);
    try {
      await createActivity(user!.id, formData);
      setMessage({ type: 'success', text: '活动创建成功！' });
      setShowCreateModal(false);
      resetForm();
      await loadActivities();
    } catch (error) {
      setMessage({ type: 'error', text: '创建活动失败，请稍后重试' });
    } finally {
      setCreating(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      startTime: new Date(),
      endTime: new Date(),
      registrationDeadline: new Date(),
      rewards: [],
      restrictions: [{
        type: ActivityRestrictionType.NONE
      }],
      maxParticipants: undefined
    });
    setNewReward({ 
      type: 'item', 
      name: '', 
      description: '',
      quantity: 1 
    });
    setNewRestriction({ type: ActivityRestrictionType.ROLE });
  };

  const addReward = () => {
    if (!newReward.name.trim()) return;
    
    setFormData(prev => ({
      ...prev,
      rewards: [...prev.rewards, { ...newReward }]
    }));
    setNewReward({ 
      type: 'item', 
      name: '', 
      description: '',
      quantity: 1 
    });
  };

  const removeReward = (index: number) => {
    setFormData(prev => ({
      ...prev,
      rewards: prev.rewards.filter((_, i) => i !== index)
    }));
  };

  const addRestriction = () => {
    setFormData(prev => ({
      ...prev,
      restrictions: [...prev.restrictions, { ...newRestriction }]
    }));
    setNewRestriction({ type: ActivityRestrictionType.ROLE });
  };

  const resetRestriction = () => {
    setFormData(prev => ({
      ...prev,
      restrictions: [{ type: ActivityRestrictionType.NONE }]
    }));
  };

  const formatDeadline = (deadline: Date) => {
    return deadline.toLocaleString('zh-CN');
  };

  const getRestrictionText = (restrictions: ActivityRestriction[]) => {
    if (!restrictions || restrictions.length === 0) {
      return '无限制';
    }
    
    return restrictions.map(restriction => {
      switch (restriction.type) {
        case ActivityRestrictionType.ROLE:
          return restriction.minRole ? `最低角色: ${restriction.minRole}` : '角色限制';
        case ActivityRestrictionType.LEVEL:
          return restriction.minLevel ? `最低等级: ${restriction.minLevel}` : '等级限制';
        case ActivityRestrictionType.CUSTOM:
          return restriction.customRequirement || '自定义限制';
        case ActivityRestrictionType.NONE:
          return '无限制';
        default:
          return '未知限制';
      }
    }).join(', ');
  };

  if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN)) {
    return null;
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">活动管理</h1>
          <p className="mt-2 text-gray-600">管理论坛活动，发布新活动并查看报名情况</p>
        </div>

        {/* 消息提示 */}
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 p-4 rounded-lg flex items-center ${
              message.type === 'success' 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5 mr-2" />
            ) : (
              <AlertCircle className="w-5 h-5 mr-2" />
            )}
            {message.text}
          </motion.div>
        )}

        {/* 操作栏 */}
        <div className="mb-6 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold text-gray-900">活动列表</h2>
            <span className="text-sm text-gray-500">共 {activities.length} 个活动</span>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>创建活动</span>
          </motion.button>
        </div>

        {/* 活动列表 */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white/80 backdrop-blur-sm rounded-lg shadow-sm border p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-sm border p-12 text-center">
            <Gift className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">暂无活动</h3>
            <p className="text-gray-500 mb-6">还没有创建任何活动，点击上方按钮创建第一个活动吧！</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              创建活动
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activities.map((activity) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/80 backdrop-blur-sm rounded-lg shadow-sm border hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                      {activity.title}
                    </h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      activity.status === ActivityStatus.ACTIVE 
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {activity.status === ActivityStatus.ACTIVE ? '进行中' : '已结束'}
                    </span>
                  </div>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {activity.description}
                  </p>

                  <div className="space-y-2 text-sm text-gray-500 mb-4">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>截止: {formatDeadline(activity.registrationDeadline)}</span>
                    </div>
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-2" />
                      <span>
                        {activity.currentParticipants}
                        {activity.maxParticipants && `/${activity.maxParticipants}`}
                        人已报名
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-2" />
                      <span>限制: {getRestrictionText(activity.restrictions)}</span>
                    </div>
                  </div>

                  {activity.rewards.length > 0 && (
                    <div className="mb-4 p-3 bg-yellow-50 rounded border border-yellow-200">
                      <div className="text-sm text-yellow-700 font-medium mb-1">奖励:</div>
                      <div className="text-sm text-yellow-600">
                        {activity.rewards.map((reward, index) => (
                          <span key={index}>
                            {reward.name} x{reward.quantity}
                            {index < activity.rewards.length - 1 && ', '}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex space-x-2">
                    <button className="flex-1 flex items-center justify-center space-x-1 py-2 px-3 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors">
                      <Eye className="w-4 h-4" />
                      <span>查看</span>
                    </button>
                    <button className="flex-1 flex items-center justify-center space-x-1 py-2 px-3 text-sm bg-gray-50 text-gray-600 rounded hover:bg-gray-100 transition-colors">
                      <Edit className="w-4 h-4" />
                      <span>编辑</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* 创建活动模态框 */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">创建新活动</h3>
              </div>

              <form onSubmit={handleCreateActivity} className="p-6 space-y-6">
                {/* 基本信息 */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      活动标题 *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="输入活动标题"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      活动描述 *
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="详细描述活动内容和规则"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        活动开始时间 *
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.startTime.toISOString().slice(0, 16)}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          startTime: new Date(e.target.value) 
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        活动结束时间 *
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.endTime.toISOString().slice(0, 16)}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          endTime: new Date(e.target.value) 
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        报名截止时间 *
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.registrationDeadline.toISOString().slice(0, 16)}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          registrationDeadline: new Date(e.target.value) 
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        最大参与人数
                      </label>
                      <input
                        type="number"
                        value={formData.maxParticipants || ''}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          maxParticipants: e.target.value ? parseInt(e.target.value) : undefined 
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="不限制请留空"
                        min="1"
                      />
                    </div>
                  </div>
                </div>

                {/* 奖励设置 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    活动奖励
                  </label>
                  <div className="space-y-2">
                    {formData.rewards.map((reward, index) => (
                      <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                        <span className="text-sm">
                          {reward.name} x{reward.quantity} ({reward.type})
                          {reward.description && ` - ${reward.description}`}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeReward(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    
                    <div className="flex space-x-2">
                      <select
                        value={newReward.type}
                        onChange={(e) => setNewReward(prev => ({ 
                          ...prev, 
                          type: e.target.value as 'pokemon' | 'item' | 'badge' | 'title' | 'points'
                        }))}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="item">道具</option>
                        <option value="pokemon">宝可梦</option>
                        <option value="badge">徽章</option>
                        <option value="title">称号</option>
                        <option value="points">积分</option>
                      </select>
                      <input
                        type="text"
                        value={newReward.name}
                        onChange={(e) => setNewReward(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="奖励名称"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <input
                        type="text"
                        value={newReward.description}
                        onChange={(e) => setNewReward(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="奖励描述"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <input
                        type="number"
                        value={newReward.quantity}
                        onChange={(e) => setNewReward(prev => ({ 
                          ...prev, 
                          quantity: parseInt(e.target.value) || 1 
                        }))}
                        placeholder="数量"
                        min="1"
                        className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={addReward}
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        添加
                      </button>
                    </div>
                  </div>
                </div>

                {/* 报名限制 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    报名限制
                  </label>
                  <div className="space-y-2">
                    {formData.restrictions.some(r => r.type !== ActivityRestrictionType.NONE) && (
                      <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                        <span className="text-sm">
                          {getRestrictionText(formData.restrictions)}
                        </span>
                        <button
                          type="button"
                          onClick={resetRestriction}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    
                    <div className="flex space-x-2">
                      <select
                        value={newRestriction.type}
                        onChange={(e) => setNewRestriction(prev => ({ 
                          ...prev, 
                          type: e.target.value as ActivityRestrictionType 
                        }))}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value={ActivityRestrictionType.ROLE}>角色限制</option>
                        <option value={ActivityRestrictionType.LEVEL}>等级限制</option>
                        <option value={ActivityRestrictionType.CUSTOM}>自定义限制</option>
                      </select>
                      {newRestriction.type === ActivityRestrictionType.ROLE && (
                        <select
                          value={newRestriction.minRole || ''}
                          onChange={(e) => setNewRestriction(prev => ({ 
                            ...prev, 
                            minRole: e.target.value as any
                          }))}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">选择最低角色</option>
                          <option value="user">普通用户</option>
                          <option value="moderator">版主</option>
                          <option value="admin">管理员</option>
                        </select>
                      )}
                      {newRestriction.type === ActivityRestrictionType.LEVEL && (
                        <input
                          type="number"
                          value={newRestriction.minLevel || ''}
                          onChange={(e) => setNewRestriction(prev => ({ 
                            ...prev, 
                            minLevel: parseInt(e.target.value) || undefined
                          }))}
                          placeholder="最低等级"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      )}
                      {newRestriction.type === ActivityRestrictionType.CUSTOM && (
                        <input
                          type="text"
                          value={newRestriction.customRequirement || ''}
                          onChange={(e) => setNewRestriction(prev => ({ 
                            ...prev, 
                            customRequirement: e.target.value
                          }))}
                          placeholder="自定义要求描述"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      )}
                      <button
                        type="button"
                        onClick={addRestriction}
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        设置
                      </button>
                    </div>
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="flex space-x-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      resetForm();
                    }}
                    className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {creating ? '创建中...' : '创建活动'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}