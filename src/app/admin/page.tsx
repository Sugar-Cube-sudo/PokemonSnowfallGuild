'use client';

import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/auth';
import SystemSettings from '@/components/admin/SystemSettings';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminPage() {
  const { state } = useAuth();
  const router = useRouter();

  // 检查用户权限
  const isAdmin = state.user?.role === UserRole.SUPER_ADMIN || 
                  state.user?.role === UserRole.ADMIN || 
                  state.user?.role === UserRole.MODERATOR;

  useEffect(() => {
    // 如果用户未登录或不是管理员，重定向到首页
    if (!state.user || !isAdmin) {
      router.push('/');
    }
  }, [state.user, isAdmin, router]);

  // 如果用户未登录或不是管理员，显示加载状态
  if (!state.user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">验证权限中...</p>
        </div>
      </div>
    );
  }

  const handleClose = () => {
    router.push('/');
  };

  return <SystemSettings onClose={handleClose} />;
}