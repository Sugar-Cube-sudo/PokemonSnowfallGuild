'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Lock,
  Key,
  Eye,
  EyeOff,
  Clock,
  Users,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Save,
  RefreshCw,
  Settings,
  Smartphone,
  Globe,
  Database
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface SecuritySettingsProps {
  onClose: () => void;
}

interface SecurityConfig {
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
    maxAge: number; // 密码最大有效期（天）
    preventReuse: number; // 防止重复使用最近N个密码
  };
  loginSecurity: {
    maxFailedAttempts: number;
    lockoutDuration: number; // 锁定时间（分钟）
    sessionTimeout: number; // 会话超时（分钟）
    requireTwoFactor: boolean;
    allowedIpRanges: string[];
  };
  auditSettings: {
    enableLoginAudit: boolean;
    enableOperationAudit: boolean;
    retentionDays: number;
    alertOnSuspiciousActivity: boolean;
  };
  systemSecurity: {
    enableHttpsOnly: boolean;
    enableCsrfProtection: boolean;
    enableRateLimiting: boolean;
    maxRequestsPerMinute: number;
  };
}

interface SecurityEvent {
  id: string;
  type: 'login_failed' | 'password_changed' | 'suspicious_activity' | 'admin_action';
  user: string;
  timestamp: Date;
  details: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  ipAddress?: string;
}

const defaultSecurityConfig: SecurityConfig = {
  passwordPolicy: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    maxAge: 90,
    preventReuse: 5
  },
  loginSecurity: {
    maxFailedAttempts: 5,
    lockoutDuration: 30,
    sessionTimeout: 120,
    requireTwoFactor: false,
    allowedIpRanges: ['0.0.0.0/0']
  },
  auditSettings: {
    enableLoginAudit: true,
    enableOperationAudit: true,
    retentionDays: 90,
    alertOnSuspiciousActivity: true
  },
  systemSecurity: {
    enableHttpsOnly: true,
    enableCsrfProtection: true,
    enableRateLimiting: true,
    maxRequestsPerMinute: 100
  }
};

const mockSecurityEvents: SecurityEvent[] = [
  {
    id: '1',
    type: 'login_failed',
    user: 'unknown',
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    details: '连续5次登录失败，IP: 192.168.1.100',
    severity: 'high',
    ipAddress: '192.168.1.100'
  },
  {
    id: '2',
    type: 'password_changed',
    user: 'john_doe',
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    details: '用户主动修改密码',
    severity: 'low'
  },
  {
    id: '3',
    type: 'suspicious_activity',
    user: 'admin_user',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    details: '异地登录检测，IP: 203.0.113.1',
    severity: 'medium',
    ipAddress: '203.0.113.1'
  },
  {
    id: '4',
    type: 'admin_action',
    user: 'super_admin',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
    details: '批量重置用户密码',
    severity: 'medium'
  }
];

export default function SecuritySettings({ onClose }: SecuritySettingsProps) {
  const { state } = useAuth();
  const [config, setConfig] = useState<SecurityConfig>(defaultSecurityConfig);
  const [activeTab, setActiveTab] = useState<'policy' | 'login' | 'audit' | 'system' | 'events'>('policy');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>(mockSecurityEvents);
  const [showIpInput, setShowIpInput] = useState(false);
  const [newIpRange, setNewIpRange] = useState('');

  useEffect(() => {
    // 模拟加载配置
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, []);

  const handleSaveConfig = async () => {
    setIsSaving(true);
    try {
      // 模拟保存配置
      await new Promise(resolve => setTimeout(resolve, 1500));
      alert('安全配置已保存成功！');
    } catch (error) {
      alert('保存配置失败，请重试。');
    } finally {
      setIsSaving(false);
    }
  };

  const updatePasswordPolicy = (field: keyof SecurityConfig['passwordPolicy'], value: any) => {
    setConfig(prev => ({
      ...prev,
      passwordPolicy: {
        ...prev.passwordPolicy,
        [field]: value
      }
    }));
  };

  const updateLoginSecurity = (field: keyof SecurityConfig['loginSecurity'], value: any) => {
    setConfig(prev => ({
      ...prev,
      loginSecurity: {
        ...prev.loginSecurity,
        [field]: value
      }
    }));
  };

  const updateAuditSettings = (field: keyof SecurityConfig['auditSettings'], value: any) => {
    setConfig(prev => ({
      ...prev,
      auditSettings: {
        ...prev.auditSettings,
        [field]: value
      }
    }));
  };

  const updateSystemSecurity = (field: keyof SecurityConfig['systemSecurity'], value: any) => {
    setConfig(prev => ({
      ...prev,
      systemSecurity: {
        ...prev.systemSecurity,
        [field]: value
      }
    }));
  };

  const addIpRange = () => {
    if (newIpRange.trim()) {
      updateLoginSecurity('allowedIpRanges', [...config.loginSecurity.allowedIpRanges, newIpRange.trim()]);
      setNewIpRange('');
      setShowIpInput(false);
    }
  };

  const removeIpRange = (index: number) => {
    const newRanges = config.loginSecurity.allowedIpRanges.filter((_, i) => i !== index);
    updateLoginSecurity('allowedIpRanges', newRanges);
  };

  const getSeverityColor = (severity: SecurityEvent['severity']) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      case 'high': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20';
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      case 'low': return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  const getEventIcon = (type: SecurityEvent['type']) => {
    switch (type) {
      case 'login_failed': return <XCircle className="w-4 h-4" />;
      case 'password_changed': return <Key className="w-4 h-4" />;
      case 'suspicious_activity': return <AlertTriangle className="w-4 h-4" />;
      case 'admin_action': return <Settings className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const tabs = [
    { id: 'policy' as const, name: '密码策略', icon: Lock },
    { id: 'login' as const, name: '登录安全', icon: Shield },
    { id: 'audit' as const, name: '审计设置', icon: Eye },
    { id: 'system' as const, name: '系统安全', icon: Database },
    { id: 'events' as const, name: '安全事件', icon: AlertTriangle }
  ];

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center space-x-3">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
            <span className="text-lg font-medium text-gray-900 dark:text-gray-100">加载安全配置...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden"
      >
        {/* 头部 */}
        <div className="bg-gradient-to-r from-red-600 to-orange-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center hover:bg-white/30 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </motion.button>
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">安全设置</h2>
                <p className="text-red-100 text-sm">配置系统安全策略和访问控制</p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSaveConfig}
              disabled={isSaving}
              className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              {isSaving ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{isSaving ? '保存中...' : '保存配置'}</span>
            </motion.button>
          </div>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* 侧边栏 */}
          <div className="w-64 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 p-4">
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <motion.button
                    key={tab.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800'
                    }`}
                  >
                    <IconComponent className="w-5 h-5" />
                    <span className="font-medium">{tab.name}</span>
                  </motion.button>
                );
              })}
            </nav>
          </div>

          {/* 主要内容 */}
          <div className="flex-1 overflow-y-auto p-6">
            <AnimatePresence mode="wait">
              {activeTab === 'policy' && (
                <motion.div
                  key="policy"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">密码策略配置</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            最小密码长度
                          </label>
                          <input
                            type="number"
                            min="6"
                            max="32"
                            value={config.passwordPolicy.minLength}
                            onChange={(e) => updatePasswordPolicy('minLength', parseInt(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            密码有效期（天）
                          </label>
                          <input
                            type="number"
                            min="30"
                            max="365"
                            value={config.passwordPolicy.maxAge}
                            onChange={(e) => updatePasswordPolicy('maxAge', parseInt(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            防止重复使用密码数量
                          </label>
                          <input
                            type="number"
                            min="3"
                            max="10"
                            value={config.passwordPolicy.preventReuse}
                            onChange={(e) => updatePasswordPolicy('preventReuse', parseInt(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="space-y-3">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            密码复杂度要求
                          </label>
                          
                          {[
                            { key: 'requireUppercase', label: '包含大写字母' },
                            { key: 'requireLowercase', label: '包含小写字母' },
                            { key: 'requireNumbers', label: '包含数字' },
                            { key: 'requireSpecialChars', label: '包含特殊字符' }
                          ].map(({ key, label }) => (
                            <label key={key} className="flex items-center space-x-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={config.passwordPolicy[key as keyof typeof config.passwordPolicy] as boolean}
                                onChange={(e) => updatePasswordPolicy(key as keyof typeof config.passwordPolicy, e.target.checked)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'login' && (
                <motion.div
                  key="login"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">登录安全配置</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            最大失败登录次数
                          </label>
                          <input
                            type="number"
                            min="3"
                            max="10"
                            value={config.loginSecurity.maxFailedAttempts}
                            onChange={(e) => updateLoginSecurity('maxFailedAttempts', parseInt(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            账户锁定时间（分钟）
                          </label>
                          <input
                            type="number"
                            min="5"
                            max="1440"
                            value={config.loginSecurity.lockoutDuration}
                            onChange={(e) => updateLoginSecurity('lockoutDuration', parseInt(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            会话超时时间（分钟）
                          </label>
                          <input
                            type="number"
                            min="30"
                            max="480"
                            value={config.loginSecurity.sessionTimeout}
                            onChange={(e) => updateLoginSecurity('sessionTimeout', parseInt(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="flex items-center space-x-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={config.loginSecurity.requireTwoFactor}
                              onChange={(e) => updateLoginSecurity('requireTwoFactor', e.target.checked)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <div>
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">启用二次验证</span>
                              <p className="text-xs text-gray-500 dark:text-gray-400">要求用户使用手机验证码登录</p>
                            </div>
                          </label>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            允许的IP地址范围
                          </label>
                          <div className="space-y-2">
                            {config.loginSecurity.allowedIpRanges.map((range, index) => (
                              <div key={index} className="flex items-center space-x-2">
                                <span className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm">
                                  {range}
                                </span>
                                <button
                                  onClick={() => removeIpRange(index)}
                                  className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                            
                            {showIpInput ? (
                              <div className="flex items-center space-x-2">
                                <input
                                  type="text"
                                  value={newIpRange}
                                  onChange={(e) => setNewIpRange(e.target.value)}
                                  placeholder="例如: 192.168.1.0/24"
                                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                                />
                                <button
                                  onClick={addIpRange}
                                  className="p-2 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setShowIpInput(false)}
                                  className="p-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setShowIpInput(true)}
                                className="w-full px-3 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-500 dark:text-gray-400 hover:border-blue-500 hover:text-blue-600 transition-colors"
                              >
                                + 添加IP地址范围
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'audit' && (
                <motion.div
                  key="audit"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">审计设置</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        {[
                          { key: 'enableLoginAudit', label: '启用登录审计', desc: '记录所有登录尝试' },
                          { key: 'enableOperationAudit', label: '启用操作审计', desc: '记录管理员操作' },
                          { key: 'alertOnSuspiciousActivity', label: '可疑活动警报', desc: '检测到异常时发送警报' }
                        ].map(({ key, label, desc }) => (
                          <label key={key} className="flex items-start space-x-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={config.auditSettings[key as keyof typeof config.auditSettings] as boolean}
                              onChange={(e) => updateAuditSettings(key as keyof typeof config.auditSettings, e.target.checked)}
                              className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <div>
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{desc}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          日志保留天数
                        </label>
                        <input
                          type="number"
                          min="30"
                          max="365"
                          value={config.auditSettings.retentionDays}
                          onChange={(e) => updateAuditSettings('retentionDays', parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          超过此天数的审计日志将被自动删除
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'system' && (
                <motion.div
                  key="system"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">系统安全配置</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        {[
                          { key: 'enableHttpsOnly', label: '强制HTTPS', desc: '仅允许HTTPS连接' },
                          { key: 'enableCsrfProtection', label: 'CSRF保护', desc: '防止跨站请求伪造攻击' },
                          { key: 'enableRateLimiting', label: '请求频率限制', desc: '限制API请求频率' }
                        ].map(({ key, label, desc }) => (
                          <label key={key} className="flex items-start space-x-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={config.systemSecurity[key as keyof typeof config.systemSecurity] as boolean}
                              onChange={(e) => updateSystemSecurity(key as keyof typeof config.systemSecurity, e.target.checked)}
                              className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <div>
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{desc}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          每分钟最大请求数
                        </label>
                        <input
                          type="number"
                          min="10"
                          max="1000"
                          value={config.systemSecurity.maxRequestsPerMinute}
                          onChange={(e) => updateSystemSecurity('maxRequestsPerMinute', parseInt(e.target.value))}
                          disabled={!config.systemSecurity.enableRateLimiting}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          超过此限制的请求将被拒绝
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'events' && (
                <motion.div
                  key="events"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">安全事件日志</h3>
                    
                    <div className="space-y-4">
                      {securityEvents.map((event) => (
                        <motion.div
                          key={event.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-4 shadow-sm"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3">
                              <div className={`p-2 rounded-lg ${getSeverityColor(event.severity)}`}>
                                {getEventIcon(event.type)}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className="font-medium text-gray-900 dark:text-gray-100">
                                    {event.user}
                                  </span>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(event.severity)}`}>
                                    {event.severity.toUpperCase()}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                  {event.details}
                                </p>
                                <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                                  <span>{event.timestamp.toLocaleString()}</span>
                                  {event.ipAddress && (
                                    <span>IP: {event.ipAddress}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}