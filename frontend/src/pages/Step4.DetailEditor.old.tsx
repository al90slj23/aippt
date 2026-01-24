import React, { useEffect, useCallback, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ArrowLeft, ArrowRight, FileText, Sparkles, Download, Home } from 'lucide-react';
import { Button, Loading, useToast, useConfirm, AiRefineInput, FilePreviewModal, ProjectResourcesList, ProgressSteps } from '@/components/shared';
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
  const [isAiRefining, setIsAiRefining] = React.useState(false);
  const [isAiRefineExpanded, setIsAiRefineExpanded] = React.useState(false);
  const [previewFileId, setPreviewFileId] = useState<string | null>(null);

  // 加载项目数据
  useEffect(() => {
    if (projectId && (!currentProject || currentProject.id !== projectId)) {
      // 直接使用 projectId 同步项目数据
      syncProject(projectId);
    } else if (projectId && currentProject && currentProject.id === projectId) {
      // 如果项目已存在，也同步一次以确保数据是最新的（特别是从描述生成后）
      // 但只在首次加载时同步，避免频繁请求
      const shouldSync = !currentProject.pages.some(p => p.description_content);
      if (shouldSync) {
        syncProject(projectId);
      }
    }
  }, [projectId, currentProject?.id]); // 只在 projectId 或项目ID变化时更新


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
    
    // 如果已有描述，询问是否覆盖
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
      throw error; // 抛出错误让组件知道失败了
    }
  }, [currentProject, projectId, syncProject, show]);

  // 导出页面描述为 Markdown 文件
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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 顶部导航栏 */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
          {/* 左侧：主页按钮 + Logo + 标题 */}
          <div className="flex items-center gap-2 md:gap-4">
            <Button
              variant="ghost"
              size="sm"
              icon={<Home size={16} className="md:w-[18px] md:h-[18px]" />}
              onClick={() => navigate('/')}
            >
              主页
            </Button>
            <div className="flex items-center gap-1.5 md:gap-2">
              <span className="text-xl md:text-2xl">🍌</span>
              <span className="text-base md:text-xl font-bold">元愈PPT</span>
            </div>
            <span className="text-gray-400 hidden lg:inline">|</span>
            <span className="text-sm md:text-lg font-semibold hidden lg:inline">编辑页面描述</span>
          </div>
          
          {/* 右侧：空白 */}
          <div></div>
        </div>
      </div>
      
      {/* 进度导航条 */}
      <ProgressSteps currentStep={4} projectId={projectId!} />
      
      {/* 操作面板 */}
      <div className="bg-gradient-to-r from-banana-50 via-orange-50/30 to-pink-50/20 border-b border-gray-200 px-3 md:px-6 py-4 md:py-5 flex-shrink-0">
        <div className="max-w-5xl mx-auto space-y-4">
          {/* 按钮组 */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
            {/* 批量生成描述 */}
            <Button
              variant="secondary"
              icon={<Sparkles size={18} className="md:w-[20px] md:h-[20px]" />}
              onClick={handleGenerateAll}
              className="flex-1 sm:flex-initial text-sm md:text-base px-6 py-3"
            >
              批量生成描述
            </Button>
            
            {/* 继续修改方案 - 中间按钮，有特效 */}
            <Button
              variant="primary"
              icon={<Sparkles size={18} className="md:w-[20px] md:h-[20px] animate-pulse" />}
              onClick={() => setIsAiRefineExpanded(!isAiRefineExpanded)}
              className="flex-1 sm:flex-initial text-sm md:text-base px-8 py-3 relative overflow-hidden group"
            >
              <span className="relative z-10">继续修改方案</span>
              {/* 动态光效 */}
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></span>
            </Button>
            
            {/* 导出描述 */}
            <Button
              variant="secondary"
              icon={<Download size={18} className="md:w-[20px] md:h-[20px]" />}
              onClick={handleExportDescriptions}
              disabled={!currentProject.pages.some(p => p.description_content)}
              className="flex-1 sm:flex-initial text-sm md:text-base px-6 py-3"
            >
              导出描述
            </Button>
          </div>
          
          {/* 进度提示 */}
          <div className="text-center">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full text-sm md:text-base text-gray-700 shadow-sm">
              <span className="font-semibold text-banana-600">
                {currentProject.pages.filter((p) => p.description_content).length}
              </span>
              <span>/</span>
              <span>{currentProject.pages.length}</span>
              <span>页已完成</span>
            </span>
          </div>
          
          {/* AI 修改输入框 - 可展开 */}
          {isAiRefineExpanded && (
            <div className="animate-in slide-in-from-top duration-300">
              <div className="bg-white rounded-xl shadow-lg border-2 border-banana-300 p-4 md:p-6">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-banana-400 to-orange-400 rounded-full flex items-center justify-center">
                    <Sparkles size={20} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">
                      AI 智能修改
                    </h3>
                    <AiRefineInput
                      title=""
                      placeholder="例如：让描述更详细、删除第2页的某个要点、强调XXX的重要性、调整第3页的语气更专业..."
                      onSubmit={handleAiRefineDescriptions}
                      disabled={false}
                      className="!p-0 !bg-transparent !border-0"
                      onStatusChange={setIsAiRefining}
                    />
                  </div>
                  <button
                    onClick={() => setIsAiRefineExpanded(false)}
                    className="flex-shrink-0 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <span className="text-gray-400 text-xl">×</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 主内容区 */}
      <main className="flex-1 p-3 md:p-6 overflow-y-auto min-h-0 pb-28 md:pb-32">
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
              <div className="flex justify-center mb-4"><FileText size={48} className="text-gray-300" /></div>
              <h3 className="text-lg md:text-xl font-semibold text-gray-700 mb-2">
                还没有页面
              </h3>
              <p className="text-sm md:text-base text-gray-500 mb-6">
                请先返回大纲编辑页添加页面
              </p>
              <Button
                variant="primary"
                onClick={() => navigate(`/project/${projectId}/outline`)}
                className="text-sm md:text-base"
              >
                返回大纲编辑
              </Button>
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
      </main>
      
      {/* 底部固定导航栏 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-5 flex items-center justify-between">
          {/* 左侧：上一步按钮 */}
          <Button
            variant="ghost"
            size="lg"
            icon={<ArrowLeft size={20} className="md:w-[22px] md:h-[22px]" />}
            onClick={() => {
              if (fromHistory) {
                navigate('/history');
              } else {
                navigate(`/project/${projectId}/outline`);
              }
            }}
            className="text-base md:text-lg font-semibold px-6 md:px-8 py-3 md:py-4"
          >
            上一步
          </Button>
          
          {/* 右侧：下一步按钮 */}
          <Button
            variant="primary"
            size="lg"
            icon={<ArrowRight size={20} className="md:w-[22px] md:h-[22px]" />}
            onClick={() => navigate(`/project/${projectId}/preview`)}
            disabled={!hasAllDescriptions}
            className="text-base md:text-lg font-semibold px-6 md:px-8 py-3 md:py-4"
          >
            下一步
          </Button>
        </div>
      </div>
      
      <ToastContainer />
      {ConfirmDialog}
      <FilePreviewModal fileId={previewFileId} onClose={() => setPreviewFileId(null)} />
    </div>
  );
};

