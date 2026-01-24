import React from 'react';
import { Button } from '@/components/shared';

interface ExportMenuProps {
  showExportMenu: boolean;
  setShowExportMenu: (show: boolean) => void;
  isMultiSelectMode: boolean;
  selectedPageIds: Set<string>;
  handleExport: (type: 'pptx' | 'pdf' | 'editable-pptx') => void;
}

export const ExportMenu: React.FC<ExportMenuProps> = ({
  showExportMenu,
  setShowExportMenu,
  isMultiSelectMode,
  selectedPageIds,
  handleExport,
}) => {
  if (!showExportMenu) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center" 
      onClick={() => setShowExportMenu(false)}
    >
      <div 
        className="bg-white rounded-lg shadow-xl p-6 w-96" 
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold mb-4">选择导出格式</h3>
        {isMultiSelectMode && selectedPageIds.size > 0 && (
          <div className="mb-4 text-sm text-gray-600">
            将导出选中的 {selectedPageIds.size} 页
          </div>
        )}
        <div className="space-y-2">
          <button
            onClick={() => handleExport('pptx')}
            className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors rounded-lg border border-gray-200"
          >
            <div className="font-medium">导出为 PPTX</div>
            <div className="text-sm text-gray-500">标准 PowerPoint 格式</div>
          </button>
          <button
            onClick={() => handleExport('editable-pptx')}
            className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors rounded-lg border border-gray-200"
          >
            <div className="font-medium">导出可编辑 PPTX（Beta）</div>
            <div className="text-sm text-gray-500">可编辑文本和元素</div>
          </button>
          <button
            onClick={() => handleExport('pdf')}
            className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors rounded-lg border border-gray-200"
          >
            <div className="font-medium">导出为 PDF</div>
            <div className="text-sm text-gray-500">便于分享和打印</div>
          </button>
        </div>
        <div className="mt-4 flex justify-end">
          <Button variant="ghost" onClick={() => setShowExportMenu(false)}>
            取消
          </Button>
        </div>
      </div>
    </div>
  );
};
