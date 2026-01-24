import React from 'react';
import { Check } from 'lucide-react';
import { SlideCard } from '@/components/preview/SlideCard';
import type { Project } from '@/types';

interface RightSidebarProps {
  currentProject: Project;
  selectedIndex: number;
  setSelectedIndex: (index: number) => void;
  isMultiSelectMode: boolean;
  selectedPageIds: Set<string>;
  togglePageSelection: (pageId: string) => void;
  handleEditPage: () => void;
  deletePageById: (pageId: string) => void;
  pageGeneratingTasks: Record<string, string>;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({
  currentProject,
  selectedIndex,
  setSelectedIndex,
  isMultiSelectMode,
  selectedPageIds,
  togglePageSelection,
  handleEditPage,
  deletePageById,
  pageGeneratingTasks,
}) => {
  return (
    <div className="hidden xl:flex xl:flex-col w-80 bg-white border-l border-gray-100 flex-shrink-0">
      <div className="flex-1 p-4 overflow-y-auto scrollbar-hide min-h-0">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">页面列表</h3>
        
        <div className="space-y-3">
          {currentProject.pages.map((page, index) => (
            <div key={page.id} className="relative">
              {/* 多选复选框 */}
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
          ))}
        </div>
      </div>
    </div>
  );
};
