// 论坛服务 - 提供论坛相关的数据操作功能

import { 
  ForumPost, 
  ForumReply, 
  ForumCategory, 
  PostType, 
  PostStatus, 
  RentalStatus,
  PostQueryParams,
  PostListResponse,
  CreatePostRequest,
  CreateReplyRequest,
  RentalConfirmRequest,
  PokemonRentalInfo,
  UserForumStats,
  ForumActivity,
  ActivityStatus,
  ActivityRestrictionType,
  CreateActivityRequest,
  ActivityRegistrationRequest,
  ActivityParticipant,
  PostModerationRequest,
  PostModerationLog,
  ActivityPostType,
  AllPostType
} from '@/types/forum';
import { PokemonCard, UserRole } from '@/types/auth';

// 模拟数据存储
let pendingPosts: ForumPost[] = [];

// 审核日志
let moderationLogs: PostModerationLog[] = [];

// 用户点赞记录
let userLikes: { [userId: string]: { posts: Set<string>; replies: Set<string> } } = {};

// 已发布的帖子列表
let forumPosts: ForumPost[] = [
  {
    id: '1',
    title: '欢迎来到落雪论坛！',
    content: '<p>欢迎大家来到落雪公会论坛！这里是我们交流宝可梦心得、分享游戏经验的地方。</p><p>请大家遵守论坛规则，友善交流。</p>',
    type: PostType.DISCUSSION,
    authorId: '1',
    authorName: '管理员',
    authorAvatar: '/avatars/admin.png',
    authorRole: UserRole.SUPER_ADMIN,
    status: PostStatus.ACTIVE,
    isSticky: true,
    isLocked: false,
    viewCount: 156,
    likeCount: 23,
    replyCount: 8,
    lastReplyAt: new Date('2024-01-15T10:30:00'),
    lastReplyBy: '小智',
    createdAt: new Date('2024-01-10T09:00:00'),
    updatedAt: new Date('2024-01-15T10:30:00'),
    likedByCurrentUser: false,
    tags: ['公告', '欢迎']
  },
  {
    id: '2',
    title: '求租一只皮卡丘',
    content: '<p>大家好！我正在准备挑战电系道馆，需要租借一只高等级的皮卡丘。</p><p>希望等级在50以上，最好会十万伏特技能。租借时间大概需要3天。</p><p>有意向的朋友请回复，谢谢！</p>',
    type: PostType.POKEMON_RENTAL,
    authorId: 'user1',
    authorName: '小智',
    authorAvatar: '/avatars/user1.png',
    authorRole: UserRole.USER,
    status: PostStatus.ACTIVE,
    isSticky: false,
    isLocked: false,
    viewCount: 89,
    likeCount: 12,
    replyCount: 5,
    lastReplyAt: new Date('2024-01-16T14:20:00'),
    lastReplyBy: '小霞',
    createdAt: new Date('2024-01-14T16:45:00'),
    updatedAt: new Date('2024-01-16T14:20:00'),
    likedByCurrentUser: false,
    rentalInfo: {
      pokemonId: 'pikachu-001',
      pokemonName: '皮卡丘',
      pokemonSpecies: '电鼠宝可梦',
      pokemonLevel: 50,
      pokemonImageUrl: '/thumbnails/025.png',
      pokemonType1: '电',
      isShiny: false,
      rentalDuration: 72, // 3天
      requirements: '等级50以上，会十万伏特',
      status: RentalStatus.AVAILABLE,
      ownerConfirmed: false,
      renterConfirmed: false
    },
    tags: ['租借', '皮卡丘', '电系']
  },
  {
    id: '3',
    title: '分享一下我的队伍配置心得',
    content: '<p>经过长时间的摸索，我总结了一些队伍配置的心得：</p><ul><li>平衡各属性克制关系</li><li>注意速度层级的搭配</li><li>考虑技能的覆盖面</li></ul><p>大家有什么好的建议吗？</p>',
    type: PostType.DISCUSSION,
    authorId: 'user3',
    authorName: '小刚',
    authorAvatar: '/avatars/user3.png',
    authorRole: UserRole.USER,
    status: PostStatus.ACTIVE,
    isSticky: false,
    isLocked: false,
    viewCount: 234,
    likeCount: 45,
    replyCount: 18,
    lastReplyAt: new Date('2024-01-16T16:15:00'),
    lastReplyBy: '小次郎',
    createdAt: new Date('2024-01-12T11:20:00'),
    updatedAt: new Date('2024-01-16T16:15:00'),
    likedByCurrentUser: false,
    tags: ['攻略', '队伍配置', '心得']
  }
];

let forumReplies: ForumReply[] = [
  {
    id: 'reply-1',
    postId: '1',
    content: '<p>感谢管理员的欢迎！期待在这里学到更多宝可梦知识。</p>',
    authorId: 'user1',
    authorName: '小智',
    authorAvatar: '/avatars/user1.png',
    authorRole: UserRole.USER,
    likeCount: 5,
    isDeleted: false,
    createdAt: new Date('2024-01-15T10:30:00'),
    updatedAt: new Date('2024-01-15T10:30:00'),
    likedByCurrentUser: false
  },
  {
    id: 'reply-2',
    postId: '2',
    content: '<p>我有一只65级的皮卡丘，会十万伏特和电光一闪，可以租借给你。</p>',
    authorId: 'user2',
    authorName: '小霞',
    authorAvatar: '/avatars/user2.png',
    authorRole: UserRole.USER,
    likeCount: 8,
    isDeleted: false,
    createdAt: new Date('2024-01-16T14:20:00'),
    updatedAt: new Date('2024-01-16T14:20:00'),
    likedByCurrentUser: false,
    rentalResponse: {
      type: 'interest',
      proposedDuration: 72,
      message: '我的皮卡丘很强，应该能帮到你',
      isOwnerResponse: false
    }
  }
];

let forumCategories: ForumCategory[] = [
  {
    id: 'general',
    name: '综合讨论',
    description: '一般性的宝可梦讨论',
    icon: '💬',
    color: '#3B82F6',
    postCount: 156,
    lastPostAt: new Date('2024-01-16T16:15:00'),
    lastPostTitle: '分享一下我的队伍配置心得',
    order: 1,
    isActive: true
  },
  {
    id: 'rental',
    name: '精灵租借',
    description: '宝可梦租借交易',
    icon: '⚡',
    color: '#F59E0B',
    postCount: 89,
    lastPostAt: new Date('2024-01-16T14:20:00'),
    lastPostTitle: '求租一只皮卡丘用于电系道馆挑战',
    order: 2,
    isActive: true
  },
  {
    id: 'strategy',
    name: '攻略心得',
    description: '游戏攻略和心得分享',
    icon: '📚',
    color: '#10B981',
    postCount: 234,
    lastPostAt: new Date('2024-01-15T20:45:00'),
    lastPostTitle: '道馆挑战技巧总结',
    order: 3,
    isActive: true
  },
  {
    id: 'showcase',
    name: '精灵展示',
    description: '展示你的宝可梦收藏',
    icon: '✨',
    color: '#8B5CF6',
    postCount: 67,
    lastPostAt: new Date('2024-01-14T18:30:00'),
    lastPostTitle: '我的异色宝可梦收藏',
    order: 4,
    isActive: true
  }
];

// 获取论坛帖子列表
export async function getForumPosts(params: PostQueryParams = {}, userId?: string): Promise<PostListResponse> {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  let filteredPosts = [...forumPosts];
  
  // 应用筛选条件
  if (params.type) {
    filteredPosts = filteredPosts.filter(post => post.type === params.type);
  }
  
  if (params.categoryId) {
    // 这里可以根据分类ID筛选，暂时跳过
  }
  
  if (params.authorId) {
    filteredPosts = filteredPosts.filter(post => post.authorId === params.authorId);
  }
  
  if (params.status) {
    filteredPosts = filteredPosts.filter(post => post.status === params.status);
  }
  
  if (params.search) {
    const searchLower = params.search.toLowerCase();
    filteredPosts = filteredPosts.filter(post => 
      post.title.toLowerCase().includes(searchLower) ||
      post.content.toLowerCase().includes(searchLower) ||
      post.tags?.some(tag => tag.toLowerCase().includes(searchLower))
    );
  }
  
  if (params.tags && params.tags.length > 0) {
    filteredPosts = filteredPosts.filter(post => 
      post.tags?.some(tag => params.tags!.includes(tag))
    );
  }
  
  // 排序
  const sortBy = params.sortBy || 'updated';
  const sortOrder = params.sortOrder || 'desc';
  
  filteredPosts.sort((a, b) => {
    let aValue: any, bValue: any;
    
    switch (sortBy) {
      case 'created':
        aValue = a.createdAt.getTime();
        bValue = b.createdAt.getTime();
        break;
      case 'updated':
        aValue = a.updatedAt.getTime();
        bValue = b.updatedAt.getTime();
        break;
      case 'replies':
        aValue = a.replyCount;
        bValue = b.replyCount;
        break;
      case 'views':
        aValue = a.viewCount;
        bValue = b.viewCount;
        break;
      case 'likes':
        aValue = a.likeCount;
        bValue = b.likeCount;
        break;
      default:
        aValue = a.updatedAt.getTime();
        bValue = b.updatedAt.getTime();
    }
    
    if (sortOrder === 'desc') {
      return bValue - aValue;
    } else {
      return aValue - bValue;
    }
  });
  
  // 置顶帖子始终在前面
  filteredPosts.sort((a, b) => {
    if (a.isSticky && !b.isSticky) return -1;
    if (!a.isSticky && b.isSticky) return 1;
    return 0;
  });
  
  // 分页
  const page = params.page || 1;
  const limit = params.limit || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  
  const paginatedPosts = filteredPosts.slice(startIndex, endIndex);
  
  // 设置每个帖子的点赞状态
  const postsWithLikeStatus = paginatedPosts.map(post => ({
    ...post,
    likedByCurrentUser: userId ? userLikes[userId]?.posts.has(post.id) || false : false
  }));
  
  return {
    posts: postsWithLikeStatus,
    total: filteredPosts.length,
    page,
    limit,
    hasMore: endIndex < filteredPosts.length
  };
}

// 获取单个帖子详情
export async function getForumPost(postId: string, userId?: string): Promise<ForumPost | null> {
  await new Promise(resolve => setTimeout(resolve, 200));
  
  const post = forumPosts.find(p => p.id === postId);
  if (post) {
    // 增加浏览次数
    post.viewCount++;
    
    // 设置当前用户的点赞状态
    if (userId && userLikes[userId]) {
      post.likedByCurrentUser = userLikes[userId].posts.has(postId);
    } else {
      post.likedByCurrentUser = false;
    }
  }
  
  return post || null;
}

// 获取帖子回复
export async function getPostReplies(postId: string, userId?: string): Promise<ForumReply[]> {
  await new Promise(resolve => setTimeout(resolve, 200));
  
  const replies = forumReplies
    .filter(reply => reply.postId === postId && !reply.isDeleted)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  
  // 设置当前用户的点赞状态
  if (userId && userLikes[userId]) {
    replies.forEach(reply => {
      reply.likedByCurrentUser = userLikes[userId].replies.has(reply.id);
    });
  } else {
    replies.forEach(reply => {
      reply.likedByCurrentUser = false;
    });
  }
  
  return replies;
}

// 获取论坛分类
export async function getForumCategories(): Promise<ForumCategory[]> {
  await new Promise(resolve => setTimeout(resolve, 100));
  
  return forumCategories
    .filter(category => category.isActive)
    .sort((a, b) => a.order - b.order);
}

// 创建帖子
export async function createForumPost(
  authorId: string, 
  authorName: string, 
  authorRole: UserRole,
  postData: CreatePostRequest
): Promise<ForumPost> {
  // 普通用户发帖需要审核，管理员发帖直接通过
  const needsModeration = authorRole === UserRole.USER;
  const status = needsModeration ? PostStatus.PENDING : PostStatus.ACTIVE;
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const newPost: ForumPost = {
    id: `post-${Date.now()}`,
    title: postData.title,
    content: postData.content,
    type: postData.type,
    authorId,
    authorName,
    authorAvatar: `/avatars/${authorId}.png`,
    authorRole,
    status,
    isSticky: false,
    isLocked: false,
    viewCount: 0,
    likeCount: 0,
    replyCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    tags: postData.tags || [],
    rentalInfo: postData.rentalInfo ? {
      ...postData.rentalInfo,
      status: RentalStatus.AVAILABLE,
      ownerConfirmed: false,
      renterConfirmed: false
    } : undefined
  };
  
  forumPosts.unshift(newPost);
  
  // 更新分类帖子数量
  if (postData.categoryId) {
    const category = forumCategories.find(c => c.id === postData.categoryId);
    if (category) {
      category.postCount++;
      category.lastPostAt = new Date();
      category.lastPostTitle = postData.title;
    }
  }
  
  return newPost;
}

// 创建回复
export async function createPostReply(
  authorId: string,
  authorName: string,
  authorRole: UserRole,
  replyData: CreateReplyRequest
): Promise<ForumReply> {
  return createForumReply(authorId, authorName, authorRole, replyData);
}

export async function createForumReply(
  authorId: string,
  authorName: string,
  authorRole: UserRole,
  replyData: CreateReplyRequest
): Promise<ForumReply> {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const newReply: ForumReply = {
    id: `reply-${Date.now()}`,
    postId: replyData.postId,
    content: replyData.content,
    authorId,
    authorName,
    authorAvatar: `/avatars/${authorId}.png`,
    authorRole,
    parentReplyId: replyData.parentReplyId,
    likeCount: 0,
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    likedByCurrentUser: false,
    rentalResponse: replyData.rentalResponse
  };
  
  forumReplies.push(newReply);
  
  // 更新帖子回复数和最后回复信息
  const post = forumPosts.find(p => p.id === replyData.postId);
  if (post) {
    post.replyCount++;
    post.lastReplyAt = new Date();
    post.lastReplyBy = authorName;
    post.updatedAt = new Date();
  }
  
  return newReply;
}

// 确认租借
export async function confirmRental(
  userId: string,
  confirmData: RentalConfirmRequest
): Promise<{ success: boolean; message: string }> {
  await new Promise(resolve => setTimeout(resolve, 400));
  
  const post = forumPosts.find(p => p.id === confirmData.postId);
  const reply = forumReplies.find(r => r.id === confirmData.replyId);
  
  if (!post || !reply || !post.rentalInfo) {
    return { success: false, message: '帖子或回复不存在' };
  }
  
  // 检查是否为帖子作者或回复作者
  const isPostAuthor = post.authorId === userId;
  const isReplyAuthor = reply.authorId === userId;
  
  if (!isPostAuthor && !isReplyAuthor) {
    return { success: false, message: '无权限确认此租借' };
  }
  
  // 更新租借信息
  if (isPostAuthor) {
    post.rentalInfo.ownerConfirmed = true;
    post.rentalInfo.renterId = reply.authorId;
    post.rentalInfo.renterName = reply.authorName;
  } else {
    post.rentalInfo.renterConfirmed = true;
  }
  
  // 如果双方都确认，开始租借
  if (post.rentalInfo.ownerConfirmed && post.rentalInfo.renterConfirmed) {
    post.rentalInfo.status = RentalStatus.RENTED;
    post.rentalInfo.rentalStartAt = confirmData.startTime || new Date();
    post.rentalInfo.rentalEndAt = new Date(
      (confirmData.startTime || new Date()).getTime() + confirmData.duration * 60 * 60 * 1000
    );
    post.rentalInfo.rentalDuration = confirmData.duration;
    
    // 这里应该更新用户的宝可梦展柜状态
    // updatePokemonShowcaseStatus(post.authorId, post.rentalInfo.pokemonId, true, post.rentalInfo.rentalEndAt);
    
    return { success: true, message: '租借确认成功，精灵已开始租借' };
  } else {
    post.rentalInfo.status = RentalStatus.PENDING;
    return { success: true, message: '确认成功，等待对方确认' };
  }
}

// 点赞帖子
export async function likePost(postId: string, userId: string): Promise<ForumPost> {
  await new Promise(resolve => setTimeout(resolve, 200));
  
  const post = forumPosts.find(p => p.id === postId);
  if (!post) {
    throw new Error('帖子不存在');
  }
  
  // 初始化用户点赞记录
  if (!userLikes[userId]) {
    userLikes[userId] = { posts: new Set(), replies: new Set() };
  }
  
  const hasLiked = userLikes[userId].posts.has(postId);
  
  if (hasLiked) {
    // 取消点赞
    userLikes[userId].posts.delete(postId);
    post.likeCount = Math.max(0, post.likeCount - 1);
    post.likedByCurrentUser = false;
  } else {
    // 点赞
    userLikes[userId].posts.add(postId);
    post.likeCount++;
    post.likedByCurrentUser = true;
  }
  
  return post;
}

// 点赞回复
export async function likeReply(replyId: string, userId: string): Promise<ForumReply> {
  await new Promise(resolve => setTimeout(resolve, 200));
  
  const reply = forumReplies.find(r => r.id === replyId);
  if (!reply) {
    throw new Error('回复不存在');
  }
  
  // 初始化用户点赞记录
  if (!userLikes[userId]) {
    userLikes[userId] = { posts: new Set(), replies: new Set() };
  }
  
  const hasLiked = userLikes[userId].replies.has(replyId);
  
  if (hasLiked) {
    // 取消点赞
    userLikes[userId].replies.delete(replyId);
    reply.likeCount = Math.max(0, reply.likeCount - 1);
    reply.likedByCurrentUser = false;
  } else {
    // 点赞
    userLikes[userId].replies.add(replyId);
    reply.likeCount++;
    reply.likedByCurrentUser = true;
  }
  
  return reply;
}

// 获取用户论坛统计
export async function getUserForumStats(userId: string): Promise<UserForumStats> {
  await new Promise(resolve => setTimeout(resolve, 200));
  
  const userPosts = forumPosts.filter(p => p.authorId === userId);
  const userReplies = forumReplies.filter(r => r.authorId === userId);
  
  const likesReceived = userPosts.reduce((sum, post) => sum + post.likeCount, 0) +
                       userReplies.reduce((sum, reply) => sum + reply.likeCount, 0);
  
  const rentalPosts = userPosts.filter(p => p.type === PostType.POKEMON_RENTAL);
  const rentalOffered = rentalPosts.length;
  const rentalRented = rentalPosts.filter(p => 
    p.rentalInfo?.status === RentalStatus.RENTED || 
    p.rentalInfo?.status === RentalStatus.COMPLETED
  ).length;
  
  return {
    postsCount: userPosts.length,
    repliesCount: userReplies.length,
    likesReceived,
    likesGiven: 0, // 需要额外的数据结构来跟踪
    rentalOffered,
    rentalRented,
    reputation: Math.floor(likesReceived * 2 + rentalRented * 5 + userPosts.length)
  };
}

// 获取用户的宝可梦列表（用于租借帖）
export async function getUserPokemonList(userId: string): Promise<PokemonCard[]> {
  await new Promise(resolve => setTimeout(resolve, 200));
  
  // 模拟数据，实际应该从用户的宝可梦展柜获取
  return [
    {
      id: 'pikachu-001',
      name: '皮卡丘',
      level: 65,
      nature: '开朗',
      ability: '静电',
      moves: ['十万伏特', '电光一闪', '铁尾', '电磁波'],
      imageUrl: '/thumbnails/025.png',
      description: '我的第一只宝可梦，非常活泼',
      isShiny: false,
      obtainedAt: new Date('2024-01-01'),
      position: 1,
      type1: '电',
      stats: {
        hp: 274,
        attack: 229,
        defense: 196,
        specialAttack: 218,
        spDefense: 218,
        speed: 317
      }
    },
    {
      id: 'charizard-001',
      name: '喷火龙',
      level: 58,
      nature: '固执',
      ability: '猛火',
      moves: ['喷射火焰', '龙爪', '地震', '雷电拳'],
      imageUrl: '/thumbnails/006.png',
      description: '强力的火系宝可梦',
      isShiny: true,
      obtainedAt: new Date('2024-01-05'),
      position: 2,
      type1: '火',
      type2: '飞行',
      stats: {
        hp: 297,
        attack: 293,
        defense: 240,
        specialAttack: 317,
        spDefense: 269,
        speed: 299
      }
    }
  ];
}

// 活动数据
let forumActivities: ForumActivity[] = [
  {
    id: 'activity-1',
    title: '新年宝可梦对战大赛',
    description: '欢迎参加新年宝可梦对战大赛！获胜者将获得丰厚奖励。',
    imageUrls: ['/images/activities/battle-tournament-1.jpg', '/images/activities/battle-tournament-2.jpg'],
    organizerId: '1',
    organizerName: '管理员',
    status: ActivityStatus.ACTIVE,
    startTime: new Date('2024-01-15T10:00:00'),
    endTime: new Date('2024-01-31T23:59:59'),
    registrationDeadline: new Date('2024-02-01T23:59:59'),
    maxParticipants: 50,
    currentParticipants: 23,
    rewards: [
      { id: 'reward-1', type: 'item', name: '大师球', description: '稀有的精灵球', quantity: 1 },
      { id: 'reward-2', type: 'points', name: '金币', description: '游戏货币', quantity: 10000 }
    ],
    restrictions: [{
      type: ActivityRestrictionType.ROLE,
      minRole: UserRole.ADMIN
    }],
    createdAt: new Date('2024-01-10T10:00:00'),
    updatedAt: new Date('2024-01-10T10:00:00'),
    isHighlighted: true,
    participants: [
      {
        id: 'participant-1',
        activityId: 'activity-1',
        userId: 'user1',
        userName: '小智',
        userAvatar: '/avatars/user1.png',
        userRole: UserRole.USER,
        registeredAt: new Date('2024-01-15T14:30:00'),
        status: 'registered',
        membershipType: 'yearly',
        membershipExpiry: new Date('2024-12-31T23:59:59'),
        isExpired: false
      },
      {
        id: 'participant-2',
        activityId: 'activity-1',
        userId: 'user2',
        userName: '小霞',
        userAvatar: '/avatars/user2.png',
        userRole: UserRole.USER,
        registeredAt: new Date('2024-01-16T09:15:00'),
        status: 'registered',
        membershipType: 'monthly',
        membershipExpiry: new Date('2024-01-15T23:59:59'),
        isExpired: true
      }
    ]
  },
  {
    id: 'activity-2',
    title: '每周签到活动',
    description: '连续签到7天即可获得奖励！',
    organizerId: '1',
    organizerName: '管理员',
    status: ActivityStatus.ACTIVE,
    startTime: new Date('2024-01-01T09:00:00'),
    endTime: new Date('2024-12-31T18:00:00'),
    registrationDeadline: new Date('2024-12-31T23:59:59'),
    maxParticipants: undefined,
    currentParticipants: 156,
    rewards: [
      { id: 'reward-3', type: 'item', name: '精灵球', description: '普通的精灵球', quantity: 10 },
      { id: 'reward-4', type: 'points', name: '经验值', description: '角色经验', quantity: 1000 }
    ],
    restrictions: [{
      type: ActivityRestrictionType.NONE
    }],
    createdAt: new Date('2024-01-01T00:00:00'),
    updatedAt: new Date('2024-01-01T00:00:00'),
    isHighlighted: false
  },
  // 历史活动
  {
    id: 'activity-3',
    title: '圣诞节特别活动',
    description: '圣诞节期间的特别活动，参与者可以获得限定奖励！',
    imageUrls: ['/images/activities/christmas-1.jpg', '/images/activities/christmas-2.jpg', '/images/activities/christmas-3.jpg'],
    organizerId: '1',
    organizerName: '管理员',
    status: ActivityStatus.COMPLETED,
    startTime: new Date('2023-12-20T10:00:00'),
    endTime: new Date('2023-12-31T23:59:59'),
    registrationDeadline: new Date('2023-12-25T23:59:59'),
    maxParticipants: 100,
    currentParticipants: 87,
    rewards: [
      { id: 'reward-5', type: 'item', name: '圣诞帽', description: '限定装饰品', quantity: 1 },
      { id: 'reward-6', type: 'points', name: '节日积分', description: '特殊积分', quantity: 5000 }
    ],
    restrictions: [{
      type: ActivityRestrictionType.NONE
    }],
    createdAt: new Date('2023-12-15T10:00:00'),
    updatedAt: new Date('2023-12-31T23:59:59'),
    isHighlighted: false,
    participants: [
      {
        id: 'participant-3',
        activityId: 'activity-3',
        userId: 'user3',
        userName: '小刚',
        userAvatar: '/avatars/user3.png',
        userRole: UserRole.USER,
        registeredAt: new Date('2023-12-21T10:30:00'),
        status: 'confirmed',
        membershipType: 'free',
        isExpired: false
      }
    ]
  },
  {
    id: 'activity-4',
    title: '万圣节捉鬼活动',
    description: '万圣节期间的特殊捉鬼活动，寻找隐藏的幽灵系宝可梦！',
    organizerId: '1',
    organizerName: '管理员',
    status: ActivityStatus.COMPLETED,
    startTime: new Date('2023-10-25T18:00:00'),
    endTime: new Date('2023-10-31T23:59:59'),
    registrationDeadline: new Date('2023-10-30T23:59:59'),
    maxParticipants: 50,
    currentParticipants: 42,
    rewards: [
      { id: 'reward-7', type: 'item', name: '南瓜灯', description: '万圣节装饰', quantity: 1 },
      { id: 'reward-8', type: 'points', name: '恐怖积分', description: '万圣节积分', quantity: 3000 }
    ],
    restrictions: [{
      type: ActivityRestrictionType.LEVEL,
      minLevel: 10
    }],
    createdAt: new Date('2023-10-20T10:00:00'),
    updatedAt: new Date('2023-10-31T23:59:59'),
    isHighlighted: false,
    participants: [
      {
        id: 'participant-4',
        activityId: 'activity-4',
        userId: 'user4',
        userName: '小次郎',
        userAvatar: '/avatars/user4.png',
        userRole: UserRole.USER,
        registeredAt: new Date('2023-10-26T15:20:00'),
        status: 'confirmed',
        membershipType: 'yearly',
        membershipExpiry: new Date('2024-10-26T23:59:59'),
        isExpired: false
      }
    ]
  }
];

let activityParticipants: ActivityParticipant[] = [
  {
    id: 'participant-1',
    activityId: 'activity-1',
    userId: 'user1',
    userName: '小智',
    userAvatar: '/avatars/user1.png',
    userRole: UserRole.USER,
    registeredAt: new Date('2024-01-15T14:30:00'),
    status: 'registered'
  },
  {
    id: 'participant-2',
    activityId: 'activity-2',
    userId: 'user1',
    userName: '小智',
    userAvatar: '/avatars/user1.png',
    userRole: UserRole.USER,
    registeredAt: new Date('2024-01-10T09:15:00'),
    status: 'registered'
  }
];

// 活动相关服务函数
export async function getForumActivities(): Promise<ForumActivity[]> {
  // 模拟API延迟
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return forumActivities.filter(activity => activity.status === ActivityStatus.ACTIVE);
}

export async function getHistoryForumActivities(): Promise<ForumActivity[]> {
  // 模拟API延迟
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return forumActivities.filter(activity => 
    activity.status === ActivityStatus.COMPLETED || 
    activity.status === ActivityStatus.CANCELLED ||
    new Date() > new Date(activity.endTime)
  ).sort((a, b) => new Date(b.endTime).getTime() - new Date(a.endTime).getTime());
}

export async function getActivityById(activityId: string): Promise<ForumActivity | null> {
  await new Promise(resolve => setTimeout(resolve, 100));
  
  return forumActivities.find(activity => activity.id === activityId) || null;
}

export async function createActivity(
  creatorId: string,
  activityData: CreateActivityRequest
): Promise<ForumActivity> {
  await new Promise(resolve => setTimeout(resolve, 200));
  
  const newActivity: ForumActivity = {
    id: `activity-${Date.now()}`,
    title: activityData.title,
    description: activityData.description,
    imageUrl: activityData.imageUrl,
    organizerId: creatorId,
    organizerName: 'Admin', // 这里应该从用户信息获取
    status: ActivityStatus.ACTIVE,
    startTime: activityData.startTime,
    endTime: activityData.endTime,
    registrationDeadline: activityData.registrationDeadline,
    maxParticipants: activityData.maxParticipants,
    currentParticipants: 0,
    rewards: activityData.rewards.map((reward, index) => ({
      ...reward,
      id: `reward-${Date.now()}-${index}`
    })),
    restrictions: activityData.restrictions,
    location: activityData.location,
    requirements: activityData.requirements,
    createdAt: new Date(),
    updatedAt: new Date(),
    isHighlighted: activityData.isHighlighted || false
  };
  
  forumActivities.unshift(newActivity);
  return newActivity;
}

export async function registerForActivity(
  userId: string,
  userName: string,
  userAvatar: string,
  userRole: UserRole,
  registrationData: ActivityRegistrationRequest
): Promise<{ success: boolean; message: string }> {
  await new Promise(resolve => setTimeout(resolve, 200));
  
  const activity = forumActivities.find(a => a.id === registrationData.activityId);
  if (!activity) {
    return { success: false, message: '活动不存在' };
  }
  
  if (activity.status !== ActivityStatus.ACTIVE) {
    return { success: false, message: '活动已结束或未开始' };
  }
  
  if (new Date() > activity.registrationDeadline) {
    return { success: false, message: '报名时间已截止' };
  }
  
  if (activity.maxParticipants && activity.currentParticipants >= activity.maxParticipants) {
    return { success: false, message: '报名人数已满' };
  }
  
  // 检查是否已经报名
  const existingParticipant = activityParticipants.find(
    p => p.activityId === registrationData.activityId && p.userId === userId
  );
  
  if (existingParticipant) {
    return { success: false, message: '您已经报名过此活动' };
  }
  
  // 创建参与记录
  const newParticipant: ActivityParticipant = {
    id: `participant-${Date.now()}`,
    activityId: registrationData.activityId,
    userId,
    userName,
    userAvatar,
    userRole,
    registeredAt: new Date(),
    status: 'registered'
  };
  
  activityParticipants.push(newParticipant);
  activity.currentParticipants += 1;
  activity.updatedAt = new Date();
  
  return { success: true, message: '报名成功！' };
}

export async function getActivityParticipants(activityId: string): Promise<ActivityParticipant[]> {
  await new Promise(resolve => setTimeout(resolve, 100));
  
  return activityParticipants
    .filter(p => p.activityId === activityId)
    .sort((a, b) => a.registeredAt.getTime() - b.registeredAt.getTime());
}

export async function getUserActivityRegistrations(userId: string): Promise<ActivityParticipant[]> {
  await new Promise(resolve => setTimeout(resolve, 100));
  
  return activityParticipants
    .filter(p => p.userId === userId)
    .sort((a, b) => b.registeredAt.getTime() - a.registeredAt.getTime());
}

// 帖子审核相关函数

// 获取待审核帖子列表
export async function getPendingPosts(): Promise<ForumPost[]> {
  await new Promise(resolve => setTimeout(resolve, 300));
  return pendingPosts.filter(post => post.status === PostStatus.PENDING);
}

// 审核帖子
export async function moderatePost(
  moderatorId: string,
  moderatorName: string,
  moderationData: PostModerationRequest
): Promise<{ success: boolean; message: string }> {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const { postId, action, reason, moderatorNote } = moderationData;
  
  // 查找待审核帖子
  const postIndex = pendingPosts.findIndex(post => post.id === postId);
  if (postIndex === -1) {
    return { success: false, message: '帖子不存在或已被处理' };
  }
  
  const post = pendingPosts[postIndex];
  
  // 创建审核日志
  const log: PostModerationLog = {
    id: `log-${Date.now()}`,
    postId,
    moderatorId,
    moderatorName,
    action,
    reason,
    note: moderatorNote,
    createdAt: new Date()
  };
  moderationLogs.push(log);
  
  if (action === 'approve') {
    // 审核通过，移动到正式帖子列表
    post.status = PostStatus.ACTIVE;
    post.updatedAt = new Date();
    forumPosts.unshift(post);
    pendingPosts.splice(postIndex, 1);
    return { success: true, message: '帖子审核通过' };
  } else {
    // 审核拒绝
    post.status = PostStatus.REJECTED;
    post.updatedAt = new Date();
    pendingPosts.splice(postIndex, 1);
    return { success: true, message: '帖子已拒绝' };
  }
}

// 获取审核日志
export async function getModerationLogs(postId?: string): Promise<PostModerationLog[]> {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  if (postId) {
    return moderationLogs.filter(log => log.postId === postId);
  }
  return moderationLogs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

// 创建活动帖子
export async function createActivityPost(
  organizerId: string,
  organizerName: string,
  organizerRole: UserRole,
  activityData: CreateActivityRequest
): Promise<{ activity: ForumActivity; post: ForumPost }> {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // 创建活动
  const activity = await createActivity(organizerId, activityData);
  
  // 创建对应的帖子
  const postData: CreatePostRequest = {
    title: `【活动】${activityData.title}`,
    content: `<div class="activity-post">
      <h3>${activityData.title}</h3>
      <p>${activityData.description}</p>
      <div class="activity-info">
        <p><strong>活动时间：</strong>${activityData.startTime.toLocaleString()} - ${activityData.endTime.toLocaleString()}</p>
        <p><strong>报名截止：</strong>${activityData.registrationDeadline.toLocaleString()}</p>
        ${activityData.maxParticipants ? `<p><strong>参与人数：</strong>限制 ${activityData.maxParticipants} 人</p>` : ''}
        ${activityData.location ? `<p><strong>活动地点：</strong>${activityData.location}</p>` : ''}
      </div>
      <div class="activity-rewards">
        <h4>活动奖励：</h4>
        <ul>
          ${activityData.rewards.map(reward => `<li>${reward.name} x${reward.quantity}</li>`).join('')}
        </ul>
      </div>
    </div>`,
    type: 'event' as any, // 活动帖类型
    tags: ['活动', '官方']
  };
  
  const post = await createForumPost(organizerId, organizerName, organizerRole, postData);
  
  return { activity, post };
}

// 删除帖子（管理员功能）
export async function deletePost(
  moderatorId: string,
  moderatorName: string,
  postId: string,
  reason?: string
): Promise<{ success: boolean; message: string }> {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // 查找帖子
  let postIndex = forumPosts.findIndex(post => post.id === postId);
  let post: ForumPost | undefined;
  let fromPending = false;
  
  if (postIndex === -1) {
    // 在待审核列表中查找
    postIndex = pendingPosts.findIndex(post => post.id === postId);
    if (postIndex !== -1) {
      post = pendingPosts[postIndex];
      fromPending = true;
    }
  } else {
    post = forumPosts[postIndex];
  }
  
  if (!post) {
    return { success: false, message: '帖子不存在' };
  }
  
  // 创建删除日志
  const log: PostModerationLog = {
    id: `log-${Date.now()}`,
    postId,
    moderatorId,
    moderatorName,
    action: 'delete',
    reason,
    createdAt: new Date()
  };
  moderationLogs.push(log);
  
  // 删除帖子
  if (fromPending) {
    pendingPosts.splice(postIndex, 1);
  } else {
    forumPosts.splice(postIndex, 1);
  }
  
  return { success: true, message: '帖子已删除' };
}