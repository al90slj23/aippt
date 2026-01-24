import { useEffect } from 'react';
import { listUserTemplates, getPageImageVersions } from '@/api/endpoints';
import type { Project, ExportExtractorMethod, ExportInpaintMethod } from '@/types';

/**
 * 项目数据加载 effect
 */
export const useProjectDataEffect = (
  projectId: string | undefined,
  currentProject: Project | null,
  syncProject: (projectId: string) => Promise<void>,
  setUserTemplates: (templates: any[]) => void
) => {
  useEffect(() => {
    if (projectId && (!currentProject || currentProject.id !== projectId)) {
      syncProject(projectId);
    }
    
    const loadTemplates = async () => {
      try {
        const response = await listUserTemplates();
        if (response.data?.templates) {
          setUserTemplates(response.data.templates);
        }
      } catch (error) {
        console.error('加载用户模板失败:', error);
      }
    };
    loadTemplates();
  }, [projectId, currentProject, syncProject, setUserTemplates]);
};

/**
 * 项目设置初始化 effect
 */
export const useProjectSettingsEffect = (
  currentProject: Project | null,
  setExtraRequirements: (value: string) => void,
  setTemplateStyle: (value: string) => void,
  setExportExtractorMethod: (value: ExportExtractorMethod) => void,
  setExportInpaintMethod: (value: ExportInpaintMethod) => void,
  lastProjectId: React.MutableRefObject<string | null>,
  isEditingRequirements: React.MutableRefObject<boolean>,
  isEditingTemplateStyle: React.MutableRefObject<boolean>
) => {
  useEffect(() => {
    if (currentProject) {
      const isNewProject = lastProjectId.current !== currentProject.id;
      
      if (isNewProject) {
        setExtraRequirements(currentProject.extra_requirements || '');
        setTemplateStyle(currentProject.template_style || '');
        setExportExtractorMethod((currentProject.export_extractor_method as ExportExtractorMethod) || 'hybrid');
        setExportInpaintMethod((currentProject.export_inpaint_method as ExportInpaintMethod) || 'hybrid');
        lastProjectId.current = currentProject.id || null;
        isEditingRequirements.current = false;
        isEditingTemplateStyle.current = false;
      } else {
        if (!isEditingRequirements.current) {
          setExtraRequirements(currentProject.extra_requirements || '');
        }
        if (!isEditingTemplateStyle.current) {
          setTemplateStyle(currentProject.template_style || '');
        }
      }
    }
  }, [
    currentProject?.id, 
    currentProject?.extra_requirements, 
    currentProject?.template_style,
    setExtraRequirements,
    setTemplateStyle,
    setExportExtractorMethod,
    setExportInpaintMethod,
    lastProjectId,
    isEditingRequirements,
    isEditingTemplateStyle
  ]);
};

/**
 * 图片版本加载 effect
 */
export const useImageVersionsEffect = (
  currentProject: Project | null,
  projectId: string | undefined,
  selectedIndex: number,
  setImageVersions: (versions: any[]) => void,
  setShowVersionMenu: (show: boolean) => void
) => {
  useEffect(() => {
    const loadVersions = async () => {
      if (!currentProject || !projectId || selectedIndex < 0 || selectedIndex >= currentProject.pages.length) {
        setImageVersions([]);
        setShowVersionMenu(false);
        return;
      }

      const page = currentProject.pages[selectedIndex];
      if (!page?.id) {
        setImageVersions([]);
        setShowVersionMenu(false);
        return;
      }

      try {
        const response = await getPageImageVersions(projectId, page.id);
        if (response.data?.versions) {
          setImageVersions(response.data.versions);
        }
      } catch (error) {
        console.error('Failed to load image versions:', error);
        setImageVersions([]);
      }
    };

    loadVersions();
  }, [currentProject, selectedIndex, projectId, setImageVersions, setShowVersionMenu]);
};

/**
 * 编辑上下文缓存 effect
 */
export const useEditContextCacheEffect = (
  isEditModalOpen: boolean,
  currentProject: Project | null,
  selectedIndex: number,
  editPrompt: string,
  selectedContextImages: any,
  setEditContextByPage: (fn: (prev: any) => any) => void
) => {
  useEffect(() => {
    if (!isEditModalOpen || !currentProject) return;
    const page = currentProject.pages[selectedIndex];
    const pageId = page?.id;
    if (!pageId) return;

    setEditContextByPage((prev: any) => ({
      ...prev,
      [pageId]: {
        prompt: editPrompt,
        contextImages: {
          useTemplate: selectedContextImages.useTemplate,
          descImageUrls: [...selectedContextImages.descImageUrls],
          uploadedFiles: [...selectedContextImages.uploadedFiles],
        },
      },
    }));
  }, [isEditModalOpen, currentProject, selectedIndex, editPrompt, selectedContextImages, setEditContextByPage]);
};

/**
 * 导出任务恢复 effect
 */
export const useExportTasksRestoreEffect = (
  restoreActiveTasks: () => void
) => {
  useEffect(() => {
    restoreActiveTasks();
  }, [restoreActiveTasks]);
};
