'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, 
  Plus, 
  Search, 
  Filter, 
  TrendingUp, 
  Clock, 
  Eye, 
  Heart,
  Star,
  Users,
  Zap,
  BarChart3,
  Settings,
  Hash
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/auth';
import { PostType, ForumPost, ForumCategory } from '@/types/forum';
import PostCard from '@/components/forum/PostCard';
import CreatePostModal from '@/components/forum/CreatePostModal';
import ActivitySection from '@/components/forum/ActivitySection';
import HistoryActivitySection from '@/components/forum/HistoryActivitySection';
import MessageSection from '@/components/forum/MessageSection';
import UserAvatar from '@/components/UserAvatar';

import { AnimatedWrapper, PageTransition, HoverAnimation } from '@/components/animations/AnimationComponents';
import { useSettings } from '@/contexts/SettingsContext';

import { getForumPosts, getForumCategories } from '@/lib/forumService';
import { useRouter } from 'next/navigation';

export default function ForumPage() {
  const { state } = useAuth();
  const { settings } = useSettings();
  const router = useRouter();
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<PostType | 'all'>('all');
  const [sortBy, setSortBy] = useState<'created' | 'updated' | 'replies' | 'views' | 'likes'>('updated');

  // 检查是否为管理员（可以返回数据展示页面）
  const isAdmin = state.user?.role === UserRole.SUPER_ADMIN || 
                  state.user?.role === UserRole.ADMIN || 
                  state.user?.role === UserRole.MODERATOR;

  const handleBackToAdmin = () => {
    router.push('/');
  };

  const handleForumManagement = () => {
    router.push('/admin?view=forum');
  };

  useEffect(() => {
    loadForumData();
  }, [selectedCategory, selectedType, sortBy, searchQuery]);

  const loadForumData = async () => {
    try {
      setLoading(true);
      const [postsData, categoriesData] = await Promise.all([
        getForumPosts({
          search: searchQuery || undefined,
          type: selectedType === 'all' ? undefined : selectedType,
          categoryId: selectedCategory === 'all' ? undefined : selectedCategory,
          sortBy,
          sortOrder: 'desc',
          limit: 20
        }, state.user?.id),
        getForumCategories()
      ]);
      
      setPosts(postsData.posts);
      setCategories(categoriesData);
    } catch (error) {
      console.error('加载论坛数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = () => {
    setShowCreateModal(true);
  };

  const handlePostCreated = (newPost: ForumPost) => {
    setPosts(prev => [newPost, ...prev]);
    setShowCreateModal(false);
  };

  const getTypeIcon = (type: PostType) => {
    switch (type) {
      case PostType.DISCUSSION:
        return <MessageSquare className="w-4 h-4" />;
      case PostType.POKEMON_RENTAL:
        return <Zap className="w-4 h-4" />;
      default:
        return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: PostType) => {
    switch (type) {
      case PostType.DISCUSSION:
        return '交流帖';
      case PostType.POKEMON_RENTAL:
        return '精灵租借';
      default:
        return '未知类型';
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen relative overflow-hidden">
        
        {/* 装饰性动画元素 */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {settings.animation.enabled && (
            <>
              <motion.div
                className="absolute top-32 right-20 w-20 h-20 bg-purple-200/15 dark:bg-purple-500/8 rounded-full blur-xl"
                animate={{
                  x: [0, -60, 0],
                  y: [0, 40, 0],
                  scale: [1, 1.2, 1]
                }}
                transition={{
                  duration: 7,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              <motion.div
                className="absolute bottom-32 left-16 w-28 h-28 bg-blue-200/15 dark:bg-blue-500/8 rounded-full blur-xl"
                animate={{
                  x: [0, 80, 0],
                  y: [0, -60, 0],
                  scale: [1, 0.8, 1]
                }}
                transition={{
                  duration: 9,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1.5
                }}
              />
            </>
          )}
        </div>
        
        {/* 主要内容 */}
        <div className="relative z-10">
          {/* 页面头部 */}
          <AnimatedWrapper animation="slideIn" delay={0}>
            <header className="backdrop-blur-sm shadow-lg border-b border-gray-200/30 dark:border-gray-700/30 sticky top-0 z-50">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* 主导航栏 */}
                <div className="flex items-center justify-between h-20">
                  {/* 左侧：论坛标题和统计 */}
                  <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-4">
                      <HoverAnimation scale={1.05}>
                        <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                          <MessageSquare className="w-8 h-8 text-white" />
                        </div>
                      </HoverAnimation>
                      <div>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                          落雪论坛
                        </h1>
                        <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400 mt-1">
                          <span className="flex items-center space-x-2 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <Users className="w-4 h-4" />
                            <span className="font-medium">在线: 42</span>
                          </span>
                          <span className="flex items-center space-x-2 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-full">
                            <BarChart3 className="w-4 h-4" />
                            <span className="font-medium">今日帖子: 15</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 右侧：用户信息和快捷操作 */}
                  <div className="flex items-center space-x-4">
                    {/* 搜索框 */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="搜索帖子..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-4 py-2.5 w-72 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm"
                      />
                    </div>

                    {/* 全局设置按钮 */}
                    <HoverAnimation scale={1.02}>
                      <div className="p-2.5 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-xl transition-all duration-200">
        
                      </div>
                    </HoverAnimation>

                    {/* 用户头像 */}
                    {state.user && (
                      <HoverAnimation scale={1.02}>
                        <div className="flex items-center space-x-3 bg-gray-50 dark:bg-gray-700/50 px-3 py-2 rounded-xl">
                          <UserAvatar
                            user={{
                              ...state.user,
                              isOnline: true
                            }}
                            size="md"
                            clickable={true}
                            showStatus={true}
                            showRoleBadge={true}
                            onClick={() => router.push(`/profile/${state.user?.id}`)}
                          />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:inline">
                            {state.user?.gameNickname || '用户'}
                          </span>
                        </div>
                      </HoverAnimation>
                    )}
                  </div>
                </div>

                {/* 二级导航栏 */}
                <div className="flex items-center justify-between py-3 border-t border-gray-100 dark:border-gray-700">
                  {/* 左侧：主要功能按钮 */}
                  <div className="flex items-center space-x-2">
                    {/* 频道按钮 */}
                    <HoverAnimation scale={1.02}>
                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={() => router.push('/forum/channels')}
                        className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-sm font-medium"
                      >
                        <Hash className="w-4 h-4" />
                        <span>频道</span>
                      </motion.button>
                    </HoverAnimation>

                    {/* 管理员按钮组 */}
                    {isAdmin && (
                      <>
                        <HoverAnimation scale={1.02}>
                          <motion.button
                            whileTap={{ scale: 0.98 }}
                            onClick={handleForumManagement}
                            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-sm font-medium"
                          >
                            <Settings className="w-4 h-4" />
                            <span>论坛管理</span>
                          </motion.button>
                        </HoverAnimation>
                        <HoverAnimation scale={1.02}>
                          <motion.button
                            whileTap={{ scale: 0.98 }}
                            onClick={handleBackToAdmin}
                            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 font-medium"
                          >
                            <BarChart3 className="w-4 h-4" />
                            <span>返回数据展示</span>
                          </motion.button>
                        </HoverAnimation>
                      </>
                    )}
                  </div>

                  {/* 右侧：发帖按钮 */}
                  <div className="flex items-center">
                    <HoverAnimation scale={1.02}>
                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={handleCreatePost}
                        className="flex items-center space-x-2 px-6 py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-200 shadow-sm font-medium"
                      >
                        <Plus className="w-4 h-4" />
                        <span>发布新帖</span>
                      </motion.button>
                    </HoverAnimation>
                  </div>
                </div>
              </div>
            </header>
          </AnimatedWrapper>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* 左侧筛选栏 */}
              <div className="lg:col-span-1">
                <AnimatedWrapper animation="slideIn" delay={0.2}>
                  <div className="space-y-6">
              {/* 分类筛选 */}
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  分类筛选
                </h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      selectedCategory === 'all'
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    全部分类
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        selectedCategory === category.id
                          ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{category.name}</span>
                        <span className="text-xs text-gray-500">{category.postCount}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 帖子类型筛选 */}
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  帖子类型
                </h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setSelectedType('all')}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                      selectedType === 'all'
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>全部类型</span>
                  </button>
                  {Object.values(PostType).map((type) => (
                    <button
                      key={type}
                      onClick={() => setSelectedType(type)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                        selectedType === type
                          ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {getTypeIcon(type)}
                      <span>{getTypeLabel(type)}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 排序选项 */}
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  排序方式
                </h3>
                <div className="space-y-2">
                  {[
                    { key: 'updated' as const, label: '最新回复', icon: Clock },
                    { key: 'created' as const, label: '发布时间', icon: TrendingUp },
                    { key: 'replies' as const, label: '回复数量', icon: MessageSquare },
                    { key: 'views' as const, label: '浏览次数', icon: Eye },
                    { key: 'likes' as const, label: '点赞数量', icon: Heart }
                  ].map(({ key, label, icon: Icon }) => (
                    <button
                      key={key}
                      onClick={() => setSortBy(key)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                        sortBy === key
                          ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
                </AnimatedWrapper>
              </div>

          {/* 主内容区 */}
          <div className="lg:col-span-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {loading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 animate-pulse">
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                        <div className="flex-1 space-y-3">
                          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
                          <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
                          <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/4"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : posts.length === 0 ? (
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-lg p-12 text-center">
                  <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    暂无帖子
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6">
                    还没有人发布帖子，成为第一个发帖的人吧！
                  </p>
                  <HoverAnimation scale={1.05}>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={handleCreatePost}
                      className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      发布第一个帖子
                    </motion.button>
                  </HoverAnimation>
                </div>
              ) : (
                <AnimatePresence>
                  {posts.map((post, index) => (
                    <AnimatedWrapper
                      key={post.id}
                      animation="fadeIn"
                      delay={index * 0.1}
                    >
                      <PostCard post={post} />
                    </AnimatedWrapper>
                  ))}
                </AnimatePresence>
              )}
            </motion.div>
          </div>

          {/* 右侧活动和消息栏 */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              {/* 活动报名区域 */}
              <ActivitySection />

              {/* 历史活动区域 */}
              <HistoryActivitySection />

              {/* 站内信区域 */}
              <MessageSection />
            </motion.div>
          </div>
        </div>
      </div>

        {/* 创建帖子模态框 */}
        <CreatePostModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onPostCreated={handlePostCreated}
          categories={categories}
        />
        
     
        </div>
      </div>
    </PageTransition>
  );
}