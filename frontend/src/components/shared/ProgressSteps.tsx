import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';

interface Step {
  number: number;
  label: string;
  path: string;
}

interface ProgressStepsProps {
  currentStep: number;
  projectId: string | null;
  className?: string;
}

const steps: Step[] = [
  { number: 1, label: '填写内容', path: 'create' },
  { number: 2, label: '选择模板', path: 'create' },
  { number: 3, label: '编辑大纲', path: 'outline' },
  { number: 4, label: '编辑描述', path: 'detail' },
  { number: 5, label: '生成图片', path: 'preview' },
];

export const ProgressSteps: React.FC<ProgressStepsProps> = ({
  currentStep,
  projectId,
  className = '',
}) => {
  const navigate = useNavigate();

  const handleStepClick = (step: Step) => {
    // 只允许点击当前步骤之前的步骤（已完成的步骤）
    // 如果没有 projectId（在创建项目页面），不允许跳转
    if (step.number < currentStep && projectId) {
      navigate(`/project/${projectId}/${step.path}`);
    }
  };

  return (
    <div className={`bg-white border-b border-gray-200 ${className}`}>
      <div className="max-w-5xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <React.Fragment key={step.number}>
              {/* 步骤圆圈 */}
              <div className="flex flex-col items-center flex-1">
                <button
                  onClick={() => handleStepClick(step)}
                  disabled={step.number >= currentStep}
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm
                    transition-all duration-200
                    ${
                      step.number < currentStep
                        ? 'bg-green-500 text-white cursor-pointer hover:bg-green-600'
                        : step.number === currentStep
                        ? 'bg-banana-500 text-white'
                        : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    }
                  `}
                >
                  {step.number < currentStep ? (
                    <Check size={20} />
                  ) : (
                    step.number
                  )}
                </button>
                <span
                  className={`
                    mt-2 text-sm font-medium
                    ${
                      step.number === currentStep
                        ? 'text-banana-600'
                        : step.number < currentStep
                        ? 'text-green-600'
                        : 'text-gray-400'
                    }
                  `}
                >
                  {step.label}
                </span>
              </div>

              {/* 连接线 */}
              {index < steps.length - 1 && (
                <div className="flex-1 h-0.5 mx-2 mb-6">
                  <div
                    className={`
                      h-full transition-all duration-300
                      ${
                        step.number < currentStep
                          ? 'bg-green-500'
                          : 'bg-gray-200'
                      }
                    `}
                  />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};
