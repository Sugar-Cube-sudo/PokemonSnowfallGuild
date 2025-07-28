'use client';

import { motion } from 'framer-motion';
import { UserRole } from '@/types/auth';
import { ROLE_BADGES } from '@/lib/auth';

interface RoleBadgeProps {
  role: UserRole;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export default function RoleBadge({ role, size = 'md', showIcon = true, className = '' }: RoleBadgeProps) {
  const badge = ROLE_BADGES[role];
  
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  const iconSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.2 }}
      className={`inline-flex items-center gap-1.5 rounded-full font-medium border border-opacity-20 backdrop-blur-sm ${
        badge.bgColor
      } ${badge.color} ${sizeClasses[size]} ${className}`}
      style={{
        borderColor: badge.color.replace('text-', '').replace('-700', '-300')
      }}
    >
      {showIcon && (
        <motion.span
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className={iconSizes[size]}
        >
          {badge.icon}
        </motion.span>
      )}
      <span>{badge.label}</span>
    </motion.div>
  );
}

// 角色权重排序（用于显示优先级）
export function getRoleWeight(role: UserRole): number {
  switch (role) {
    case UserRole.SUPER_ADMIN:
      return 4;
    case UserRole.ADMIN:
      return 3;
    case UserRole.MODERATOR:
      return 2;
    case UserRole.USER:
      return 1;
    default:
      return 0;
  }
}

// 角色比较函数
export function compareRoles(roleA: UserRole, roleB: UserRole): number {
  return getRoleWeight(roleB) - getRoleWeight(roleA);
}