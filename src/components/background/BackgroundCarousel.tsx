'use client';

import React, { useState, useEffect } from 'react';
import { useSettings } from '@/contexts/SettingsContext';

export function BackgroundCarousel() {
  const { settings } = useSettings();
  const [isVisible, setIsVisible] = useState(true);

  // 根据设置类型渲染不同的背景
  const renderBackground = () => {
    switch (settings.background.type) {
      case 'color':
        return (
          <div
            className="fixed inset-0 -z-50"
            style={{
              backgroundColor: settings.background.value,
              opacity: settings.background.opacity,
              filter: `blur(${settings.background.blur}px)`,
            }}
          />
        );

      case 'gradient':
        return (
          <div
            className="fixed inset-0 -z-50"
            style={{
              background: settings.background.value,
              opacity: settings.background.opacity,
              filter: `blur(${settings.background.blur}px)`,
            }}
          />
        );

      case 'image':
        if (settings.background.images.length === 0) {
          return (
            <div
              className="fixed inset-0 -z-50"
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                opacity: settings.background.opacity,
                filter: `blur(${settings.background.blur}px)`,
              }}
            />
          );
        }

        // 显示单张图片（最新的一张）
        return (
          <div
            className="fixed inset-0 -z-50 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url(${settings.background.images[0].url})`,
              opacity: settings.background.opacity,
              filter: `blur(${settings.background.blur}px)`,
            }}
          />
        );

      default:
        return null;
    }
  };

  return (
    <>
      {renderBackground()}
      
      {/* 背景遮罩层，确保内容可读性 - 降低遮罩透明度 */}
      <div className="fixed inset-0 -z-40 bg-white/20 dark:bg-gray-900/20" />
    </>
  );
}

// 背景预览组件（用于设置面板）
interface BackgroundPreviewProps {
  type: 'color' | 'gradient' | 'image';
  value: string;
  images?: Array<{ id: string; url: string; name: string }>;
  opacity?: number;
  blur?: number;
  className?: string;
}

export function BackgroundPreview({ 
  type, 
  value, 
  images = [], 
  opacity = 1, 
  blur = 0, 
  className = '' 
}: BackgroundPreviewProps) {
  const [previewIndex, setPreviewIndex] = useState(0);

  useEffect(() => {
    if (type === 'image' && images.length > 1) {
      const interval = setInterval(() => {
        setPreviewIndex((prev) => (prev + 1) % images.length);
      }, 2000); // 预览时2秒切换一次

      return () => clearInterval(interval);
    }
  }, [type, images.length]);

  const getBackgroundStyle = () => {
    switch (type) {
      case 'color':
        return {
          backgroundColor: value,
          opacity,
          filter: `blur(${blur}px)`,
        };

      case 'gradient':
        return {
          background: value,
          opacity,
          filter: `blur(${blur}px)`,
        };

      case 'image':
        if (images.length === 0) {
          return {
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            opacity,
            filter: `blur(${blur}px)`,
          };
        }
        
        const currentImage = images[previewIndex] || images[0];
        return {
          backgroundImage: `url(${currentImage.url})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity,
          filter: `blur(${blur}px)`,
        };

      default:
        return {};
    }
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div
        className="absolute inset-0"
        style={getBackgroundStyle()}
      />
      
      {/* 内容遮罩 */}
      <div className="absolute inset-0 bg-white/20 dark:bg-gray-900/20" />
      
      {/* 预览内容 */}
      <div className="relative z-10 p-4 text-center">
        <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">
          背景预览
        </div>
        <div className="text-xs text-gray-600 dark:text-gray-400">
          {type === 'color' && '纯色背景'}
          {type === 'gradient' && '渐变背景'}
          {type === 'image' && images.length > 0 && `图片 ${previewIndex + 1}/${images.length}`}
          {type === 'image' && images.length === 0 && '默认渐变'}
        </div>
      </div>
      
      {/* 轮播指示器 */}
      {type === 'image' && images.length > 1 && (
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
          <div className="flex space-x-1">
            {images.map((_, index) => (
              <div
                key={index}
                className={`w-1.5 h-1.5 rounded-full ${
                  index === previewIndex ? 'bg-white' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}