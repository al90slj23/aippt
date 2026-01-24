import React, { useState, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Paperclip, Home, ArrowRight } from 'lucide-react';
import { Button, Textarea, useToast, ReferenceFileList, ReferenceFileSelector, FilePreviewModal, ImagePreviewList, ProgressSteps } from '@/components/shared';
import { uploadReferenceFile, type ReferenceFile, triggerFileParse, uploadMaterial } from '@/api/endpoints';

type CreationType = 'idea' | 'outline' | 'description';

export const Step1FillContent: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const creationType = (location.state as any)?.type as CreationType || 'idea';
  
  const { show, ToastContainer } = useToast();
  
  const [content, setContent] = useState('');
  const [referenceFiles, setReferenceFiles] = useState<ReferenceFile[]>([]);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [isFileSelectorOpen, setIsFileSelectorOpen] = useState(false);
  const [previewFileId, setPreviewFileId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
              setReferenceFiles(prev => prev.map(f => f.id === uploadedFile.id ? parseResponse.data!.file : f));
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

  // 处理下一步
  const handleNextStep = () => {
    if (!content.trim()) {
      show({ message: '请输入内容', type: 'error' });
      return;
    }
    if (referenceFiles.some(f => f.parse_status === 'pending' || f.parse_status === 'parsing')) {
      show({ message: '请等待文件解析完成', type: 'info' });
      return;
    }
    
    // 导航到步骤2，传递数据
    navigate('/create/step2', { 
      state: { 
        type: creationType,
        content,
        referenceFiles,
      } 
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 顶部导航栏 */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
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
            <span className="text-sm md:text-lg font-semibold hidden lg:inline">{currentConfig.title}</span>
          </div>
          <div></div>
        </div>
      </div>
      
      {/* 进度导航条 */}
      <ProgressSteps currentStep={1} projectId={null} />

      {/* 主内容区 */}
      <main className="flex-1 p-3 md:p-6 overflow-y-auto pb-28 md:pb-32">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-2">{currentConfig.title}</h2>
              <p className="text-gray-600">{currentConfig.description}</p>
            </div>

            {/* 输入区 */}
            <div className="relative">
              <Textarea
                ref={textareaRef}
                placeholder={currentConfig.placeholder}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onPaste={handlePaste}
                rows={currentConfig.rows}
                className="pr-20"
              />
              
              <button
                type="button"
                onClick={() => setIsFileSelectorOpen(true)}
                className="absolute left-3 bottom-3 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="选择参考文件"
              >
                <Paperclip size={18} />
              </button>
            </div>

            <ImagePreviewList content={content} onRemoveImage={handleRemoveImage} />
            <ReferenceFileList
              files={referenceFiles}
              onFileClick={setPreviewFileId}
              onFileDelete={handleFileRemove}
              onFileStatusChange={handleFileStatusChange}
              deleteMode="remove"
            />
          </div>
        </div>
      </main>

      {/* 底部固定导航栏 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-5 flex items-center justify-between">
          <Button
            variant="ghost"
            size="lg"
            icon={<ArrowLeft size={20} className="md:w-[22px] md:h-[22px]" />}
            onClick={() => navigate('/')}
            className="text-base md:text-lg font-semibold px-6 md:px-8 py-3 md:py-4"
          >
            上一步
          </Button>
          
          <Button
            variant="primary"
            size="lg"
            icon={<ArrowRight size={20} className="md:w-[22px] md:h-[22px]" />}
            onClick={handleNextStep}
            disabled={!content.trim() || referenceFiles.some(f => f.parse_status === 'pending' || f.parse_status === 'parsing')}
            className="text-base md:text-lg font-semibold px-6 md:px-8 py-3 md:py-4"
          >
            下一步
          </Button>
        </div>
      </div>

      <ToastContainer />
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
