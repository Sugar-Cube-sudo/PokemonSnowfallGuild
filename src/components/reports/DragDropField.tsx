'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Type, 
  Calendar, 
  ToggleLeft, 
  Hash, 
  List, 
  GripVertical,
  Plus,
  X,
  Check
} from 'lucide-react';
import { TableField, DragFieldItem } from '@/types/report';

interface DragDropFieldProps {
  fields: TableField[];
  onFieldsChange: (fields: TableField[]) => void;
  disabled?: boolean;
}

const FIELD_TYPES = [
  { type: 'text', label: '文本', icon: Type },
  { type: 'number', label: '数字', icon: Hash },
  { type: 'date', label: '日期', icon: Calendar },
  { type: 'boolean', label: '是/否', icon: ToggleLeft },
  { type: 'select', label: '选择', icon: List }
] as const;

const PRESET_FIELDS: DragFieldItem[] = [
  { id: 'username', name: '用户名', type: 'text', isPreset: true },
  { id: 'memberType', name: '会员类型', type: 'select', isPreset: true },
  { id: 'membershipFee', name: '会费金额', type: 'number', isPreset: true },
  { id: 'joinDate', name: '入会时间', type: 'date', isPreset: true },
  { id: 'isOverdue', name: '是否逾期', type: 'boolean', isPreset: true },
  { id: 'email', name: '邮箱', type: 'text', isPreset: true },
  { id: 'phone', name: '电话', type: 'text', isPreset: true },
  { id: 'expireDate', name: '到期时间', type: 'date', isPreset: true },
  { id: 'lastLogin', name: '最后登录', type: 'date', isPreset: true },
  { id: 'points', name: '积分', type: 'number', isPreset: true },
  { id: 'level', name: '等级', type: 'select', isPreset: true }
];

export default function DragDropField({ fields, onFieldsChange, disabled = false }: DragDropFieldProps) {
  const [draggedItem, setDraggedItem] = useState<DragFieldItem | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [showAddField, setShowAddField] = useState(false);
  const [newField, setNewField] = useState<Partial<TableField>>({ type: 'text', required: false });
  const dragRef = useRef<HTMLDivElement>(null);

  // 处理拖拽开始
  const handleDragStart = useCallback((item: DragFieldItem, e: React.DragEvent) => {
    if (disabled) return;
    
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('text/plain', JSON.stringify(item));
  }, [disabled]);

  // 处理拖拽结束
  const handleDragEnd = useCallback(() => {
    setDraggedItem(null);
    setDragOverIndex(null);
  }, []);

  // 处理拖拽悬停
  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    if (disabled) return;
    
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setDragOverIndex(index);
  }, [disabled]);

  // 处理拖拽离开
  const handleDragLeave = useCallback(() => {
    setDragOverIndex(null);
  }, []);

  // 处理放置
  const handleDrop = useCallback((e: React.DragEvent, targetIndex: number) => {
    if (disabled) return;
    
    e.preventDefault();
    setDragOverIndex(null);

    try {
      const itemData = JSON.parse(e.dataTransfer.getData('text/plain')) as DragFieldItem;
      
      // 检查字段是否已存在
      if (fields.find(f => f.id === itemData.id)) {
        return;
      }

      const newField: TableField = {
        id: itemData.id,
        name: itemData.name,
        type: itemData.type,
        required: false,
        order: targetIndex,
        ...(itemData.type === 'select' && itemData.id === 'memberType' && {
          options: ['年费', '月费', '免费']
        }),
        ...(itemData.type === 'select' && itemData.id === 'level' && {
          options: ['初级', '中级', '高级', 'VIP']
        })
      };

      const newFields = [...fields];
      newFields.splice(targetIndex, 0, newField);
      
      // 重新排序
      newFields.forEach((field, index) => {
        field.order = index;
      });

      onFieldsChange(newFields);
    } catch (error) {
      console.error('拖拽数据解析失败:', error);
    }
  }, [disabled, fields, onFieldsChange]);

  // 移除字段
  const removeField = useCallback((fieldId: string) => {
    if (disabled) return;
    
    const newFields = fields.filter(f => f.id !== fieldId);
    newFields.forEach((field, index) => {
      field.order = index;
    });
    onFieldsChange(newFields);
  }, [disabled, fields, onFieldsChange]);

  // 添加自定义字段
  const addCustomField = useCallback(() => {
    if (!newField.name || !newField.type) return;

    const fieldId = `custom_${Date.now()}`;
    const customField: TableField = {
      id: fieldId,
      name: newField.name,
      type: newField.type as TableField['type'],
      required: newField.required || false,
      order: fields.length,
      ...(newField.type === 'select' && {
        options: newField.options || []
      })
    };

    onFieldsChange([...fields, customField]);
    setNewField({ type: 'text', required: false });
    setShowAddField(false);
  }, [newField, fields, onFieldsChange]);

  // 获取字段类型图标
  const getFieldIcon = useCallback((type: string) => {
    const fieldType = FIELD_TYPES.find(ft => ft.type === type);
    return fieldType ? fieldType.icon : Type;
  }, []);

  return (
    <div className="space-y-6">
      {/* 预设字段库 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          字段库
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {PRESET_FIELDS.map(item => {
            const Icon = getFieldIcon(item.type);
            const isUsed = fields.some(f => f.id === item.id);
            
            return (
              <motion.div
                key={item.id}
                draggable={!disabled && !isUsed}
                onDragStart={(e) => handleDragStart(item, e as unknown as React.DragEvent)}
                onDragEnd={handleDragEnd}
                whileHover={!disabled && !isUsed ? { scale: 1.05 } : {}}
                className={`
                  p-3 rounded-lg border-2 border-dashed cursor-move transition-all
                  ${isUsed 
                    ? 'border-gray-300 bg-gray-100 dark:bg-gray-700 dark:border-gray-600 opacity-50 cursor-not-allowed'
                    : disabled
                    ? 'border-gray-300 bg-gray-100 dark:bg-gray-700 dark:border-gray-600 cursor-not-allowed'
                    : 'border-blue-300 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-600 hover:border-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30'
                  }
                `}
                title={isUsed ? '字段已使用' : '拖拽到下方添加字段'}
              >
                <div className="flex items-center space-x-2">
                  <Icon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {item.name}
                  </span>
                </div>
                {isUsed && (
                  <div className="mt-1">
                    <span className="text-xs text-gray-500">已使用</span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* 添加自定义字段 */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <AnimatePresence>
            {showAddField ? (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    type="text"
                    placeholder="字段名称"
                    value={newField.name || ''}
                    onChange={(e) => setNewField(prev => ({ ...prev, name: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <select
                    value={newField.type || 'text'}
                    onChange={(e) => setNewField(prev => ({ ...prev, type: e.target.value as TableField['type'] }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {FIELD_TYPES.map(type => (
                      <option key={type.type} value={type.type}>{type.label}</option>
                    ))}
                  </select>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={newField.required || false}
                      onChange={(e) => setNewField(prev => ({ ...prev, required: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">必填</span>
                  </label>
                </div>
                
                {newField.type === 'select' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      选项（每行一个）
                    </label>
                    <textarea
                      placeholder="选项1\n选项2\n选项3"
                      value={newField.options?.join('\n') || ''}
                      onChange={(e) => setNewField(prev => ({ 
                        ...prev, 
                        options: e.target.value.split('\n').filter(opt => opt.trim()) 
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                    />
                  </div>
                )}
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={addCustomField}
                    disabled={!newField.name}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>添加</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowAddField(false);
                      setNewField({ type: 'text', required: false });
                    }}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
                  >
                    <X className="w-4 h-4" />
                    <span>取消</span>
                  </button>
                </div>
              </motion.div>
            ) : (
              <button
                onClick={() => setShowAddField(true)}
                disabled={disabled}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>添加自定义字段</span>
              </button>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 当前字段配置 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          当前字段配置
        </h3>
        
        <div 
          ref={dragRef}
          className="space-y-2 min-h-[100px] border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4"
        >
          {fields.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400 py-8">
              <p>拖拽字段到此处开始配置表格</p>
            </div>
          ) : (
            fields.map((field, index) => {
              const Icon = getFieldIcon(field.type);
              
              return (
                <motion.div
                  key={field.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  onDragOver={(e) => handleDragOver(e as unknown as React.DragEvent, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e as unknown as React.DragEvent, index)}
                  className={`
                    flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border
                    ${dragOverIndex === index ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-600'}
                  `}
                >
                  <div className="flex items-center space-x-3">
                    <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
                    <Icon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    <div>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {field.name}
                      </span>
                      {field.required && (
                        <span className="ml-1 text-red-500">*</span>
                      )}
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {FIELD_TYPES.find(ft => ft.type === field.type)?.label || field.type}
                      </div>
                    </div>
                  </div>
                  
                  {!disabled && (
                    <button
                      onClick={() => removeField(field.id)}
                      className="p-1 text-red-600 hover:text-red-800 transition-colors"
                      title="移除字段"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </motion.div>
              );
            })
          )}
          
          {/* 拖拽目标区域 */}
          {draggedItem && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onDragOver={(e) => handleDragOver(e, fields.length)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, fields.length)}
              className={`
                h-12 border-2 border-dashed rounded-lg flex items-center justify-center
                ${dragOverIndex === fields.length ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600'}
              `}
            >
              <span className="text-sm text-gray-500 dark:text-gray-400">
                拖拽到此处添加字段
              </span>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}