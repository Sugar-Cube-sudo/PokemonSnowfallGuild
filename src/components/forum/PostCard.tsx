'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  MessageSquare, 
  Eye, 
  Heart, 
  Clock, 
  Pin, 
  Lock, 
  Zap,
  Star,
  User,
  Calendar,
  Timer
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ForumPost, PostType, RentalStatus } from '@/types/forum';
import { likePost } from '@/lib/forumService';
import { useAuth } from '@/contexts/AuthContext';
import UserAvatar from '@/components/UserAvatar';

interface PostCardProps {
  post: ForumPost;
}

export default function PostCard({ post }: PostCardProps) {
  const router = useRouter();
  const { state } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [isLiking, setIsLiking] = useState(false);

  const handlePostClick = () => {
    router.push(`/forum/post/${post.id}`);
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!state.user || isLiking) return;
    
    setIsLiking(true);
    try {
      const updatedPost = await likePost(post.id, state.user.id);
      setIsLiked(updatedPost.likedByCurrentUser ?? false);
      setLikeCount(updatedPost.likeCount);
    } catch (error) {
      console.error('点赞失败:', error);
    } finally {
      setIsLiking(false);
    }
  };

  const getPostTypeInfo = () => {
    switch (post.type) {
      case PostType.DISCUSSION:
        return {
          icon: <MessageSquare className="w-4 h-4" />,
          label: '交流帖',
          color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
        };
      case PostType.POKEMON_RENTAL:
        return {
          icon: <Zap className="w-4 h-4" />,
          label: '精灵租借',
          color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
        };
      default:
        return {
          icon: <MessageSquare className="w-4 h-4" />,
          label: '未知',
          color: 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300'
        };
    }
  };

  const getRentalStatusInfo = () => {
    if (!post.rentalInfo) return null;
    
    switch (post.rentalInfo.status) {
      case RentalStatus.AVAILABLE:
        return {
          label: '可租借',
          color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
        };
      case RentalStatus.PENDING:
        return {
          label: '待确认',
          color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
        };
      case RentalStatus.RENTED:
        return {
          label: '已租借',
          color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
        };
      case RentalStatus.COMPLETED:
        return {
          label: '已完成',
          color: 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300'
        };
      case RentalStatus.CANCELLED:
        return {
          label: '已取消',
          color: 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300'
        };
      default:
        return null;
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return '刚刚';
    } else if (diffInSeconds < 3600) {
      return `${Math.floor(diffInSeconds / 60)}分钟前`;
    } else if (diffInSeconds < 86400) {
      return `${Math.floor(diffInSeconds / 3600)}小时前`;
    } else if (diffInSeconds < 2592000) {
      return `${Math.floor(diffInSeconds / 86400)}天前`;
    } else {
      return date.toLocaleDateString('zh-CN');
    }
  };

  const stripHtmlTags = (html: string) => {
    return html.replace(/<[^>]*>/g, '').substring(0, 150) + (html.length > 150 ? '...' : '');
  };

  const typeInfo = getPostTypeInfo();
  const rentalStatusInfo = getRentalStatusInfo();

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer overflow-hidden"
      onClick={handlePostClick}
    >
      <div className="p-6">
        {/* 帖子头部 */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-3 flex-1">
            {/* 用户头像 */}
            <UserAvatar 
              user={{
                id: post.authorId,
                username: post.authorName,
                avatarUrl: post.authorAvatar,
                isOnline: Math.random() > 0.5 // 模拟在线状态
              } as any}
              size="md"
              showTooltip
              showStatus
              showRoleBadge
              clickable
              onClick={(e) => {
                e?.stopPropagation();
                router.push(`/profile/${post.authorId}`);
              }}
            />
            
            <div className="flex-1 min-w-0">
              {/* 标题和标签 */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    {post.isSticky && (
                      <Pin className="w-4 h-4 text-red-500" />
                    )}
                    {post.isLocked && (
                      <Lock className="w-4 h-4 text-gray-500" />
                    )}
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2">
                      {post.title}
                    </h3>
                  </div>
                  
                  {/* 标签 */}
                  <div className="flex items-center space-x-2 mb-2">
                    <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${typeInfo.color}`}>
                      {typeInfo.icon}
                      <span>{typeInfo.label}</span>
                    </span>
                    
                    {rentalStatusInfo && (
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${rentalStatusInfo.color}`}>
                        {rentalStatusInfo.label}
                      </span>
                    )}
                    
                    {post.tags?.slice(0, 3).map((tag, index) => (
                      <span 
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* 作者和时间信息 */}
              <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mb-3">
                <div className="flex items-center space-x-1">
                  <User className="w-4 h-4" />
                  <span>{post.authorName}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>{formatTimeAgo(post.createdAt)}</span>
                </div>
                {post.lastReplyAt && (
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>最后回复: {formatTimeAgo(post.lastReplyAt)}</span>
                  </div>
                )}
              </div>
              
              {/* 帖子内容预览 */}
              <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2 mb-4">
                {stripHtmlTags(post.content)}
              </p>
              
              {/* 精灵租借信息 */}
              {post.rentalInfo && (
                <div className="bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 dark:from-yellow-900/20 dark:via-orange-900/20 dark:to-red-900/20 rounded-2xl p-5 mb-4 border border-yellow-200/50 dark:border-yellow-700/50 shadow-lg hover:shadow-xl transition-all duration-300 group">
                  {/* 背景装饰 */}
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/5 via-orange-400/5 to-red-400/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  <div className="flex items-center space-x-4 relative z-10">
                    {post.rentalInfo.pokemonImageUrl && (
                      <div className="relative">
                        <div className="relative w-16 h-16 bg-gradient-to-br from-white via-yellow-50 to-orange-100 dark:from-gray-700 dark:via-yellow-900/30 dark:to-orange-900/30 rounded-2xl flex items-center justify-center overflow-hidden shadow-inner border-2 border-yellow-200/50 dark:border-yellow-600/50">
                          {post.rentalInfo.isShiny && (
                            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 via-pink-400/20 to-purple-400/20 rounded-2xl animate-pulse"></div>
                          )}
                          {post.rentalInfo.isShiny && (
                            <div className="absolute -top-1 -right-1 z-20">
                              <div className="relative">
                                <div className="w-5 h-5 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center shadow-lg">
                                  <span className="text-white text-xs font-bold">✨</span>
                                </div>
                                <div className="absolute inset-0 animate-ping">
                                  <div className="w-5 h-5 bg-yellow-300 rounded-full opacity-75"></div>
                                </div>
                              </div>
                            </div>
                          )}
                          <img 
                            src={post.rentalInfo.pokemonImageUrl} 
                            alt={post.rentalInfo.pokemonName}
                            className="w-full h-full object-cover transition-all duration-300 transform group-hover:scale-110"
                          />
                        </div>
                        
                        {/* 等级徽章 */}
                        <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg border-2 border-white dark:border-gray-800">
                          Lv.{post.rentalInfo.pokemonLevel}
                        </div>
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-bold text-lg text-gray-900 dark:text-white">
                          {post.rentalInfo.pokemonName}
                        </h4>
                      </div>
                      
                      {/* 属性标签 */}
                      <div className="flex items-center flex-wrap gap-2 mb-3">
                        <span className="text-sm text-gray-600 dark:text-gray-300">{post.rentalInfo.pokemonSpecies}</span>
                        {post.rentalInfo.pokemonType1 && (
                          <span className="px-3 py-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-semibold rounded-full shadow-sm">
                            {post.rentalInfo.pokemonType1}
                          </span>
                        )}
                        {post.rentalInfo.pokemonType2 && (
                          <span className="px-3 py-1 bg-gradient-to-r from-green-500 to-green-600 text-white text-sm font-semibold rounded-full shadow-sm">
                            {post.rentalInfo.pokemonType2}
                          </span>
                        )}
                      </div>
                      
                      {/* 租借信息 */}
                      <div className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-300 bg-white/50 dark:bg-gray-800/50 rounded-lg px-3 py-2 backdrop-blur-sm">
                        <Timer className="w-4 h-4 text-orange-500" />
                        <span className="font-medium">租借时长: {Math.floor(post.rentalInfo.rentalDuration / 24)}天</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* 帖子统计信息 */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center space-x-1">
              <Eye className="w-4 h-4" />
              <span>{post.viewCount}</span>
            </div>
            <div className="flex items-center space-x-1">
              <MessageSquare className="w-4 h-4" />
              <span>{post.replyCount}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleLike}
              disabled={isLiking}
              className={`flex items-center space-x-1 px-3 py-1 rounded-full transition-colors ${
                isLiked 
                  ? 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300' 
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900 dark:hover:text-red-300'
              }`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
              <span>{likeCount}</span>
            </motion.button>
            
            {post.lastReplyBy && (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                最后回复: {post.lastReplyBy}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}