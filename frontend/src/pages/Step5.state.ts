import { useState, useRef } from 'react';
import type { ImageVersion, ExportExtractorMethod, ExportInpaintMethod } from '@/types';
import type { UserTemplate } from '@/api/endpoints';

/**
 * Step5 页面的所有状态管理
 */
export const useStep5State = (currentProject: any) => {
  // 页面选择和导航
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  // 模态框状态
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isProjectSettingsOpen, setIsProjectSettingsOpen] = useState(false);
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [isMaterialSelectorOpen, setIsMaterialSelectorOpen] = useState(false);
  
  // 编辑相关状态
  const [editPrompt, setEditPrompt] = useState('');
  const [editOutlineTitle, setEditOutlineTitle] = useState('');
  const [editOutlinePoints, setEditOutlinePoints] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [isOutlineExpanded, setIsOutlineExpanded] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  
  // 多选模式
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedPageIds, setSelectedPageIds] = useState<Set<string>>(new Set());
  
  // 加载和刷新状态
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUploadingTemplate, setIsUploadingTemplate] = useState(false);
  const [isSavingRequirements, setIsSavingRequirements] = useState(false);
  const [isSavingTemplateStyle, setIsSavingTemplateStyle] = useState(false);
  const [isSavingExportSettings, setIsSavingExportSettings] = useState(false);
  
  // 图片版本
  const [imageVersions, setImageVersions] = useState<ImageVersion[]>([]);
  const [showVersionMenu, setShowVersionMenu] = useState(false);
  
  // 模板选择
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [selectedPresetTemplateId, setSelectedPresetTemplateId] = useState<string | null>(null);
  const [userTemplates, setUserTemplates] = useState<UserTemplate[]>([]);
  
  // 上下文图片
  const [selectedContextImages, setSelectedContextImages] = useState<{
    useTemplate: boolean;
    descImageUrls: string[];
    uploadedFiles: File[];
  }>({
    useTemplate: false,
    descImageUrls: [],
    uploadedFiles: [],
  });
  
  // 项目设置
  const [extraRequirements, setExtraRequirements] = useState<string>('');
  const [templateStyle, setTemplateStyle] = useState<string>('');
  const [exportExtractorMethod, setExportExtractorMethod] = useState<ExportExtractorMethod>(
    (currentProject?.export_extractor_method as ExportExtractorMethod) || 'hybrid'
  );
  const [exportInpaintMethod, setExportInpaintMethod] = useState<ExportInpaintMethod>(
    (currentProject?.export_inpaint_method as ExportInpaintMethod) || 'hybrid'
  );
  
  // 编辑上下文缓存
  const [editContextByPage, setEditContextByPage] = useState<Record<string, {
    prompt: string;
    contextImages: {
      useTemplate: boolean;
      descImageUrls: string[];
      uploadedFiles: File[];
    };
  }>>({});
  
  // 区域选择状态
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [isRegionSelectionMode, setIsRegionSelectionMode] = useState(false);
  const [isSelectingRegion, setIsSelectingRegion] = useState(false);
  const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null);
  const [selectionRect, setSelectionRect] = useState<{ 
    left: number; 
    top: number; 
    width: number; 
    height: number 
  } | null>(null);
  
  // Refs
  const isEditingRequirements = useRef(false);
  const isEditingTemplateStyle = useRef(false);
  const lastProjectId = useRef<string | null>(null);

  return {
    // 页面选择
    selectedIndex,
    setSelectedIndex,
    
    // 模态框
    isEditModalOpen,
    setIsEditModalOpen,
    isTemplateModalOpen,
    setIsTemplateModalOpen,
    showExportMenu,
    setShowExportMenu,
    isProjectSettingsOpen,
    setIsProjectSettingsOpen,
    isMaterialModalOpen,
    setIsMaterialModalOpen,
    isMaterialSelectorOpen,
    setIsMaterialSelectorOpen,
    
    // 编辑
    editPrompt,
    setEditPrompt,
    editOutlineTitle,
    setEditOutlineTitle,
    editOutlinePoints,
    setEditOutlinePoints,
    editDescription,
    setEditDescription,
    isOutlineExpanded,
    setIsOutlineExpanded,
    isDescriptionExpanded,
    setIsDescriptionExpanded,
    
    // 多选
    isMultiSelectMode,
    setIsMultiSelectMode,
    selectedPageIds,
    setSelectedPageIds,
    
    // 加载状态
    isRefreshing,
    setIsRefreshing,
    isUploadingTemplate,
    setIsUploadingTemplate,
    isSavingRequirements,
    setIsSavingRequirements,
    isSavingTemplateStyle,
    setIsSavingTemplateStyle,
    isSavingExportSettings,
    setIsSavingExportSettings,
    
    // 版本
    imageVersions,
    setImageVersions,
    showVersionMenu,
    setShowVersionMenu,
    
    // 模板
    selectedTemplateId,
    setSelectedTemplateId,
    selectedPresetTemplateId,
    setSelectedPresetTemplateId,
    userTemplates,
    setUserTemplates,
    
    // 上下文图片
    selectedContextImages,
    setSelectedContextImages,
    
    // 项目设置
    extraRequirements,
    setExtraRequirements,
    templateStyle,
    setTemplateStyle,
    exportExtractorMethod,
    setExportExtractorMethod,
    exportInpaintMethod,
    setExportInpaintMethod,
    
    // 编辑上下文
    editContextByPage,
    setEditContextByPage,
    
    // 区域选择
    imageRef,
    isRegionSelectionMode,
    setIsRegionSelectionMode,
    isSelectingRegion,
    setIsSelectingRegion,
    selectionStart,
    setSelectionStart,
    selectionRect,
    setSelectionRect,
    
    // Refs
    isEditingRequirements,
    isEditingTemplateStyle,
    lastProjectId,
  };
};
