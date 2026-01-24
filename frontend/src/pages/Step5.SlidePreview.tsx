import React, { useMemo, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  RefreshCw,
  Sparkles,
  Upload,
  ImagePlus,
  Settings,
} from 'lucide-react';
import { 
  Button,
  Loading, 
  Modal, 
  useToast, 
  useConfirm, 
  MaterialSelector, 
  ProjectSettingsModal, 
  StepLayout, 
  ActionButton 
} from '@/components/shared';
import { MaterialGeneratorModal } from '@/components/shared/MaterialGeneratorModal';
import { TemplateSelector } from '@/components/shared/TemplateSelector';
import { useProjectStore } from '@/store/useProjectStore';
import { useExportTasksStore } from '@/store/useExportTasksStore';
import { getImageUrl } from '@/api/client';
import { normalizeErrorMessage } from '@/utils';

// 导入拆分的模块
import { useStep5State } from './Step5.state';
import { 
  useEditHandlers, 
  useRegionSelectionHandlers, 
  useMultiSelectHandlers,
  useOtherHandlers 
} from './Step5.handlers';
import {
  useProjectDataEffect,
  useProjectSettingsEffect,
  useImageVersionsEffect,
  useEditContextCacheEffect,
  useExportTasksRestoreEffect,
} from './Step5.effects';
import { extractImageUrlsFromDescription } from './Step5.hooks';

// 导入子组件
import { LeftSidebar } from './Step5.LeftSidebar';
import { MainPreview } from './Step5.MainPreview';
import { RightSidebar } from './Step5.RightSidebar';
import { EditModal } from './Step5.EditModal';
import { ExportMenu } from './Step5.ExportMenu';

export const Step5SlidePreview: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { projectId } = useParams<{ projectId: string }>();
  const fromHistory = (location.state as any)?.from === 'history';
  
  // Store hooks
  const {
    currentProject,
    syncProject,
    generateImages,
    editPageImage,
    deletePageById,
    updatePageLocal,
    isGlobalLoading,
    taskProgress,
    pageGeneratingTasks,
  } = useProjectStore();
  
  const { addTask, pollTask: pollExportTask, tasks: exportTasks, restoreActiveTasks } = useExportTasksStore();
  const { show, ToastContainer } = useToast();
  const { confirm, ConfirmDialog } = useConfirm();

  // 状态管理
  const state = useStep5State(currentProject);

  // Memoize pages with generated images
  const pagesWithImages = useMemo(() => {
    return currentProject?.pages.filter(p => p.id && p.generated_image_path) || [];
  }, [currentProject?.pages]);

  // Effects
  useExportTasksRestoreEffect(restoreActiveTasks);
  useProjectDataEffect(projectId, currentProject, syncProject, state.setUserTemplates);
  useProjectSettingsEffect(
    currentProject,
    state.setExtraRequirements,
    state.setTemplateStyle,
    state.setExportExtractorMethod,
    state.setExportInpaintMethod,
    state.lastProjectId,
    state.isEditingRequirements,
    state.isEditingTemplateStyle
  );
  useImageVersionsEffect(
    currentProject,
    projectId,
    state.selectedIndex,
    state.setImageVersions,
    state.setShowVersionMenu
  );
  useEditContextCacheEffect(
    state.isEditModalOpen,
    currentProject,
    state.selectedIndex,
    state.editPrompt,
    state.selectedContextImages,
    state.setEditContextByPage
  );

  // 处理函数
  const editHandlers = useEditHandlers(
    currentProject,
    state.selectedIndex,
    updatePageLocal,
    editPageImage,
    show,
    state
  );

  const regionSelectionHandlers = useRegionSelectionHandlers(
    state.imageRef,
    state,
    show
  );

  const multiSelectHandlers = useMultiSelectHandlers(pagesWithImages, state);

  const otherHandlers = useOtherHandlers(
    projectId,
    currentProject,
    state.selectedIndex,
    syncProject,
    generateImages,
    pageGeneratingTasks,
    state.userTemplates,
    show,
    confirm,
    state
  );

  // 生成和导出处理
  const handleGenerateAll = useCallback(async () => {
    const pageIds = multiSelectHandlers.getSelectedPageIdsForExport();
    const isPartialGenerate = state.isMultiSelectMode && state.selectedPageIds.size > 0;
    
    const pagesToGenerate = isPartialGenerate
      ? currentProject?.pages.filter(p => p.id && state.selectedPageIds.has(p.id))
      : currentProject?.pages;
    const hasImages = pagesToGenerate?.some((p) => p.generated_image_path);
    
    const executeGenerate = async () => {
      try {
        await generateImages(pageIds);
      } catch (error: any) {
        console.error('批量生成错误:', error);
        let errorMessage = '生成失败';
        const respData = error?.response?.data;

        if (respData) {
          if (respData.error?.message) {
            errorMessage = respData.error.message;
          } else if (respData.message) {
            errorMessage = respData.message;
          } else if (respData.error) {
            errorMessage =
              typeof respData.error === 'string'
                ? respData.error
                : respData.error.message || errorMessage;
          }
        } else if (error.message) {
          errorMessage = error.message;
        }

        errorMessage = normalizeErrorMessage(errorMessage);
        show({
          message: errorMessage,
          type: 'error',
        });
      }
    };
    
    if (hasImages) {
      const message = isPartialGenerate
        ? `将重新生成选中的 ${state.selectedPageIds.size} 页（历史记录将会保存），确定继续吗？`
        : '将重新生成所有页面（历史记录将会保存），确定继续吗？';
      confirm(
        message,
        executeGenerate,
        { title: '确认重新生成', variant: 'warning' }
      );
    } else {
      await executeGenerate();
    }
  }, [currentProject, generateImages, state.isMultiSelectMode, state.selectedPageIds, multiSelectHandlers, show, confirm]);

  const handleExport = useCallback(async (type: 'pptx' | 'pdf' | 'editable-pptx') => {
    state.setShowExportMenu(false);
    if (!projectId) return;
    
    const pageIds = multiSelectHandlers.getSelectedPageIdsForExport();
    const exportTaskId = `export-${Date.now()}`;
    
    try {
      if (type === 'pptx' || type === 'pdf') {
        const { exportPPTX: apiExportPPTX, exportPDF: apiExportPDF } = await import('@/api/endpoints');
        const response = type === 'pptx' 
          ? await apiExportPPTX(projectId, pageIds)
          : await apiExportPDF(projectId, pageIds);
        const downloadUrl = response.data?.download_url || response.data?.download_url_absolute;
        if (downloadUrl) {
          addTask({
            id: exportTaskId,
            taskId: '',
            projectId,
            type: type as any,
            status: 'COMPLETED',
            downloadUrl,
            pageIds: pageIds,
          });
          window.open(downloadUrl, '_blank');
        }
      } else if (type === 'editable-pptx') {
        addTask({
          id: exportTaskId,
          taskId: '',
          projectId,
          type: 'editable-pptx',
          status: 'PROCESSING',
          pageIds: pageIds,
        });
        
        show({ message: '导出任务已开始，可在导出任务面板查看进度', type: 'success' });
        
        const { exportEditablePPTX: apiExportEditablePPTX } = await import('@/api/endpoints');
        const response = await apiExportEditablePPTX(projectId, undefined, pageIds);
        const taskId = response.data?.task_id;
        
        if (taskId) {
          addTask({
            id: exportTaskId,
            taskId,
            projectId,
            type: 'editable-pptx',
            status: 'PROCESSING',
            pageIds: pageIds,
          });
          
          pollExportTask(exportTaskId, projectId, taskId);
        }
      }
    } catch (error: any) {
      addTask({
        id: exportTaskId,
        taskId: '',
        projectId,
        type: type as any,
        status: 'FAILED',
        errorMessage: normalizeErrorMessage(error.message || '导出失败'),
        pageIds: pageIds,
      });
      show({ message: normalizeErrorMessage(error.message || '导出失败'), type: 'error' });
    }
  }, [projectId, state, multiSelectHandlers, addTask, pollExportTask, show]);

  // 加载状态
  if (!currentProject) {
    return <Loading fullscreen message="加载项目中..." />;
  }

  if (isGlobalLoading) {
    let loadingMessage = "处理中...";
    if (taskProgress && typeof taskProgress === 'object') {
      const progressData = taskProgress as any;
      if (progressData.current_step) {
        const stepMap: Record<string, string> = {
          'Generating clean backgrounds': '正在生成干净背景...',
          'Creating PDF': '正在创建PDF...',
          'Parsing with MinerU': '正在解析内容...',
          'Creating editable PPTX': '正在创建可编辑PPTX...',
          'Complete': '完成！'
        };
        loadingMessage = stepMap[progressData.current_step] || progressData.current_step;
      }
    }
    
    return (
      <Loading
        fullscreen
        message={loadingMessage}
        progress={taskProgress || undefined}
      />
    );
  }

  const selectedPage = currentProject.pages[state.selectedIndex];
  const imageUrl = selectedPage?.generated_image_path
    ? getImageUrl(selectedPage.generated_image_path, selectedPage.updated_at)
    : '';

  const hasAllImages = currentProject.pages.every(
    (p) => p.generated_image_path
  );

  // 定义操作按钮
  const isGenerating = Object.keys(pageGeneratingTasks).length > 0 || isGlobalLoading;
  
  const actionButtons: ActionButton[] = [
    {
      label: isGenerating ? '生成中...' : '批量生成图片',
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
      disabled: isGenerating || (state.isMultiSelectMode && state.selectedPageIds.size === 0),
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
      label: '更换模板',
      icon: <Upload size={18} className="md:w-[20px] md:h-[20px]" />,
      onClick: () => state.setIsTemplateModalOpen(true),
      variant: 'secondary',
    },
    {
      label: '素材生成',
      icon: <ImagePlus size={18} className="md:w-[20px] md:h-[20px]" />,
      onClick: () => state.setIsMaterialModalOpen(true),
      variant: 'secondary',
    },
    {
      label: '项目设置',
      icon: <Settings size={18} className="md:w-[20px] md:h-[20px]" />,
      onClick: () => state.setIsProjectSettingsOpen(true),
      variant: 'secondary',
    },
    {
      label: '刷新页面',
      icon: <RefreshCw size={18} className={`md:w-[20px] md:h-[20px] ${state.isRefreshing ? 'animate-spin' : ''}`} />,
      onClick: otherHandlers.handleRefresh,
      variant: 'secondary',
      disabled: state.isRefreshing,
    },
  ];

  return (
    <>
      <StepLayout
        currentStep={5}
        projectId={projectId || null}
        pageTitle="预览与导出"
        actionButtons={actionButtons}
        navigation={{
          onPrevious: () => {
            if (fromHistory) {
              navigate('/history');
            } else {
              navigate(`/project/${projectId}/detail`);
            }
          },
          onNext: () => {
            state.setShowExportMenu(true);
          },
          nextLabel: '导出',
          disableNext: state.isMultiSelectMode ? state.selectedPageIds.size === 0 : !hasAllImages,
        }}
      >
        {/* 三栏布局 */}
        <div className="flex-1 flex flex-row min-h-0 pb-20 md:pb-24">
          {/* 左侧：统计信息 */}
          <LeftSidebar
            currentProject={currentProject}
            pagesWithImages={pagesWithImages}
            isMultiSelectMode={state.isMultiSelectMode}
            selectedPageIds={state.selectedPageIds}
            toggleMultiSelectMode={multiSelectHandlers.toggleMultiSelectMode}
            selectAllPages={multiSelectHandlers.selectAllPages}
            deselectAllPages={multiSelectHandlers.deselectAllPages}
            exportTasks={exportTasks}
            projectId={projectId}
          />

          {/* 中间：主预览区 */}
          <MainPreview
            currentProject={currentProject}
            selectedIndex={state.selectedIndex}
            setSelectedIndex={state.setSelectedIndex}
            selectedPage={selectedPage}
            imageUrl={imageUrl}
            pageGeneratingTasks={pageGeneratingTasks}
            handleRegeneratePage={otherHandlers.handleRegeneratePage}
            imageVersions={state.imageVersions}
            showVersionMenu={state.showVersionMenu}
            setShowVersionMenu={state.setShowVersionMenu}
            handleSwitchVersion={otherHandlers.handleSwitchVersion}
            handleEditPage={editHandlers.handleEditPage}
          />

          {/* 右侧：缩略图列表 */}
          <RightSidebar
            currentProject={currentProject}
            selectedIndex={state.selectedIndex}
            setSelectedIndex={state.setSelectedIndex}
            isMultiSelectMode={state.isMultiSelectMode}
            selectedPageIds={state.selectedPageIds}
            togglePageSelection={multiSelectHandlers.togglePageSelection}
            handleEditPage={editHandlers.handleEditPage}
            deletePageById={deletePageById}
            pageGeneratingTasks={pageGeneratingTasks}
          />
        </div>
      </StepLayout>

      {/* 导出菜单弹窗 */}
      <ExportMenu
        showExportMenu={state.showExportMenu}
        setShowExportMenu={state.setShowExportMenu}
        isMultiSelectMode={state.isMultiSelectMode}
        selectedPageIds={state.selectedPageIds}
        handleExport={handleExport}
      />

      {/* 编辑弹窗 */}
      <EditModal
        isOpen={state.isEditModalOpen}
        onClose={() => state.setIsEditModalOpen(false)}
        imageUrl={imageUrl}
        imageRef={state.imageRef}
        isRegionSelectionMode={state.isRegionSelectionMode}
        setIsRegionSelectionMode={state.setIsRegionSelectionMode}
        selectionRect={state.selectionRect}
        handleSelectionMouseDown={regionSelectionHandlers.handleSelectionMouseDown}
        handleSelectionMouseMove={regionSelectionHandlers.handleSelectionMouseMove}
        handleSelectionMouseUp={regionSelectionHandlers.handleSelectionMouseUp}
        isOutlineExpanded={state.isOutlineExpanded}
        setIsOutlineExpanded={state.setIsOutlineExpanded}
        editOutlineTitle={state.editOutlineTitle}
        setEditOutlineTitle={state.setEditOutlineTitle}
        editOutlinePoints={state.editOutlinePoints}
        setEditOutlinePoints={state.setEditOutlinePoints}
        isDescriptionExpanded={state.isDescriptionExpanded}
        setIsDescriptionExpanded={state.setIsDescriptionExpanded}
        editDescription={state.editDescription}
        setEditDescription={state.setEditDescription}
        currentProject={currentProject}
        selectedPage={selectedPage}
        selectedContextImages={state.selectedContextImages}
        setSelectedContextImages={state.setSelectedContextImages}
        extractImageUrlsFromDescription={extractImageUrlsFromDescription}
        handleFileUpload={editHandlers.handleFileUpload}
        removeUploadedFile={editHandlers.removeUploadedFile}
        setIsMaterialSelectorOpen={state.setIsMaterialSelectorOpen}
        editPrompt={state.editPrompt}
        setEditPrompt={state.setEditPrompt}
        handleSaveOutlineAndDescription={editHandlers.handleSaveOutlineAndDescription}
        handleSubmitEdit={editHandlers.handleSubmitEdit}
      />

      {/* 模板选择 Modal */}
      <Modal
        isOpen={state.isTemplateModalOpen}
        onClose={() => state.setIsTemplateModalOpen(false)}
        title="更换模板"
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 mb-4">
            选择一个新的模板将应用到后续PPT页面生成（不影响已经生成的页面）。你可以选择预设模板、已有模板或上传新模板。
          </p>
          <TemplateSelector
            onSelect={otherHandlers.handleTemplateSelect}
            selectedTemplateId={state.selectedTemplateId}
            selectedPresetTemplateId={state.selectedPresetTemplateId}
            showUpload={false}
            projectId={projectId || null}
          />
          {state.isUploadingTemplate && (
            <div className="text-center py-2 text-sm text-gray-500">
              正在上传模板...
            </div>
          )}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="ghost"
              onClick={() => state.setIsTemplateModalOpen(false)}
              disabled={state.isUploadingTemplate}
            >
              关闭
            </Button>
          </div>
        </div>
      </Modal>

      {/* 素材生成模态组件 */}
      {projectId && (
        <>
          <MaterialGeneratorModal
            projectId={projectId}
            isOpen={state.isMaterialModalOpen}
            onClose={() => state.setIsMaterialModalOpen(false)}
          />
          <MaterialSelector
            projectId={projectId}
            isOpen={state.isMaterialSelectorOpen}
            onClose={() => state.setIsMaterialSelectorOpen(false)}
            onSelect={editHandlers.handleSelectMaterials}
            multiple={true}
          />
          <ProjectSettingsModal
            isOpen={state.isProjectSettingsOpen}
            onClose={() => state.setIsProjectSettingsOpen(false)}
            extraRequirements={state.extraRequirements}
            templateStyle={state.templateStyle}
            onExtraRequirementsChange={(value) => {
              state.isEditingRequirements.current = true;
              state.setExtraRequirements(value);
            }}
            onTemplateStyleChange={(value) => {
              state.isEditingTemplateStyle.current = true;
              state.setTemplateStyle(value);
            }}
            onSaveExtraRequirements={otherHandlers.handleSaveExtraRequirements}
            onSaveTemplateStyle={otherHandlers.handleSaveTemplateStyle}
            isSavingRequirements={state.isSavingRequirements}
            isSavingTemplateStyle={state.isSavingTemplateStyle}
            exportExtractorMethod={state.exportExtractorMethod}
            exportInpaintMethod={state.exportInpaintMethod}
            onExportExtractorMethodChange={state.setExportExtractorMethod}
            onExportInpaintMethodChange={state.setExportInpaintMethod}
            onSaveExportSettings={otherHandlers.handleSaveExportSettings}
            isSavingExportSettings={state.isSavingExportSettings}
          />
        </>
      )}

      <ToastContainer />
      {ConfirmDialog}
    </>
  );
};
