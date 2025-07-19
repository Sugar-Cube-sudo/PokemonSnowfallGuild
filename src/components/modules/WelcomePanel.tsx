'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Quote } from 'lucide-react';
import { Module } from '@/lib/moduleLoader';
import { HitokotoResponse } from '@/types';

function WelcomePanelComponent() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [hitokoto, setHitokoto] = useState<HitokotoResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // 更新时间
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 获取一言
  useEffect(() => {
    const fetchHitokoto = async () => {
      try {
        // 添加超时控制
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5秒超时
        
        const response = await fetch('https://v1.hitokoto.cn/?c=b', {
          signal: controller.signal,
          mode: 'cors',
          headers: {
            'Accept': 'application/json',
          }
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data: HitokotoResponse = await response.json();
        setHitokoto(data);
      } catch (error) {
        console.warn('Failed to fetch hitokoto, using default:', error);
        // 设置默认一言
        setHitokoto({
          hitokoto: '愿你的每一天都充满阳光与希望',
          from: '落雪公会',
          id: 0,
          uuid: '',
          commit_from: '',
          creator: '',
          creator_uid: 0,
          reviewer: 0,
          type: 'b',
          length: 0
        });
      } finally {
        setLoading(false);
      }
    };

    fetchHitokoto();
    // 每30分钟更新一次一言
    const interval = setInterval(fetchHitokoto, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (date: Date) => {
    return {
      time: date.toLocaleTimeString('zh-CN', { 
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }),
      date: date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
      })
    };
  };

  const { time, date } = formatTime(currentTime);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6 }}
      className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-lg p-8 border border-gray-200 dark:border-gray-700 h-full"
    >
      {/* 公会名称 */}
      <div className="mb-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col space-y-2"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            落雪公会
          </h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-lg text-gray-600 dark:text-gray-400 font-medium"
          >
            Pokemon Snowfall Guild
          </motion.p>
        </motion.div>
      </div>

      {/* 系统时间 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md"
      >
        <div className="flex items-center gap-3 mb-3">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
          >
            <Clock className="w-5 h-5 text-blue-500" />
          </motion.div>
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            系统时间
          </span>
        </div>
        
        <motion.div
          key={time}
          initial={{ scale: 0.95, opacity: 0.8 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="text-2xl font-mono font-bold text-blue-600 dark:text-blue-400 mb-2"
        >
          {time}
        </motion.div>
        
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {date}
        </div>
      </motion.div>

      {/* 一言 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md"
      >
        <div className="flex items-center gap-3 mb-4">
          <Quote className="w-5 h-5 text-purple-500" />
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            每日一言
          </span>
        </div>
        
        {loading ? (
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-gray-400 dark:text-gray-500"
          >
            加载中...
          </motion.div>
        ) : hitokoto ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <blockquote className="text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">
              "{hitokoto.hitokoto}"
            </blockquote>
            <cite className="text-sm text-gray-500 dark:text-gray-400">
              —— {hitokoto.from}
            </cite>
          </motion.div>
        ) : (
          <div className="text-gray-400 dark:text-gray-500">
            暂无内容
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

export default Module({
  id: 'welcome-panel',
  name: '欢迎面板',
  position: 'sidebar',
  order: 1
})(WelcomePanelComponent);