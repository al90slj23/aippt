import { useCallback } from 'react';
import { getImageUrl } from '@/api/client';
import { 
  getPageImageVersions, 
  setCurrentImageVersion, 
  updateProject, 
  uploadTemplate 
} from '@/api/endpoints';
import { getTemplateFile } from '@/components/shared/TemplateSelector';
import { materialUrlToFile } from '@/components/shared/MaterialSelector';
import type { Material, UserTemplate } from '@/api/endpoints';
import type { Project, Page, DescriptionContent } from '@/types';
import { normalizeErrorMessage } from '@/utils';
import { extractImageUrlsFromDescription } from './Step5.hooks';

/**
 * 编辑相关的处理函数
 */
export const useEditHandlers = (
  currentProject: Project | null,
  selectedIndex: number,
  updatePageLocal: (pageId: string, updates: Partial<Page>) => void,
  editPageImage: (pageId: string, prompt: string, context: any) => Promise<void>,
  show: (props: any) => void,
  state: any
) => {
  const {
    setEditOutlineTitle,
    setEditOutlinePoints,
    setEditDescription,
    setEditPrompt,
    setSelectedContextImages,
    setIsEditModalOpen,
    setIsOutlineExpanded,
    setIsDescriptionExpanded,
    setIsRegionSelectionMode,
    setSelectionStart,
    setSelectionRect,
    setIsSelectingRegion,
    editOutlineTitle,
    editOutlinePoints,
    editDescription,
    editPrompt,
    selectedContextImages,
    editContextByPage,
    setEditContextByPage,
  } = state;

  const handleEditPage = useCallback(() => {
    if (!currentProject) return;
    const page = currentProject.pages[selectedIndex];
    const pageId = page?.id;

    setIsOutlineExpanded(false);
    setIsDescriptionExpanded(false);

    setEditOutlineTitle(page?.outline_content?.title || '');
    setEditOutlinePoints(page?.outline_content?.points?.join('\n') || '');
    
    const descContent = page?.description_content;
    let descText = '';
    if (descContent) {
      if ('text' in descContent) {
        descText = descContent.text as string;
      } else if ('text_content' in descContent && Array.isArray(descContent.text_content)) {
        descText = descContent.text_content.join('\n');
      }
    }
    setEditDescription(descText);

    if (pageId && editContextByPage[pageId]) {
      const cached = editContextByPage[pageId];
      setEditPrompt(cached.prompt);
      setSelectedContextImages({
        useTemplate: cached.contextImages.useTemplate,
        descImageUrls: [...cached.contextImages.descImageUrls],
        uploadedFiles: [...cached.contextImages.uploadedFiles],
      });
    } else {
      setEditPrompt('');
      setSelectedContextImages({
        useTemplate: false,
        descImageUrls: [],
        uploadedFiles: [],
      });
    }

    setIsRegionSelectionMode(false);
    setSelectionStart(null);
    setSelectionRect(null);
    setIsSelectingRegion(false);

    setIsEditModalOpen(true);
  }, [currentProject, selectedIndex, editContextByPage, setEditOutlineTitle, setEditOutlinePoints, setEditDescription, setEditPrompt, setSelectedContextImages, setIsEditModalOpen, setIsOutlineExpanded, setIsDescriptionExpanded, setIsRegionSelectionMode, setSelectionStart, setSelectionRect, setIsSelectingRegion]);

  const handleSaveOutlineAndDescription = useCallback(() => {
    if (!currentProject) return;
    const page = currentProject.pages[selectedIndex];
    if (!page?.id) return;

    const updates: Partial<Page> = {};
    
    const originalTitle = page.outline_content?.title || '';
    const originalPoints = page.outline_content?.points?.join('\n') || '';
    if (editOutlineTitle !== originalTitle || editOutlinePoints !== originalPoints) {
      updates.outline_content = {
        title: editOutlineTitle,
        points: editOutlinePoints.split('\n').filter((p) => p.trim()),
      };
    }
    
    const descContent = page.description_content;
    let originalDesc = '';
    if (descContent) {
      if ('text' in descContent) {
        originalDesc = descContent.text as string;
      } else if ('text_content' in descContent && Array.isArray(descContent.text_content)) {
        originalDesc = descContent.text_content.join('\n');
      }
    }
    if (editDescription !== originalDesc) {
      updates.description_content = {
        text: editDescription,
      } as DescriptionContent;
    }
    
    if (Object.keys(updates).length > 0) {
      updatePageLocal(page.id, updates);
      show({ message: '大纲和描述已保存', type: 'success' });
    }
  }, [currentProject, selectedIndex, editOutlineTitle, editOutlinePoints, editDescription, updatePageLocal, show]);

  const handleSubmitEdit = useCallback(async () => {
    if (!currentProject || !editPrompt.trim()) return;
    
    const page = currentProject.pages[selectedIndex];
    if (!page.id) return;

    handleSaveOutlineAndDescription();

    await editPageImage(
      page.id,
      editPrompt,
      {
        useTemplate: selectedContextImages.useTemplate,
        descImageUrls: selectedContextImages.descImageUrls,
        uploadedFiles: selectedContextImages.uploadedFiles.length > 0 
          ? selectedContextImages.uploadedFiles 
          : undefined,
      }
    );

    setEditContextByPage((prev) => ({
      ...prev,
      [page.id!]: {
        prompt: editPrompt,
        contextImages: {
          useTemplate: selectedContextImages.useTemplate,
          descImageUrls: [...selectedContextImages.descImageUrls],
          uploadedFiles: [...selectedContextImages.uploadedFiles],
        },
      },
    }));

    setIsEditModalOpen(false);
  }, [currentProject, selectedIndex, editPrompt, selectedContextImages, editPageImage, handleSaveOutlineAndDescription, setEditContextByPage, setIsEditModalOpen]);

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

  return {
    handleEditPage,
    handleSaveOutlineAndDescription,
    handleSubmitEdit,
    handleFileUpload,
    removeUploadedFile,
    handleSelectMaterials,
  };
};

/**
 * 区域选择相关的处理函数
 */
export const useRegionSelectionHandlers = (
  imageRef: React.MutableRefObject<HTMLImageElement | null>,
  state: any,
  show: (props: any) => void
) => {
  const {
    isRegionSelectionMode,
    setIsSelectingRegion,
    setSelectionStart,
    setSelectionRect,
    selectionStart,
    isSelectingRegion,
    selectionRect,
    setSelectedContextImages,
  } = state;

  const handleSelectionMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isRegionSelectionMode || !imageRef.current) return;
    const rect = imageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (x < 0 || y < 0 || x > rect.width || y > rect.height) return;
    setIsSelectingRegion(true);
    setSelectionStart({ x, y });
    setSelectionRect(null);
  }, [isRegionSelectionMode, imageRef, setIsSelectingRegion, setSelectionStart, setSelectionRect]);

  const handleSelectionMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isRegionSelectionMode || !isSelectingRegion || !selectionStart || !imageRef.current) return;
    const rect = imageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const clampedX = Math.max(0, Math.min(x, rect.width));
    const clampedY = Math.max(0, Math.min(y, rect.height));

    const left = Math.min(selectionStart.x, clampedX);
    const top = Math.min(selectionStart.y, clampedY);
    const width = Math.abs(clampedX - selectionStart.x);
    const height = Math.abs(clampedY - selectionStart.y);

    setSelectionRect({ left, top, width, height });
  }, [isRegionSelectionMode, isSelectingRegion, selectionStart, imageRef, setSelectionRect]);

  const handleSelectionMouseUp = useCallback(async () => {
    if (!isRegionSelectionMode || !isSelectingRegion || !selectionRect || !imageRef.current) {
      setIsSelectingRegion(false);
      setSelectionStart(null);
      return;
    }

    setIsSelectingRegion(false);
    setSelectionStart(null);

    try {
      const img = imageRef.current;
      const { left, top, width, height } = selectionRect;
      if (width < 10 || height < 10) {
        return;
      }

      const naturalWidth = img.naturalWidth;
      const naturalHeight = img.naturalHeight;
      const displayWidth = img.clientWidth;
      const displayHeight = img.clientHeight;

      if (!naturalWidth || !naturalHeight || !displayWidth || !displayHeight) return;

      const scaleX = naturalWidth / displayWidth;
      const scaleY = naturalHeight / displayHeight;

      const sx = left * scaleX;
      const sy = top * scaleY;
      const sWidth = width * scaleX;
      const sHeight = height * scaleY;

      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(sWidth));
      canvas.height = Math.max(1, Math.round(sHeight));
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      try {
        ctx.drawImage(
          img,
          sx,
          sy,
          sWidth,
          sHeight,
          0,
          0,
          canvas.width,
          canvas.height
        );

        canvas.toBlob((blob) => {
          if (!blob) return;
          const file = new File([blob], `crop-${Date.now()}.png`, { type: 'image/png' });
          setSelectedContextImages((prev) => ({
            ...prev,
            uploadedFiles: [...prev.uploadedFiles, file],
          }));
          show({
            message: '已将选中区域添加为参考图片，可在下方"上传图片"中查看与删除',
            type: 'success',
          });
        }, 'image/png');
      } catch (e: any) {
        console.error('裁剪选中区域失败:', e);
        show({
          message: '无法从当前图片裁剪区域（浏览器安全限制）。可以尝试手动上传参考图片。',
          type: 'error',
        });
      }
    } finally {
      // 不清理 selectionRect
    }
  }, [isRegionSelectionMode, isSelectingRegion, selectionRect, imageRef, setIsSelectingRegion, setSelectionStart, setSelectedContextImages, show]);

  return {
    handleSelectionMouseDown,
    handleSelectionMouseMove,
    handleSelectionMouseUp,
  };
};

/**
 * 多选相关的处理函数
 */
export const useMultiSelectHandlers = (
  pagesWithImages: Page[],
  state: any
) => {
  const {
    isMultiSelectMode,
    setIsMultiSelectMode,
    selectedPageIds,
    setSelectedPageIds,
  } = state;

  const togglePageSelection = useCallback((pageId: string) => {
    setSelectedPageIds((prev: Set<string>) => {
      const next = new Set(prev);
      if (next.has(pageId)) {
        next.delete(pageId);
      } else {
        next.add(pageId);
      }
      return next;
    });
  }, [setSelectedPageIds]);

  const selectAllPages = useCallback(() => {
    const allPageIds = pagesWithImages.map(p => p.id!);
    setSelectedPageIds(new Set(allPageIds));
  }, [pagesWithImages, setSelectedPageIds]);

  const deselectAllPages = useCallback(() => {
    setSelectedPageIds(new Set());
  }, [setSelectedPageIds]);

  const toggleMultiSelectMode = useCallback(() => {
    setIsMultiSelectMode((prev: boolean) => {
      if (prev) {
        setSelectedPageIds(new Set());
      }
      return !prev;
    });
  }, [setIsMultiSelectMode, setSelectedPageIds]);

  const getSelectedPageIdsForExport = useCallback((): string[] | undefined => {
    if (!isMultiSelectMode || selectedPageIds.size === 0) {
      return undefined;
    }
    return Array.from(selectedPageIds);
  }, [isMultiSelectMode, selectedPageIds]);

  return {
    togglePageSelection,
    selectAllPages,
    deselectAllPages,
    toggleMultiSelectMode,
    getSelectedPageIdsForExport,
  };
};

/**
 * 其他处理函数
 */
export const useOtherHandlers = (
  projectId: string | undefined,
  currentProject: Project | null,
  selectedIndex: number,
  syncProject: (projectId: string) => Promise<void>,
  generateImages: (pageIds?: string[]) => Promise<void>,
  pageGeneratingTasks: Record<string, string>,
  userTemplates: UserTemplate[],
  show: (props: any) => void,
  confirm: (message: string, onConfirm: () => void, options?: any) => void,
  state: any
) => {
  const {
    setImageVersions,
    setShowVersionMenu,
    setIsRefreshing,
    setIsUploadingTemplate,
    setIsSavingRequirements,
    setIsSavingTemplateStyle,
    setIsSavingExportSettings,
    setIsTemplateModalOpen,
    setSelectedTemplateId,
    setSelectedPresetTemplateId,
    extraRequirements,
    templateStyle,
    exportExtractorMethod,
    exportInpaintMethod,
    isEditingRequirements,
    isEditingTemplateStyle,
  } = state;

  const handleRegeneratePage = useCallback(async () => {
    if (!currentProject) return;
    const page = currentProject.pages[selectedIndex];
    if (!page.id) return;
    
    if (pageGeneratingTasks[page.id]) {
      show({ message: '该页面正在生成中，请稍候...', type: 'info' });
      return;
    }
    
    try {
      await generateImages([page.id]);
      show({ message: '已开始生成图片，请稍候...', type: 'success' });
    } catch (error: any) {
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
  }, [currentProject, selectedIndex, pageGeneratingTasks, generateImages, show]);

  const handleSwitchVersion = useCallback(async (versionId: string) => {
    if (!currentProject || !currentProject.pages[selectedIndex]?.id || !projectId) return;
    const selectedPage = currentProject.pages[selectedIndex];
    
    try {
      await setCurrentImageVersion(projectId, selectedPage.id!, versionId);
      await syncProject(projectId);
      setShowVersionMenu(false);
      show({ message: '已切换到该版本', type: 'success' });
    } catch (error: any) {
      show({ 
        message: `切换失败: ${error.message || '未知错误'}`, 
        type: 'error' 
      });
    }
  }, [currentProject, selectedIndex, projectId, syncProject, setShowVersionMenu, show]);

  const handleRefresh = useCallback(async () => {
    const targetProjectId = projectId || currentProject?.id;
    if (!targetProjectId) {
      show({ message: '无法刷新：缺少项目ID', type: 'error' });
      return;
    }

    setIsRefreshing(true);
    try {
      await syncProject(targetProjectId);
      show({ message: '刷新成功', type: 'success' });
    } catch (error: any) {
      show({ 
        message: error.message || '刷新失败，请稍后重试', 
        type: 'error' 
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [projectId, currentProject?.id, syncProject, show, setIsRefreshing]);

  const handleSaveExtraRequirements = useCallback(async () => {
    if (!currentProject || !projectId) return;
    
    setIsSavingRequirements(true);
    try {
      await updateProject(projectId, { extra_requirements: extraRequirements || '' });
      isEditingRequirements.current = false;
      await syncProject(projectId);
      show({ message: '额外要求已保存', type: 'success' });
    } catch (error: any) {
      show({ 
        message: `保存失败: ${error.message || '未知错误'}`, 
        type: 'error' 
      });
    } finally {
      setIsSavingRequirements(false);
    }
  }, [currentProject, projectId, extraRequirements, syncProject, show, setIsSavingRequirements, isEditingRequirements]);

  const handleSaveTemplateStyle = useCallback(async () => {
    if (!currentProject || !projectId) return;
    
    setIsSavingTemplateStyle(true);
    try {
      await updateProject(projectId, { template_style: templateStyle || '' });
      isEditingTemplateStyle.current = false;
      await syncProject(projectId);
      show({ message: '风格描述已保存', type: 'success' });
    } catch (error: any) {
      show({ 
        message: `保存失败: ${error.message || '未知错误'}`, 
        type: 'error' 
      });
    } finally {
      setIsSavingTemplateStyle(false);
    }
  }, [currentProject, projectId, templateStyle, syncProject, show, setIsSavingTemplateStyle, isEditingTemplateStyle]);

  const handleSaveExportSettings = useCallback(async () => {
    if (!currentProject || !projectId) return;
    
    setIsSavingExportSettings(true);
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
    } finally {
      setIsSavingExportSettings(false);
    }
  }, [currentProject, projectId, exportExtractorMethod, exportInpaintMethod, syncProject, show, setIsSavingExportSettings]);

  const handleTemplateSelect = useCallback(async (templateFile: File | null, templateId?: string) => {
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
    
    setIsUploadingTemplate(true);
    try {
      await uploadTemplate(projectId, file);
      await syncProject(projectId);
      setIsTemplateModalOpen(false);
      show({ message: '模板更换成功', type: 'success' });
      
      if (templateId) {
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
    } finally {
      setIsUploadingTemplate(false);
    }
  }, [projectId, userTemplates, syncProject, show, setIsUploadingTemplate, setIsTemplateModalOpen, setSelectedTemplateId, setSelectedPresetTemplateId]);

  return {
    handleRegeneratePage,
    handleSwitchVersion,
    handleRefresh,
    handleSaveExtraRequirements,
    handleSaveTemplateStyle,
    handleSaveExportSettings,
    handleTemplateSelect,
  };
};
