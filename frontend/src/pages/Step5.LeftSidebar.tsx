import React from 'react';
import { CheckSquare, Square, Image as ImageIcon } from 'lucide-react';
import { ExportTasksPanel } from '@/components/shared';
import type { Project, Page } from '@/types';
import type { ExportTask } from '@/store/useExportTasksStore';

interface LeftSidebarProps {
  currentProject: Project;
  pagesWithImages: Page[];
  isMultiSelectMode: boolean;
  selectedPageIds: Set<string>;
  toggleMultiSelectMode: () => void;
  selectAllPages: () => void;
  deselectAllPages: () => void;
  exportTasks: ExportTask[];
  projectId: string | undefined;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  currentProject,
  pagesWithImages,
  isMultiSelectMode,
  selectedPageIds,
  toggleMultiSelectMode,
  selectAllPages,
  deselectAllPages,
  exportTasks,
  projectId,
}) => {
  return (
    <div className="hidden md:flex md:flex-col w-64 bg-white border-r border-gray-100 flex-shrink-0">
      <div className="flex-1 p-6 overflow-y-auto scrollbar-hide min-h-0">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">统计信息</h3>
        
        {/* 生成进度 */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl shadow-sm p-5 mb-4 border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">生成进度</span>
            <ImageIcon size={18} className="text-banana-600" />
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {pagesWithImages.length}/{currentProject.pages.length}
          </div>
          <div className="text-xs text-gray-500 mt-1">页已生成</div>
          
          {/* 进度条 */}
          <div className="mt-3 w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-banana-400 to-orange-400 h-full rounded-full transition-all duration-500"
              style={{ 
                width: `${currentProject.pages.length > 0 
                  ? (pagesWithImages.length / currentProject.pages.length) * 100 
                  : 0}%` 
              }}
            />
          </div>
        </div>

        {/* 多选控制 */}
        {pagesWithImages.length > 0 && (
          <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl shadow-sm p-5 border border-gray-200">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">批量操作</h4>
            <div className="space-y-2">
              <button
                onClick={toggleMultiSelectMode}
                className={`w-full px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                  isMultiSelectMode 
                    ? 'bg-banana-100 text-banana-700 hover:bg-banana-200' 
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {isMultiSelectMode ? <CheckSquare size={16} /> : <Square size={16} />}
                <span>{isMultiSelectMode ? '取消多选' : '开启多选'}</span>
              </button>
              
              {isMultiSelectMode && (
                <>
                  <button
                    onClick={selectedPageIds.size === pagesWithImages.length ? deselectAllPages : selectAllPages}
                    className="w-full px-3 py-2 rounded-lg text-sm bg-white text-gray-700 hover:bg-gray-100 border border-gray-200 transition-colors"
                  >
                    {selectedPageIds.size === pagesWithImages.length ? '取消全选' : '全选'}
                  </button>
                  {selectedPageIds.size > 0 && (
                    <div className="text-center text-sm text-banana-600 font-medium">
                      已选择 {selectedPageIds.size} 页
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* 导出任务面板 */}
        {exportTasks.filter(t => t.projectId === projectId).length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">导出任务</h4>
            <ExportTasksPanel 
              projectId={projectId} 
              pages={currentProject?.pages || []}
              className="shadow-sm" 
            />
          </div>
        )}
      </div>
    </div>
  );
};
