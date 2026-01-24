import React, { useEffect, useCallback, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { FileText, Sparkles, Download } from 'lucide-react';
import { StepLayout, ActionButton, useToast, useConfirm, FilePreviewModal, ProjectResourcesList, Loading } from '@/components/shared';
import { DescriptionCard } from '@/components/preview/DescriptionCard';
import { useProjectStore } from '@/store/useProjectStore';
import { refineDescriptions } from '@/api/endpoints';
import { exportDescriptionsToMarkdown } from '@/utils/projectUtils';

export const Step4DetailEditor: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { projectId } = useParams<{ projectId: string }>();
  const fromHistory = (location.state as any)?.from === 'history';
  const {
    currentProject,
    syncProject,
    updatePageLocal,
    generateDescriptions,
    generatePageDescription,
    pageDescriptionGeneratingTasks,
  } = useProjectStore();
  const { show, ToastContainer } = useToast();
  const { confirm, ConfirmDialog } = useConfirm();
  const [isAiRefining, setIsAiRefining] = useState(false);
  const [previewFileId, setPreviewFileId] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false); // 新增：导航 loading 状态

  // 加载项目数据
  useEffect(() => {
    if (projectId && (!currentProject || currentProject.id !== projectId)) {
      syncProject(projectId);
    } else if (projectId && currentProject && currentProject.id === projectId) {
      const shouldSync = !currentProject.pages.some(p => p.description_content);
      if (shouldSync) {
        syncProject(projectId);
      }
    }
  }, [projectId, currentProject?.id]);

  const handleGenerateAll = async () => {
    const hasDescriptions = currentProject?.pages.some(
      (p) => p.description_content
    );
    
    const executeGenerate = async () => {
      await generateDescriptions();
    };
    
    if (hasDescriptions) {
      confirm(
        '部分页面已有描述，重新生成将覆盖，确定继续吗？',
        executeGenerate,
        { title: '确认重新生成', variant: 'warning' }
      );
    } else {
      await executeGenerate();
    }
  };

  const handleRegeneratePage = async (pageId: string) => {
    if (!currentProject) return;
    
    const page = currentProject.pages.find((p) => p.id === pageId);
    if (!page) return;
    
    if (page.description_content) {
      confirm(
        '该页面已有描述，重新生成将覆盖现有内容，确定继续吗？',
        async () => {
          try {
            await generatePageDescription(pageId);
            show({ message: '生成成功', type: 'success' });
          } catch (error: any) {
            show({ 
              message: `生成失败: ${error.message || '未知错误'}`, 
              type: 'error' 
            });
          }
        },
        { title: '确认重新生成', variant: 'warning' }
      );
      return;
    }
    
    try {
      await generatePageDescription(pageId);
      show({ message: '生成成功', type: 'success' });
    } catch (error: any) {
      show({ 
        message: `生成失败: ${error.message || '未知错误'}`, 
        type: 'error' 
      });
    }
  };

  const handleAiRefineDescriptions = useCallback(async (requirement: string, previousRequirements: string[]) => {
    if (!currentProject || !projectId) return;
    
    try {
      const response = await refineDescriptions(projectId, requirement, previousRequirements);
      await syncProject(projectId);
      show({ 
        message: response.data?.message || '页面描述修改成功', 
        type: 'success' 
      });
    } catch (error: any) {
      console.error('修改页面描述失败:', error);
      const errorMessage = error?.response?.data?.error?.message 
        || error?.message 
        || '修改失败，请稍后重试';
      show({ message: errorMessage, type: 'error' });
      throw error;
    }
  }, [currentProject, projectId, syncProject, show]);

  // 包装函数以适配 StepLayout 的 aiRefine.onSubmit 签名
  const handleAiRefineWrapper = useCallback(async (prompt: string) => {
    await handleAiRefineDescriptions(prompt, []);
  }, [handleAiRefineDescriptions]);

  const handleExportDescriptions = useCallback(() => {
    if (!currentProject) return;
    exportDescriptionsToMarkdown(currentProject);
    show({ message: '导出成功', type: 'success' });
  }, [currentProject, show]);

  if (!currentProject) {
    return <Loading fullscreen message="加载项目中..." />;
  }

  const hasAllDescriptions = currentProject.pages.every(
    (p) => p.description_content
  );

  // 定义操作按钮
  const actionButtons: ActionButton[] = [
    {
      label: '批量生成描述',
      icon: <Sparkles size={18} className="md:w-[20px] md:h-[20px]" />,
      onClick: handleGenerateAll,
      variant: 'secondary',
    },
    {
      label: '继续修改方案',
      onClick: () => {},
      variant: 'primary',
      isMainAction: true,
    },
    {
      label: '导出描述',
      icon: <Download size={18} className="md:w-[20px] md:h-[20px]" />,
      onClick: handleExportDescriptions,
      variant: 'secondary',
      disabled: !currentProject.pages.some(p => p.description_content),
    },
  ];

  return (
    <>
      <StepLayout
        currentStep={4}
        projectId={projectId || null}
        pageTitle="编辑页面描述"
        actionButtons={actionButtons}
        progressInfo={{
          current: currentProject.pages.filter(p => p.description_content).length,
          total: currentProject.pages.length,
          label: '页已完成',
        }}
        aiRefine={{
          placeholder: '例如：让描述更详细、删除第2页的某个要点、强调XXX的重要性、调整第3页的语气更专业...',
          onSubmit: handleAiRefineWrapper,
          onStatusChange: setIsAiRefining,
        }}
        navigation={{
          onPrevious: () => {
            if (fromHistory) {
              navigate('/history');
            } else {
              navigate(`/project/${projectId}/outline`);
            }
          },
          onNext: async () => {
            setIsNavigating(true);
            // 给一个短暂延迟，让 loading 状态显示出来
            await new Promise(resolve => setTimeout(resolve, 300));
            navigate(`/project/${projectId}/preview`);
          },
          disableNext: !hasAllDescriptions,
          loadingNext: isNavigating,
        }}
        isLoading={isNavigating}
        loadingMessage="正在跳转到图片生成..."
      >
        {/* 主内容区 */}
        <div className="flex-1 p-3 md:p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {/* 项目资源列表（文件和图片） */}
            <ProjectResourcesList
              projectId={projectId || null}
              onFileClick={setPreviewFileId}
              showFiles={true}
              showImages={true}
            />
            
            {currentProject.pages.length === 0 ? (
              <div className="text-center py-12 md:py-20">
                <div className="flex justify-center mb-4">
                  <FileText size={48} className="text-gray-300" />
                </div>
                <h3 className="text-lg md:text-xl font-semibold text-gray-700 mb-2">
                  还没有页面
                </h3>
                <p className="text-sm md:text-base text-gray-500 mb-6">
                  请先返回大纲编辑页添加页面
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
                {currentProject.pages.map((page, index) => {
                  const pageId = page.id || page.page_id;
                  return (
                    <DescriptionCard
                      key={pageId}
                      page={page}
                      index={index}
                      onUpdate={(data) => updatePageLocal(pageId, data)}
                      onRegenerate={() => handleRegeneratePage(pageId)}
                      isGenerating={pageId ? !!pageDescriptionGeneratingTasks[pageId] : false}
                      isAiRefining={isAiRefining}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </StepLayout>

      {ToastContainer}
      {ConfirmDialog}
      <FilePreviewModal fileId={previewFileId} onClose={() => setPreviewFileId(null)} />
    </>
  );
};
