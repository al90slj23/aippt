import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Plus, FileText, Sparkles, Download } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { StepLayout, ActionButton, useConfirm, useToast, FilePreviewModal, ProjectResourcesList } from '@/components/shared';
import { OutlineCard } from '@/components/outline/OutlineCard';
import { useProjectStore } from '@/store/useProjectStore';
import { refineOutline } from '@/api/endpoints';
import { exportOutlineToMarkdown } from '@/utils/projectUtils';
import type { Page } from '@/types';

// 可排序的卡片包装器
const SortableCard: React.FC<{
  page: Page;
  index: number;
  onUpdate: (data: Partial<Page>) => void;
  onDelete: () => void;
  onClick: () => void;
  isSelected: boolean;
  isAiRefining?: boolean;
}> = (props) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: props.page.id || `page-${props.index}`,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    width: '100%',
    height: '100%',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <OutlineCard {...props} dragHandleProps={listeners} />
    </div>
  );
};

export const Step3OutlineEditor: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { projectId } = useParams<{ projectId: string }>();
  const fromHistory = (location.state as any)?.from === 'history';
  const {
    currentProject,
    syncProject,
    updatePageLocal,
    reorderPages,
    deletePageById,
    addNewPage,
    generateOutline,
    isGlobalLoading, // 添加 isGlobalLoading
  } = useProjectStore();

  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [isAiRefining, setIsAiRefining] = useState(false);
  const [previewFileId, setPreviewFileId] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false); // 新增：导航 loading 状态
  const [maxCardWidth, setMaxCardWidth] = useState<number>(0);
  const [maxCardHeight, setMaxCardHeight] = useState<number>(0);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const { confirm, ConfirmDialog } = useConfirm();
  const { show, ToastContainer } = useToast();

  // 加载项目数据
  useEffect(() => {
    if (projectId && (!currentProject || currentProject.id !== projectId)) {
      syncProject(projectId);
    }
  }, [projectId, currentProject, syncProject]);

  // 计算最大卡片宽度和高度
  useEffect(() => {
    if (!currentProject?.pages.length) return;
    
    // 第一次渲染时，先重置尺寸让卡片自由扩展
    setMaxCardWidth(0);
    setMaxCardHeight(0);
    
    // 等待 DOM 渲染完成后计算
    const timer = setTimeout(() => {
      let maxWidth = 0;
      let maxHeight = 0;
      cardRefs.current.forEach(ref => {
        if (ref) {
          // 获取卡片的自然尺寸（包括溢出的内容）
          const card = ref.querySelector('[class*="p-4"]');
          if (card) {
            // 使用 scrollWidth 和 scrollHeight 来获取完整内容的尺寸
            const width = card.scrollWidth;
            const height = card.scrollHeight;
            if (width > maxWidth) {
              maxWidth = width;
            }
            if (height > maxHeight) {
              maxHeight = height;
            }
          }
        }
      });
      if (maxWidth > 0) {
        setMaxCardWidth(maxWidth);
      }
      if (maxHeight > 0) {
        setMaxCardHeight(maxHeight);
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [currentProject?.pages, isAiRefining, currentProject?.pages.map(p => p.outline_content).join(',')]);

  // 拖拽传感器配置
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id && currentProject) {
      const oldIndex = currentProject.pages.findIndex((p) => p.id === active.id);
      const newIndex = currentProject.pages.findIndex((p) => p.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newPages = arrayMove(currentProject.pages, oldIndex, newIndex);
        // 更新页面顺序，传递页面 ID 数组
        reorderPages(newPages.map(p => p.id).filter((id): id is string => id !== undefined));
      }
    }
  };

  const handleGenerateOutline = async () => {
    const hasOutlines = currentProject?.pages.some((p) => p.outline_content);

    const executeGenerate = async () => {
      await generateOutline();
    };

    if (hasOutlines) {
      confirm(
        '部分页面已有大纲，重新生成将覆盖，确定继续吗？',
        executeGenerate,
        { title: '确认重新生成', variant: 'warning' }
      );
    } else {
      await executeGenerate();
    }
  };

  const handleAiRefineOutline = async (prompt: string) => {
    if (!currentProject || !projectId) return;

    try {
      setIsAiRefining(true);
      const response = await refineOutline(projectId, prompt);

      if (response.data?.pages) {
        await syncProject(projectId);
        show({ message: 'AI 修改成功', type: 'success' });
      }
    } catch (error: any) {
      show({
        message: `AI 修改失败: ${error.message || '未知错误'}`,
        type: 'error',
      });
    } finally {
      setIsAiRefining(false);
    }
  };

  const handleExportOutline = () => {
    if (!currentProject) return;
    exportOutlineToMarkdown(currentProject);
    show({ message: '大纲已导出', type: 'success' });
  };

  const handleDeletePage = async (pageId: string) => {
    confirm('确定要删除这一页吗？', async () => {
      await deletePageById(pageId);
      if (selectedPageId === pageId) {
        setSelectedPageId(null);
      }
    });
  };

  if (!currentProject) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  // 定义操作按钮（根据是否有页面显示不同的按钮）
  const hasPages = currentProject.pages.length > 0;
  
  const actionButtons: ActionButton[] = hasPages ? [
    {
      label: currentProject.creation_type === 'outline' ? '重新解析大纲' : '重新生成大纲',
      icon: <Sparkles size={18} className="md:w-[20px] md:h-[20px]" />,
      onClick: handleGenerateOutline,
      variant: 'secondary',
      disabled: isGlobalLoading, // 生成中禁用
      className: 'relative overflow-hidden group',
      style: {
        background: 'linear-gradient(90deg, #FF6B6B, #FFD93D, #6BCF7F, #4D96FF, #9D4EDD, #FF6B6B)',
        backgroundSize: '200% 100%',
        animation: 'rainbow-flow 3s linear infinite',
        color: 'white',
        border: 'none',
      },
    },
    {
      label: '深度优化大纲',
      icon: <Sparkles size={18} className="md:w-[20px] md:h-[20px] animate-pulse" />,
      onClick: () => {}, // StepLayout 会自动处理展开 AI 输入框
      variant: 'primary',
      isMainAction: true, // 保持主要按钮样式
      disabled: isGlobalLoading, // 生成中禁用
    },
    {
      label: '手动添加大纲',
      icon: <Plus size={18} className="md:w-[20px] md:h-[20px]" />,
      onClick: addNewPage,
      variant: 'secondary',
      disabled: isGlobalLoading, // 生成中禁用
    },
    {
      label: '导出大纲文案',
      icon: <Download size={18} className="md:w-[20px] md:h-[20px]" />,
      onClick: handleExportOutline,
      variant: 'secondary',
      disabled: isGlobalLoading, // 生成中禁用
    },
  ] : [
    {
      label: currentProject.creation_type === 'outline' ? '解析大纲' : '自动生成大纲',
      icon: <Sparkles size={18} className="md:w-[20px] md:h-[20px]" />,
      onClick: handleGenerateOutline,
      variant: 'secondary',
      disabled: isGlobalLoading, // 生成中禁用
      className: 'relative overflow-hidden group',
      style: {
        background: 'linear-gradient(90deg, #FF6B6B, #FFD93D, #6BCF7F, #4D96FF, #9D4EDD, #FF6B6B)',
        backgroundSize: '200% 100%',
        animation: 'rainbow-flow 3s linear infinite',
        color: 'white',
        border: 'none',
      },
    },
    {
      label: '手动添加大纲',
      icon: <Plus size={18} className="md:w-[20px] md:h-[20px]" />,
      onClick: addNewPage,
      variant: 'secondary',
      disabled: isGlobalLoading, // 生成中禁用
    },
  ];

  return (
    <>
      <StepLayout
        currentStep={3}
        projectId={projectId || null}
        pageTitle="编辑大纲"
        actionButtons={actionButtons}
        aiRefine={{
          placeholder: '例如：增加一页关于XXX的内容、删除第3页、合并前两页、调整第2页的标题...',
          onSubmit: handleAiRefineOutline,
          onStatusChange: setIsAiRefining,
        }}
        contextBar={
          <div className="flex items-start gap-1.5 md:gap-2 text-xs md:text-sm">
            {currentProject.creation_type === 'idea' && (
              <span className="font-medium text-gray-700 flex-shrink-0 flex items-center">
                <Sparkles size={12} className="mr-1" /> PPT构想:
                <span className="text-gray-900 font-normal ml-2 break-words whitespace-pre-wrap">
                  {currentProject.idea_prompt}
                </span>
              </span>
            )}
            {currentProject.creation_type === 'outline' && (
              <span className="font-medium text-gray-700 flex-shrink-0 flex items-center">
                <FileText size={12} className="mr-1" /> 大纲:
                <span className="text-gray-900 font-normal ml-2 break-words whitespace-pre-wrap">
                  {currentProject.outline_text || currentProject.idea_prompt}
                </span>
              </span>
            )}
            {currentProject.creation_type === 'descriptions' && (
              <span className="font-medium text-gray-700 flex-shrink-0 flex items-center">
                <FileText size={12} className="mr-1" /> 描述:
                <span className="text-gray-900 font-normal ml-2 break-words whitespace-pre-wrap">
                  {currentProject.description_text || currentProject.idea_prompt}
                </span>
              </span>
            )}
          </div>
        }
        navigation={{
          onPrevious: () => {
            if (fromHistory) {
              navigate('/history');
            } else {
              navigate('/');
            }
          },
          onNext: async () => {
            setIsNavigating(true);
            // 给一个短暂延迟，让 loading 状态显示出来
            await new Promise(resolve => setTimeout(resolve, 300));
            navigate(`/project/${projectId}/detail`);
          },
          loadingNext: isNavigating,
          disableNext: !hasPages, // 没有页面时禁用下一步
        }}
        isLoading={isNavigating || isGlobalLoading} // 导航或生成大纲时显示 loading
        loadingMessage={isNavigating ? "正在跳转到详情编辑..." : "正在生成大纲..."}
      >
        {/* 主内容区 - 两栏布局 */}
        <div className="flex-1 flex flex-row min-h-0 pb-20 md:pb-24">
          {/* 中间：主要内容区域 */}
          <div className="flex-1 p-3 md:p-6 overflow-y-auto scrollbar-hide min-h-0">
            <div className="w-full h-full">
              {/* 移动端统计信息 */}
              <div className="md:hidden mb-4">
                <div className="bg-gradient-to-br from-banana-50 to-orange-50 rounded-xl shadow-sm p-4 border border-banana-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-600 mb-1">大纲页面</div>
                      <div className="text-2xl font-bold text-gray-900">
                        {currentProject.pages.length} <span className="text-sm font-normal text-gray-600">个页面</span>
                      </div>
                    </div>
                    <FileText size={32} className="text-banana-600" />
                  </div>
                </div>
              </div>

              {/* 移动端项目资源 */}
              <div className="md:hidden mb-4">
                <ProjectResourcesList
                  projectId={projectId || null}
                  onFileClick={setPreviewFileId}
                  showFiles={true}
                  showImages={true}
                />
              </div>

              {/* 大纲卡片列表 */}
              {currentProject.pages.length === 0 ? (
                <div className="text-center py-20">
                  <div className="flex justify-center mb-4">
                    <FileText size={64} className="text-gray-300" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">还没有页面</h3>
                  <p className="text-gray-500 mb-6">
                    点击"手动添加大纲"手动创建，或"自动生成大纲"让 AI 帮你完成
                  </p>
                  
                  {/* 空状态按钮 */}
                  <div className="flex justify-center gap-4">
                    <button
                      onClick={handleGenerateOutline}
                      disabled={isGlobalLoading}
                      className="relative overflow-hidden px-6 py-3 rounded-lg font-medium text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                      style={{
                        background: 'linear-gradient(90deg, #FF6B6B, #FFD93D, #6BCF7F, #4D96FF, #9D4EDD, #FF6B6B)',
                        backgroundSize: '200% 100%',
                        animation: isGlobalLoading ? 'none' : 'rainbow-flow 3s linear infinite',
                      }}
                    >
                      <span className="flex items-center gap-2">
                        {isGlobalLoading ? (
                          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                          <Sparkles size={20} />
                        )}
                        {isGlobalLoading ? '生成中...' : (currentProject.creation_type === 'outline' ? '解析大纲' : '自动生成大纲')}
                      </span>
                    </button>
                    
                    <button
                      onClick={addNewPage}
                      disabled={isGlobalLoading}
                      className="px-6 py-3 rounded-lg font-medium text-gray-700 bg-white border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="flex items-center gap-2">
                        <Plus size={20} />
                        手动添加大纲
                      </span>
                    </button>
                  </div>
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={currentProject.pages.map((p, idx) => p.id || `page-${idx}`)}
                    strategy={rectSortingStrategy}
                  >
                    {/* Grid 布局，居中对齐 */}
                    <div 
                      className="grid gap-4 justify-center"
                      style={{
                        gridTemplateColumns: maxCardWidth > 0 ? `repeat(auto-fit, ${maxCardWidth}px)` : 'repeat(auto-fit, minmax(200px, max-content))',
                        gridAutoRows: maxCardHeight > 0 ? `${maxCardHeight}px` : 'auto'
                      }}
                    >
                      {currentProject.pages.map((page, index) => (
                        <div
                          key={page.id || `page-${index}`}
                          ref={el => cardRefs.current[index] = el}
                          className="flex"
                          style={{
                            width: maxCardWidth > 0 ? `${maxCardWidth}px` : 'max-content',
                            height: maxCardHeight > 0 ? `${maxCardHeight}px` : 'auto'
                          }}
                        >
                          <SortableCard
                            page={page}
                            index={index}
                            onUpdate={(data) => page.id && updatePageLocal(page.id, data)}
                            onDelete={() => page.id && handleDeletePage(page.id)}
                            onClick={() => setSelectedPageId(page.id || null)}
                            isSelected={selectedPageId === page.id}
                            isAiRefining={isAiRefining}
                          />
                        </div>
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div>
          </div>

          {/* 右侧：统计信息 */}
          <div className="hidden md:flex md:flex-col w-64 bg-white border-l border-gray-100 flex-shrink-0">
            <div className="flex-1 p-6 overflow-y-auto scrollbar-hide min-h-0">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">统计信息</h3>
              
              {/* 页面数量统计 */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl shadow-sm p-5 mb-4 border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">大纲页面</span>
                  <FileText size={18} className="text-banana-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900">
                  {currentProject.pages.length}
                </div>
                <div className="text-xs text-gray-500 mt-1">个页面</div>
              </div>

              {/* 项目资源列表 */}
              <div className="mt-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">项目资源</h4>
                <ProjectResourcesList
                  projectId={projectId || null}
                  onFileClick={setPreviewFileId}
                  showFiles={true}
                  showImages={true}
                />
              </div>
            </div>
          </div>
        </div>
      </StepLayout>

      {ConfirmDialog}
      <ToastContainer />
      <FilePreviewModal fileId={previewFileId} onClose={() => setPreviewFileId(null)} />
    </>
  );
};
