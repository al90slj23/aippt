import React from 'react';
import { ChevronLeft, ChevronRight, RefreshCw, Upload, ImagePlus } from 'lucide-react';
import { Button } from '@/components/shared';
import type { ImageVersion } from '@/types';

interface ControlsProps {
  currentProject: any;
  selectedIndex: number;
  setSelectedIndex: (index: number) => void;
  selectedPage: any;
  imageVersions: ImageVersion[];
  showVersionMenu: boolean;
  setShowVersionMenu: (show: boolean) => void;
  handleSwitchVersion: (versionId: string) => void;
  handleEditPage: () => void;
  handleRegeneratePage: () => void;
  pageGeneratingTasks: Record<string, boolean>;
  isRefreshing: boolean;
  handleRefresh: () => void;
  setIsTemplateModalOpen: (open: boolean) => void;
  setIsMaterialModalOpen: (open: boolean) => void;
}

export const SlidePreviewControls: React.FC<ControlsProps> = ({
  currentProject,
  selectedIndex,
  setSelectedIndex,
  selectedPage,
  imageVersions,
  showVersionMenu,
  setShowVersionMenu,
  handleSwitchVersion,
  handleEditPage,
  handleRegeneratePage,
  pageGeneratingTasks,
  isRefreshing,
  handleRefresh,
  setIsTemplateModalOpen,
  setIsMaterialModalOpen,
}) => {
  return (
    <div className="bg-white border-t border-gray-200 px-3 md:px-6 py-3 md:py-4 flex-shrink-0">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 max-w-5xl mx-auto">
        {/* 导航 */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-center">
          <Button
            variant="ghost"
            size="sm"
            icon={<ChevronLeft size={16} className="md:w-[18px] md:h-[18px]" />}
            onClick={() => setSelectedIndex(Math.max(0, selectedIndex - 1))}
            disabled={selectedIndex === 0}
            className="text-xs md:text-sm"
          >
            <span className="hidden sm:inline">上一页</span>
            <span className="sm:hidden">上一页</span>
          </Button>
          <span className="px-2 md:px-4 text-xs md:text-sm text-gray-600 whitespace-nowrap">
            {selectedIndex + 1} / {currentProject.pages.length}
          </span>
          <Button
            variant="ghost"
            size="sm"
            icon={<ChevronRight size={16} className="md:w-[18px] md:h-[18px]" />}
            onClick={() =>
              setSelectedIndex(
                Math.min(currentProject.pages.length - 1, selectedIndex + 1)
              )
            }
            disabled={selectedIndex === currentProject.pages.length - 1}
            className="text-xs md:text-sm"
          >
            <span className="hidden sm:inline">下一页</span>
            <span className="sm:hidden">下一页</span>
          </Button>
        </div>

        {/* 操作 */}
        <div className="flex items-center gap-1.5 md:gap-2 w-full sm:w-auto justify-center">
          {/* 手机端：模板更换按钮 */}
          <Button
            variant="ghost"
            size="sm"
            icon={<Upload size={16} />}
            onClick={() => setIsTemplateModalOpen(true)}
            className="lg:hidden text-xs"
            title="更换模板"
          />
          {/* 手机端：素材生成按钮 */}
          <Button
            variant="ghost"
            size="sm"
            icon={<ImagePlus size={16} />}
            onClick={() => setIsMaterialModalOpen(true)}
            className="lg:hidden text-xs"
            title="素材生成"
          />
          {/* 手机端：刷新按钮 */}
          <Button
            variant="ghost"
            size="sm"
            icon={<RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />}
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="md:hidden text-xs"
            title="刷新"
          />
          {imageVersions.length > 1 && (
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowVersionMenu(!showVersionMenu)}
                className="text-xs md:text-sm"
              >
                <span className="hidden md:inline">历史版本 ({imageVersions.length})</span>
                <span className="md:hidden">版本</span>
              </Button>
              {showVersionMenu && (
                <div className="absolute right-0 bottom-full mb-2 w-56 md:w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20 max-h-96 overflow-y-auto">
                  {imageVersions.map((version) => (
                    <button
                      key={version.version_id}
                      onClick={() => handleSwitchVersion(version.version_id)}
                      className={`w-full px-3 md:px-4 py-2 text-left hover:bg-gray-50 transition-colors flex items-center justify-between text-xs md:text-sm ${
                        version.is_current ? 'bg-banana-50' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>
                          版本 {version.version_number}
                        </span>
                        {version.is_current && (
                          <span className="text-xs text-banana-600 font-medium">
                            (当前)
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-400 hidden md:inline">
                        {version.created_at
                          ? new Date(version.created_at).toLocaleString('zh-CN', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : ''}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={handleEditPage}
            disabled={!selectedPage?.generated_image_path}
            className="text-xs md:text-sm flex-1 sm:flex-initial"
          >
            编辑
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRegeneratePage}
            disabled={selectedPage?.id && pageGeneratingTasks[selectedPage.id] ? true : false}
            className="text-xs md:text-sm flex-1 sm:flex-initial"
          >
            {selectedPage?.id && pageGeneratingTasks[selectedPage.id]
              ? '生成中...'
              : '重新生成'}
          </Button>
        </div>
      </div>
    </div>
  );
};
