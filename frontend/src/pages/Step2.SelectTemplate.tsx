import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { StepLayout, useToast } from '@/components/shared';
import { TemplateSelector, getTemplateFile } from '@/components/shared/TemplateSelector';
import { listProjects } from '@/api/endpoints';
import { useProjectStore } from '@/store/useProjectStore';

export const Step2SelectTemplate: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { projectId } = useParams<{ projectId: string }>();
  
  // 从上一步获取数据
  const { type: creationType, content } = (location.state as any) || {};
  
  const { initializeProject, isGlobalLoading, currentProject, syncProject } = useProjectStore();
  const { show, ToastContainer } = useToast();
  
  const [selectedTemplate, setSelectedTemplate] = useState<File | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [selectedPresetTemplateId, setSelectedPresetTemplateId] = useState<string | null>(null);
  const [userTemplates, setUserTemplates] = useState<any[]>([]);
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
      // 检查是否是首次使用
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
      
      const newProjectId = localStorage.getItem('currentProjectId');
      if (!newProjectId) {
        show({ message: '项目创建失败', type: 'error' });
        return;
      }
      
      // 根据创建类型跳转到不同步骤
      if (creationType === 'idea' || creationType === 'outline') {
        navigate(`/project/${newProjectId}/outline`);
      } else if (creationType === 'description') {
        navigate(`/project/${newProjectId}/detail`);
      }
    } catch (error: any) {
      console.error('创建项目失败:', error);
    }
  };

  return (
    <StepLayout
      currentStep={2}
      projectId={projectId || null}
      pageTitle="选择风格模板"
      navigation={{
        onPrevious: () => navigate('/create', { state: { type: creationType } }),
        onNext: handleSubmit,
        nextLabel: "开始生成",
        loadingNext: isGlobalLoading,
      }}
      isLoading={isGlobalLoading}
      loadingMessage="正在创建项目..."
    >
      {/* 主内容区 */}
      <div className="flex-1 p-3 md:p-6 overflow-y-auto">
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
                    } else {
                      setTemplateStyle('');
                    }
                  }}
                  className="w-4 h-4 text-banana-500 rounded focus:ring-banana-500"
                />
              </label>
            </div>

            {useTemplateStyle ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    风格描述
                  </label>
                  <textarea
                    value={templateStyle}
                    onChange={(e) => setTemplateStyle(e.target.value)}
                    placeholder="例如：简约商务风格，使用深蓝色和白色配色，字体清晰大方，布局整洁..."
                    rows={5}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-banana-500 focus:border-transparent resize-none"
                  />
                </div>
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-blue-900">
                    💡 <strong>提示：</strong>风格描述会在生成图片时自动添加到提示词中。
                    描述越详细，生成的 PPT 风格越符合您的期望。
                  </p>
                </div>
              </div>
            ) : (
              <TemplateSelector
                selectedTemplateId={selectedTemplateId}
                selectedPresetTemplateId={selectedPresetTemplateId}
                onSelect={handleTemplateSelect}
                projectId={projectId || null}
              />
            )}
          </div>
        </div>
      </div>

      <ToastContainer />
    </StepLayout>
  );
};
