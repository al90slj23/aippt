import { useCallback } from 'react';
import type { Material } from '@/api/endpoints';
import { 
  updateProject, 
  uploadTemplate, 
  exportPPTX as apiExportPPTX, 
  exportPDF as apiExportPDF, 
  exportEditablePPTX as apiExportEditablePPTX 
} from '@/api/endpoints';
import { materialUrlToFile } from '@/components/shared/MaterialSelector';
import { getTemplateFile } from '@/components/shared/TemplateSelector';
import type { UserTemplate } from '@/api/endpoints';
import type { ExportTaskType } from '@/store/useExportTasksStore';
import { normalizeErrorMessage } from '@/utils';
import type { Project, DescriptionContent, ExportExtractorMethod, ExportInpaintMethod } from '@/types';

// 处理生成相关的 hooks
export const useGenerateHandlers = (
  currentProject: Project | null,
  generateImages: (pageIds?: string[]) => Promise<void>,
  isMultiSelectMode: boolean,
  selectedPageIds: Set<string>,
  show: (props: any) => void,
  confirm: (message: string, onConfirm: () => void, options?: any) => void
) => {
  const getSelectedPageIdsForExport = useCallback((): string[] | undefined => {
    if (!isMultiSelectMode || selectedPageIds.size === 0) {
      return undefined;
    }
    return Array.from(selectedPageIds);
  }, [isMultiSelectMode, selectedPageIds]);

  const handleGenerateAll = useCallback(async () => {
    const pageIds = getSelectedPageIdsForExport();
    const isPartialGenerate = isMultiSelectMode && selectedPageIds.size > 0;
    
    const pagesToGenerate = isPartialGenerate
      ? currentProject?.pages.filter(p => p.id && selectedPageIds.has(p.id))
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
        ? `将重新生成选中的 ${selectedPageIds.size} 页（历史记录将会保存），确定继续吗？`
        : '将重新生成所有页面（历史记录将会保存），确定继续吗？';
      confirm(
        message,
        executeGenerate,
        { title: '确认重新生成', variant: 'warning' }
      );
    } else {
      await executeGenerate();
    }
  }, [currentProject, generateImages, isMultiSelectMode, selectedPageIds, getSelectedPageIdsForExport, show, confirm]);

  return { handleGenerateAll, getSelectedPageIdsForExport };
};

// 处理导出相关的 hooks
export const useExportHandlers = (
  projectId: string | undefined,
  addTask: (task: any) => void,
  pollExportTask: (exportTaskId: string, projectId: string, taskId: string) => void,
  show: (props: any) => void
) => {
  const handleExport = useCallback(async (
    type: 'pptx' | 'pdf' | 'editable-pptx',
    pageIds?: string[]
  ) => {
    if (!projectId) return;
    
    const exportTaskId = `export-${Date.now()}`;
    
    try {
      if (type === 'pptx' || type === 'pdf') {
        const response = type === 'pptx' 
          ? await apiExportPPTX(projectId, pageIds)
          : await apiExportPDF(projectId, pageIds);
        const downloadUrl = response.data?.download_url || response.data?.download_url_absolute;
        if (downloadUrl) {
          addTask({
            id: exportTaskId,
            taskId: '',
            projectId,
            type: type as ExportTaskType,
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
        type: type as ExportTaskType,
        status: 'FAILED',
        errorMessage: normalizeErrorMessage(error.message || '导出失败'),
        pageIds: pageIds,
      });
      show({ message: normalizeErrorMessage(error.message || '导出失败'), type: 'error' });
    }
  }, [projectId, addTask, pollExportTask, show]);

  return { handleExport };
};

// 处理项目设置相关的 hooks
export const useProjectSettingsHandlers = (
  currentProject: Project | null,
  projectId: string | undefined,
  syncProject: (projectId: string) => Promise<void>,
  show: (props: any) => void
) => {
  const handleSaveExtraRequirements = useCallback(async (extraRequirements: string) => {
    if (!currentProject || !projectId) return;
    
    try {
      await updateProject(projectId, { extra_requirements: extraRequirements || '' });
      await syncProject(projectId);
      show({ message: '额外要求已保存', type: 'success' });
    } catch (error: any) {
      show({ 
        message: `保存失败: ${error.message || '未知错误'}`, 
        type: 'error' 
      });
    }
  }, [currentProject, projectId, syncProject, show]);

  const handleSaveTemplateStyle = useCallback(async (templateStyle: string) => {
    if (!currentProject || !projectId) return;
    
    try {
      await updateProject(projectId, { template_style: templateStyle || '' });
      await syncProject(projectId);
      show({ message: '风格描述已保存', type: 'success' });
    } catch (error: any) {
      show({ 
        message: `保存失败: ${error.message || '未知错误'}`, 
        type: 'error' 
      });
    }
  }, [currentProject, projectId, syncProject, show]);

  const handleSaveExportSettings = useCallback(async (
    exportExtractorMethod: ExportExtractorMethod,
    exportInpaintMethod: ExportInpaintMethod
  ) => {
    if (!currentProject || !projectId) return;
    
    try {
      await updateProject(projectId, { 
        export_extractor_method: exportExtractorMethod,
        export_inpaint_method: exportInpaintMethod 
      });
      await syncProject(projectId);
      show({ message: '导出设置已保存', type: 'success' });
    } catch (error: any) {
      show({ 
        message: `保存失败: ${error.message || '未知错误'}`, 
        type: 'error' 
      });
    }
  }, [currentProject, projectId, syncProject, show]);

  const handleRefresh = useCallback(async () => {
    const targetProjectId = projectId || currentProject?.id;
    if (!targetProjectId) {
      show({ message: '无法刷新：缺少项目ID', type: 'error' });
      return;
    }

    try {
      await syncProject(targetProjectId);
      show({ message: '刷新成功', type: 'success' });
    } catch (error: any) {
      show({ 
        message: error.message || '刷新失败，请稍后重试', 
        type: 'error' 
      });
    }
  }, [projectId, currentProject?.id, syncProject, show]);

  return {
    handleSaveExtraRequirements,
    handleSaveTemplateStyle,
    handleSaveExportSettings,
    handleRefresh,
  };
};

// 处理模板相关的 hooks
export const useTemplateHandlers = (
  projectId: string | undefined,
  syncProject: (projectId: string) => Promise<void>,
  userTemplates: UserTemplate[],
  show: (props: any) => void
) => {
  const handleTemplateSelect = useCallback(async (
    templateFile: File | null,
    templateId?: string,
    setSelectedTemplateId?: (id: string | null) => void,
    setSelectedPresetTemplateId?: (id: string | null) => void
  ) => {
    if (!projectId) return;
    
    let file = templateFile;
    if (templateId && !file) {
      file = await getTemplateFile(templateId, userTemplates);
      if (!file) {
        show({ message: '加载模板失败', type: 'error' });
        return;
      }
    }
    
    if (!file) {
      return;
    }
    
    try {
      await uploadTemplate(projectId, file);
      await syncProject(projectId);
      show({ message: '模板更换成功', type: 'success' });
      
      if (templateId && setSelectedTemplateId && setSelectedPresetTemplateId) {
        if (templateId.length <= 3 && /^\d+$/.test(templateId)) {
          setSelectedPresetTemplateId(templateId);
          setSelectedTemplateId(null);
        } else {
          setSelectedTemplateId(templateId);
          setSelectedPresetTemplateId(null);
        }
      }
    } catch (error: any) {
      show({ 
        message: `更换模板失败: ${error.message || '未知错误'}`, 
        type: 'error' 
      });
    }
  }, [projectId, syncProject, userTemplates, show]);

  return { handleTemplateSelect };
};

// 处理素材相关的 hooks
export const useMaterialHandlers = (
  setSelectedContextImages: React.Dispatch<React.SetStateAction<{
    useTemplate: boolean;
    descImageUrls: string[];
    uploadedFiles: File[];
  }>>,
  show: (props: any) => void
) => {
  const handleSelectMaterials = useCallback(async (materials: Material[]) => {
    try {
      const files = await Promise.all(
        materials.map((material) => materialUrlToFile(material))
      );
      setSelectedContextImages((prev) => ({
        ...prev,
        uploadedFiles: [...prev.uploadedFiles, ...files],
      }));
      show({ message: `已添加 ${materials.length} 个素材`, type: 'success' });
    } catch (error: any) {
      console.error('加载素材失败:', error);
      show({
        message: '加载素材失败: ' + (error.message || '未知错误'),
        type: 'error',
      });
    }
  }, [setSelectedContextImages, show]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedContextImages((prev) => ({
      ...prev,
      uploadedFiles: [...prev.uploadedFiles, ...files],
    }));
  }, [setSelectedContextImages]);

  const removeUploadedFile = useCallback((index: number) => {
    setSelectedContextImages((prev) => ({
      ...prev,
      uploadedFiles: prev.uploadedFiles.filter((_, i) => i !== index),
    }));
  }, [setSelectedContextImages]);

  return {
    handleSelectMaterials,
    handleFileUpload,
    removeUploadedFile,
  };
};

// 提取描述中的图片URL
export const extractImageUrlsFromDescription = (descriptionContent: DescriptionContent | undefined): string[] => {
  if (!descriptionContent) return [];
  
  let text: string = '';
  if ('text' in descriptionContent) {
    text = descriptionContent.text as string;
  } else if ('text_content' in descriptionContent && Array.isArray(descriptionContent.text_content)) {
    text = descriptionContent.text_content.join('\n');
  }
  
  if (!text) return [];
  
  const pattern = /!\[.*?\]\((.*?)\)/g;
  const matches: string[] = [];
  let match: RegExpExecArray | null;
  
  while ((match = pattern.exec(text)) !== null) {
    const url = match[1]?.trim();
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
      matches.push(url);
    }
  }
  
  return matches;
};
