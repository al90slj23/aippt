import React, { useState, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Paperclip, ImagePlus, FolderOpen } from 'lucide-react';
import { Button, Textarea, useToast, MaterialGeneratorModal, MaterialCenterModal, ReferenceFileList, ReferenceFileSelector, FilePreviewModal, ImagePreviewList } from '@/components/shared';
import { TemplateSelector, getTemplateFile } from '@/components/shared/TemplateSelector';
import { listUserTemplates, type UserTemplate, uploadReferenceFile, type ReferenceFile, triggerFileParse, uploadMaterial, listProjects } from '@/api/endpoints';
import { useProjectStore } from '@/store/useProjectStore';
import { PRESET_STYLES } from '@/config/presetStyles';

type CreationType = 'idea' | 'outline' | 'description';

export const CreateProject: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const creationType = (location.state as any)?.type as CreationType || 'idea';
  
  const { initializeProject, isGlobalLoading } = useProjectStore();
  const { show, ToastContainer } = useToast();
  
  const [content, setContent] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<File | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [selectedPresetTemplateId, setSelectedPresetTemplateId] = useState<string | null>(null);
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [isMaterialCenterOpen, setIsMaterialCenterOpen] = useState(false);
  const [userTemplates, setUserTemplates] = useState<UserTemplate[]>([]);
  const [referenceFiles, setReferenceFiles] = useState<ReferenceFile[]>([]);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [isFileSelectorOpen, setIsFileSelectorOpen] = useState(false);
  const [previewFileId, setPreviewFileId] = useState<string | null>(null);
  const [useTemplateStyle, setUseTemplateStyle] = useState(false);
  const [templateStyle, setTemplateStyle] = useState('');
  const [hoveredPresetId, setHoveredPresetId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 加载用户模板
  React.useEffect(() => {
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
  }, []);

  const config = {
    idea: {
      title: '一句话生成 PPT',
      placeholder: '例如：生成一份关于 AI 发展史的演讲 PPT',
      description: '输入你的想法，AI 将为你生成完整的 PPT',
      rows: 4,
    },
    outline: {
      title: '从大纲生成 PPT',
      placeholder: '粘贴你的 PPT 大纲...\n\n例如：\n第一部分：AI 的起源\n- 1950 年代的开端\n- 达特茅斯会议\n\n第二部分：发展历程\n...',
      description: '已有大纲？直接粘贴即可快速生成，AI 将自动切分为结构化大纲',
      rows: 12,
    },
    description: {
      title: '从描述生成 PPT',
      placeholder: '粘贴你的完整页面描述...\n\n例如：\n第 1 页\n标题：人工智能的诞生\n内容：1950 年，图灵提出"图灵测试"...\n\n第 2 页\n标题：AI 的发展历程\n内容：1950年代：符号主义...\n...',
      description: '已有完整描述？AI 将自动解析出大纲并切分为每页描述，直接生成图片',
      rows: 12,
    },
  };

  const currentConfig = config[creationType];

  // 处理粘贴事件
  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file) {
          if (file.type.startsWith('image/')) {
            e.preventDefault();
            await handleImageUpload(file);
            return;
          }
          
          const allowedExtensions = ['pdf', 'docx', 'pptx', 'doc', 'ppt', 'xlsx', 'xls', 'csv', 'txt', 'md'];
          const fileExt = file.name.split('.').pop()?.toLowerCase();
          
          if (fileExt && allowedExtensions.includes(fileExt)) {
            e.preventDefault();
            await handleFileUpload(file);
          }
        }
      }
    }
  };

  const handleImageUpload = async (file: File) => {
    if (isUploadingFile) return;
    setIsUploadingFile(true);
    try {
      show({ message: '正在上传图片...', type: 'info' });
      const cursorPosition = textareaRef.current?.selectionStart || content.length;
      const response = await uploadMaterial(file, null);
      
      if (response?.data?.url) {
        const imageUrl = response.data.url;
        const markdownImage = `![image](${imageUrl})`;
        
        setContent(prev => {
          const before = prev.slice(0, cursorPosition);
          const after = prev.slice(cursorPosition);
          const prefix = before && !before.endsWith('\n') ? '\n' : '';
          const suffix = after && !after.startsWith('\n') ? '\n' : '';
          return before + prefix + markdownImage + suffix + after;
        });
        
        setTimeout(() => {
          if (textareaRef.current) {
            const newPosition = cursorPosition + (content.slice(0, cursorPosition) && !content.slice(0, cursorPosition).endsWith('\n') ? 1 : 0) + markdownImage.length;
            textareaRef.current.selectionStart = newPosition;
            textareaRef.current.selectionEnd = newPosition;
            textareaRef.current.focus();
          }
        }, 0);
        
        show({ message: '图片上传成功！', type: 'success' });
      }
    } catch (error: any) {
      show({ message: `图片上传失败: ${error?.response?.data?.error?.message || error.message}`, type: 'error' });
    } finally {
      setIsUploadingFile(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (isUploadingFile) return;
    const maxSize = 200 * 1024 * 1024;
    if (file.size > maxSize) {
      show({ message: `文件过大：${(file.size / 1024 / 1024).toFixed(1)}MB，最大支持 200MB`, type: 'error' });
      return;
    }

    const fileExt = file.name.split('.').pop()?.toLowerCase();
    if (fileExt === 'ppt' || fileExt === 'pptx') {
      show({ message: '💡 提示：建议将PPT转换为PDF格式上传，可获得更好的解析效果', type: 'info' });
    }
    
    setIsUploadingFile(true);
    try {
      const response = await uploadReferenceFile(file, null);
      if (response?.data?.file) {
        const uploadedFile = response.data.file;
        setReferenceFiles(prev => [...prev, uploadedFile]);
        show({ message: '文件上传成功', type: 'success' });
        
        if (uploadedFile.parse_status === 'pending') {
          try {
            const parseResponse = await triggerFileParse(uploadedFile.id);
            if (parseResponse?.data?.file) {
              setReferenceFiles(prev => prev.map(f => f.id === uploadedFile.id ? parseResponse.data.file : f));
            }
          } catch (parseError) {
            console.error('触发文件解析失败:', parseError);
          }
        }
      }
    } catch (error: any) {
      if (error?.response?.status === 413) {
        show({ message: `文件过大：${(file.size / 1024 / 1024).toFixed(1)}MB，最大支持 200MB`, type: 'error' });
      } else {
        show({ message: `文件上传失败: ${error?.response?.data?.error?.message || error.message}`, type: 'error' });
      }
    } finally {
      setIsUploadingFile(false);
    }
  };

  const handleFileRemove = (fileId: string) => {
    setReferenceFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleFileStatusChange = (updatedFile: ReferenceFile) => {
    setReferenceFiles(prev => prev.map(f => f.id === updatedFile.id ? updatedFile : f));
  };

  const handleFilesSelected = (selectedFiles: ReferenceFile[]) => {
    setReferenceFiles(prev => {
      const existingIds = new Set(prev.map(f => f.id));
      const newFiles = selectedFiles.filter(f => !existingIds.has(f.id));
      const updated = prev.map(f => {
        const updatedFile = selectedFiles.find(sf => sf.id === f.id);
        return updatedFile || f;
      });
      return [...updated, ...newFiles];
    });
    show({ message: `已添加 ${selectedFiles.length} 个参考文件`, type: 'success' });
  };

  const selectedFileIds = useMemo(() => referenceFiles.map(f => f.id), [referenceFiles]);

  const handleRemoveImage = (imageUrl: string) => {
    setContent(prev => {
      const imageRegex = new RegExp(`!\\[[^\\]]*\\]\\(${imageUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)`, 'g');
      let newContent = prev.replace(imageRegex, '');
      newContent = newContent.replace(/\n{3,}/g, '\n\n');
      return newContent.trim();
    });
    show({ message: '已移除图片', type: 'success' });
  };

  const handleTemplateSelect = async (templateFile: File | null, templateId?: string) => {
    if (templateFile) {
      setSelectedTemplate(templateFile);
    }
    
    if (templateId) {
      if (templateId.length <= 3 && /^\d+$/.test(templateId)) {
        setSelectedPresetTemplateId(templateId);
        setSelectedTemplateId(null);
      } else {
        setSelectedTemplateId(templateId);
        setSelectedPresetTemplateId(null);
      }
    } else {
      setSelectedTemplateId(null);
      setSelectedPresetTemplateId(null);
    }
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      show({ message: '请输入内容', type: 'error' });
      return;
    }

    const parsingFiles = referenceFiles.filter(f => f.parse_status === 'pending' || f.parse_status === 'parsing');
    if (parsingFiles.length > 0) {
      show({ message: `还有 ${parsingFiles.length} 个参考文件正在解析中，请等待解析完成`, type: 'info' });
      return;
    }

    try {
      try {
        const historyResponse = await listProjects(1, 0);
        if ((historyResponse.data?.projects || []).length === 0) {
          show({ message: '建议先到设置页底部进行服务测试，避免后续功能异常', type: 'info' });
        }
      } catch (error) {
        console.warn('检查历史项目失败，跳过提示:', error);
      }

      let templateFile = selectedTemplate;
      if (!templateFile && (selectedTemplateId || selectedPresetTemplateId)) {
        const templateId = selectedTemplateId || selectedPresetTemplateId;
        if (templateId) {
          templateFile = await getTemplateFile(templateId, userTemplates);
        }
      }
      
      const styleDesc = templateStyle.trim() ? templateStyle.trim() : undefined;
      
      await initializeProject(creationType, content, templateFile || undefined, styleDesc);
      
      const projectId = localStorage.getItem('currentProjectId');
      if (!projectId) {
        show({ message: '项目创建失败', type: 'error' });
        return;
      }
      
      // 关联参考文件和素材...
      
      if (creationType === 'idea' || creationType === 'outline') {
        navigate(`/project/${projectId}/outline`);
      } else if (creationType === 'description') {
        navigate(`/project/${projectId}/detail`);
      }
    } catch (error: any) {
      console.error('创建项目失败:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50/30 to-pink-50/50">
      {/* 导航栏 */}
      <nav className="bg-white/40 backdrop-blur-2xl border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            icon={<ArrowLeft size={18} />}
            onClick={() => navigate('/')}
          >
            返回
          </Button>
          <h1 className="text-xl font-bold text-gray-900">{currentConfig.title}</h1>
        </div>
      </nav>

      {/* 主内容 */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          {/* 描述 */}
          <p className="text-gray-600">{currentConfig.description}</p>

          {/* 输入区 */}
          <div className="relative">
            <Textarea
              ref={textareaRef}
              placeholder={currentConfig.placeholder}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onPaste={handlePaste}
              rows={currentConfig.rows}
              className="pr-20 pb-14"
            />
            
            <button
              type="button"
              onClick={() => setIsFileSelectorOpen(true)}
              className="absolute left-3 bottom-3 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="选择参考文件"
            >
              <Paperclip size={18} />
            </button>

            <div className="absolute right-3 bottom-3">
              <Button
                size="sm"
                onClick={handleSubmit}
                loading={isGlobalLoading}
                disabled={!content.trim() || referenceFiles.some(f => f.parse_status === 'pending' || f.parse_status === 'parsing')}
              >
                {referenceFiles.some(f => f.parse_status === 'pending' || f.parse_status === 'parsing') ? '解析中...' : '下一步'}
              </Button>
            </div>
          </div>

          <ImagePreviewList content={content} onRemoveImage={handleRemoveImage} />
          <ReferenceFileList
            files={referenceFiles}
            onFileClick={setPreviewFileId}
            onFileDelete={handleFileRemove}
            onFileStatusChange={handleFileStatusChange}
            deleteMode="remove"
          />

          {/* 模板选择 */}
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">选择风格模板</h3>
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-sm text-gray-600">使用文字描述风格</span>
                <input
                  type="checkbox"
                  checked={useTemplateStyle}
                  onChange={(e) => {
                    setUseTemplateStyle(e.target.checked);
                    if (e.target.checked) {
                      setSelectedTemplate(null);
                      setSelectedTemplateId(null);
                      setSelectedPresetTemplateId(null);
                    }
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-banana-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-banana-500 relative"></div>
              </label>
            </div>

            {useTemplateStyle ? (
              <div className="space-y-3">
                <Textarea
                  placeholder="描述您想要的 PPT 风格，例如：简约商务风格，使用蓝色和白色配色，字体清晰大方..."
                  value={templateStyle}
                  onChange={(e) => setTemplateStyle(e.target.value)}
                  rows={3}
                />
                <div className="flex flex-wrap gap-2">
                  {PRESET_STYLES.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setTemplateStyle(preset.description)}
                      className="px-3 py-1.5 text-xs font-medium rounded-full border-2 border-gray-200 hover:border-banana-400 hover:bg-banana-50 transition-all"
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <TemplateSelector
                onSelect={handleTemplateSelect}
                selectedTemplateId={selectedTemplateId}
                selectedPresetTemplateId={selectedPresetTemplateId}
                showUpload={true}
                projectId={null}
              />
            )}
          </div>
        </div>
      </main>

      <ToastContainer />
      <MaterialGeneratorModal projectId={null} isOpen={isMaterialModalOpen} onClose={() => setIsMaterialModalOpen(false)} />
      <MaterialCenterModal isOpen={isMaterialCenterOpen} onClose={() => setIsMaterialCenterOpen(false)} />
      <ReferenceFileSelector
        projectId={null}
        isOpen={isFileSelectorOpen}
        onClose={() => setIsFileSelectorOpen(false)}
        onSelect={handleFilesSelected}
        multiple={true}
        initialSelectedIds={selectedFileIds}
      />
      <FilePreviewModal fileId={previewFileId} onClose={() => setPreviewFileId(null)} />
    </div>
  );
};
