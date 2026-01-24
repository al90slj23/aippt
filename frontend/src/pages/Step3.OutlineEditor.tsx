import React, { useState, useEffect } from 'react';
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
  verticalListSortingStrategy,
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
  } = useProjectStore();

  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [isAiRefining, setIsAiRefining] = useState(false);
  const [previewFileId, setPreviewFileId] = useState<string | null>(null);
  const { confirm, ConfirmDialog } = useConfirm();
  const { show, ToastContainer } = useToast();

  // 加载项目数据
  useEffect(() => {
    if (projectId && (!currentProject || currentProject.id !== projectId)) {
      syncProject(projectId);
    }
  }, [projectId, currentProject, syncProject]);

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

  const selectedPage = currentProject.pages.find((p) => p.id === selectedPageId);

  // 定义操作按钮
  const actionButtons: ActionButton[] = [
    {
      label: '添加页面',
      icon: <Plus size={18} className="md:w-[20px] md:h-[20px]" />,
      onClick: addNewPage,
      variant: 'secondary',
    },
    {
      label: currentProject.pages.length === 0
        ? (currentProject.creation_type === 'outline' ? '解析大纲' : '自动生成大纲')
        : (currentProject.creation_type === 'outline' ? '重新解析大纲' : '重新生成大纲'),
      icon: <Sparkles size={18} className="md:w-[20px] md:h-[20px]" />,
      onClick: handleGenerateOutline,
      variant: 'secondary',
    },
    {
      label: '继续修改方案',
      onClick: () => {}, // StepLayout 会自动处理展开 AI 输入框
      variant: 'primary',
      isMainAction: true,
    },
    {
      label: '导出大纲',
      icon: <Download size={18} className="md:w-[20px] md:h-[20px]" />,
      onClick: handleExportOutline,
      variant: 'secondary',
      disabled: currentProject.pages.length === 0,
    },
  ];

  return (
    <>
      <StepLayout
        currentStep={3}
        projectId={projectId || null}
        pageTitle="编辑大纲"
        actionButtons={actionButtons}
        progressInfo={{
          current: currentProject.pages.length,
          total: 0,
          label: '个页面',
        }}
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
          onNext: () => navigate(`/project/${projectId}/detail`),
        }}
      >
        {/* 主内容区 */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* 左侧：大纲列表 */}
          <div className="flex-1 p-3 md:p-6 overflow-y-auto min-h-0">
            <div className="max-w-4xl mx-auto">
              {/* 项目资源列表（文件和图片） */}
              <ProjectResourcesList
                projectId={projectId || null}
                onFileClick={setPreviewFileId}
                showFiles={true}
                showImages={true}
              />

              {/* 大纲卡片列表 */}
              {currentProject.pages.length === 0 ? (
                <div className="text-center py-20">
                  <div className="flex justify-center mb-4">
                    <FileText size={64} className="text-gray-300" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">还没有页面</h3>
                  <p className="text-gray-500 mb-6">
                    点击"添加页面"手动创建，或"自动生成大纲"让 AI 帮你完成
                  </p>
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={currentProject.pages.map((p, idx) => p.id || `page-${idx}`)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-4">
                      {currentProject.pages.map((page, index) => (
                        <SortableCard
                          key={page.id || `page-${index}`}
                          page={page}
                          index={index}
                          onUpdate={(data) => page.id && updatePageLocal(page.id, data)}
                          onDelete={() => page.id && handleDeletePage(page.id)}
                          onClick={() => setSelectedPageId(page.id || null)}
                          isSelected={selectedPageId === page.id}
                          isAiRefining={isAiRefining}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div>
          </div>

          {/* 右侧：预览 */}
          <div className="hidden md:block w-96 bg-white border-l border-gray-200 p-4 md:p-6 overflow-y-auto flex-shrink-0">
            <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">预览</h3>

            {selectedPage ? (
              <div className="space-y-3 md:space-y-4">
                <div>
                  <div className="text-xs md:text-sm text-gray-500 mb-1">标题</div>
                  <div className="text-base md:text-lg font-semibold text-gray-900">
                    {selectedPage.outline_content.title}
                  </div>
                </div>
                <div>
                  <div className="text-xs md:text-sm text-gray-500 mb-2">要点</div>
                  <ul className="space-y-1.5 md:space-y-2">
                    {selectedPage.outline_content.points.map((point, idx) => (
                      <li key={idx} className="flex items-start text-sm md:text-base text-gray-700">
                        <span className="mr-2 text-banana-500 flex-shrink-0">•</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 md:py-10 text-gray-400">
                <div className="text-3xl md:text-4xl mb-2">👆</div>
                <p className="text-sm md:text-base">点击左侧卡片查看详情</p>
              </div>
            )}
          </div>

          {/* 移动端预览：底部抽屉 */}
          {selectedPage && (
            <div className="md:hidden fixed inset-x-0 bottom-0 bg-white border-t border-gray-200 p-4 max-h-[50vh] overflow-y-auto shadow-lg z-50">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">预览</h3>
              <div className="space-y-2">
                <div>
                  <div className="text-xs text-gray-500 mb-1">标题</div>
                  <div className="text-sm font-semibold text-gray-900">
                    {selectedPage.outline_content.title}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">要点</div>
                  <ul className="space-y-1">
                    {selectedPage.outline_content.points.map((point, idx) => (
                      <li key={idx} className="flex items-start text-xs text-gray-700">
                        <span className="mr-1.5 text-banana-500 flex-shrink-0">•</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </StepLayout>

      {ConfirmDialog}
      {ToastContainer}
      <FilePreviewModal fileId={previewFileId} onClose={() => setPreviewFileId(null)} />
    </>
  );
};
