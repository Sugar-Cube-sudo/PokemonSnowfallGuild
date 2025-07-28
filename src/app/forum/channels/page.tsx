'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  Users,
  Settings,
  Send,
  Smile,
  Image,
  Pin,
  Trash2,
  UserMinus,
  Volume,
  VolumeX,
  Clock,
  Shield,
  Hash,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Reply,
  Heart,
  AlertTriangle,
  AtSign,
  Upload,
  Eye,
  ChevronUp,
  Bell
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  ForumChannel,
  ChannelMessage,
  ChannelMember,
  ChannelType,
  ChannelStatus,
  SendChannelMessageRequest,
  ChannelModerationAction,
  ChannelBackground,
  UnreadMessageInfo
} from '@/types/forum';
import {
  getChannels,
  getChannelById,
  joinChannel,
  leaveChannel,
  getChannelMembers,
  sendChannelMessage,
  getChannelMessages,
  likeChannelMessage,
  executeChannelModeration,
  parseMentions,
  sendMentionNotifications,
  uploadChannelBackground,
  getChannelBackground,
  setUserChannelBackground,
  getUnreadMessageInfo,
  markMessagesAsRead,
  getUnreadMessages,
  getFirstUnreadMessage
} from '@/lib/channelService';
import { UserRole } from '@/types/auth';
import { UserInteractionContext } from '@/types/friends';
import RoleBadge from '@/components/RoleBadge';
import UserAvatar from '@/components/UserAvatar';
import ChannelManagement from '@/components/forum/ChannelManagement';
import UserInteractionMenu from '@/components/UserInteractionMenu';
import FriendsSidebar from '@/components/FriendsSidebar';
import '@/styles/channel-chat.css';

interface ChannelPageState {
  channels: ForumChannel[];
  selectedChannel: ForumChannel | null;
  messages: ChannelMessage[];
  members: ChannelMember[];
  loading: boolean;
  messagesLoading: boolean;
  newMessage: string;
  replyingTo: ChannelMessage | null;
  showMembers: boolean;
  searchQuery: string;
  filterType: ChannelType | 'all';
  showChannelManagement: boolean;
  showCreateChannelModal: boolean;
  showFriendsSidebar: boolean;
  showEmojiPicker: boolean;
  showImageUpload: boolean;
}

export default function ChannelsPage() {
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  
  const [state, setState] = useState<ChannelPageState>({
    channels: [],
    selectedChannel: null,
    messages: [],
    members: [],
    loading: true,
    messagesLoading: false,
    newMessage: '',
    replyingTo: null,
    showMembers: false,
    searchQuery: '',
    filterType: 'all',
    showChannelManagement: false,
    showCreateChannelModal: false,
    showFriendsSidebar: false,
    showEmojiPicker: false,
    showImageUpload: false
  });
  
  // 新增状态
  const [channelBackground, setChannelBackground] = useState<ChannelBackground | null>(null);
  const [userBackground, setUserBackground] = useState<string>('');
  const [unreadInfo, setUnreadInfo] = useState<UnreadMessageInfo | null>(null);
  const [showUnreadMessages, setShowUnreadMessages] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState<ChannelMessage[]>([]);
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionSuggestions, setMentionSuggestions] = useState<ChannelMember[]>([]);
  const [mentionQuery, setMentionQuery] = useState('');
  const [showBackgroundUpload, setShowBackgroundUpload] = useState(false);
  const [userInteractionContext, setUserInteractionContext] = useState<UserInteractionContext | null>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭表情选择器
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setState(prev => ({ ...prev, showEmojiPicker: false }));
      }
    };

    if (state.showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [state.showEmojiPicker]);

  // 加载频道列表
  const loadChannels = async () => {
    try {
      // 先尝试从API加载
      let channels;
      try {
        channels = await getChannels({
          type: state.filterType === 'all' ? undefined : state.filterType,
          search: state.searchQuery || undefined
        });
      } catch (apiError) {
        console.log('API加载失败，使用模拟数据:', apiError);
        // 如果API失败，使用模拟数据
        channels = getMockChannels();
      }
      
      setState(prev => ({ ...prev, channels, loading: false }));
    } catch (error) {
      console.error('加载频道失败:', error);
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  // 模拟频道数据
  const getMockChannels = (): ForumChannel[] => {
    const now = new Date();
    return [
      {
        id: 'channel-1',
        name: '综合讨论',
        description: '大家一起聊天的地方',
        type: ChannelType.GENERAL,
        status: ChannelStatus.ACTIVE,
        icon: '💬',
        color: '#3B82F6',
        order: 1,
        memberCount: 156,
        maxMembers: 500,
        allowedRoles: [UserRole.USER, UserRole.MODERATOR, UserRole.ADMIN, UserRole.SUPER_ADMIN],
        moderatorIds: ['mod-1', 'mod-2'],
        isPrivate: false,
        speakingRules: {
          slowMode: false,
          slowModeInterval: 0,
          slowModeSeconds: 0,
          requireApproval: false,
          allowImages: true,
          allowLinks: true,
          maxMessageLength: 2000,
          allowMentions: true,
          allowAtAll: false
        },
        forbiddenWords: [],
        curfewEnabled: false,
        messageCount: 1234,
        lastMessageAt: new Date(now.getTime() - 5 * 60 * 1000),
        lastMessageBy: '小智',
        createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        updatedAt: now,
        createdBy: 'admin-1',
        createdByName: '管理员'
      },
      {
        id: 'channel-2',
        name: 'PVP对战',
        description: '精灵对战交流频道',
        type: ChannelType.PVP,
        status: ChannelStatus.ACTIVE,
        icon: '⚔️',
        color: '#EF4444',
        order: 2,
        memberCount: 89,
        maxMembers: 200,
        allowedRoles: [UserRole.USER, UserRole.MODERATOR, UserRole.ADMIN, UserRole.SUPER_ADMIN],
        moderatorIds: ['mod-1'],
        isPrivate: false,
        speakingRules: {
          slowMode: true,
          slowModeInterval: 10,
          slowModeSeconds: 10,
          requireApproval: false,
          allowImages: true,
          allowLinks: false,
          maxMessageLength: 1000,
          allowMentions: true,
          allowAtAll: false
        },
        forbiddenWords: ['外挂', '作弊'],
        curfewEnabled: false,
        messageCount: 567,
        lastMessageAt: new Date(now.getTime() - 15 * 60 * 1000),
        lastMessageBy: '小霞',
        createdAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
        updatedAt: now,
        createdBy: 'admin-1',
        createdByName: '管理员'
      },
      {
        id: 'channel-3',
        name: '交易市场',
        description: '精灵和道具交易',
        type: ChannelType.TRADE,
        status: ChannelStatus.ACTIVE,
        icon: '💰',
        color: '#10B981',
        order: 3,
        memberCount: 234,
        maxMembers: 300,
        allowedRoles: [UserRole.MODERATOR, UserRole.ADMIN, UserRole.SUPER_ADMIN],
        moderatorIds: ['mod-2'],
        isPrivate: false,
        speakingRules: {
          slowMode: true,
          slowModeInterval: 30,
          slowModeSeconds: 30,
          requireApproval: true,
          allowImages: true,
          allowLinks: false,
          maxMessageLength: 1500,
          allowMentions: true,
          allowAtAll: false
        },
        forbiddenWords: ['骗子', '诈骗'],
        curfewEnabled: true,
        curfewStartHour: 23,
        curfewEndHour: 7,
        messageCount: 890,
        lastMessageAt: new Date(now.getTime() - 2 * 60 * 1000),
        lastMessageBy: '小刚',
        createdAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
        updatedAt: now,
        createdBy: 'admin-1',
        createdByName: '管理员'
      }
    ];
  };

  // 选择频道
  const selectChannel = async (channelId: string) => {
    if (!user) return;
    
    setState(prev => ({ ...prev, messagesLoading: true }));
    
    try {
      // 先尝试从API加载
      let channel, messagesResponse, members;
      try {
        channel = await getChannelById(channelId);
        if (!channel) return;
        
        // 自动加入频道
        await joinChannel(channelId, user.id, user.username, user.avatarUrl || '', user.role);
        
        // 加载消息和成员
        [messagesResponse, members] = await Promise.all([
          getChannelMessages({ channelId, limit: 50 }, user.id),
          getChannelMembers(channelId)
        ]);
      } catch (apiError) {
        console.log('API加载失败，使用模拟数据:', apiError);
        // 如果API失败，使用模拟数据
        channel = getMockChannels().find(c => c.id === channelId);
        if (!channel) return;
        
        messagesResponse = { messages: getMockMessages(channelId) };
        members = getMockMembers(channelId);
      }
      
      setState(prev => ({
        ...prev,
        selectedChannel: channel,
        messages: Array.isArray(messagesResponse.messages) ? messagesResponse.messages.reverse() : [], // 反转以显示最新消息在底部
        members,
        messagesLoading: false,
        replyingTo: null
      }));
      
      // 尝试加载频道背景图
      try {
        const background = await getChannelBackground(channelId);
        setChannelBackground(background);
      } catch (error) {
        console.log('加载背景图失败:', error);
      }
      
      // 尝试加载未读消息信息
      try {
        const unreadInfo = await getUnreadMessageInfo(user.id, channelId);
        setUnreadInfo(unreadInfo);
      } catch (error) {
        console.log('加载未读信息失败:', error);
      }
      
      // 滚动到底部
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error) {
      console.error('选择频道失败:', error);
      setState(prev => ({ ...prev, messagesLoading: false }));
    }
  };

  // 模拟消息数据
  const getMockMessages = (channelId: string): ChannelMessage[] => {
    const now = new Date();
    const baseMessages = [
      {
        id: 'msg-1',
        channelId,
        content: '大家好！欢迎来到这个频道！',
        authorId: 'user-1',
        authorName: '小智',
        authorAvatar: '',
        authorRole: UserRole.USER,
        type: 'text' as const,
        isDeleted: false,
        isPinned: false,
        isEdited: false,
        likeCount: 5,
        likedByCurrentUser: false,
        createdAt: new Date(now.getTime() - 60 * 60 * 1000),
        updatedAt: new Date(now.getTime() - 60 * 60 * 1000)
      },
      {
        id: 'msg-2',
        channelId,
        content: '今天天气真不错，适合出去抓精灵！',
        authorId: 'user-2',
        authorName: '小霞',
        authorAvatar: '',
        authorRole: UserRole.MODERATOR,
        type: 'text' as const,
        isDeleted: false,
        isPinned: false,
        isEdited: false,
        likeCount: 3,
        likedByCurrentUser: true,
        createdAt: new Date(now.getTime() - 45 * 60 * 1000),
        updatedAt: new Date(now.getTime() - 45 * 60 * 1000)
      },
      {
        id: 'msg-3',
        channelId,
        content: '有人想要交换精灵吗？我有一只闪光皮卡丘',
        authorId: 'user-3',
        authorName: '小刚',
        authorAvatar: '',
        authorRole: UserRole.USER,
        type: 'text' as const,
        isDeleted: false,
        isPinned: true,
        isEdited: false,
        likeCount: 12,
        likedByCurrentUser: false,
        createdAt: new Date(now.getTime() - 30 * 60 * 1000),
        updatedAt: new Date(now.getTime() - 30 * 60 * 1000),
        pinnedAt: new Date(now.getTime() - 25 * 60 * 1000),
        pinnedBy: 'mod-1'
      },
      {
        id: 'msg-4',
        channelId,
        content: '@小刚 我对你的闪光皮卡丘很感兴趣！',
        authorId: 'user-4',
        authorName: '小茂',
        authorAvatar: '',
        authorRole: UserRole.USER,
        type: 'text' as const,
        replyToId: 'msg-3',
        replyToContent: '有人想要交换精灵吗？我有一只闪光皮卡丘',
        replyToAuthor: '小刚',
        mentions: [{ userId: 'user-3', username: '小刚', displayName: '小刚' }],
        isDeleted: false,
        isPinned: false,
        isEdited: false,
        likeCount: 2,
        likedByCurrentUser: false,
        createdAt: new Date(now.getTime() - 15 * 60 * 1000),
        updatedAt: new Date(now.getTime() - 15 * 60 * 1000)
      },
      {
        id: 'msg-5',
        channelId,
        content: '这个频道真的很活跃呢！',
        authorId: 'user-5',
        authorName: '小遥',
        authorAvatar: '',
        authorRole: UserRole.MODERATOR,
        type: 'text' as const,
        isDeleted: false,
        isPinned: false,
        isEdited: false,
        likeCount: 1,
        likedByCurrentUser: false,
        createdAt: new Date(now.getTime() - 5 * 60 * 1000),
        updatedAt: new Date(now.getTime() - 5 * 60 * 1000)
      }
    ];

    // 根据频道类型添加特定消息
    if (channelId === 'channel-2') { // PVP频道
      baseMessages.push({
        id: 'msg-pvp-1',
        channelId,
        content: '有人想要来一场6v6的对战吗？',
        authorId: 'user-6',
        authorName: '对战达人',
        authorAvatar: '',
        authorRole: UserRole.USER,
        type: 'text' as const,
        isDeleted: false,
        isPinned: false,
        isEdited: false,
        likeCount: 4,
        likedByCurrentUser: false,
        createdAt: new Date(now.getTime() - 2 * 60 * 1000),
        updatedAt: new Date(now.getTime() - 2 * 60 * 1000)
      });
    } else if (channelId === 'channel-3') { // 交易频道
      baseMessages.push({
        id: 'msg-trade-1',
        channelId,
        content: '出售：色违暴鲤龙，6V，价格面议',
        authorId: 'user-7',
        authorName: '交易商',
        authorAvatar: '',
        authorRole: UserRole.MODERATOR,
        type: 'text' as const,
        isDeleted: false,
        isPinned: false,
        isEdited: false,
        likeCount: 8,
        likedByCurrentUser: false,
        createdAt: new Date(now.getTime() - 1 * 60 * 1000),
        updatedAt: new Date(now.getTime() - 1 * 60 * 1000)
      });
    }

    return baseMessages;
  };

  // 模拟成员数据
  const getMockMembers = (channelId: string): ChannelMember[] => {
    const now = new Date();
    return [
      {
        id: 'member-1',
        channelId,
        userId: 'user-1',
        userName: '小智',
        userAvatar: '',
        userRole: UserRole.USER,
        isOnline: true,
        isMuted: false,
        messageCount: 45,
        lastActiveAt: new Date(now.getTime() - 5 * 60 * 1000),
        joinedAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'member-2',
        channelId,
        userId: 'user-2',
        userName: '小霞',
        userAvatar: '',
        userRole: UserRole.MODERATOR,
        isOnline: true,
        isMuted: false,
        messageCount: 32,
        lastActiveAt: new Date(now.getTime() - 10 * 60 * 1000),
        joinedAt: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'member-3',
        channelId,
        userId: 'user-3',
        userName: '小刚',
        userAvatar: '',
        userRole: UserRole.USER,
        isOnline: false,
        isMuted: false,
        messageCount: 28,
        lastActiveAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
        joinedAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'member-4',
        channelId,
        userId: 'user-4',
        userName: '小茂',
        userAvatar: '',
        userRole: UserRole.USER,
        isOnline: true,
        isMuted: false,
        messageCount: 15,
        lastActiveAt: new Date(now.getTime() - 15 * 60 * 1000),
        joinedAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000)
      },
      {
        id: 'member-5',
        channelId,
        userId: 'user-5',
        userName: '小遥',
        userAvatar: '',
        userRole: UserRole.MODERATOR,
        isOnline: true,
        isMuted: false,
        messageCount: 22,
        lastActiveAt: new Date(now.getTime() - 5 * 60 * 1000),
        joinedAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000)
      }
    ];
  };

  // 发送消息
  const handleSendMessage = async () => {
    if (!user || !state.selectedChannel || !state.newMessage.trim()) return;
    
    try {
      // 解析@提及
      const { mentions, isAtAll } = parseMentions(state.newMessage.trim(), state.members);
      
      const messageData: SendChannelMessageRequest = {
        channelId: state.selectedChannel.id,
        content: state.newMessage.trim(),
        replyToId: state.replyingTo?.id,
        mentions,
        isAtAll
      };
      
      const result = await sendChannelMessage(
        user.id,
        user.username,
        user.avatarUrl || '',
        user.role,
        messageData
      );
      
      if (result.success && result.channelMessage) {
        // 发送@通知
        if (mentions.length > 0 || isAtAll) {
          await sendMentionNotifications(result.channelMessage!, state.selectedChannel.name);
        }
        
        setState(prev => ({
          ...prev,
          messages: [...prev.messages, result.channelMessage!],
          newMessage: '',
          replyingTo: null
        }));
        
        setShowMentionSuggestions(false);
        
        // 滚动到底部
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else {
        alert(result.message || '发送失败');
      }
    } catch (error) {
      console.error('发送消息失败:', error);
      alert('发送消息失败');
    }
  };

  // 处理表情选择
  const handleEmojiSelect = (emoji: string) => {
    setState(prev => ({
      ...prev,
      newMessage: prev.newMessage + emoji,
      showEmojiPicker: false
    }));
    messageInputRef.current?.focus();
  };

  // 处理图片上传
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件');
      return;
    }

    // 检查文件大小 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('图片大小不能超过5MB');
      return;
    }

    try {
      // 创建预览URL
      const imageUrl = URL.createObjectURL(file);
      
      // 模拟上传过程
      const uploadedImageUrl = await simulateImageUpload(file);
      
      // 发送图片消息
      if (user && state.selectedChannel) {
        const messageData: SendChannelMessageRequest = {
          channelId: state.selectedChannel.id,
          content: `[图片] ${file.name}`,
          imageUrl: uploadedImageUrl,
          replyToId: state.replyingTo?.id
        };
        
        const result = await sendChannelMessage(
          user.id,
          user.username,
          user.avatarUrl || '',
          user.role,
          messageData
        );
        
        if (result.success && result.channelMessage) {
          setState(prev => ({
            ...prev,
            messages: [...prev.messages, result.channelMessage!],
            replyingTo: null,
            showImageUpload: false
          }));
          
          // 滚动到底部
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        } else {
          alert(result.message || '发送图片失败');
        }
      }
    } catch (error) {
      console.error('上传图片失败:', error);
      alert('上传图片失败');
    }
    
    // 清空文件输入
    event.target.value = '';
  };

  // 模拟图片上传
  const simulateImageUpload = async (file: File): Promise<string> => {
    // 模拟上传延迟
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 返回模拟的图片URL
    return `https://example.com/uploads/${Date.now()}_${file.name}`;
  };

  // 点赞消息
  const handleLikeMessage = async (messageId: string) => {
    if (!user) return;
    
    try {
      const updatedMessage = await likeChannelMessage(messageId, user.id);
      if (updatedMessage) {
        setState(prev => ({
          ...prev,
          messages: prev.messages.map(msg => 
            msg.id === messageId ? updatedMessage : msg
          )
        }));
      }
    } catch (error) {
      console.error('点赞失败:', error);
    }
  };

  // 回复消息
  const handleReplyMessage = (message: ChannelMessage) => {
    setState(prev => ({ ...prev, replyingTo: message }));
    messageInputRef.current?.focus();
  };

  // 取消回复
  const cancelReply = () => {
    setState(prev => ({ ...prev, replyingTo: null }));
  };

  // 管理操作
  const handleModerationAction = async (action: ChannelModerationAction) => {
    if (!user || !state.selectedChannel) return;
    
    try {
      const result = await executeChannelModeration(
        user.id,
        user.username,
        state.selectedChannel.id,
        action
      );
      
      if (result.success) {
        alert(result.message);
        // 重新加载数据
        if (action.type === 'pin' || action.type === 'unpin' || action.type === 'delete') {
          // 重新加载消息
          const messagesResponse = await getChannelMessages(
            { channelId: state.selectedChannel.id, limit: 50 },
            user.id
          );
          setState(prev => ({
            ...prev,
            messages: messagesResponse.messages.reverse()
          }));
        }
        if (action.type === 'mute' || action.type === 'unmute' || action.type === 'kick') {
          // 重新加载成员
          const members = await getChannelMembers(state.selectedChannel.id);
          setState(prev => ({ ...prev, members }));
        }
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('管理操作失败:', error);
      alert('操作失败');
    }
  };

  // 检查是否是管理员
  const isChannelModerator = (channel: ForumChannel) => {
    return user && (
      user.role === UserRole.SUPER_ADMIN ||
      user.role === UserRole.ADMIN ||
      channel.moderatorIds.includes(user.id)
    );
  };

  // 格式化时间
  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString();
  };

  // 处理@输入
  const handleMessageInput = (value: string) => {
    setState(prev => ({ ...prev, newMessage: value }));
    
    // 检测@符号
    const atIndex = value.lastIndexOf('@');
    if (atIndex !== -1) {
      const query = value.slice(atIndex + 1);
      if (query.length === 0 || /^[\w\u4e00-\u9fa5]*$/.test(query)) {
        setMentionQuery(query);
        const filtered = state.members.filter(member => 
          member.userName.toLowerCase().includes(query.toLowerCase()) &&
          member.userId !== user?.id
        );
        setMentionSuggestions(filtered);
        setShowMentionSuggestions(true);
      } else {
        setShowMentionSuggestions(false);
      }
    } else {
      setShowMentionSuggestions(false);
    }
  };
  
  // 选择@用户
  const handleSelectMention = (member: ChannelMember) => {
    const atIndex = state.newMessage.lastIndexOf('@');
    const beforeAt = state.newMessage.slice(0, atIndex);
    const afterQuery = state.newMessage.slice(atIndex + 1 + mentionQuery.length);
    setState(prev => ({ ...prev, newMessage: `${beforeAt}@${member.userName} ${afterQuery}` }));
    setShowMentionSuggestions(false);
  };

  // 打开频道管理界面
  const handleOpenChannelManagement = () => {
    setState(prev => ({ ...prev, showChannelManagement: true }));
  };

  // 关闭频道管理界面
  const handleCloseChannelManagement = () => {
    setState(prev => ({ ...prev, showChannelManagement: false }));
  };

  // 打开创建频道模态框
  const handleOpenCreateChannel = () => {
    setState(prev => ({ ...prev, showCreateChannelModal: true }));
  };

  // 关闭创建频道模态框
  const handleCloseCreateChannel = () => {
    setState(prev => ({ ...prev, showCreateChannelModal: false }));
  };

  // 创建频道成功后的回调
  const handleChannelCreated = () => {
    handleCloseCreateChannel();
    loadChannels(); // 重新加载频道列表
  };
  
  // 上传背景图
  const handleBackgroundUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !state.selectedChannel || !user) return;
    
    // 模拟上传
    const imageUrl = URL.createObjectURL(file);
    
    try {
      const result = await uploadChannelBackground(
        state.selectedChannel.id,
        imageUrl,
        user.id,
        user.username
      );
      
      if (result.success) {
        setChannelBackground(result.background!);
      }
    } catch (error) {
      console.error('上传背景图失败:', error);
    }
  };
  
  // 设置用户自定义背景
  const handleSetUserBackground = async (imageUrl: string) => {
    if (!state.selectedChannel || !user) return;
    
    try {
      await setUserChannelBackground(user.id, state.selectedChannel.id, imageUrl);
      setUserBackground(imageUrl);
    } catch (error) {
      console.error('设置背景失败:', error);
    }
  };
  
  // 查看未读消息
  const handleViewUnreadMessages = async () => {
    if (!state.selectedChannel || !user) return;
    
    try {
      const unreadMsgs = await getUnreadMessages(user.id, state.selectedChannel.id, 20);
      setUnreadMessages(unreadMsgs);
      setShowUnreadMessages(true);
    } catch (error) {
      console.error('获取未读消息失败:', error);
    }
  };
  
  // 跳转到第一条未读消息
  const handleJumpToFirstUnread = async () => {
    if (!state.selectedChannel || !user) return;
    
    try {
      const firstUnread = await getFirstUnreadMessage(user.id, state.selectedChannel.id);
      if (firstUnread) {
        // 找到消息在列表中的位置并滚动
        const messageElement = document.getElementById(`message-${firstUnread.id}`);
        if (messageElement) {
          messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          messageElement.classList.add('highlight-unread');
          setTimeout(() => {
            messageElement.classList.remove('highlight-unread');
          }, 2000);
        }
      }
    } catch (error) {
      console.error('跳转到未读消息失败:', error);
    }
  };
  
  // 标记消息为已读
  const handleMarkAsRead = async (messageId: string) => {
    if (!state.selectedChannel || !user) return;
    
    try {
      await markMessagesAsRead(user.id, state.selectedChannel.id, messageId);
      const newUnreadInfo = await getUnreadMessageInfo(user.id, state.selectedChannel.id);
      setUnreadInfo(newUnreadInfo);
    } catch (error) {
      console.error('标记已读失败:', error);
    }
  };

  // 获取频道图标
  const getChannelIcon = (type: ChannelType) => {
    switch (type) {
      case ChannelType.PVP:
        return '⚔️';
      case ChannelType.TRADE:
        return '💰';
      case ChannelType.HELP:
        return '❓';
      case ChannelType.ANNOUNCEMENT:
        return '📢';
      default:
        return '💬';
    }
  };

  // 获取频道类型名称
  const getChannelTypeName = (type: ChannelType) => {
    switch (type) {
      case ChannelType.PVP:
        return 'PVP';
      case ChannelType.TRADE:
        return '交易';
      case ChannelType.HELP:
        return '帮助';
      case ChannelType.ANNOUNCEMENT:
        return '公告';
      default:
        return '综合';
    }
  };

  useEffect(() => {
    loadChannels();
  }, [state.searchQuery, state.filterType]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">请先登录</h1>
          <p className="text-gray-600">您需要登录后才能使用频道功能</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="flex h-[800px]">
            {/* 频道列表侧边栏 */}
            <div className="w-80 bg-gray-50 border-r border-gray-200 flex flex-col">
              {/* 头部 */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Hash className="w-6 h-6 text-blue-500" />
                    频道
                  </h1>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setState(prev => ({ ...prev, showFriendsSidebar: !prev.showFriendsSidebar }))}
                      className="p-2 text-gray-500 hover:text-green-500 hover:bg-green-50 rounded-lg transition-colors"
                      title="好友列表"
                    >
                      <Users className="w-5 h-5" />
                    </button>
                    {(user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN) && (
                      <button 
                        onClick={handleOpenCreateChannel}
                        className="p-2 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                        title="创建频道"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
                
                {/* 搜索和筛选 */}
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="搜索频道..."
                      value={state.searchQuery}
                      onChange={(e) => setState(prev => ({ ...prev, searchQuery: e.target.value }))}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <select
                    value={state.filterType}
                    onChange={(e) => setState(prev => ({ ...prev, filterType: e.target.value as ChannelType | 'all' }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">所有类型</option>
                    <option value={ChannelType.GENERAL}>综合讨论</option>
                    <option value={ChannelType.PVP}>PVP对战</option>
                    <option value={ChannelType.TRADE}>交易频道</option>
                    <option value={ChannelType.HELP}>帮助频道</option>
                    <option value={ChannelType.ANNOUNCEMENT}>公告频道</option>
                  </select>
                </div>
              </div>
              
              {/* 频道列表 */}
              <div className="flex-1 overflow-y-auto">
                {state.loading ? (
                  <div className="p-6 text-center text-gray-500">
                    <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                    加载中...
                  </div>
                ) : (
                  <div className="p-4 space-y-2">
                    {state.channels.map((channel) => (
                      <motion.div
                        key={channel.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => selectChannel(channel.id)}
                        className={`p-4 rounded-xl cursor-pointer transition-all duration-200 ${
                          state.selectedChannel?.id === channel.id
                            ? 'bg-blue-100 border-2 border-blue-300'
                            : 'bg-white hover:bg-gray-50 border-2 border-transparent'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="text-2xl">{channel.icon || getChannelIcon(channel.type)}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-gray-800 truncate">{channel.name}</h3>
                              {channel.status === ChannelStatus.CLOSED && (
                                <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">关闭</span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 line-clamp-2 mb-2">{channel.description}</p>
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {channel.memberCount}
                              </span>
                              <span className="flex items-center gap-1">
                                <MessageSquare className="w-3 h-3" />
                                {channel.messageCount}
                              </span>
                              <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                                {getChannelTypeName(channel.type)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {/* 主聊天区域 */}
            <div className="flex-1 flex flex-col">
              {state.selectedChannel ? (
                <>
                  {/* 频道头部 */}
                  <div className="p-6 border-b border-gray-200 bg-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-3xl">{state.selectedChannel.icon || getChannelIcon(state.selectedChannel.type)}</div>
                        <div>
                          <h2 className="text-xl font-bold text-gray-800">{state.selectedChannel.name}</h2>
                          <p className="text-sm text-gray-600">{state.selectedChannel.description}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setState(prev => ({ ...prev, showMembers: !prev.showMembers }))}
                          className={`p-2 rounded-lg transition-colors ${
                            state.showMembers
                              ? 'bg-blue-100 text-blue-600'
                              : 'text-gray-500 hover:text-blue-500 hover:bg-blue-50'
                          }`}
                        >
                          <Users className="w-5 h-5" />
                        </button>
                        
                        {isChannelModerator(state.selectedChannel) && (
                          <button 
                            onClick={handleOpenChannelManagement}
                            className="p-2 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                            title="频道管理"
                          >
                            <Settings className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-1 overflow-hidden">
                    {/* 消息区域 */}
                    <div className="flex-1 flex flex-col">
                      {/* 消息列表 */}
                      <div 
                        className="flex-1 overflow-y-auto p-6 space-y-4 message-list custom-scrollbar chat-background"
                        style={{
                          backgroundImage: userBackground || channelBackground?.imageUrl 
                            ? `url(${userBackground || channelBackground?.imageUrl})` 
                            : undefined,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          backgroundRepeat: 'no-repeat'
                        }}
                      >
                        {/* 未读消息提示 */}
                        {unreadInfo && unreadInfo.count > 0 && (
                          <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="sticky top-0 z-10 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2">
                              <Bell className="w-4 h-4" />
                              <span>您有 {unreadInfo.count} 条未读消息</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={handleViewUnreadMessages}
                                className="text-sm bg-white/20 px-2 py-1 rounded hover:bg-white/30 transition-colors"
                              >
                                查看
                              </button>
                              <button
                                onClick={handleJumpToFirstUnread}
                                className="text-sm bg-white/20 px-2 py-1 rounded hover:bg-white/30 transition-colors"
                              >
                                跳转
                              </button>
                            </div>
                          </motion.div>
                        )}
                        
                        {state.messagesLoading ? (
                          <div className="text-center text-gray-500">
                            <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                            加载消息中...
                          </div>
                        ) : (
                          <>
                            {state.messages.map((message) => {
                              const isOwnMessage = message.authorId === user?.id;
                              
                              return (
                                <motion.div
                                  key={message.id}
                                  id={`message-${message.id}`}
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4 message-item group ${
                                    message.isUnread ? 'highlight-unread' : ''
                                  }`}
                                  onViewportEnter={() => handleMarkAsRead(message.id)}
                                >
                                  <div className={`max-w-[70%] ${isOwnMessage ? 'order-2' : 'order-1'}`}>
                                    {/* 置顶标识 */}
                                    {message.isPinned && (
                                      <div className="flex items-center gap-1 text-amber-600 text-sm mb-2">
                                        <Pin className="w-4 h-4" />
                                        <span>置顶消息</span>
                                      </div>
                                    )}
                                    
                                    {/* 回复信息 */}
                                    {message.replyToId && (
                                      <div className="bg-gray-100/80 backdrop-blur-sm rounded p-2 mb-2 border-l-4 border-blue-500">
                                        <div className="text-sm text-gray-600">
                                          回复 {message.replyToAuthor}
                                        </div>
                                        <div className="text-sm text-gray-800 truncate">
                                          {message.replyToContent}
                                        </div>
                                      </div>
                                    )}
                                    
                                    {/* 消息气泡 */}
                                    <div className={`p-4 message-bubble ${
                                      isOwnMessage ? 'own' : 'other'
                                    }`}>
                                      {/* 用户名和时间 */}
                                      {!isOwnMessage && (
                                        <div className="flex items-center gap-2 mb-2">
                                          <UserAvatar
                                            user={{
                                              avatarUrl: message.authorAvatar,
                                              gameNickname: message.authorName,
                                              role: message.authorRole
                                            }}
                                            size="sm"
                                            clickable={message.authorId !== user.id}
                                            onClick={() => message.authorId !== user.id && setUserInteractionContext({
                                              targetUser: {
                                                id: message.authorId,
                                                name: message.authorName,
                                                gameNickname: message.authorName,
                                                avatar: message.authorAvatar,
                                                role: message.authorRole
                                              },
                                              position: { x: 0, y: 0 },
                                              isOpen: true
                                            })}
                                          />
                                          <div className="font-medium text-sm">{message.authorName}</div>
                                          <RoleBadge role={message.authorRole} size="sm" />
                                        </div>
                                      )}
                                      
                                      {/* @提及高亮 */}
                                      <div className="mb-2">
                                        {message.isAtAll && (
                                          <span className="mention-tag at-all">
                                            @全体成员
                                          </span>
                                        )}
                                        {message.mentions && message.mentions.map(mention => (
                                          <span key={mention.userId} className="mention-tag at-user">
                                            @{mention.displayName}
                                          </span>
                                        ))}
                                      </div>
                                      
                                      {/* 消息内容 */}
                                      <p className="whitespace-pre-wrap break-words">{message.content}</p>
                                      
                                      {/* 图片 */}
                                      {message.imageUrl && (
                                        <div className="mt-3">
                                          <img
                                            src={message.imageUrl}
                                            alt="图片"
                                            className="max-w-full rounded-lg shadow-sm cursor-pointer hover:opacity-90 transition-opacity"
                                            onClick={() => window.open(message.imageUrl, '_blank')}
                                          />
                                        </div>
                                      )}
                                      
                                      {/* 时间戳 */}
                                      <div className={`text-xs mt-2 ${
                                        isOwnMessage ? 'text-white/70' : 'text-gray-500'
                                      }`}>
                                        {formatTime(message.createdAt)}
                                        {message.isEdited && ' (已编辑)'}
                                      </div>
                                    </div>
                                    
                                    {/* 消息操作 */}
                                    <div className={`flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity ${
                                      isOwnMessage ? 'justify-end' : 'justify-start'
                                    }`}>
                                      <button
                                        onClick={() => handleLikeMessage(message.id)}
                                        className={`flex items-center gap-1 px-2 py-1 rounded text-sm transition-colors ${
                                          message.likedByCurrentUser
                                            ? 'bg-red-100 text-red-600'
                                            : 'text-gray-500 hover:bg-gray-100'
                                        }`}
                                      >
                                        <Heart className={`w-4 h-4 ${message.likedByCurrentUser ? 'fill-current' : ''}`} />
                                        {message.likeCount > 0 && message.likeCount}
                                      </button>
                                      
                                      <button
                                        onClick={() => handleReplyMessage(message)}
                                        className="flex items-center gap-1 px-2 py-1 rounded text-sm text-gray-500 hover:bg-gray-100 transition-colors"
                                      >
                                        <Reply className="w-4 h-4" />
                                        回复
                                      </button>
                                      
                                      {isChannelModerator(state.selectedChannel!) && (
                                        <div className="flex items-center gap-1">
                                          <button
                                            onClick={() => handleModerationAction({
                                              type: message.isPinned ? 'unpin' : 'pin',
                                              targetMessageId: message.id
                                            })}
                                            className="p-1 text-gray-500 hover:bg-gray-100 rounded transition-colors"
                                          >
                                            <Pin className="w-4 h-4" />
                                          </button>
                                          
                                          <button
                                            onClick={() => handleModerationAction({
                                              type: 'delete',
                                              targetMessageId: message.id
                                            })}
                                            className="p-1 text-gray-500 hover:bg-red-100 hover:text-red-600 rounded transition-colors"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </motion.div>
                              );
                            })}
                            <div ref={messagesEndRef} />
                          </>
                        )}
                      </div>
                      
                      {/* 消息输入区域 */}
                      <div className="p-6 border-t border-gray-200/50 bg-white/80 backdrop-blur-sm">
                        {state.replyingTo && (
                          <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div className="text-sm text-blue-700">
                                回复 {state.replyingTo.authorName}: {state.replyingTo.content.substring(0, 50)}...
                              </div>
                              <button
                                onClick={cancelReply}
                                className="text-blue-500 hover:text-blue-700"
                              >
                                ×
                              </button>
                            </div>
                          </div>
                        )}
                        
                        {/* @提及建议 */}
                        {showMentionSuggestions && mentionSuggestions.length > 0 && (
                          <div className="mention-suggestions rounded-lg shadow-lg mb-3 max-h-40 overflow-y-auto">
                            {mentionSuggestions.map((member) => (
                              <button
                                key={member.userId}
                                onClick={() => handleSelectMention(member)}
                                className="mention-suggestion-item w-full flex items-center gap-3 px-4 py-2 text-left"
                              >
                                <UserAvatar
                                  user={{
                                    avatarUrl: member.userAvatar,
                                    gameNickname: member.userName,
                                    role: member.userRole
                                  }}
                                  size="sm"
                                />
                                <div>
                                  <div className="font-medium text-gray-900">{member.userName}</div>
                                  <RoleBadge role={member.userRole} size="sm" />
                                </div>
                              </button>
                            ))}
                            
                            {/* @全体成员选项 (仅管理员) */}
                            {isChannelModerator(state.selectedChannel!) && (
                              <button
                                onClick={() => {
                                  const atIndex = state.newMessage.lastIndexOf('@');
                                  const beforeAt = state.newMessage.slice(0, atIndex);
                                  const afterQuery = state.newMessage.slice(atIndex + 1 + mentionQuery.length);
                                  setState(prev => ({ ...prev, newMessage: `${beforeAt}@all ${afterQuery}` }));
                                  setShowMentionSuggestions(false);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors text-left border-t border-gray-100"
                              >
                                <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                  <AtSign className="w-4 h-4" />
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900">全体成员</div>
                                  <div className="text-sm text-gray-500">@所有频道成员</div>
                                </div>
                              </button>
                            )}
                          </div>
                        )}
                        
                        <div className="flex items-end gap-3">
                          <div className="flex-1 relative">
                            <textarea
                              ref={messageInputRef}
                              value={state.newMessage}
                              onChange={(e) => handleMessageInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  handleSendMessage();
                                }
                                if (e.key === 'Escape') {
                                  setShowMentionSuggestions(false);
                                }
                              }}
                              placeholder="输入消息... (输入 @ 来提及其他成员)"
                              className="message-input w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                              rows={3}
                            />
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {/* 表情按钮 */}
                            <div className="relative">
                              <button 
                                onClick={() => setState(prev => ({ ...prev, showEmojiPicker: !prev.showEmojiPicker }))}
                                className="p-3 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-colors"
                                title="选择表情"
                              >
                                <Smile className="w-5 h-5" />
                              </button>
                              
                              {/* 表情选择器 */}
                               {state.showEmojiPicker && (
                                 <div ref={emojiPickerRef} className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-80 z-50">
                                  <div className="text-sm font-medium text-gray-900 mb-3">选择表情</div>
                                  <div className="grid grid-cols-8 gap-2 max-h-48 overflow-y-auto">
                                    {[
                                      '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣',
                                      '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰',
                                      '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜',
                                      '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏',
                                      '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
                                      '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠',
                                      '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨',
                                      '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥',
                                      '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧',
                                      '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐',
                                      '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑',
                                      '🤠', '😈', '👿', '👹', '👺', '🤡', '💩', '👻',
                                      '💀', '☠️', '👽', '👾', '🤖', '🎃', '😺', '😸',
                                      '😹', '😻', '😼', '😽', '🙀', '😿', '😾', '❤️',
                                      '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎',
                                      '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘',
                                      '💝', '💟', '👍', '👎', '👌', '🤌', '🤏', '✌️',
                                      '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕',
                                      '👇', '☝️', '👋', '🤚', '🖐️', '✋', '🖖', '👏',
                                      '🙌', '🤝', '👐', '🤲', '🤜', '🤛', '✊', '👊'
                                    ].map((emoji, index) => (
                                      <button
                                        key={index}
                                        onClick={() => handleEmojiSelect(emoji)}
                                        className="p-2 text-2xl hover:bg-gray-100 rounded transition-colors"
                                        title={emoji}
                                      >
                                        {emoji}
                                      </button>
                                    ))}
                                  </div>
                                  <div className="mt-3 pt-3 border-t border-gray-200">
                                    <button
                                      onClick={() => setState(prev => ({ ...prev, showEmojiPicker: false }))}
                                      className="text-sm text-gray-500 hover:text-gray-700"
                                    >
                                      关闭
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            {/* 图片上传按钮 */}
                            <div className="relative">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                                id="image-upload"
                              />
                              <label
                                htmlFor="image-upload"
                                className="p-3 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-colors cursor-pointer inline-block"
                                title="上传图片"
                              >
                                <Image className="w-5 h-5" />
                              </label>
                            </div>
                            
                            {/* 背景图上传 */}
                            <div className="relative">
                              <button
                                onClick={() => setShowBackgroundUpload(!showBackgroundUpload)}
                                className="p-3 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-colors"
                                title="设置背景图"
                              >
                                <Upload className="w-5 h-5" />
                              </button>
                              
                              {showBackgroundUpload && (
                                <div className="absolute bottom-full right-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 w-48">
                                  <div className="text-sm font-medium text-gray-900 mb-2">设置背景图</div>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleBackgroundUpload}
                                    className="w-full text-sm text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                  />
                                  <div className="mt-2 text-xs text-gray-500">
                                    支持 JPG、PNG 格式
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            <button
                              onClick={handleSendMessage}
                              disabled={!state.newMessage.trim()}
                              className="p-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              <Send className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* 成员列表侧边栏 */}
                    <AnimatePresence>
                      {state.showMembers && (
                        <motion.div
                          initial={{ width: 0, opacity: 0 }}
                          animate={{ width: 300, opacity: 1 }}
                          exit={{ width: 0, opacity: 0 }}
                          className="bg-gray-50 border-l border-gray-200 overflow-hidden"
                        >
                          <div className="p-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                              <Users className="w-5 h-5" />
                              成员 ({state.members.length})
                            </h3>
                            
                            <div className="space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar">
                              {state.members.map((member) => (
                                <div key={member.id} className="flex items-center gap-3 p-3 bg-white rounded-lg">
                                  <div className="relative">
                                    <UserAvatar
                                      user={{
                                        avatarUrl: member.userAvatar,
                                        gameNickname: member.userName,
                                        role: member.userRole
                                      }}
                                      size="sm"
                                      clickable={member.userId !== user.id}
                                      onClick={() => member.userId !== user.id && setUserInteractionContext({
                                        targetUser: {
                                          id: member.userId,
                                          name: member.userName,
                                          gameNickname: member.userName,
                                          avatar: member.userAvatar,
                                          role: member.userRole
                                        },
                                        position: { x: 0, y: 0 },
                                        isOpen: true
                                      })}
                                    />
                                    <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                                      member.isOnline ? 'bg-green-500' : 'bg-gray-400'
                                    }`} />
                                  </div>
                                  
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-gray-800 truncate">{member.userName}</span>
                                      {member.isMuted && (
                                        <VolumeX className="w-4 h-4 text-red-500" />
                                      )}
                                    </div>
                                    <RoleBadge role={member.userRole} size="sm" />
                                  </div>
                                  
                                  {isChannelModerator(state.selectedChannel!) && member.userId !== user.id && (
                                    <div className="flex items-center gap-1">
                                      <button
                                        onClick={() => handleModerationAction({
                                          type: member.isMuted ? 'unmute' : 'mute',
                                          targetUserId: member.userId,
                                          duration: 15
                                        })}
                                        className="p-1 text-gray-500 hover:bg-gray-100 rounded transition-colors"
                                      >
                                        {member.isMuted ? <Volume className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                                      </button>
                                      
                                      <button
                                        onClick={() => handleModerationAction({
                                          type: 'kick',
                                          targetUserId: member.userId
                                        })}
                                        className="p-1 text-gray-500 hover:bg-red-100 hover:text-red-600 rounded transition-colors"
                                      >
                                        <UserMinus className="w-4 h-4" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              ) : (
                /* 未选择频道时的欢迎界面 */
                <div className="flex-1 flex items-center justify-center bg-gray-50">
                  <div className="text-center">
                    <div className="text-6xl mb-4">💬</div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">欢迎来到频道</h2>
                    <p className="text-gray-600 mb-6">选择一个频道开始聊天吧！</p>
                    <div className="bg-white p-6 rounded-xl shadow-sm max-w-md">
                      <h3 className="font-semibold text-gray-800 mb-3">频道功能</h3>
                      <ul className="text-sm text-gray-600 space-y-2 text-left">
                        <li className="flex items-center gap-2">
                          <MessageSquare className="w-4 h-4 text-blue-500" />
                          实时聊天交流
                        </li>
                        <li className="flex items-center gap-2">
                          <Pin className="w-4 h-4 text-yellow-500" />
                          精华内容置顶
                        </li>
                        <li className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-green-500" />
                          违禁词自动检测
                        </li>
                        <li className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-purple-500" />
                          宵禁时间管理
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* 未读消息弹窗 */}
      <AnimatePresence>
        {showUnreadMessages && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowUnreadMessages(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden slide-up"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">未读消息</h3>
                <button
                  onClick={() => setShowUnreadMessages(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ×
                </button>
              </div>
              
              <div className="overflow-y-auto max-h-96 p-4 space-y-3 custom-scrollbar">
                {unreadMessages.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    暂无未读消息
                  </div>
                ) : (
                  unreadMessages.map((message) => (
                    <div
                      key={message.id}
                      className="bg-gray-50 rounded-lg p-3 cursor-pointer hover:bg-gray-100 transition-colors fade-in"
                      onClick={() => {
                        setShowUnreadMessages(false);
                        const messageElement = document.getElementById(`message-${message.id}`);
                        if (messageElement) {
                          messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          messageElement.classList.add('highlight-unread');
                          setTimeout(() => {
                            messageElement.classList.remove('highlight-unread');
                          }, 2000);
                        }
                      }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-medium">
                          {message.authorName.charAt(0).toUpperCase()}
                        </div>
                        <div className="font-medium text-sm text-gray-900">{message.authorName}</div>
                        <div className="text-xs text-gray-500">{formatTime(message.createdAt)}</div>
                      </div>
                      
                      {message.isAtAll && (
                        <span className="mention-tag at-all">
                          @全体成员
                        </span>
                      )}
                      {message.mentions && message.mentions.map(mention => (
                        <span key={mention.userId} className="mention-tag at-user">
                          @{mention.displayName}
                        </span>
                      ))}
                      
                      <p className="text-sm text-gray-700 line-clamp-2">{message.content}</p>
                    </div>
                  ))
                )}
              </div>
              
              <div className="flex items-center justify-between p-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    if (unreadMessages.length > 0) {
                      handleMarkAsRead(unreadMessages[unreadMessages.length - 1].id);
                    }
                    setShowUnreadMessages(false);
                  }}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  全部标记为已读
                </button>
                
                <button
                  onClick={() => setShowUnreadMessages(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                  关闭
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 频道管理模态框 */}
      {state.showChannelManagement && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">频道管理</h2>
              <button
                onClick={handleCloseChannelManagement}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                ×
              </button>
            </div>
            <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
              <ChannelManagement />
            </div>
          </div>
        </div>
      )}

      {/* 好友侧边栏 */}
      <FriendsSidebar 
        isOpen={state.showFriendsSidebar}
        onToggle={() => setState(prev => ({ ...prev, showFriendsSidebar: !prev.showFriendsSidebar }))}
        onClose={() => setState(prev => ({ ...prev, showFriendsSidebar: false }))}
      />

      {/* 用户交互菜单 */}
      {userInteractionContext && (
        <UserInteractionMenu
          context={userInteractionContext}
          onClose={() => setUserInteractionContext(null)}
        />
      )}
    </div>
  );
}