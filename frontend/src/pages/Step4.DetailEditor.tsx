import React, { useEffect, useCallback, useState, useRef } from 'react';
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
    isGlobalLoading, // 添加 isGlobalLoading
  } = useProjectStore();
  const { show, ToastContainer } = useToast();
  const { confirm, ConfirmDialog } = useConfirm();
  const [isAiRefining, setIsAiRefining] = useState(false);
  const [previewFileId, setPreviewFileId] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false); // 新增：导航 loading 状态
  const [maxCardWidth, setMaxCardWidth] = useState<number>(0);
  const [maxCardHeight, setMaxCardHeight] = useState<number>(0);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

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

  // 计算最大卡片宽度和高度
  useEffect(() => {
    if (!currentProject?.pages.length) return;
    
    // 第一次渲染时，先重置尺寸让卡片自由扩展
    setMaxCardWidth(0);
    setMaxCardHeight(0);
    
    // 等待 DOM 渲染完成后计算，增加延迟以确保内容完全渲染
    const timer = setTimeout(() => {
      let maxWidth = 0;
      let maxHeight = 0;
      cardRefs.current.forEach(ref => {
        if (ref) {
          // 获取卡片的自然尺寸（包括溢出的内容）
          const card = ref.querySelector('[class*="p-0"]');
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
    }, 300); // 增加延迟到 300ms
    
    return () => clearTimeout(timer);
  }, [currentProject?.pages, pageDescriptionGeneratingTasks, currentProject?.pages.map(p => p.description_content).join(',')]);

  const handleGenerateAll = async () => {
    const hasDescriptions = currentProject?.pages.some(
      (p) => p.description_content
    );
    
    const executeGenerate = async () => {
      try {
        await generateDescriptions();
        show({ message: '批量生成完成', type: 'success' });
      } catch (error: any) {
        const errorMessage = error.code === 'ECONNABORTED' || error.message?.includes('timeout')
          ? '生成超时（超过5分钟），请稍后重试或检查网络连接'
          : `批量生成失败: ${error.message || '未知错误'}`;
        show({ 
          message: errorMessage, 
          type: 'error' 
        });
      }
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
            const errorMessage = error.code === 'ECONNABORTED' || error.message?.includes('timeout')
              ? '生成超时（超过5分钟），请稍后重试或检查网络连接'
              : `生成失败: ${error.message || '未知错误'}`;
            show({ 
              message: errorMessage, 
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
      const errorMessage = error.code === 'ECONNABORTED' || error.message?.includes('timeout')
        ? '生成超时（超过5分钟），请稍后重试或检查网络连接'
        : `生成失败: ${error.message || '未知错误'}`;
      show({ 
        message: errorMessage, 
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

  // 定义操作按钮
  const completedCount = currentProject.pages.filter(p => p.description_content).length;
  const totalCount = currentProject.pages.length;
  const hasAllDescriptions = completedCount === totalCount && totalCount > 0;
  const isGenerating = Object.keys(pageDescriptionGeneratingTasks).length > 0 || isGlobalLoading;
  
  const actionButtons: ActionButton[] = [
    {
      label: isGenerating ? '生成中...' : (hasAllDescriptions ? '重新批量描述' : '自动批量描述'),
      icon: isGenerating ? (
        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : (
        <Sparkles size={18} className="md:w-[20px] md:h-[20px]" />
      ),
      onClick: handleGenerateAll,
      variant: 'secondary',
      disabled: isGenerating,
      className: 'relative overflow-hidden group',
      style: {
        background: 'linear-gradient(90deg, #FF6B6B, #FFD93D, #6BCF7F, #4D96FF, #9D4EDD, #FF6B6B)',
        backgroundSize: '200% 100%',
        animation: isGenerating ? 'none' : 'rainbow-flow 3s linear infinite',
        color: 'white',
        border: 'none',
        opacity: isGenerating ? 0.7 : 1,
      },
    },
    {
      label: '深度优化描述',
      onClick: () => {},
      variant: 'primary',
      isMainAction: true,
      disabled: isGenerating,
    },
    {
      label: '导出描述文案',
      icon: <Download size={18} className="md:w-[20px] md:h-[20px]" />,
      onClick: handleExportDescriptions,
      variant: 'secondary',
      disabled: !currentProject.pages.some(p => p.description_content) || isGenerating,
    },
  ];

  return (
    <>
      <StepLayout
        currentStep={4}
        projectId={projectId || null}
        pageTitle="编辑页面描述"
        actionButtons={actionButtons}
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
        {/* 主内容区 - 两栏布局 */}
        <div className="flex-1 flex flex-row min-h-0 pb-20 md:pb-24">
          {/* 中间：主要内容区域 */}
          <div className="flex-1 p-3 md:p-6 overflow-y-auto scrollbar-hide min-h-0">
            <div className="w-full h-full">
              {/* 移动端统计信息 */}
              <div className="md:hidden mb-4">
                <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl shadow-sm p-4 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-600 mb-1">完成进度</div>
                      <div className="text-2xl font-bold text-gray-900">
                        {completedCount}/{totalCount} <span className="text-sm font-normal text-gray-600">页已完成</span>
                      </div>
                    </div>
                    <FileText size={32} className="text-banana-600" />
                  </div>
                  {/* 进度条 */}
                  <div className="mt-3 w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-banana-400 to-orange-400 h-full rounded-full transition-all duration-500"
                      style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
                    />
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
                <div 
                  className="grid gap-4 justify-center"
                  style={{
                    gridTemplateColumns: maxCardWidth > 0 ? `repeat(auto-fit, ${maxCardWidth}px)` : 'repeat(auto-fit, minmax(200px, max-content))',
                    gridAutoRows: maxCardHeight > 0 ? `${maxCardHeight}px` : 'auto'
                  }}
                >
                  {currentProject.pages.map((page, index) => {
                    const pageId = page.id || page.page_id;
                    return (
                      <div 
                        key={pageId} 
                        ref={el => cardRefs.current[index] = el}
                        className="flex"
                        style={{ 
                          width: maxCardWidth > 0 ? `${maxCardWidth}px` : 'max-content',
                          height: maxCardHeight > 0 ? `${maxCardHeight}px` : 'auto'
                        }}
                      >
                        <DescriptionCard
                          page={page}
                          index={index}
                          onUpdate={(data) => updatePageLocal(pageId, data)}
                          onRegenerate={() => handleRegeneratePage(pageId)}
                          isGenerating={pageId ? !!pageDescriptionGeneratingTasks[pageId] : false}
                          isAiRefining={isAiRefining}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* 右侧：统计信息 */}
          <div className="hidden md:flex md:flex-col w-64 bg-white border-l border-gray-100 flex-shrink-0">
            <div className="flex-1 p-6 overflow-y-auto scrollbar-hide min-h-0">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">统计信息</h3>
              
              {/* 完成进度统计 */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl shadow-sm p-5 mb-4 border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">完成进度</span>
                  <FileText size={18} className="text-banana-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900">
                  {completedCount}/{totalCount}
                </div>
                <div className="text-xs text-gray-500 mt-1">页已完成</div>
                
                {/* 进度条 */}
                <div className="mt-3 w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-banana-400 to-orange-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
                  />
                </div>
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

      <ToastContainer />
      {ConfirmDialog}
      <FilePreviewModal fileId={previewFileId} onClose={() => setPreviewFileId(null)} />
    </>
  );
};
