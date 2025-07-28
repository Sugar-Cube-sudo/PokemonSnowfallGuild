'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { User, UserRole } from '@/types/auth';
import { getUserProfile } from '@/lib/userProfile';
import { getAllUsers } from '@/lib/auth';
import { useAuth } from '@/contexts/AuthContext';
import UserProfile from '@/components/UserProfile';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';



export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { state } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUserData();
  }, [params.id]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 获取目标用户数据
      const targetUserId = params.id as string;
      
      // 从所有用户中查找目标用户
      const allUsers = await getAllUsers();
      let targetUser = allUsers.find(u => u.id === targetUserId || u.uniqueId === targetUserId);
      
      if (!targetUser) {
        // 如果是当前登录用户访问自己的主页，但找不到用户数据，这可能是数据同步问题
        if (state.user && (state.user.id === targetUserId || state.user.uniqueId === targetUserId)) {
          // 使用当前登录用户的数据
          targetUser = state.user;
        } else {
          setError('用户不存在');
          return;
        }
      }

      setUser(targetUser);
    } catch (error) {
      console.error('加载用户数据失败:', error);
      setError('加载用户数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">加载中...</div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardContent className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">
              {error || '用户不存在'}
            </h1>
            <p className="text-gray-600 mb-6">
              {error === '用户不存在' 
                ? '您访问的用户不存在，请检查用户ID是否正确。'
                : '加载用户信息时出现问题，请稍后重试。'
              }
            </p>
            <Button onClick={handleGoBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isOwnProfile = state.user?.id === user.id;

  return (
    <div className="min-h-screen">
      {/* 导航栏 */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50">
        <div className="container mx-auto px-4 py-4">
          <Button 
            variant="ghost" 
            onClick={handleGoBack}
            className="mb-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回
          </Button>
          <h1 className="text-xl font-semibold">
            {isOwnProfile ? '我的主页' : `${user.gameNickname}的主页`}
          </h1>
        </div>
      </div>

      {/* 用户主页内容 */}
      <UserProfile 
        user={user}
        currentUser={state.user}
        isOwnProfile={isOwnProfile}
      />
    </div>
  );
}