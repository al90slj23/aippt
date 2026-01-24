import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { ArrowLeft, Home, Sparkles } from 'lucide-react';
import { Button, useToast, ProgressSteps, MaterialGeneratorModal, MaterialCenterModal } from '@/components/shared';
import { TemplateSelector, getTemplateFile } from '@/components/shared/TemplateSelector';
import { listUserTemplates, type UserTemplate, type ReferenceFile, listProjects } from '@/api/endpoints';
import { useProjectStore } from '@/store/useProjectStore';
import { PRESET_STYLES } from '@/config/presetStyles';

type CreationType = 'idea' | 'outline' | 'description';

export const Step2SelectTemplate: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { projectId } = useParams<{ projectId: string }>();
  
  // 从上一步获取数据
  const { type: creationType, content, referenceFiles } = (location.state as any) || {};
  
  const { initializeProject, isGlobalLoading, currentProject, syncProject } = useProjectStore();
  const { show, ToastContainer } = useToast();
  
  const [selectedTemplate, setSelectedTemplate] = useState<File | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [selectedPresetTemplateId, setSelectedPresetTemplateId] = useState<string | null>(null);
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [isMaterialCenterOpen, setIsMaterialCenterOpen] = useState(false);
  const [userTemplates, setUserTemplates] = useState<UserTemplate[]>([]);
  const [useTemplateStyle, setUseTemplateStyle] = useState(false);
  const [templateStyle, setTemplateStyle] = useState('');

  // 如果有 projectId，加载项目数据
  useEffect(() => {
    if (projectId && (!currentProject || currentProject.id !== projectId)) {
      syncProject(projectId);
    }
  }, [projectId, currentProject, syncProject]);

  // 如果没有从上一步传递数据且没有 projectId，返回首页
  useEffect(() => {
    if (!projectId && (!creationType || !content)) {
      show({ message: '请先完成步骤1', type: 'error' });
      navigate('/');
    }
  }, [projectId, creationType, content, navigate, show]);

  // 加载用户模板
  useEffect(() => {
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
    if (!content || !creationType) {
      show({ message: '缺少必要数据，请重新开始', type: 'error' });
      navigate('/');
      return;
    }

    try {
      // 检查是否是首次使用（提示进行服务测试）
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
      
      // 关联参考文件（如果有）
      if (referenceFiles && Array.isArray(referenceFiles) && referenceFiles.length > 0) {
        // 参考文件已经在步骤1上传，这里只需要关联到项目
        // 实际关联逻辑在 initializeProject 中处理
      }
      
      // 根据创建类型跳转到不同步骤
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
            <span className="text-sm md:text-lg font-semibold hidden lg:inline">选择风格模板</span>
          </div>
          <div></div>
        </div>
      </div>
      
      {/* 进度导航条 */}
      <ProgressSteps currentStep={2} projectId={projectId || null} />

      {/* 主内容区 */}
      <main className="flex-1 p-3 md:p-6 overflow-y-auto pb-28 md:pb-32">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold mb-2">选择风格模板</h2>
                <p className="text-gray-600">选择一个模板或描述您想要的风格</p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-sm text-gray-600">使用文字描述</span>
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
                <textarea
                  placeholder="描述您想要的 PPT 风格，例如：简约商务风格，使用蓝色和白色配色，字体清晰大方..."
                  value={templateStyle}
                  onChange={(e) => setTemplateStyle(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-banana-500 resize-none"
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

      {/* 底部固定导航栏 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-5 flex items-center justify-between">
          <Button
            variant="ghost"
            size="lg"
            icon={<ArrowLeft size={20} className="md:w-[22px] md:h-[22px]" />}
            onClick={() => navigate('/create', { state: { type: creationType } })}
            className="text-base md:text-lg font-semibold px-6 md:px-8 py-3 md:py-4"
          >
            上一步
          </Button>
          
          <Button
            variant="primary"
            size="lg"
            onClick={handleSubmit}
            loading={isGlobalLoading}
            className="text-base md:text-lg font-semibold px-6 md:px-8 py-3 md:py-4"
          >
            开始生成
          </Button>
        </div>
      </div>

      <ToastContainer />

      {/* 全屏遮罩 Loading */}
      {isGlobalLoading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-2xl p-8 flex flex-col items-center gap-4 max-w-sm mx-4">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-banana-200 border-t-banana-500 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-banana-500 animate-pulse" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-gray-900 mb-1">正在创建项目</p>
              <p className="text-sm text-gray-500">请稍候，正在初始化您的 PPT 项目...</p>
            </div>
          </div>
        </div>
      )}
      <MaterialGeneratorModal projectId={null} isOpen={isMaterialModalOpen} onClose={() => setIsMaterialModalOpen(false)} />
      <MaterialCenterModal isOpen={isMaterialCenterOpen} onClose={() => setIsMaterialCenterOpen(false)} />
    </div>
  );
};
