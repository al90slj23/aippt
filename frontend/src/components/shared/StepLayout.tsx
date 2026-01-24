import React, { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Home, Sparkles } from 'lucide-react';
import { Button, ProgressSteps, AiRefineInput } from '@/components/shared';
import { useBrand } from '@/contexts/BrandContext';

export interface ActionButton {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  className?: string;
  isMainAction?: boolean; // 是否是主要操作按钮（中间带特效）
}

export interface StepLayoutProps {
  // 基础信息
  currentStep: 1 | 2 | 3 | 4 | 5;
  projectId: string | null;
  pageTitle: string;
  
  // 操作按钮（可选）
  actionButtons?: ActionButton[];
  
  // 进度信息（可选）
  progressInfo?: {
    current: number;
    total: number;
    label: string; // 例如："页已完成"、"个页面"
  };
  
  // AI 修改功能
  aiRefine?: {
    placeholder: string;
    onSubmit: (prompt: string) => Promise<void>;
    onStatusChange?: (isRefining: boolean) => void;
  };
  
  // 上下文信息栏（可选）
  contextBar?: ReactNode;
  
  // 主内容区域
  children: ReactNode;
  
  // 底部导航
  navigation: {
    onPrevious: () => void;
    onNext: () => void;
    previousLabel?: string;
    nextLabel?: string;
    disableNext?: boolean;
    loadingNext?: boolean; // 新增：下一步按钮的 loading 状态
    loadingPrevious?: boolean; // 新增：上一步按钮的 loading 状态
  };
  
  // 全局 loading 状态（显示全屏遮罩）
  isLoading?: boolean;
  loadingMessage?: string;
  
  // 是否来自历史记录
  fromHistory?: boolean;
}

export const StepLayout: React.FC<StepLayoutProps> = ({
  currentStep,
  projectId,
  pageTitle,
  actionButtons,
  progressInfo,
  aiRefine,
  contextBar,
  children,
  navigation,
  isLoading = false,
  loadingMessage = '处理中...',
}) => {
  const navigate = useNavigate();
  const { brandSettings } = useBrand();
  const [isAiRefineExpanded, setIsAiRefineExpanded] = React.useState(false);

  // 找到主要操作按钮（中间带特效的按钮）
  const mainActionButton = actionButtons?.find(btn => btn.isMainAction);
  const otherButtons = actionButtons?.filter(btn => !btn.isMainAction) || [];
  
  // 将主要按钮放在中间
  const leftButtons = otherButtons.slice(0, Math.ceil(otherButtons.length / 2));
  const rightButtons = otherButtons.slice(Math.ceil(otherButtons.length / 2));

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* 顶部栏 */}
      <div className="bg-white shadow-sm border-b border-gray-200 flex-shrink-0">
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
              <img
                src={brandSettings?.brand_logo_url || '/logo.png'}
                alt={brandSettings?.brand_name || 'Logo'}
                className="h-8 md:h-10 w-auto rounded-lg object-contain"
              />
              <span className="text-base md:text-xl font-bold">
                {brandSettings?.brand_name || '元愈PPT'}
              </span>
            </div>
            <span className="text-gray-400 hidden lg:inline">|</span>
            <span className="text-sm md:text-lg font-semibold hidden lg:inline">{pageTitle}</span>
          </div>
          <div></div>
        </div>
      </div>

      {/* 进度导航条 */}
      <ProgressSteps currentStep={currentStep} projectId={projectId} />

      {/* 操作面板（可选） */}
      {actionButtons && actionButtons.length > 0 && (
        <div className="bg-gradient-to-r from-banana-50 via-orange-50/30 to-pink-50/20 border-b border-gray-200 px-3 md:px-6 py-4 md:py-5 flex-shrink-0">
          <div className="max-w-5xl mx-auto space-y-4">
          {/* 按钮组 */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
            {/* 左侧按钮 */}
            {leftButtons.map((button, index) => (
              <Button
                key={`left-${index}`}
                variant={button.variant || 'secondary'}
                icon={button.icon}
                onClick={button.onClick}
                disabled={button.disabled}
                className={`flex-1 sm:flex-initial text-sm md:text-base px-6 py-3 ${button.className || ''}`}
              >
                {button.label}
              </Button>
            ))}

            {/* 中间主要按钮（带特效） */}
            {mainActionButton && aiRefine && (
              <Button
                variant={mainActionButton.variant || 'primary'}
                icon={
                  mainActionButton.icon || (
                    <Sparkles size={18} className="md:w-[20px] md:h-[20px] animate-pulse" />
                  )
                }
                onClick={() => {
                  if (aiRefine) {
                    setIsAiRefineExpanded(!isAiRefineExpanded);
                  }
                  mainActionButton.onClick();
                }}
                disabled={mainActionButton.disabled}
                className={`flex-1 sm:flex-initial text-sm md:text-base px-8 py-3 relative overflow-hidden group ${mainActionButton.className || ''}`}
              >
                <span className="relative z-10">{mainActionButton.label}</span>
                {/* 动态光效 */}
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></span>
              </Button>
            )}

            {/* 右侧按钮 */}
            {rightButtons.map((button, index) => (
              <Button
                key={`right-${index}`}
                variant={button.variant || 'secondary'}
                icon={button.icon}
                onClick={button.onClick}
                disabled={button.disabled}
                className={`flex-1 sm:flex-initial text-sm md:text-base px-6 py-3 ${button.className || ''}`}
              >
                {button.label}
              </Button>
            ))}
          </div>

          {/* 进度提示 */}
          {progressInfo && (
            <div className="text-center">
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full text-sm md:text-base text-gray-700 shadow-sm">
                <span className="font-semibold text-banana-600">{progressInfo.current}</span>
                {progressInfo.total > 0 && (
                  <>
                    <span>/</span>
                    <span>{progressInfo.total}</span>
                  </>
                )}
                <span>{progressInfo.label}</span>
              </span>
            </div>
          )}

          {/* AI 修改输入框 - 可展开 */}
          {aiRefine && isAiRefineExpanded && (
            <div className="animate-in slide-in-from-top duration-300">
              <div className="bg-white rounded-xl shadow-lg border-2 border-banana-300 p-4 md:p-6">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-banana-400 to-orange-400 rounded-full flex items-center justify-center">
                    <Sparkles size={20} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">
                      AI 智能修改
                    </h3>
                    <AiRefineInput
                      title=""
                      placeholder={aiRefine.placeholder}
                      onSubmit={aiRefine.onSubmit}
                      disabled={false}
                      className="!p-0 !bg-transparent !border-0"
                      onStatusChange={aiRefine.onStatusChange}
                    />
                  </div>
                  <button
                    onClick={() => setIsAiRefineExpanded(false)}
                    className="flex-shrink-0 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <span className="text-gray-400 text-xl">×</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      )}

      {/* 上下文信息栏（可选） */}
      {contextBar && (
        <div className="bg-banana-50 border-b border-banana-100 px-3 md:px-6 py-2 md:py-3 max-h-32 overflow-y-auto flex-shrink-0">
          {contextBar}
        </div>
      )}

      {/* 主内容区域 */}
      <div className="flex-1 overflow-hidden pb-28 md:pb-32">
        {children}
      </div>

      {/* 底部固定导航栏 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-5 flex items-center justify-between">
          {/* 左侧：上一步按钮 */}
          <Button
            variant="ghost"
            size="lg"
            icon={<ArrowLeft size={20} className="md:w-[22px] md:h-[22px]" />}
            onClick={navigation.onPrevious}
            loading={navigation.loadingPrevious}
            disabled={navigation.loadingPrevious || navigation.loadingNext}
            className="text-base md:text-lg font-semibold px-6 md:px-8 py-3 md:py-4"
          >
            {navigation.previousLabel || '上一步'}
          </Button>

          {/* 右侧：下一步按钮 */}
          <Button
            variant="primary"
            size="lg"
            icon={<ArrowRight size={20} className="md:w-[22px] md:h-[22px]" />}
            onClick={navigation.onNext}
            loading={navigation.loadingNext}
            disabled={navigation.disableNext || navigation.loadingNext || navigation.loadingPrevious}
            className="text-base md:text-lg font-semibold px-6 md:px-8 py-3 md:py-4"
          >
            {navigation.nextLabel || '下一步'}
          </Button>
        </div>
      </div>

      {/* 全屏遮罩 Loading */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-2xl p-8 flex flex-col items-center gap-4 max-w-sm mx-4">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-banana-200 border-t-banana-500 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-banana-500 animate-pulse" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-gray-900 mb-1">{loadingMessage}</p>
              <p className="text-sm text-gray-500">请稍候，正在处理您的请求...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
