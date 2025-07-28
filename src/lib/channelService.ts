// 频道服务 - 提供频道相关的数据操作功能

import {
  ForumChannel,
  ChannelMessage,
  ChannelMember,
  ForbiddenWordViolation,
  ChannelType,
  ChannelStatus,
  ChannelQueryParams,
  CreateChannelRequest,
  UpdateChannelRequest,
  SendChannelMessageRequest,
  ChannelMessageQueryParams,
  ChannelMessageListResponse,
  ChannelModerationAction,
  ChannelStats,
  UserChannelStats,
  ChannelNotification,
  ChannelSpeakingRules,
  ChannelMention,
  ChannelBackground,
  UnreadMessageInfo,
  ChannelUserSettings
} from '@/types/forum';
import { UserRole } from '@/types/auth';

// 模拟数据存储
let channels: ForumChannel[] = [];
let channelMessages: ChannelMessage[] = [];
let channelMembers: ChannelMember[] = [];
let forbiddenWordViolations: ForbiddenWordViolation[] = [];
let channelBackgrounds: ChannelBackground[] = [];
let channelUserSettings: ChannelUserSettings[] = [];
let channelNotifications: ChannelNotification[] = [];
let messageIdCounter = 1;

// 用户消息点赞记录
let userMessageLikes: { [userId: string]: Set<string> } = {};

// 初始化默认频道数据
function initializeDefaultChannels() {
  if (channels.length === 0) {
    const defaultSpeakingRules: ChannelSpeakingRules = {
      slowMode: false,
      slowModeInterval: 5,
      slowModeSeconds: 5,
      requireApproval: false,
      allowImages: true,
      allowLinks: true,
      maxMessageLength: 2000,
      allowMentions: true,
      allowAtAll: true
    };

    // 预设PVP频道
    const pvpChannel: ForumChannel = {
      id: 'channel-pvp',
      name: 'PVP对战',
      description: '宝可梦对战交流频道，讨论战术、分享对战心得',
      type: ChannelType.PVP,
      status: ChannelStatus.ACTIVE,
      icon: '⚔️',
      color: '#EF4444',
      order: 1,
      memberCount: 0,
      maxMembers: 500,
      isPrivate: false,
      allowedRoles: [UserRole.USER, UserRole.ADMIN, UserRole.SUPER_ADMIN],
      moderatorIds: ['1'], // 管理员ID
      speakingRules: defaultSpeakingRules,
      forbiddenWords: ['外挂', '作弊', '刷分', '代练'],
      curfewEnabled: false,
      messageCount: 0,
      createdAt: new Date('2024-01-01T00:00:00'),
      updatedAt: new Date('2024-01-01T00:00:00'),
      createdBy: '1',
      createdByName: '管理员'
    };

    // 综合讨论频道
    const generalChannel: ForumChannel = {
      id: 'channel-general',
      name: '综合讨论',
      description: '日常交流、闲聊的地方',
      type: ChannelType.GENERAL,
      status: ChannelStatus.ACTIVE,
      icon: '💬',
      color: '#3B82F6',
      order: 2,
      memberCount: 0,
      maxMembers: 1000,
      isPrivate: false,
      allowedRoles: [UserRole.USER, UserRole.ADMIN, UserRole.SUPER_ADMIN],
      moderatorIds: ['1'],
      speakingRules: defaultSpeakingRules,
      forbiddenWords: ['垃圾', '废物', '傻逼'],
      curfewEnabled: false,
      messageCount: 0,
      createdAt: new Date('2024-01-01T00:00:00'),
      updatedAt: new Date('2024-01-01T00:00:00'),
      createdBy: '1',
      createdByName: '管理员'
    };

    channels = [pvpChannel, generalChannel];
  }
}

// 初始化数据
initializeDefaultChannels();

// ==================== 频道管理 ====================

// 获取频道列表
export async function getChannels(params: ChannelQueryParams = {}): Promise<ForumChannel[]> {
  await new Promise(resolve => setTimeout(resolve, 200));
  
  let filteredChannels = [...channels];
  
  // 应用筛选条件
  if (params.type) {
    filteredChannels = filteredChannels.filter(channel => channel.type === params.type);
  }
  
  if (params.status) {
    filteredChannels = filteredChannels.filter(channel => channel.status === params.status);
  }
  
  if (params.search) {
    const searchLower = params.search.toLowerCase();
    filteredChannels = filteredChannels.filter(channel => 
      channel.name.toLowerCase().includes(searchLower) ||
      channel.description.toLowerCase().includes(searchLower)
    );
  }
  
  // 排序
  const sortBy = params.sortBy || 'order';
  const sortOrder = params.sortOrder || 'asc';
  
  filteredChannels.sort((a, b) => {
    let aValue: any, bValue: any;
    
    switch (sortBy) {
      case 'name':
        aValue = a.name;
        bValue = b.name;
        break;
      case 'created':
        aValue = a.createdAt;
        bValue = b.createdAt;
        break;
      case 'members':
        aValue = a.memberCount;
        bValue = b.memberCount;
        break;
      case 'messages':
        aValue = a.messageCount;
        bValue = b.messageCount;
        break;
      default:
        aValue = a.order;
        bValue = b.order;
    }
    
    if (sortOrder === 'desc') {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    } else {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    }
  });
  
  return filteredChannels;
}

// 获取单个频道详情
export async function getChannelById(channelId: string): Promise<ForumChannel | null> {
  await new Promise(resolve => setTimeout(resolve, 100));
  return channels.find(channel => channel.id === channelId) || null;
}

// 创建频道
export async function createChannel(
  creatorId: string,
  creatorName: string,
  channelData: CreateChannelRequest
): Promise<ForumChannel> {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const newChannel: ForumChannel = {
    id: `channel-${Date.now()}`,
    name: channelData.name,
    description: channelData.description,
    type: channelData.type,
    status: ChannelStatus.ACTIVE,
    icon: channelData.icon,
    color: channelData.color,
    order: channels.length + 1,
    memberCount: 0,
    maxMembers: channelData.maxMembers,
    isPrivate: channelData.isPrivate || false,
    allowedRoles: channelData.allowedRoles,
    moderatorIds: [creatorId], // 创建者自动成为管理员
    speakingRules: channelData.speakingRules,
    forbiddenWords: channelData.forbiddenWords || [],
    curfewEnabled: channelData.curfewEnabled || false,
    curfewStartTime: channelData.curfewStartTime,
    curfewEndTime: channelData.curfewEndTime,
    curfewStartHour: channelData.curfewStartHour,
    curfewEndHour: channelData.curfewEndHour,
    messageCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: creatorId,
    createdByName: creatorName
  };
  
  channels.push(newChannel);
  return newChannel;
}

// 更新频道
export async function updateChannel(
  channelId: string,
  updateData: UpdateChannelRequest
): Promise<ForumChannel | null> {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const channelIndex = channels.findIndex(channel => channel.id === channelId);
  if (channelIndex === -1) {
    return null;
  }
  
  const channel = channels[channelIndex];
  
  // 更新字段
  if (updateData.name !== undefined) channel.name = updateData.name;
  if (updateData.description !== undefined) channel.description = updateData.description;
  if (updateData.status !== undefined) channel.status = updateData.status;
  if (updateData.icon !== undefined) channel.icon = updateData.icon;
  if (updateData.color !== undefined) channel.color = updateData.color;
  if (updateData.maxMembers !== undefined) channel.maxMembers = updateData.maxMembers;
  if (updateData.isPrivate !== undefined) channel.isPrivate = updateData.isPrivate;
  if (updateData.allowedRoles !== undefined) channel.allowedRoles = updateData.allowedRoles;
  if (updateData.moderatorIds !== undefined) channel.moderatorIds = updateData.moderatorIds;
  if (updateData.speakingRules !== undefined) {
    channel.speakingRules = { ...channel.speakingRules, ...updateData.speakingRules };
  }
  if (updateData.forbiddenWords !== undefined) channel.forbiddenWords = updateData.forbiddenWords;
  if (updateData.curfewEnabled !== undefined) channel.curfewEnabled = updateData.curfewEnabled;
  if (updateData.curfewStartTime !== undefined) channel.curfewStartTime = updateData.curfewStartTime;
  if (updateData.curfewEndTime !== undefined) channel.curfewEndTime = updateData.curfewEndTime;
  if (updateData.curfewStartHour !== undefined) channel.curfewStartHour = updateData.curfewStartHour;
  if (updateData.curfewEndHour !== undefined) channel.curfewEndHour = updateData.curfewEndHour;
  
  channel.updatedAt = new Date();
  
  return channel;
}

// 删除频道
export async function deleteChannel(channelId: string): Promise<{ success: boolean; message: string }> {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const channelIndex = channels.findIndex(channel => channel.id === channelId);
  if (channelIndex === -1) {
    return { success: false, message: '频道不存在' };
  }
  
  // 删除频道相关数据
  channels.splice(channelIndex, 1);
  channelMessages = channelMessages.filter(message => message.channelId !== channelId);
  channelMembers = channelMembers.filter(member => member.channelId !== channelId);
  forbiddenWordViolations = forbiddenWordViolations.filter(violation => violation.channelId !== channelId);
  
  return { success: true, message: '频道删除成功' };
}

// ==================== 频道成员管理 ====================

// 加入频道
export async function joinChannel(
  channelId: string,
  userId: string,
  userName: string,
  userAvatar: string,
  userRole: UserRole
): Promise<{ success: boolean; message: string }> {
  await new Promise(resolve => setTimeout(resolve, 200));
  
  const channel = channels.find(c => c.id === channelId);
  if (!channel) {
    return { success: false, message: '频道不存在' };
  }
  
  if (channel.status !== ChannelStatus.ACTIVE) {
    return { success: false, message: '频道已关闭' };
  }
  
  // 检查权限
  if (!channel.allowedRoles.includes(userRole)) {
    return { success: false, message: '您没有权限加入此频道' };
  }
  
  // 检查是否已经是成员
  const existingMember = channelMembers.find(m => m.channelId === channelId && m.userId === userId);
  if (existingMember) {
    return { success: false, message: '您已经是频道成员' };
  }
  
  // 检查人数限制
  if (channel.maxMembers && channel.memberCount >= channel.maxMembers) {
    return { success: false, message: '频道人数已满' };
  }
  
  // 添加成员
  const newMember: ChannelMember = {
    id: `member-${Date.now()}`,
    channelId,
    userId,
    userName,
    userAvatar,
    userRole,
    isOnline: true,
    isMuted: false,
    messageCount: 0,
    lastActiveAt: new Date(),
    joinedAt: new Date()
  };
  
  channelMembers.push(newMember);
  
  // 更新频道成员数
  channel.memberCount++;
  channel.updatedAt = new Date();
  
  return { success: true, message: '加入频道成功' };
}

// 离开频道
export async function leaveChannel(
  channelId: string,
  userId: string
): Promise<{ success: boolean; message: string }> {
  await new Promise(resolve => setTimeout(resolve, 200));
  
  const memberIndex = channelMembers.findIndex(m => m.channelId === channelId && m.userId === userId);
  if (memberIndex === -1) {
    return { success: false, message: '您不是频道成员' };
  }
  
  // 移除成员
  channelMembers.splice(memberIndex, 1);
  
  // 更新频道成员数
  const channel = channels.find(c => c.id === channelId);
  if (channel) {
    channel.memberCount--;
    channel.updatedAt = new Date();
  }
  
  return { success: true, message: '操作成功' };
}

// ==================== @提及功能 ====================

// 解析消息中的@提及
export function parseMentions(content: string, channelMembers: ChannelMember[]): {
  mentions: ChannelMention[];
  isAtAll: boolean;
  processedContent: string;
} {
  const mentions: ChannelMention[] = [];
  let isAtAll = false;
  let processedContent = content;

  // 检查@全体成员
  if (content.includes('@all') || content.includes('@全体成员')) {
    isAtAll = true;
  }

  // 解析@用户名
  const mentionRegex = /@([\w\u4e00-\u9fa5]+)/g;
  let match;
  while ((match = mentionRegex.exec(content)) !== null) {
    const username = match[1];
    if (username === 'all' || username === '全体成员') {
      isAtAll = true;
      continue;
    }
    
    const member = channelMembers.find(m => m.userName === username);
    if (member && !mentions.find(m => m.userId === member.userId)) {
      mentions.push({
        userId: member.userId,
        username: member.userName,
        displayName: member.userName
      });
    }
  }

  return { mentions, isAtAll, processedContent };
}

// 发送@通知到站内信
export async function sendMentionNotifications(
  message: ChannelMessage,
  channelName: string
): Promise<void> {
  const { createSystemMessage } = await import('@/lib/messageSystem');
  
  // 处理@全体成员
  if (message.isAtAll) {
    const allMembers = channelMembers.filter(m => m.channelId === message.channelId);
    const recipients = allMembers.map(m => m.userName);
    
    if (recipients.length > 0) {
      await createSystemMessage({
        title: `频道@全体通知 - ${channelName}`,
        content: `${message.authorName} 在频道「${channelName}」中@了全体成员：\n\n${message.content}`,
        category: 'notification' as any,
        priority: 'high' as any,
        recipients,
        metadata: {
          channelId: message.channelId,
          messageId: message.id,
          mentionType: 'at_all'
        }
      });
    }
  }
  
  // 处理@特定用户
  if (message.mentions && message.mentions.length > 0) {
    const recipients = message.mentions.map(m => m.username);
    
    await createSystemMessage({
      title: `频道@提及通知 - ${channelName}`,
      content: `${message.authorName} 在频道「${channelName}」中@了您：\n\n${message.content}`,
      category: 'notification' as any,
      priority: 'normal' as any,
      recipients,
      metadata: {
        channelId: message.channelId,
        messageId: message.id,
        mentionType: 'mention'
      }
    });
  }
}

// ==================== 背景图管理 ====================

// 上传频道背景图
export async function uploadChannelBackground(
  channelId: string,
  imageUrl: string,
  uploadedBy: string,
  uploadedByName: string
): Promise<{ success: boolean; background?: ChannelBackground; message: string }> {
  await new Promise(resolve => setTimeout(resolve, 200));
  
  const channel = channels.find(c => c.id === channelId);
  if (!channel) {
    return { success: false, message: '频道不存在' };
  }
  
  // 停用之前的背景图
  channelBackgrounds.forEach(bg => {
    if (bg.channelId === channelId) {
      bg.isActive = false;
    }
  });
  
  const newBackground: ChannelBackground = {
    id: `bg-${Date.now()}`,
    channelId,
    imageUrl,
    uploadedBy,
    uploadedByName,
    isActive: true,
    createdAt: new Date()
  };
  
  channelBackgrounds.push(newBackground);
  
  return {
    success: true,
    background: newBackground,
    message: '背景图上传成功'
  };
}

// 获取频道背景图
export async function getChannelBackground(channelId: string): Promise<ChannelBackground | null> {
  await new Promise(resolve => setTimeout(resolve, 100));
  return channelBackgrounds.find(bg => bg.channelId === channelId && bg.isActive) || null;
}

// 设置用户自定义背景图
export async function setUserChannelBackground(
  userId: string,
  channelId: string,
  backgroundImageUrl: string
): Promise<{ success: boolean; message: string }> {
  await new Promise(resolve => setTimeout(resolve, 200));
  
  let userSettings = channelUserSettings.find(s => s.userId === userId && s.channelId === channelId);
  
  if (!userSettings) {
    userSettings = {
      userId,
      channelId,
      backgroundImageUrl,
      notificationEnabled: true,
      mentionNotificationEnabled: true
    };
    channelUserSettings.push(userSettings);
  } else {
    userSettings.backgroundImageUrl = backgroundImageUrl;
  }
  
  return { success: true, message: '背景图设置成功' };
}

// ==================== 未读消息管理 ====================

// 获取用户未读消息信息
export async function getUnreadMessageInfo(
  userId: string,
  channelId: string
): Promise<UnreadMessageInfo | null> {
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const userSettings = channelUserSettings.find(s => s.userId === userId && s.channelId === channelId);
  if (!userSettings || !userSettings.lastReadMessageId) {
    // 如果没有阅读记录，返回所有消息为未读
    const messages = channelMessages.filter(m => m.channelId === channelId && !m.isDeleted);
    return {
      channelId,
      messageId: '',
      count: messages.length,
      lastReadAt: undefined
    };
  }
  
  const lastReadMessage = channelMessages.find(m => m.id === userSettings.lastReadMessageId);
  if (!lastReadMessage) {
    return null;
  }
  
  const unreadMessages = channelMessages.filter(m => 
    m.channelId === channelId && 
    !m.isDeleted && 
    m.createdAt > lastReadMessage.createdAt
  );
  
  return {
    channelId,
    messageId: userSettings.lastReadMessageId,
    count: unreadMessages.length,
    lastReadAt: userSettings.lastReadAt
  };
}

// 标记消息为已读
export async function markMessagesAsRead(
  userId: string,
  channelId: string,
  messageId: string
): Promise<{ success: boolean; message: string }> {
  await new Promise(resolve => setTimeout(resolve, 100));
  
  let userSettings = channelUserSettings.find(s => s.userId === userId && s.channelId === channelId);
  
  if (!userSettings) {
    userSettings = {
      userId,
      channelId,
      lastReadMessageId: messageId,
      lastReadAt: new Date(),
      notificationEnabled: true,
      mentionNotificationEnabled: true
    };
    channelUserSettings.push(userSettings);
  } else {
    userSettings.lastReadMessageId = messageId;
    userSettings.lastReadAt = new Date();
  }
  
  return { success: true, message: '已标记为已读' };
}

// 获取频道未读消息数量
export async function getChannelUnreadCount(userId: string, channelId: string): Promise<number> {
  const unreadInfo = await getUnreadMessageInfo(userId, channelId);
  return unreadInfo?.count || 0;
}

// ==================== 快速浏览未读消息 ====================

// 获取未读消息列表
export async function getUnreadMessages(
  userId: string,
  channelId: string,
  limit: number = 10
): Promise<ChannelMessage[]> {
  await new Promise(resolve => setTimeout(resolve, 200));
  
  const userSettings = channelUserSettings.find(s => s.userId === userId && s.channelId === channelId);
  let unreadMessages: ChannelMessage[];
  
  if (!userSettings || !userSettings.lastReadMessageId) {
    // 如果没有阅读记录，返回最新的消息
    unreadMessages = channelMessages
      .filter(m => m.channelId === channelId && !m.isDeleted)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  } else {
    const lastReadMessage = channelMessages.find(m => m.id === userSettings.lastReadMessageId);
    if (lastReadMessage) {
      unreadMessages = channelMessages
        .filter(m => 
          m.channelId === channelId && 
          !m.isDeleted && 
          m.createdAt > lastReadMessage.createdAt
        )
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
        .slice(0, limit);
    } else {
      unreadMessages = [];
    }
  }
  
  return unreadMessages;
}

// 跳转到第一条未读消息
export async function getFirstUnreadMessage(
  userId: string,
  channelId: string
): Promise<ChannelMessage | null> {
  const unreadMessages = await getUnreadMessages(userId, channelId, 1);
  return unreadMessages.length > 0 ? unreadMessages[0] : null;
}

// 获取频道成员列表
export async function getChannelMembers(channelId: string): Promise<ChannelMember[]> {
  await new Promise(resolve => setTimeout(resolve, 200));
  
  return channelMembers
    .filter(member => member.channelId === channelId)
    .sort((a, b) => b.lastActiveAt.getTime() - a.lastActiveAt.getTime());
}

// ==================== 消息管理 ====================

// 检查违禁词
function checkForbiddenWords(content: string, forbiddenWords: string[]): string | null {
  const contentLower = content.toLowerCase();
  for (const word of forbiddenWords) {
    if (contentLower.includes(word.toLowerCase())) {
      return word;
    }
  }
  return null;
}

// 检查宵禁
function isInCurfew(channel: ForumChannel): boolean {
  if (!channel.curfewEnabled || !channel.curfewStartTime || !channel.curfewEndTime) {
    return false;
  }
  
  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  
  const startTime = channel.curfewStartTime;
  const endTime = channel.curfewEndTime;
  
  // 处理跨天的情况
  if (startTime > endTime) {
    return currentTime >= startTime || currentTime <= endTime;
  } else {
    return currentTime >= startTime && currentTime <= endTime;
  }
}

// 发送消息
export async function sendChannelMessage(
  authorId: string,
  authorName: string,
  authorAvatar: string,
  authorRole: UserRole,
  messageData: SendChannelMessageRequest
): Promise<{ success: boolean; message?: string; channelMessage?: ChannelMessage }> {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const channel = channels.find(c => c.id === messageData.channelId);
  if (!channel) {
    return { success: false, message: '频道不存在' };
  }
  
  if (channel.status !== ChannelStatus.ACTIVE) {
    return { success: false, message: '频道已关闭' };
  }
  
  // 检查是否是频道成员
  const member = channelMembers.find(m => m.channelId === messageData.channelId && m.userId === authorId);
  if (!member) {
    return { success: false, message: '您不是频道成员' };
  }
  
  // 检查是否被禁言
  if (member.isMuted && member.mutedUntil && member.mutedUntil > new Date()) {
    const remainingTime = Math.ceil((member.mutedUntil.getTime() - new Date().getTime()) / (1000 * 60));
    return { success: false, message: `您已被禁言，剩余时间：${remainingTime}分钟` };
  }
  
  // 检查宵禁
  if (isInCurfew(channel) && authorRole === UserRole.USER) {
    return { success: false, message: '当前时间段禁止发言（宵禁时间）' };
  }
  
  // 检查违禁词
  const violatedWord = checkForbiddenWords(messageData.content, channel.forbiddenWords);
  if (violatedWord) {
    // 记录违规
    const violation: ForbiddenWordViolation = {
      id: `violation-${Date.now()}`,
      channelId: messageData.channelId,
      userId: authorId,
      userName: authorName,
      userRole: authorRole,
      messageContent: messageData.content,
      violatedWord,
      forbiddenWord: violatedWord,
      originalMessage: messageData.content,
      channelName: channel.name,
      violationTime: new Date(),
      muteDuration: 15, // 15分钟
      muteStartAt: new Date(),
      muteEndAt: new Date(Date.now() + 15 * 60 * 1000),
      muteEndTime: new Date(Date.now() + 15 * 60 * 1000),
      createdAt: new Date()
    };
    
    forbiddenWordViolations.push(violation);
    
    // 禁言用户
    member.isMuted = true;
    member.mutedUntil = violation.muteEndAt;
    member.mutedBy = 'system';
    member.mutedReason = `使用违禁词：${violatedWord}`;
    
    return { success: false, message: `检测到违禁词"${violatedWord}"，您已被禁言15分钟` };
  }
  
  // 检查消息长度
  if (messageData.content.length > channel.speakingRules.maxMessageLength) {
    return { success: false, message: `消息长度超过限制（${channel.speakingRules.maxMessageLength}字符）` };
  }
  
  // 创建消息
  const newMessage: ChannelMessage = {
    id: `message-${Date.now()}`,
    channelId: messageData.channelId,
    content: messageData.content,
    authorId,
    authorName,
    authorAvatar,
    authorRole,
    type: messageData.type || 'text',
    imageUrl: messageData.imageUrl,
    replyToId: messageData.replyToId,
    isDeleted: false,
    isPinned: false,
    isEdited: false,
    likeCount: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  // 如果是回复消息，获取被回复的消息信息
  if (messageData.replyToId) {
    const replyToMessage = channelMessages.find(m => m.id === messageData.replyToId);
    if (replyToMessage) {
      newMessage.replyToContent = replyToMessage.content.substring(0, 100); // 截取前100字符
      newMessage.replyToAuthor = replyToMessage.authorName;
    }
  }
  
  channelMessages.push(newMessage);
  
  // 更新频道统计
  channel.messageCount++;
  channel.lastMessageAt = new Date();
  channel.lastMessageBy = authorName;
  channel.updatedAt = new Date();
  
  // 更新成员统计
  member.messageCount++;
  member.lastActiveAt = new Date();
  
  return { success: true, channelMessage: newMessage };
}

// 获取频道消息列表
export async function getChannelMessages(
  params: ChannelMessageQueryParams,
  userId?: string
): Promise<ChannelMessageListResponse> {
  await new Promise(resolve => setTimeout(resolve, 200));
  
  let filteredMessages = channelMessages.filter(message => 
    message.channelId === params.channelId && !message.isDeleted
  );
  
  // 应用筛选条件
  if (params.search) {
    const searchLower = params.search.toLowerCase();
    filteredMessages = filteredMessages.filter(message => 
      message.content.toLowerCase().includes(searchLower)
    );
  }
  
  if (params.authorId) {
    filteredMessages = filteredMessages.filter(message => message.authorId === params.authorId);
  }
  
  if (params.pinnedOnly) {
    filteredMessages = filteredMessages.filter(message => message.isPinned);
  }
  
  if (params.before) {
    filteredMessages = filteredMessages.filter(message => message.createdAt < params.before!);
  }
  
  if (params.after) {
    filteredMessages = filteredMessages.filter(message => message.createdAt > params.after!);
  }
  
  // 排序（最新的在前）
  filteredMessages.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  
  // 分页
  const page = params.page || 1;
  const limit = params.limit || 50;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  
  const paginatedMessages = filteredMessages.slice(startIndex, endIndex);
  
  // 设置当前用户的点赞状态
  if (userId && userMessageLikes[userId]) {
    paginatedMessages.forEach(message => {
      message.likedByCurrentUser = userMessageLikes[userId].has(message.id);
    });
  }
  
  return {
    messages: paginatedMessages,
    total: filteredMessages.length,
    page,
    limit,
    hasMore: endIndex < filteredMessages.length
  };
}

// 点赞消息
export async function likeChannelMessage(
  messageId: string,
  userId: string
): Promise<ChannelMessage | null> {
  await new Promise(resolve => setTimeout(resolve, 200));
  
  const message = channelMessages.find(m => m.id === messageId);
  if (!message) {
    return null;
  }
  
  if (!userMessageLikes[userId]) {
    userMessageLikes[userId] = new Set();
  }
  
  const hasLiked = userMessageLikes[userId].has(messageId);
  
  if (hasLiked) {
    // 取消点赞
    userMessageLikes[userId].delete(messageId);
    message.likeCount--;
  } else {
    // 点赞
    userMessageLikes[userId].add(messageId);
    message.likeCount++;
  }
  
  message.likedByCurrentUser = !hasLiked;
  message.updatedAt = new Date();
  
  return message;
}

// ==================== 频道管理操作 ====================

// 执行频道管理操作
export async function executeChannelModeration(
  moderatorId: string,
  moderatorName: string,
  channelId: string,
  action: ChannelModerationAction
): Promise<{ success: boolean; message: string }> {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const channel = channels.find(c => c.id === channelId);
  if (!channel) {
    return { success: false, message: '频道不存在' };
  }
  
  // 检查管理员权限
  if (!channel.moderatorIds.includes(moderatorId)) {
    return { success: false, message: '您没有管理权限' };
  }
  
  switch (action.type) {
    case 'mute':
      if (!action.targetUserId || !action.duration) {
        return { success: false, message: '缺少必要参数' };
      }
      
      const memberToMute = channelMembers.find(m => 
        m.channelId === channelId && m.userId === action.targetUserId
      );
      
      if (!memberToMute) {
        return { success: false, message: '用户不是频道成员' };
      }
      
      memberToMute.isMuted = true;
      memberToMute.mutedUntil = new Date(Date.now() + action.duration * 60 * 1000);
      memberToMute.mutedBy = moderatorId;
      memberToMute.mutedReason = action.reason || '违反频道规则';
      
      return { success: true, message: `用户已被禁言${action.duration}分钟` };
      
    case 'unmute':
      if (!action.targetUserId) {
        return { success: false, message: '缺少必要参数' };
      }
      
      const memberToUnmute = channelMembers.find(m => 
        m.channelId === channelId && m.userId === action.targetUserId
      );
      
      if (!memberToUnmute) {
        return { success: false, message: '用户不是频道成员' };
      }
      
      memberToUnmute.isMuted = false;
      memberToUnmute.mutedUntil = undefined;
      memberToUnmute.mutedBy = undefined;
      memberToUnmute.mutedReason = undefined;
      
      return { success: true, message: '用户禁言已解除' };
      
    case 'kick':
      if (!action.targetUserId) {
        return { success: false, message: '缺少必要参数' };
      }
      
      const memberToKick = channelMembers.find(m => 
        m.channelId === channelId && m.userId === action.targetUserId
      );
      
      if (!memberToKick) {
        return { success: false, message: '用户不是频道成员' };
      }
      
      // 移除成员
      const kickIndex = channelMembers.indexOf(memberToKick);
      channelMembers.splice(kickIndex, 1);
      
      // 更新频道成员数
      channel.memberCount--;
      channel.updatedAt = new Date();
      
      return { success: true, message: '用户已被踢出频道' };
      
    case 'pin':
      if (!action.targetMessageId) {
        return { success: false, message: '缺少必要参数' };
      }
      
      const messageToPin = channelMessages.find(m => m.id === action.targetMessageId);
      if (!messageToPin) {
        return { success: false, message: '消息不存在' };
      }
      
      messageToPin.isPinned = true;
      messageToPin.pinnedAt = new Date();
      messageToPin.pinnedBy = moderatorId;
      messageToPin.updatedAt = new Date();
      
      return { success: true, message: '消息已设为精华' };
      
    case 'unpin':
      if (!action.targetMessageId) {
        return { success: false, message: '缺少必要参数' };
      }
      
      const messageToUnpin = channelMessages.find(m => m.id === action.targetMessageId);
      if (!messageToUnpin) {
        return { success: false, message: '消息不存在' };
      }
      
      messageToUnpin.isPinned = false;
      messageToUnpin.pinnedAt = undefined;
      messageToUnpin.pinnedBy = undefined;
      messageToUnpin.updatedAt = new Date();
      
      return { success: true, message: '精华已取消' };
      
    case 'delete':
      if (!action.targetMessageId) {
        return { success: false, message: '缺少必要参数' };
      }
      
      const messageToDelete = channelMessages.find(m => m.id === action.targetMessageId);
      if (!messageToDelete) {
        return { success: false, message: '消息不存在' };
      }
      
      messageToDelete.isDeleted = true;
      messageToDelete.deletedAt = new Date();
      messageToDelete.deletedBy = moderatorId;
      messageToDelete.updatedAt = new Date();
      
      return { success: true, message: '消息已删除' };
      
    default:
      return { success: false, message: '未知操作类型' };
  }
}

// ==================== 统计信息 ====================

// 获取频道统计信息
export async function getChannelStats(): Promise<ChannelStats> {
  await new Promise(resolve => setTimeout(resolve, 200));
  
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  const dailyMessages = channelMessages.filter(m => m.createdAt >= oneDayAgo).length;
  const weeklyMessages = channelMessages.filter(m => m.createdAt >= oneWeekAgo).length;
  const monthlyMessages = channelMessages.filter(m => m.createdAt >= oneMonthAgo).length;
  
  // 获取热门频道
  const topChannels = channels
    .filter(c => c.status === ChannelStatus.ACTIVE)
    .map(c => ({
      channelId: c.id,
      channelName: c.name,
      messageCount: c.messageCount,
      memberCount: c.memberCount
    }))
    .sort((a, b) => b.messageCount - a.messageCount)
    .slice(0, 5);
  
  return {
    totalChannels: channels.length,
    activeChannels: channels.filter(c => c.status === ChannelStatus.ACTIVE).length,
    totalMembers: channelMembers.length,
    totalMessages: channelMessages.length,
    dailyMessages,
    weeklyMessages,
    monthlyMessages,
    topChannels
  };
}

// 获取用户频道统计
export async function getUserChannelStats(userId: string): Promise<UserChannelStats> {
  await new Promise(resolve => setTimeout(resolve, 200));
  
  const userMembers = channelMembers.filter(m => m.userId === userId);
  const userMessages = channelMessages.filter(m => m.authorId === userId && !m.isDeleted);
  const pinnedMessages = userMessages.filter(m => m.isPinned);
  const violations = forbiddenWordViolations.filter(v => v.userId === userId);
  const currentMutes = userMembers.filter(m => m.isMuted && m.mutedUntil && m.mutedUntil > new Date());
  
  return {
    joinedChannels: userMembers.length,
    totalMessages: userMessages.length,
    pinnedMessages: pinnedMessages.length,
    violationCount: violations.length,
    currentMutes: currentMutes.length
  };
}

// 获取违禁词违规记录
export async function getForbiddenWordViolations(
  channelId?: string,
  userId?: string
): Promise<ForbiddenWordViolation[]> {
  await new Promise(resolve => setTimeout(resolve, 200));
  
  let violations = [...forbiddenWordViolations];
  
  if (channelId) {
    violations = violations.filter(v => v.channelId === channelId);
  }
  
  if (userId) {
    violations = violations.filter(v => v.userId === userId);
  }
  
  return violations.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

// 清理过期的禁言状态
export async function cleanupExpiredMutes(): Promise<void> {
  const now = new Date();
  
  channelMembers.forEach(member => {
    if (member.isMuted && member.mutedUntil && member.mutedUntil <= now) {
      member.isMuted = false;
      member.mutedUntil = undefined;
      member.mutedBy = undefined;
      member.mutedReason = undefined;
    }
  });
}

// 定期清理过期禁言（每分钟执行一次）
setInterval(cleanupExpiredMutes, 60 * 1000);