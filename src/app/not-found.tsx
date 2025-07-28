'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  Home, 
  MessageSquare, 
  ArrowLeft, 
  Sparkles,
  Star,
  Heart,
  Zap,
  X
} from 'lucide-react';
import { AnimatedWrapper, HoverAnimation, Typewriter, ParallaxContainer } from '@/components/animations/AnimationComponents';
import { useSettings } from '@/contexts/SettingsContext';
import { parsePokemonIndex, PokemonIndexEntry } from '@/utils/pokemonDataParser';

// 浮动装饰元素组件
const FloatingElement = ({ 
  children, 
  delay = 0, 
  duration = 3,
  className = ""
}: {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}) => {
  return (
    <motion.div
      className={`absolute ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ 
        opacity: [0, 1, 1, 0],
        y: [20, -10, -30, -50],
        x: [0, 10, -5, 15],
        rotate: [0, 5, -3, 8]
      }}
      transition={{
        duration: duration,
        delay: delay,
        repeat: Infinity,
        repeatDelay: 2,
        ease: "easeInOut"
      }}
    >
      {children}
    </motion.div>
  );
};

// Pokemon球动画组件
const PokemonBall = ({ size = "w-8 h-8", delay = 0, isClickable = false, onClick }: { 
  size?: string; 
  delay?: number;
  isClickable?: boolean;
  onClick?: () => void;
}) => {
  return (
    <motion.div
      className={`${size} relative ${isClickable ? 'cursor-pointer' : ''}`}
      initial={{ scale: 0, rotate: 0 }}
      animate={{ 
        scale: [0, 1.2, 1],
        rotate: [0, 180, 360]
      }}
      whileHover={isClickable ? { 
        scale: 1.1,
        rotate: [0, 10, -10, 0],
        transition: { duration: 0.3 }
      } : {}}
      whileTap={isClickable ? { scale: 0.9 } : {}}
      transition={{
        duration: 1.5,
        delay: delay,
        ease: "easeOut"
      }}
      onClick={onClick}
    >
      <motion.div 
        className="w-full h-full rounded-full bg-gradient-to-b from-red-500 to-red-600 relative overflow-hidden shadow-lg"
        animate={isClickable ? {
          boxShadow: [
            "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            "0 10px 15px -3px rgba(239, 68, 68, 0.3)",
            "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
          ]
        } : {}}
        transition={{
          duration: 2,
          repeat: isClickable ? Infinity : 0,
          ease: "easeInOut"
        }}
      >
        <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-red-400 to-red-500"></div>
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-gray-100 to-white"></div>
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-800 transform -translate-y-1/2"></div>
        <motion.div 
          className="absolute top-1/2 left-1/2 w-3 h-3 bg-white rounded-full transform -translate-x-1/2 -translate-y-1/2 border-2 border-gray-800"
          animate={isClickable ? {
            scale: [1, 1.2, 1],
            backgroundColor: ["#ffffff", "#fef3c7", "#ffffff"]
          } : {}}
          transition={{
            duration: 1.5,
            repeat: isClickable ? Infinity : 0,
            ease: "easeInOut"
          }}
        >
          <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-gray-300 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
        </motion.div>
        
        {/* 闪光效果 */}
        {isClickable && (
          <motion.div
            className="absolute inset-0 rounded-full"
            animate={{
              background: [
                "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3) 0%, transparent 50%)",
                "radial-gradient(circle at 70% 70%, rgba(255,255,255,0.3) 0%, transparent 50%)",
                "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3) 0%, transparent 50%)"
              ]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        )}
      </motion.div>
    </motion.div>
  );
};

// 404数字动画组件
const AnimatedNumber = ({ number, delay = 0 }: { number: string; delay?: number }) => {
  return (
    <motion.div
      className="relative"
      initial={{ opacity: 0, scale: 0.5, rotateY: 90 }}
      animate={{ opacity: 1, scale: 1, rotateY: 0 }}
      transition={{
        duration: 0.8,
        delay: delay,
        type: "spring",
        bounce: 0.4
      }}
    >
      <div className="text-8xl md:text-9xl font-bold bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 bg-clip-text text-transparent relative">
        {number}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-blue-400 via-purple-500 to-pink-400 bg-clip-text text-transparent"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          {number}
        </motion.div>
      </div>
      
      {/* 发光效果 */}
      <motion.div
        className="absolute inset-0 text-8xl md:text-9xl font-bold text-blue-400 blur-lg opacity-30"
        animate={{ 
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.6, 0.3]
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        {number}
      </motion.div>
    </motion.div>
  );
};

export default function NotFound() {
  const router = useRouter();
  const { settings } = useSettings();
  const [showElements, setShowElements] = useState(false);
  const [currentMessage, setCurrentMessage] = useState(0);
  const [showPokemon, setShowPokemon] = useState(false);
  const [randomPokemon, setRandomPokemon] = useState<PokemonIndexEntry | null>(null);
  const [pokemonList, setPokemonList] = useState<PokemonIndexEntry[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);
  
  const messages = [
    "哎呀！你迷路了吗？",
    "这里没有你要找的宝可梦...",
    "让我们一起回到安全的地方吧！",
    "落雪公会永远欢迎你回来！"
  ];

  useEffect(() => {
    const timer = setTimeout(() => setShowElements(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  // 加载宝可梦数据
  useEffect(() => {
    const loadPokemonData = async () => {
      try {
        const data = await parsePokemonIndex();
        setPokemonList(data);
      } catch (error) {
        console.error('加载宝可梦数据失败:', error);
      }
    };
    loadPokemonData();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessage((prev) => (prev + 1) % messages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [messages.length]);

  const handleGoHome = () => {
    router.push('/');
  };

  const handleGoForum = () => {
    router.push('/forum');
  };

  const handleGoBack = () => {
    router.back();
  };

  // 处理精灵球点击事件
  const handlePokeBallClick = () => {
    if (pokemonList.length > 0 && !isDrawing) {
      setIsDrawing(true);
      setAnimationKey(prev => prev + 1);
      
      // 延迟显示宝可梦，让精灵球动画先播放
      setTimeout(() => {
        const randomIndex = Math.floor(Math.random() * pokemonList.length);
        const selectedPokemon = pokemonList[randomIndex];
        setRandomPokemon(selectedPokemon);
        setShowPokemon(true);
        setIsDrawing(false);
      }, 800);
    }
  };

  // 关闭宝可梦显示
  const closePokemonModal = () => {
    setShowPokemon(false);
    setRandomPokemon(null);
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* 动态背景 */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900" />
      
      {/* 装饰性动画背景元素 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {settings.animation.enabled && (
          <>
            {/* 浮动的Pokemon球 */}
            <FloatingElement delay={0} className="top-20 left-10">
              <PokemonBall size="w-6 h-6" />
            </FloatingElement>
            <FloatingElement delay={1} className="top-40 right-20">
              <PokemonBall size="w-8 h-8" />
            </FloatingElement>
            <FloatingElement delay={2} className="bottom-40 left-1/4">
              <PokemonBall size="w-5 h-5" />
            </FloatingElement>
            <FloatingElement delay={0.5} className="top-60 right-1/3">
              <PokemonBall size="w-7 h-7" />
            </FloatingElement>
            
            {/* 浮动的星星和装饰 */}
            <FloatingElement delay={1.5} className="top-32 left-1/3">
              <Star className="w-6 h-6 text-yellow-400 fill-current" />
            </FloatingElement>
            <FloatingElement delay={2.5} className="bottom-60 right-10">
              <Sparkles className="w-8 h-8 text-purple-400" />
            </FloatingElement>
            <FloatingElement delay={3} className="top-80 left-20">
              <Heart className="w-5 h-5 text-pink-400 fill-current" />
            </FloatingElement>
            <FloatingElement delay={1.8} className="bottom-32 right-1/4">
              <Zap className="w-6 h-6 text-blue-400 fill-current" />
            </FloatingElement>
            
            {/* 大型装饰圆圈 */}
            <motion.div
              className="absolute top-20 right-10 w-32 h-32 bg-blue-200/20 dark:bg-blue-500/10 rounded-full blur-xl"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.6, 0.3]
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <motion.div
              className="absolute bottom-20 left-10 w-40 h-40 bg-purple-200/15 dark:bg-purple-500/8 rounded-full blur-2xl"
              animate={{
                scale: [1, 0.8, 1.3, 1],
                x: [0, 20, -10, 0],
                y: [0, -15, 10, 0]
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1
              }}
            />
          </>
        )}
      </div>

      {/* 主要内容 */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-4xl mx-auto">
          {/* 404 数字动画 */}
          <AnimatedWrapper animation="fadeIn" delay={0}>
            <div className="flex items-center justify-center space-x-4 mb-8">
              <AnimatedNumber number="4" delay={0.2} />
              <AnimatedNumber number="0" delay={0.4} />
              <AnimatedNumber number="4" delay={0.6} />
            </div>
          </AnimatedWrapper>

          {/* 主标题 */}
          <AnimatedWrapper animation="slideIn" delay={0.8}>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              <Typewriter 
                text="页面走丢了！" 
                speed={100}
                className="gradient-text"
              />
            </h1>
          </AnimatedWrapper>

          {/* 动态消息 */}
          <AnimatedWrapper animation="fadeIn" delay={1.2}>
            <div className="h-16 flex items-center justify-center mb-8">
              <AnimatePresence mode="wait">
                <motion.p
                  key={currentMessage}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                  className="text-lg md:text-xl text-gray-600 dark:text-gray-300"
                >
                  {messages[currentMessage]}
                </motion.p>
              </AnimatePresence>
            </div>
          </AnimatedWrapper>

          {/* 可爱的Pokemon插图区域 - 精灵球 */}
          <AnimatedWrapper animation="bounce" delay={1.5}>
            <div className="mb-12 flex justify-center">
              <motion.div
                className="relative cursor-pointer"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 300 }}
                onClick={handlePokeBallClick}
              >
                <div className="w-32 h-32 relative">
                  <PokemonBall size="w-32 h-32" delay={0} isClickable={true} onClick={handlePokeBallClick} />
                </div>
                
                {/* 环绕的小装饰 */}
                {showElements && (
                  <>
                    <motion.div
                      className="absolute -top-2 -right-2"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1, rotate: 360 }}
                      transition={{ delay: 2, duration: 0.5 }}
                    >
                      <Star className="w-6 h-6 text-yellow-500 fill-current" />
                    </motion.div>
                    <motion.div
                      className="absolute -bottom-2 -left-2"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1, rotate: -360 }}
                      transition={{ delay: 2.2, duration: 0.5 }}
                    >
                      <Sparkles className="w-6 h-6 text-purple-500" />
                    </motion.div>
                  </>
                )}
                
                {/* 点击提示 */}
                <motion.div
                  className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-sm text-gray-600 dark:text-gray-400"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  点击
                </motion.div>
              </motion.div>
            </div>
          </AnimatedWrapper>

          {/* 操作按钮组 */}
          <AnimatedWrapper animation="slideIn" delay={2}>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
              {/* 返回首页 */}
              <HoverAnimation scale={1.05}>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleGoHome}
                  className="flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                  <Home className="w-5 h-5" />
                  <span className="font-semibold">回到首页</span>
                </motion.button>
              </HoverAnimation>

              {/* 前往论坛 */}
              <HoverAnimation scale={1.05}>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleGoForum}
                  className="flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl hover:from-purple-600 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                  <MessageSquare className="w-5 h-5" />
                  <span className="font-semibold">前往论坛</span>
                </motion.button>
              </HoverAnimation>

              {/* 返回上页 */}
              <HoverAnimation scale={1.05}>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleGoBack}
                  className="flex items-center space-x-3 px-8 py-4 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-2 border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span className="font-semibold">返回上页</span>
                </motion.button>
              </HoverAnimation>
            </div>
          </AnimatedWrapper>

          {/* 底部提示信息 */}
          <AnimatedWrapper animation="fadeIn" delay={2.5}>
            <div className="mt-16 p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-xl">
              <div className="flex items-center justify-center space-x-2 text-gray-600 dark:text-gray-400">
                <PokemonBall size="w-5 h-5" delay={0} />
                <span className="text-sm">
                  如果你认为这是一个错误，请联系管理员或点击精灵球寻找宝可梦
                </span>
              </div>
              
              <motion.div
                className="mt-4 text-xs text-gray-500 dark:text-gray-500"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                © 2024 落雪公会 Pokemon Snowfall Guild
              </motion.div>
            </div>
          </AnimatedWrapper>
        </div>
      </div>

      {/* 随机宝可梦模态框 */}
      <AnimatePresence>
        {showPokemon && randomPokemon && (
          <motion.div
            key={`modal-${animationKey}`}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closePokemonModal}
          >
            <motion.div
              className="bg-gradient-to-br from-white via-blue-50 to-purple-50 dark:from-gray-800 dark:via-gray-700 dark:to-gray-600 rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl border border-white/20 relative overflow-hidden"
              initial={{ scale: 0.3, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.3, opacity: 0, y: 50 }}
              transition={{ type: "spring", damping: 25, stiffness: 400 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* 背景装饰 */}
              <div className="absolute inset-0 rounded-3xl overflow-hidden">
                <motion.div
                  className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-yellow-200/30 to-orange-200/30 rounded-full"
                  animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 180, 360]
                  }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                />
                <motion.div
                  className="absolute -bottom-10 -left-10 w-24 h-24 bg-gradient-to-br from-blue-200/30 to-purple-200/30 rounded-full"
                  animate={{
                    scale: [1.2, 1, 1.2],
                    rotate: [360, 180, 0]
                  }}
                  transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                />
              </div>

              {/* 关闭按钮 */}
              <div className="flex justify-end mb-4 relative z-10">
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={closePokemonModal}
                  className="w-8 h-8 bg-white/80 dark:bg-gray-800/80 rounded-full flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors backdrop-blur-sm"
                >
                  <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </motion.button>
              </div>

              {/* 宝可梦信息 */}
              <div className="text-center relative z-10">
                {/* 精灵球打开动画 */}
                <motion.div
                  className="mb-6 flex justify-center"
                  initial={{ scale: 1 }}
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                >
                  <div className="relative">
                    <motion.div
                      key={`pokeball-${animationKey}`}
                      className="w-24 h-24"
                      initial={{ scale: 1, rotate: 0 }}
                      animate={{ 
                        scale: [1, 1.3, 0.7, 1.1, 1],
                        rotate: [0, 180, 360, 540, 720]
                      }}
                      transition={{ duration: 1.2, ease: "easeInOut" }}
                    >
                      <PokemonBall size="w-24 h-24" delay={0} />
                    </motion.div>
                    
                    {/* 闪光效果 */}
                    <motion.div
                      key={`flash-${animationKey}`}
                      className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-32 pointer-events-none"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ 
                        scale: [0, 2, 0],
                        opacity: [0, 1, 0]
                      }}
                      transition={{ duration: 0.8, delay: 0.6 }}
                    >
                      <div className="w-full h-full bg-gradient-radial from-yellow-300/60 via-white/40 to-transparent rounded-full" />
                    </motion.div>
                    
                    {/* 宝可梦图片 */}
                    <motion.div
                      key={`pokemon-${animationKey}`}
                      className="absolute inset-0 flex items-center justify-center"
                      initial={{ opacity: 0, scale: 0, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ delay: 1.2, duration: 0.6, type: "spring", damping: 15 }}
                    >
                      <motion.div
                        animate={{
                          y: [0, -5, 0],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                        className="relative"
                      >
                        <img
                          src={randomPokemon.imageUrl}
                          alt={randomPokemon.chinese}
                          className="w-20 h-20 object-contain drop-shadow-lg"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/thumbnails/default.png';
                          }}
                        />
                        
                        {/* 宝可梦光环 */}
                        <motion.div
                          className="absolute inset-0 rounded-full"
                          animate={{
                            boxShadow: [
                              "0 0 20px rgba(59, 130, 246, 0.3)",
                              "0 0 40px rgba(147, 51, 234, 0.4)",
                              "0 0 20px rgba(59, 130, 246, 0.3)"
                            ]
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        />
                      </motion.div>
                    </motion.div>
                  </div>
                </motion.div>

                {/* 宝可梦名称和编号 */}
                <motion.div
                  key={`info-${animationKey}`}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.8, duration: 0.6 }}
                  className="mb-4"
                >
                  <motion.h3 
                    className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2"
                    animate={{
                      backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"]
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                  >
                    {randomPokemon.chinese}
                  </motion.h3>
                  <p className="text-lg text-gray-700 dark:text-gray-200 mb-1 font-medium">
                    {randomPokemon.english}
                  </p>
                  <motion.p 
                    className="text-sm text-gray-500 dark:text-gray-400 font-mono"
                    animate={{
                      color: ["#6b7280", "#3b82f6", "#6b7280"]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    #{randomPokemon.id.toString().padStart(3, '0')}
                  </motion.p>
                </motion.div>

                {/* 装饰性元素 */}
                <motion.div
                  className="flex justify-center space-x-4 mb-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.4, duration: 0.5 }}
                >
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  >
                    <Star className="w-6 h-6 text-yellow-400 fill-current" />
                  </motion.div>
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Sparkles className="w-6 h-6 text-purple-400" />
                  </motion.div>
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                  >
                    <Heart className="w-6 h-6 text-pink-400 fill-current" />
                  </motion.div>
                </motion.div>

                {/* 装饰星星 */}
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={`star-${i}-${animationKey}`}
                    className={`absolute w-2 h-2 bg-gradient-to-r ${
                      i % 3 === 0 ? 'from-yellow-400 to-orange-400' :
                      i % 3 === 1 ? 'from-blue-400 to-purple-400' :
                      'from-green-400 to-teal-400'
                    } rounded-full`}
                    style={{
                      top: `${20 + (i * 15)}%`,
                      left: i % 2 === 0 ? '10%' : '90%',
                    }}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ 
                      scale: [0, 1, 0],
                      opacity: [0, 1, 0],
                      rotate: [0, 180, 360]
                    }}
                    transition={{
                      duration: 2,
                      delay: 2 + (i * 0.2),
                      repeat: Infinity,
                      repeatDelay: 3
                    }}
                  />
                ))}

                {/* 再次抽取按钮 */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.6, duration: 0.5 }}
                >
                  <HoverAnimation scale={1.05}>
                    <motion.button
                      key={`button-${animationKey}`}
                      whileTap={{ scale: 0.95 }}
                      onClick={handlePokeBallClick}
                      disabled={isDrawing}
                      className={`relative overflow-hidden px-8 py-4 bg-gradient-to-r from-red-500 via-pink-500 to-red-600 text-white rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 ${
                        isDrawing ? 'opacity-50 cursor-not-allowed' : 'hover:from-red-600 hover:via-pink-600 hover:to-red-700'
                      }`}
                    >
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                        animate={{
                          x: ["-100%", "100%"]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "linear"
                        }}
                      />
                      <span className="relative z-10">
                        {isDrawing ? '抽取中...' : '再抽一只宝可梦'}
                      </span>
                    </motion.button>
                  </HoverAnimation>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}