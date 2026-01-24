import React from 'react';
import { Sparkles, CheckSquare, Square, Check } from 'lucide-react';
import { Button } from '@/components/shared';
import { SlideCard } from '@/components/preview/SlideCard';
import { getImageUrl } from '@/api/client';
import type { Project, Page } from '@/types';

interface SidebarProps {
  currentProject: Project;
  selectedIndex: number;
  setSelectedIndex: (index: number) => void;
  isMultiSelectMode: boolean;
  selectedPageIds: Set<string>;
  toggleMultiSelectMode: () => void;
  togglePageSelection: (pageId: string) => void;
  selectAllPages: () => void;
  deselectAllPages: () => void;
  handleGenerateAll: () => void;
  handleEditPage: () => void;
  deletePageById: (pageId: string) => void;
  pageGeneratingTasks: Record<string, boolean>;
  pagesWithImages: Page[];
}

export const SlidePreviewSidebar: React.FC<SidebarProps> = ({
  currentProject,
  selectedIndex,
  setSelectedIndex,
  isMultiSelectMode,
  selectedPageIds,
  toggleMultiSelectMode,
  togglePageSelection,
  selectAllPages,
  deselectAllPages,
  handleGenerateAll,
  handleEditPage,
  deletePageById,
  pageGeneratingTasks,
  pagesWithImages,
}) => {
  return (
    <aside className="w-full md:w-80 bg-white border-b md:border-b-0 md:border-r border-gray-200 flex flex-col flex-shrink-0">
      <div className="p-3 md:p-4 border-b border-gray-200 flex-shrink-0 space-y-2 md:space-y-3">
        <Button
          variant="primary"
          icon={<Sparkles size={16} className="md:w-[18px] md:h-[18px]" />}
          onClick={handleGenerateAll}
          className="w-full text-sm md:text-base"
          disabled={isMultiSelectMode && selectedPageIds.size === 0}
        >
          {isMultiSelectMode && selectedPageIds.size > 0
            ? `生成选中页面 (${selectedPageIds.size})`
            : `批量生成图片 (${currentProject.pages.length})`}
        </Button>
      </div>
      
      {/* 缩略图列表：桌面端垂直，移动端横向滚动 */}
      <div className="flex-1 overflow-y-auto md:overflow-y-auto overflow-x-auto md:overflow-x-visible p-3 md:p-4 min-h-0">
        {/* 多选模式切换 - 紧凑布局 */}
        <div className="flex items-center gap-2 text-xs mb-3">
          <button
            onClick={toggleMultiSelectMode}
            className={`px-2 py-1 rounded transition-colors flex items-center gap-1 ${
              isMultiSelectMode 
                ? 'bg-banana-100 text-banana-700 hover:bg-banana-200' 
                : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            {isMultiSelectMode ? <CheckSquare size={14} /> : <Square size={14} />}
            <span>{isMultiSelectMode ? '取消多选' : '多选'}</span>
          </button>
          {isMultiSelectMode && (
            <>
              <button
                onClick={selectedPageIds.size === pagesWithImages.length ? deselectAllPages : selectAllPages}
                className="text-gray-500 hover:text-banana-600 transition-colors"
              >
                {selectedPageIds.size === pagesWithImages.length ? '取消全选' : '全选'}
              </button>
              {selectedPageIds.size > 0 && (
                <span className="text-banana-600 font-medium">
                  ({selectedPageIds.size}页)
                </span>
              )}
            </>
          )}
        </div>
        <div className="flex md:flex-col gap-2 md:gap-4 min-w-max md:min-w-0">
          {currentProject.pages.map((page, index) => (
            <div key={page.id} className="md:w-full flex-shrink-0 relative">
              {/* 移动端：简化缩略图 */}
              <div className="md:hidden relative">
                <button
                  onClick={() => {
                    if (isMultiSelectMode && page.id && page.generated_image_path) {
                      togglePageSelection(page.id);
                    } else {
                      setSelectedIndex(index);
                    }
                  }}
                  className={`w-20 h-14 rounded border-2 transition-all ${
                    selectedIndex === index
                      ? 'border-banana-500 shadow-md'
                      : 'border-gray-200'
                  } ${isMultiSelectMode && page.id && selectedPageIds.has(page.id) ? 'ring-2 ring-banana-400' : ''}`}
                >
                  {page.generated_image_path ? (
                    <img
                      src={getImageUrl(page.generated_image_path, page.updated_at)}
                      alt={`Slide ${index + 1}`}
                      className="w-full h-full object-cover rounded"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 rounded flex items-center justify-center text-xs text-gray-400">
                      {index + 1}
                    </div>
                  )}
                </button>
                {/* 多选复选框（移动端） */}
                {isMultiSelectMode && page.id && page.generated_image_path && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePageSelection(page.id!);
                    }}
                    className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                      selectedPageIds.has(page.id)
                        ? 'bg-banana-500 text-white'
                        : 'bg-white border-2 border-gray-300'
                    }`}
                  >
                    {selectedPageIds.has(page.id) && <Check size={12} />}
                  </button>
                )}
              </div>
              {/* 桌面端：完整卡片 */}
              <div className="hidden md:block relative">
                {/* 多选复选框（桌面端） */}
                {isMultiSelectMode && page.id && page.generated_image_path && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePageSelection(page.id!);
                    }}
                    className={`absolute top-2 left-2 z-10 w-6 h-6 rounded flex items-center justify-center transition-all ${
                      selectedPageIds.has(page.id)
                        ? 'bg-banana-500 text-white shadow-md'
                        : 'bg-white/90 border-2 border-gray-300 hover:border-banana-400'
                    }`}
                  >
                    {selectedPageIds.has(page.id) && <Check size={14} />}
                  </button>
                )}
                <SlideCard
                  page={page}
                  index={index}
                  isSelected={selectedIndex === index}
                  onClick={() => {
                    if (isMultiSelectMode && page.id && page.generated_image_path) {
                      togglePageSelection(page.id);
                    } else {
                      setSelectedIndex(index);
                    }
                  }}
                  onEdit={() => {
                    setSelectedIndex(index);
                    handleEditPage();
                  }}
                  onDelete={() => page.id && deletePageById(page.id)}
                  isGenerating={page.id ? !!pageGeneratingTasks[page.id] : false}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};
