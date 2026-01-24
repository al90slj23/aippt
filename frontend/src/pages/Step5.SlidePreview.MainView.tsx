import React from 'react';
import { Button } from '@/components/shared';
import { getImageUrl } from '@/api/client';
import type { Page } from '@/types';

interface MainViewProps {
  currentProject: any;
  selectedIndex: number;
  selectedPage: Page | undefined;
  imageUrl: string;
  handleRegeneratePage: () => void;
  pageGeneratingTasks: Record<string, boolean>;
}

export const SlidePreviewMainView: React.FC<MainViewProps> = ({
  currentProject,
  selectedIndex,
  selectedPage,
  imageUrl,
  handleRegeneratePage,
  pageGeneratingTasks,
}) => {
  if (currentProject.pages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center overflow-y-auto">
        <div className="text-center">
          <div className="text-4xl md:text-6xl mb-4">📊</div>
          <h3 className="text-lg md:text-xl font-semibold text-gray-700 mb-2">
            还没有页面
          </h3>
          <p className="text-sm md:text-base text-gray-500 mb-6">
            请先返回编辑页面添加内容
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* 预览区 */}
      <div className="flex-1 overflow-y-auto min-h-0 flex items-center justify-center p-4 md:p-8">
        <div className="max-w-5xl w-full">
          <div className="relative aspect-video bg-white rounded-lg shadow-xl overflow-hidden touch-manipulation">
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
                    <Button
                      variant="primary"
                      onClick={handleRegeneratePage}
                    >
                      生成此页
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
