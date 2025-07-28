'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Download, 
  FileText, 
  Table, 
  Code, 
  X,
  Check
} from 'lucide-react';
import { ExportFormat, ExportOptions, TableField } from '@/types/report';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (options: ExportOptions) => void;
  fields: TableField[];
  totalRows: number;
}

const EXPORT_FORMATS = [
  {
    format: ExportFormat.CSV,
    label: 'CSV 文件',
    description: '逗号分隔值文件，适合Excel打开',
    icon: Table,
    mimeType: 'text/csv'
  },
  {
    format: ExportFormat.EXCEL,
    label: 'Excel 文件',
    description: 'Microsoft Excel工作簿',
    icon: FileText,
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  },
  {
    format: ExportFormat.JSON,
    label: 'JSON 文件',
    description: 'JavaScript对象表示法，适合程序处理',
    icon: Code,
    mimeType: 'application/json'
  }
];

export default function ExportModal({ 
  isOpen, 
  onClose, 
  onExport, 
  fields, 
  totalRows 
}: ExportModalProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>(ExportFormat.CSV);
  const [includeHeaders, setIncludeHeaders] = useState(true);
  const [selectedFields, setSelectedFields] = useState<string[]>(fields.map(f => f.id));
  const [filename, setFilename] = useState('');

  const handleExport = () => {
    const options: ExportOptions = {
      format: selectedFormat,
      includeHeaders,
      selectedFields: selectedFields.length > 0 ? selectedFields : undefined,
      filename: filename || undefined
    };
    
    onExport(options);
    onClose();
  };

  const toggleField = (fieldId: string) => {
    setSelectedFields(prev => 
      prev.includes(fieldId) 
        ? prev.filter(id => id !== fieldId)
        : [...prev, fieldId]
    );
  };

  const toggleAllFields = () => {
    setSelectedFields(prev => 
      prev.length === fields.length ? [] : fields.map(f => f.id)
    );
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        >
          {/* 头部 */}
          <div className="flex items-center justify-between p-6 border-b">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">导出数据</h2>
              <p className="text-sm text-gray-500 mt-1">
                共 {totalRows} 行数据，{fields.length} 个字段
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* 导出格式选择 */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">选择导出格式</h3>
              <div className="grid grid-cols-1 gap-3">
                {EXPORT_FORMATS.map((format) => {
                  const Icon = format.icon;
                  return (
                    <label
                      key={format.format}
                      className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedFormat === format.format
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="format"
                        value={format.format}
                        checked={selectedFormat === format.format}
                        onChange={(e) => setSelectedFormat(e.target.value as ExportFormat)}
                        className="sr-only"
                      />
                      <Icon className="w-5 h-5 text-gray-600 mr-3" />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{format.label}</div>
                        <div className="text-sm text-gray-500">{format.description}</div>
                      </div>
                      {selectedFormat === format.format && (
                        <Check className="w-5 h-5 text-blue-500" />
                      )}
                    </label>
                  );
                })}
              </div>
            </div>

            {/* 导出选项 */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">导出选项</h3>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={includeHeaders}
                    onChange={(e) => setIncludeHeaders(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">包含表头</span>
                </label>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    文件名（可选）
                  </label>
                  <input
                    type="text"
                    value={filename}
                    onChange={(e) => setFilename(e.target.value)}
                    placeholder="留空将自动生成文件名"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* 字段选择 */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-medium text-gray-900">选择字段</h3>
                <button
                  onClick={toggleAllFields}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  {selectedFields.length === fields.length ? '取消全选' : '全选'}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
                {fields.map((field) => (
                  <label key={field.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedFields.includes(field.id)}
                      onChange={() => toggleField(field.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 truncate">
                      {field.name}
                    </span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                已选择 {selectedFields.length} 个字段
              </p>
            </div>
          </div>

          {/* 底部按钮 */}
          <div className="flex items-center justify-end space-x-3 p-6 border-t bg-gray-50">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleExport}
              disabled={selectedFields.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              <Download className="w-4 h-4 mr-2" />
              导出数据
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}