'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Heart,
  MessageSquare,
  Eye,
  Share2,
  MoreHorizontal,
  Clock,
  Calendar,
  Star,
  Zap,
  User,
  Send,
  AlertCircle,
  CheckCircle,
  XCircle,
  Timer
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ForumPost, ForumReply, PostType, RentalStatus, CreateReplyRequest, RentalConfirmRequest } from '@/types/forum';
import { PokemonCard } from '@/types/auth';
import {
  getForumPost,
  getPostReplies,
  createPostReply,
  likePost,
  likeReply,
  confirmRental,
  getUserPokemonList
} from '@/lib/forumService';
import UserAvatar from '@/components/UserAvatar';
import RichTextEditor from '@/components/forum/RichTextEditor';
import RoleBadge from '@/components/RoleBadge';
import ShareCard from '@/components/ShareCard';

// 回复列表组件
interface ReplyListProps {
  replies: ForumReply[];
  post: ForumPost;
  state: any;
  replyingTo: string | null;
  setReplyingTo: (id: string | null) => void;
  nestedReplyContent: string;
  setNestedReplyContent: (content: string) => void;
  isSubmittingReply: boolean;
  handleLikeReply: (id: string) => void;
  handleSubmitNestedReply: (parentId: string) => void;
  handleRentalResponse: (reply: ForumReply) => void;
  formatDate: (date: Date) => string;
  level?: number;
}

function ReplyList({
  replies,
  post,
  state,
  replyingTo,
  setReplyingTo,
  nestedReplyContent,
  setNestedReplyContent,
  isSubmittingReply,
  handleLikeReply,
  handleSubmitNestedReply,
  handleRentalResponse,
  formatDate,
  level = 0
}: ReplyListProps) {
  const router = useRouter();
  // 分离顶级回复和子回复
  const topLevelReplies = replies.filter(reply => !reply.parentReplyId);
  const childReplies = replies.filter(reply => reply.parentReplyId);

  // 获取指定父回复的子回复
  const getChildReplies = (parentId: string) => {
    return childReplies.filter(reply => reply.parentReplyId === parentId);
  };

  const renderReply = (reply: ForumReply, isChild = false) => (
    <motion.div
      key={reply.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${isChild ? 'ml-12 border-l-2 border-gray-200 dark:border-gray-700 pl-4' : ''} p-6`}
    >
      <div className="flex items-start space-x-4">
        <UserAvatar 
          user={{ id: reply.authorId, username: reply.authorName }} 
          size={isChild ? "sm" : "md"} 
          clickable
          onClick={(e) => {
            e?.stopPropagation();
            router.push(`/profile/${reply.authorId}`);
          }}
        />
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-gray-900 dark:text-white">
                {reply.authorName}
              </span>
              {reply.authorRole && <RoleBadge role={reply.authorRole} size="sm" />}
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {formatDate(reply.createdAt)}
              </span>
            </div>
            
            {/* 租借响应按钮 */}
            {post.type === PostType.POKEMON_RENTAL && 
             post.rentalInfo?.status === RentalStatus.AVAILABLE &&
             state.user?.id === post.authorId &&
             reply.authorId !== post.authorId && (
              <button
                onClick={() => handleRentalResponse(reply)}
                className="px-3 py-1 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm"
              >
                确认租借
              </button>
            )}
          </div>
          
          <div 
            className="prose dark:prose-invert prose-sm max-w-none mb-3"
            ref={(el) => {
              if (el && el.innerHTML !== reply.content) {
                el.innerHTML = reply.content;
              }
            }}
          />
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => handleLikeReply(reply.id)}
              className={`flex items-center space-x-1 text-sm transition-colors ${
                reply.likedByCurrentUser
                  ? 'text-red-500'
                  : 'text-gray-500 dark:text-gray-400 hover:text-red-500'
              }`}
            >
              <Heart className={`w-4 h-4 ${reply.likedByCurrentUser ? 'fill-current' : ''}`} />
              <span>{reply.likeCount}</span>
            </button>
            
            {level < 3 && ( // 限制嵌套层级
              <button 
                onClick={() => setReplyingTo(reply.id)}
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-500 transition-colors"
              >
                回复
              </button>
            )}
          </div>
          
          {/* 嵌套回复输入框 */}
          {replyingTo === reply.id && state.user && (
            <div className="mt-4 space-y-3">
              <div className="flex items-center space-x-2">
                <UserAvatar user={state.user} size="sm" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  回复 @{reply.authorName}
                </span>
              </div>
              
              <RichTextEditor
                value={nestedReplyContent}
                onChange={setNestedReplyContent}
                placeholder={`回复 @${reply.authorName}...`}
                minHeight={80}
                maxHeight={200}
              />
              
              <div className="flex items-center justify-end space-x-2">
                <button
                  onClick={() => {
                    setReplyingTo(null);
                    setNestedReplyContent('');
                  }}
                  className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={() => handleSubmitNestedReply(reply.id)}
                  disabled={!nestedReplyContent.trim() || isSubmittingReply}
                  className="flex items-center space-x-1 px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-3 h-3" />
                  <span>{isSubmittingReply ? '发送中...' : '回复'}</span>
                </button>
              </div>
            </div>
          )}
          
          {/* 渲染子回复 */}
          {!isChild && getChildReplies(reply.id).length > 0 && (
            <div className="mt-4">
              {getChildReplies(reply.id).map(childReply => renderReply(childReply, true))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );

  return (
    <>
      {topLevelReplies.map(reply => renderReply(reply))}
    </>
  );
}

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { state } = useAuth();
  const postId = params.id as string;
  
  const [post, setPost] = useState<ForumPost | null>(null);
  const [replies, setReplies] = useState<ForumReply[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null); // 正在回复的评论ID
  const [nestedReplyContent, setNestedReplyContent] = useState(''); // 嵌套回复内容
  
  // 租借相关状态
  const [showRentalModal, setShowRentalModal] = useState(false);
  const [selectedReply, setSelectedReply] = useState<ForumReply | null>(null);
  const [rentalDuration, setRentalDuration] = useState(24);
  const [userPokemon, setUserPokemon] = useState<PokemonCard[]>([]);
  const [selectedPokemon, setSelectedPokemon] = useState<PokemonCard | null>(null);
  const [isConfirmingRental, setIsConfirmingRental] = useState(false);
  const [showShareCard, setShowShareCard] = useState(false);

  useEffect(() => {
    if (postId) {
      loadPostData();
    }
  }, [postId]);

  useEffect(() => {
    if (state.user && post?.type === PostType.POKEMON_RENTAL) {
      loadUserPokemon();
    }
  }, [state.user, post]);

  const loadPostData = async () => {
    try {
      setIsLoading(true);
      const [postData, repliesData] = await Promise.all([
        getForumPost(postId, state.user?.id),
        getPostReplies(postId, state.user?.id)
      ]);
      setPost(postData);
      setReplies(repliesData);
    } catch (error) {
      console.error('加载帖子数据失败:', error);
      setError('加载帖子失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserPokemon = async () => {
    if (!state.user) return;
    
    try {
      const pokemon = await getUserPokemonList(state.user.id);
      setUserPokemon(pokemon);
    } catch (error) {
      console.error('加载宝可梦列表失败:', error);
    }
  };

  const handleLikePost = async () => {
    if (!state.user || !post) return;
    
    try {
      const updatedPost = await likePost(post.id, state.user.id);
      setPost(updatedPost);
    } catch (error) {
      console.error('点赞失败:', error);
    }
  };

  const handleLikeReply = async (replyId: string) => {
    if (!state.user) return;
    
    try {
      const updatedReply = await likeReply(replyId, state.user.id);
      setReplies(replies.map(reply => 
        reply.id === replyId ? updatedReply : reply
      ));
    } catch (error) {
      console.error('点赞回复失败:', error);
    }
  };

  const handleSubmitReply = async () => {
    if (!state.user || !post || !replyContent.trim()) return;
    
    setIsSubmittingReply(true);
    try {
      const replyData: CreateReplyRequest = {
        postId: post.id,
        content: replyContent.trim()
      };
      
      const newReply = await createPostReply(
        state.user.id,
        state.user.username,
        state.user.role,
        replyData
      );
      
      setReplies([...replies, newReply]);
      setReplyContent('');
      setIsReplying(false);
      
      // 更新帖子回复数
      setPost({
        ...post,
        replyCount: post.replyCount + 1
      });
    } catch (error) {
      console.error('回复失败:', error);
    } finally {
      setIsSubmittingReply(false);
    }
  };

  // 提交嵌套回复
  const handleSubmitNestedReply = async (parentReplyId: string) => {
    if (!nestedReplyContent.trim() || !state.user || !post) return;

    setIsSubmittingReply(true);
    setError(null);

    try {
      const replyData: CreateReplyRequest = {
        postId: post.id,
        content: nestedReplyContent,
        parentReplyId
      };

      await createPostReply(
        state.user.id,
        state.user.username,
        state.user.role,
        replyData
      );
      
      setNestedReplyContent('');
      setReplyingTo(null);
      await loadPostData(); // 重新加载数据
    } catch (error) {
      console.error('提交回复失败:', error);
      setError('提交回复失败，请重试');
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleRentalResponse = (reply: ForumReply) => {
    setSelectedReply(reply);
    setShowRentalModal(true);
  };

  const handleConfirmRental = async () => {
    if (!state.user || !post || !selectedReply || !selectedPokemon) return;
    
    setIsConfirmingRental(true);
    try {
      const rentalData: RentalConfirmRequest = {
        postId: post.id,
        replyId: selectedReply.id,
        duration: rentalDuration,
        renterUserId: selectedReply.authorId
      };
      
      await confirmRental(state.user.id, rentalData);
      
      // 更新帖子状态
      setPost({
        ...post,
        rentalInfo: {
          ...post.rentalInfo!,
          status: RentalStatus.RENTED
        }
      });
      
      setShowRentalModal(false);
      setSelectedReply(null);
      setSelectedPokemon(null);
    } catch (error) {
      console.error('确认租借失败:', error);
    } finally {
      setIsConfirmingRental(false);
    }
  };

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - dateObj.getTime();
    const diffInHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return '刚刚';
    } else if (diffInHours < 24) {
      return `${diffInHours}小时前`;
    } else if (diffInHours < 24 * 7) {
      return `${Math.floor(diffInHours / 24)}天前`;
    } else {
      return dateObj.toLocaleDateString('zh-CN');
    }
  };

  const getDurationText = (hours: number) => {
    if (hours < 24) {
      return `${hours}小时`;
    } else {
      const days = Math.floor(hours / 24);
      const remainingHours = hours % 24;
      return remainingHours > 0 ? `${days}天${remainingHours}小时` : `${days}天`;
    }
  };

  const getRentalStatusColor = (status: RentalStatus) => {
    switch (status) {
      case RentalStatus.AVAILABLE:
        return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300';
      case RentalStatus.RENTED:
        return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-300';
      case RentalStatus.EXPIRED:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-300';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getRentalStatusText = (status: RentalStatus) => {
    switch (status) {
      case RentalStatus.AVAILABLE:
        return '可租借';
      case RentalStatus.RENTED:
        return '已租借';
      case RentalStatus.EXPIRED:
        return '已过期';
      default:
        return '未知状态';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">加载中...</p>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {error || '帖子不存在'}
          </h2>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            返回
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 返回按钮 */}
        <button
          onClick={() => router.back()}
          className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>返回论坛</span>
        </button>

        {/* 帖子内容 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mb-6"
        >
          {/* 帖子头部 */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <UserAvatar 
                  user={{ id: post.authorId, username: post.authorName }} 
                  size="md" 
                  clickable
                  onClick={(e) => {
                    e?.stopPropagation();
                    router.push(`/profile/${post.authorId}`);
                  }}
                />
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {post.authorName}
                    </span>
                    {post.authorRole && <RoleBadge role={post.authorRole} size="sm" />}
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(post.createdAt)}</span>
                    <span>•</span>
                    <Eye className="w-4 h-4" />
                    <span>{post.viewCount} 浏览</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {/* 帖子类型标识 */}
                <div className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm ${
                  post.type === PostType.DISCUSSION
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                    : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300'
                }`}>
                  {post.type === PostType.DISCUSSION ? (
                    <MessageSquare className="w-4 h-4" />
                  ) : (
                    <Zap className="w-4 h-4" />
                  )}
                  <span>
                    {post.type === PostType.DISCUSSION ? '交流帖' : '精灵租借'}
                  </span>
                </div>
                
                {/* 租借状态 */}
                {post.type === PostType.POKEMON_RENTAL && post.rentalInfo && (
                  <div className={`px-3 py-1 rounded-full text-sm ${getRentalStatusColor(post.rentalInfo.status)}`}>
                    {getRentalStatusText(post.rentalInfo.status)}
                  </div>
                )}
              </div>
            </div>
            
            {/* 帖子标题 */}
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {post.title}
            </h1>
            
            {/* 标签 */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {post.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-sm"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 精灵租借信息 */}
          {post.type === PostType.POKEMON_RENTAL && post.rentalInfo && (
            <div className="p-6 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-4">
                {post.rentalInfo.pokemonImageUrl && (
                  <img 
                    src={post.rentalInfo.pokemonImageUrl} 
                    alt={post.rentalInfo.pokemonName}
                    className="w-20 h-20 rounded-lg object-cover"
                  />
                )}
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {post.rentalInfo.pokemonName}
                    </h3>
                    {post.rentalInfo.isShiny && (
                      <Star className="w-5 h-5 text-yellow-500" />
                    )}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                    等级 {post.rentalInfo.pokemonLevel} • {post.rentalInfo.pokemonSpecies}
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center space-x-1">
                      <Timer className="w-4 h-4" />
                      <span>租借时长: {getDurationText(post.rentalInfo.rentalDuration)}</span>
                    </div>
                    {post.rentalInfo.requirements && (
                      <div>
                        要求: {post.rentalInfo.requirements}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 帖子内容 */}
          <div className="p-6">
            <div
              className="prose dark:prose-invert max-w-none"
              ref={(el) => {
                if (el && el.innerHTML !== post.content) {
                  el.innerHTML = post.content;
                }
              }}
            />
          </div>

          {/* 帖子操作 */}
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <button
                  onClick={handleLikePost}
                  className={`flex items-center space-x-2 transition-colors ${
                    post.likedByCurrentUser
                      ? 'text-red-500'
                      : 'text-gray-500 dark:text-gray-400 hover:text-red-500'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${post.likedByCurrentUser ? 'fill-current' : ''}`} />
                  <span>{post.likeCount}</span>
                </button>
                
                <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
                  <MessageSquare className="w-5 h-5" />
                  <span>{post.replyCount}</span>
                </div>
                
                <button 
                  onClick={() => setShowShareCard(true)}
                  className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 hover:text-blue-500 transition-colors"
                  title="分享帖子"
                >
                  <Share2 className="w-5 h-5" />
                  <span>分享</span>
                </button>
              </div>
              
              <button className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* 回复列表 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              回复 ({replies.length})
            </h2>
          </div>
          
          {/* 回复输入框 */}
          {state.user && (
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              {!isReplying ? (
                <button
                  onClick={() => setIsReplying(true)}
                  className="w-full p-4 text-left text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  写下你的回复...
                </button>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <UserAvatar user={state.user} size="sm" />
                    <span className="font-medium text-gray-900 dark:text-white">
                      {state.user.username}
                    </span>
                  </div>
                  
                  <RichTextEditor
                    value={replyContent}
                    onChange={setReplyContent}
                    placeholder="写下你的回复..."
                    minHeight={120}
                    maxHeight={300}
                  />
                  
                  <div className="flex items-center justify-end space-x-3">
                    <button
                      onClick={() => {
                        setIsReplying(false);
                        setReplyContent('');
                      }}
                      className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleSubmitReply}
                      disabled={!replyContent.trim() || isSubmittingReply}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Send className="w-4 h-4" />
                      <span>{isSubmittingReply ? '发送中...' : '发送回复'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* 回复列表 */}
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {replies.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>还没有回复，来发表第一个回复吧！</p>
              </div>
            ) : (
              <ReplyList 
                replies={replies} 
                post={post}
                state={state}
                replyingTo={replyingTo}
                setReplyingTo={setReplyingTo}
                nestedReplyContent={nestedReplyContent}
                setNestedReplyContent={setNestedReplyContent}
                isSubmittingReply={isSubmittingReply}
                handleLikeReply={handleLikeReply}
                handleSubmitNestedReply={handleSubmitNestedReply}
                handleRentalResponse={handleRentalResponse}
                formatDate={formatDate}
              />
            )}
          </div>
        </div>
      </div>

      {/* 租借确认模态框 */}
      <AnimatePresence>
        {showRentalModal && selectedReply && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowRentalModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  确认租借
                </h3>
                
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      租借方: <span className="font-medium">{selectedReply.authorName}</span>
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      宝可梦: <span className="font-medium">{post.rentalInfo?.pokemonName}</span>
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      确认租借时长
                    </label>
                    <div className="space-y-2">
                      <input
                        type="range"
                        min="1"
                        max="168"
                        value={rentalDuration}
                        onChange={(e) => setRentalDuration(Number(e.target.value))}
                        className="w-full"
                      />
                      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                        <span>1小时</span>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span className="font-medium">{getDurationText(rentalDuration)}</span>
                        </div>
                        <span>7天</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowRentalModal(false)}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleConfirmRental}
                    disabled={isConfirmingRental}
                    className="flex items-center space-x-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>{isConfirmingRental ? '确认中...' : '确认租借'}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* 分享卡片模态框 */}
      {showShareCard && (
        <ShareCard
          type="post"
          post={post}
          onClose={() => setShowShareCard(false)}
        />
      )}
    </div>
  );
}