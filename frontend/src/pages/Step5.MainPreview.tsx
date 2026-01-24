import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/shared';
import type { Project, Page, ImageVersion } from '@/types';

interface MainPreviewProps {
  currentProject: Project;
  selectedIndex: number;
  setSelectedIndex: (index: number) => void;
  selectedPage: Page | undefined;
  imageUrl: string;
  pageGeneratingTasks: Record<string, string>;
  handleRegeneratePage: () => void;
  imageVersions: ImageVersion[];
  showVersionMenu: boolean;
  setShowVersionMenu: (show: boolean) => void;
  handleSwitchVersion: (versionId: string) => void;
  handleEditPage: () => void;
}

export const MainPreview: React.FC<MainPreviewProps> = ({
  currentProject,
  selectedIndex,
  setSelectedIndex,
  selectedPage,
  imageUrl,
  pageGeneratingTasks,
  handleRegeneratePage,
  imageVersions,
  showVersionMenu,
  setShowVersionMenu,
  handleSwitchVersion,
  handleEditPage,
}) => {
  return (
    <div className="flex-1 flex flex-col p-3 md:p-6 overflow-hidden min-h-0">
      {/* 大图预览 */}
      <div className="flex-1 flex items-center justify-center mb-4">
        <div className="max-w-5xl w-full">
          <div className="relative aspect-video bg-white rounded-lg shadow-xl overflow-hidden">
            {selectedPage?.generated_image_path ? (
              <img
                src={imageUrl}
                alt={`Slide ${selectedIndex + 1}`}
                className="w-full h-full object-cover select-none"
                draggable={false}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                <div className="text-center">
                  <div className="text-6xl mb-4">🍌</div>
                  <p className="text-gray-500 mb-4">
                    {selectedPage?.id && pageGeneratingTasks[selectedPage.id]
                      ? '正在生成中...'
                      : selectedPage?.status === 'GENERATING'
                      ? '正在生成中...'
                      : '尚未生成图片'}
                  </p>
                  {(!selectedPage?.id || !pageGeneratingTasks[selectedPage.id]) && 
                   selectedPage?.status !== 'GENERATING' && (
                    <Button variant="primary" onClick={handleRegeneratePage}>
                      生成此页
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 控制栏 */}
      <div className="flex items-center justify-between bg-white rounded-lg shadow-sm p-4 border border-gray-200">
        {/* 导航按钮 */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            icon={<ChevronLeft size={16} />}
            onClick={() => setSelectedIndex(Math.max(0, selectedIndex - 1))}
            disabled={selectedIndex === 0}
          />
          <span className="px-4 text-sm text-gray-600">
            {selectedIndex + 1} / {currentProject.pages.length}
          </span>
          <Button
            variant="ghost"
            size="sm"
            icon={<ChevronRight size={16} />}
            onClick={() => setSelectedIndex(Math.min(currentProject.pages.length - 1, selectedIndex + 1))}
            disabled={selectedIndex === currentProject.pages.length - 1}
          />
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center gap-2">
          {imageVersions.length > 1 && (
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowVersionMenu(!showVersionMenu)}
              >
                历史版本 ({imageVersions.length})
              </Button>
              {showVersionMenu && (
                <div className="absolute right-0 bottom-full mb-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20 max-h-96 overflow-y-auto">
                  {imageVersions.map((version) => (
                    <button
                      key={version.version_id}
                      onClick={() => handleSwitchVersion(version.version_id)}
                      className={`w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors flex items-center justify-between text-sm ${
                        version.is_current ? 'bg-banana-50' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>版本 {version.version_number}</span>
                        {version.is_current && (
                          <span className="text-xs text-banana-600 font-medium">(当前)</span>
                        )}
                      </div>
                      <span className="text-xs text-gray-400">
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
          >
            编辑
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRegeneratePage}
            disabled={!!(selectedPage?.id && pageGeneratingTasks[selectedPage.id])}
          >
            {selectedPage?.id && pageGeneratingTasks[selectedPage.id] ? '生成中...' : '重新生成'}
          </Button>
        </div>
      </div>
    </div>
  );
};
