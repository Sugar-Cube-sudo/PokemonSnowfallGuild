'use client';

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import {
  Message,
  MessageCategory,
  MessagePriority,
  MessageStatus,
  CreateMessageRequest,
  BatchMessageRequest,
  MessageStats,
  MessageQueryParams,
  MessageListResponse,
  NotificationBadge
} from '@/types/message';
import {
  createMessage,
  createSystemMessage,
  getUserMessages,
  markMessageAsRead,
  batchUpdateMessages,
  markAllMessagesAsRead,
  calculateUserMessageStats,
  getNotificationBadges,
  sendOverdueReminders,
  sendSystemReportToAdmin,
  getAllMessages,
  deleteMessage,
  sendBatchRemindersToOverdueUsers
} from '@/lib/messageSystem';
import { useAuth } from '@/contexts/AuthContext';
import { User } from '@/types/auth';

// 消息状态接口
interface MessageState {
  messages: Message[];
  loading: boolean;
  error: string | null;
  stats: MessageStats | null;
  badges: NotificationBadge[];
  currentPage: number;
  hasMore: boolean;
  total: number;
}

// 消息操作类型
type MessageAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_MESSAGES'; payload: { messages: Message[]; stats: MessageStats; total: number; hasMore: boolean; page: number } }
  | { type: 'ADD_MESSAGE'; payload: Message }
  | { type: 'UPDATE_MESSAGE'; payload: Message }
  | { type: 'REMOVE_MESSAGE'; payload: string }
  | { type: 'SET_BADGES'; payload: NotificationBadge[] }
  | { type: 'RESET_MESSAGES' };

// 初始状态
const initialState: MessageState = {
  messages: [],
  loading: false,
  error: null,
  stats: null,
  badges: [],
  currentPage: 1,
  hasMore: false,
  total: 0
};

// Reducer
function messageReducer(state: MessageState, action: MessageAction): MessageState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'SET_MESSAGES':
      return {
        ...state,
        messages: action.payload.messages,
        stats: action.payload.stats,
        total: action.payload.total,
        hasMore: action.payload.hasMore,
        currentPage: action.payload.page,
        loading: false,
        error: null
      };
    case 'ADD_MESSAGE':
      return {
        ...state,
        messages: [action.payload, ...state.messages],
        total: state.total + 1
      };
    case 'UPDATE_MESSAGE':
      return {
        ...state,
        messages: state.messages.map(msg =>
          msg.id === action.payload.id ? action.payload : msg
        )
      };
    case 'REMOVE_MESSAGE':
      return {
        ...state,
        messages: state.messages.filter(msg => msg.id !== action.payload),
        total: Math.max(0, state.total - 1)
      };
    case 'SET_BADGES':
      return { ...state, badges: action.payload };
    case 'RESET_MESSAGES':
      return initialState;
    default:
      return state;
  }
}

// Context接口
interface MessageContextType {
  state: MessageState;
  // 用户消息操作
  loadUserMessages: (params?: MessageQueryParams) => Promise<void>;
  markAsRead: (messageId: string) => Promise<boolean>;
  batchUpdate: (request: BatchMessageRequest) => Promise<boolean>;
  markAllAsRead: () => Promise<boolean>;
  refreshBadges: () => void;
  
  // 管理员消息操作
  createNewMessage: (request: CreateMessageRequest) => Promise<Message | null>;
  loadAllMessages: (params?: MessageQueryParams) => Promise<void>;
  deleteMessageById: (messageId: string) => Promise<boolean>;
  
  // 系统操作
  sendOverdueRemindersToUsers: () => Promise<Message[]>;
  sendSystemReport: () => Promise<Message | null>;
  sendBatchToOverdueUsers: (title: string, content: string) => Promise<Message[]>;
}

// 创建Context
const MessageContext = createContext<MessageContextType | undefined>(undefined);

// Provider组件
export function MessageProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(messageReducer, initialState);
  const { state: authState } = useAuth();

  // 加载用户消息
  const loadUserMessages = useCallback(async (params: MessageQueryParams = {}) => {
    if (!authState.user) return;
    
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await getUserMessages(authState.user.username, params);
      dispatch({
        type: 'SET_MESSAGES',
        payload: {
          messages: response.messages,
          stats: response.stats,
          total: response.total,
          hasMore: response.hasMore,
          page: response.page
        }
      });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: '加载消息失败' });
    }
  }, [authState.user]);

  // 刷新红点通知
  const refreshBadges = useCallback(() => {
    if (!authState.user) return;
    
    const badges = getNotificationBadges(authState.user.username);
    dispatch({ type: 'SET_BADGES', payload: badges });
  }, [authState.user]);

  // 初始化时加载红点
  useEffect(() => {
    if (authState.user) {
      refreshBadges();
    }
  }, [authState.user, refreshBadges]);

  // 标记消息为已读
  const markAsRead = useCallback(async (messageId: string): Promise<boolean> => {
    if (!authState.user) return false;
    
    try {
      const success = await markMessageAsRead(messageId, authState.user.username);
      if (success) {
        // 更新本地状态
        const updatedMessage = state.messages.find(msg => msg.id === messageId);
        if (updatedMessage) {
          const recipient = updatedMessage.recipients.find(r => r.username === authState.user!.username);
          if (recipient) {
            recipient.status = MessageStatus.READ;
            recipient.readAt = new Date();
            dispatch({ type: 'UPDATE_MESSAGE', payload: updatedMessage });
          }
        }
        // 刷新红点
        refreshBadges();
      }
      return success;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: '标记已读失败' });
      return false;
    }
  }, [authState.user, state.messages, refreshBadges]);

  // 批量更新消息
  const batchUpdate = async (request: BatchMessageRequest): Promise<boolean> => {
    if (!authState.user) return false;
    
    try {
      const success = await batchUpdateMessages(request, authState.user.username);
      if (success) {
        // 重新加载消息
        await loadUserMessages();
        refreshBadges();
      }
      return success;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: '批量操作失败' });
      return false;
    }
  };

  // 一键已读
  const markAllAsRead = async (): Promise<boolean> => {
    if (!authState.user) return false;
    
    try {
      const success = await markAllMessagesAsRead(authState.user.username);
      if (success) {
        // 更新本地状态
        const updatedMessages = state.messages.map(message => {
          const recipient = message.recipients.find(r => r.username === authState.user!.username);
          if (recipient && recipient.status === MessageStatus.UNREAD) {
            recipient.status = MessageStatus.READ;
            recipient.readAt = new Date();
          }
          return message;
        });
        
        dispatch({
          type: 'SET_MESSAGES',
          payload: {
            messages: updatedMessages,
            stats: state.stats!,
            total: state.total,
            hasMore: state.hasMore,
            page: state.currentPage
          }
        });
        
        refreshBadges();
      }
      return success;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: '一键已读失败' });
      return false;
    }
  };

  // 创建新消息（管理员）
  const createNewMessage = useCallback(async (request: CreateMessageRequest): Promise<Message | null> => {
    if (!authState.user) return null;
    
    try {
      const message = await createMessage(request, authState.user);
      dispatch({ type: 'ADD_MESSAGE', payload: message });
      return message;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: '创建消息失败' });
      return null;
    }
  }, [authState.user]);

  // 加载所有消息（管理员）
  const loadAllMessages = useCallback(async (params: MessageQueryParams = {}) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await getAllMessages(params);
      dispatch({
        type: 'SET_MESSAGES',
        payload: {
          messages: response.messages,
          stats: response.stats,
          total: response.total,
          hasMore: response.hasMore,
          page: response.page
        }
      });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: '加载消息失败' });
    }
  }, []);

  // 删除消息（管理员）
  const deleteMessageById = useCallback(async (messageId: string): Promise<boolean> => {
    if (!authState.user) return false;
    
    try {
      const success = await deleteMessage(messageId, authState.user.username);
      if (success) {
        dispatch({ type: 'REMOVE_MESSAGE', payload: messageId });
      }
      return success;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: '删除消息失败' });
      return false;
    }
  }, [authState.user]);

  // 发送逾期提醒
  const sendOverdueRemindersToUsers = useCallback(async (): Promise<Message[]> => {
    if (!authState.user) return [];
    
    try {
      const messages = await sendOverdueReminders(authState.user);
      return messages;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: '发送提醒失败' });
      return [];
    }
  }, [authState.user]);

  // 发送系统汇报
  const sendSystemReport = useCallback(async (): Promise<Message | null> => {
    if (!authState.user) return null;
    
    try {
      const message = await sendSystemReportToAdmin(authState.user);
      if (message) {
        dispatch({ type: 'ADD_MESSAGE', payload: message });
      }
      return message;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: '发送系统汇报失败' });
      return null;
    }
  }, [authState.user]);

  // 批量发送给逾期用户
  const sendBatchToOverdueUsers = useCallback(async (title: string, content: string): Promise<Message[]> => {
    if (!authState.user) return [];
    
    try {
      const messages = await sendBatchRemindersToOverdueUsers(title, content, authState.user);
      messages.forEach(message => {
        dispatch({ type: 'ADD_MESSAGE', payload: message });
      });
      return messages;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: '批量发送失败' });
      return [];
    }
  }, [authState.user]);

  const value: MessageContextType = {
    state,
    loadUserMessages,
    markAsRead,
    batchUpdate,
    markAllAsRead,
    refreshBadges,
    createNewMessage,
    loadAllMessages,
    deleteMessageById,
    sendOverdueRemindersToUsers,
    sendSystemReport,
    sendBatchToOverdueUsers
  };

  return (
    <MessageContext.Provider value={value}>
      {children}
    </MessageContext.Provider>
  );
}

// Hook
export function useMessage() {
  const context = useContext(MessageContext);
  if (context === undefined) {
    throw new Error('useMessage must be used within a MessageProvider');
  }
  return context;
}