import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, FileText, FileEdit, ImagePlus, FolderOpen } from 'lucide-react';
import { Button } from '@/components/shared';
import { useBrand } from '@/contexts/BrandContext';

export const HomeSimple: React.FC = () => {
  const navigate = useNavigate();
  const { brandSettings } = useBrand();

  const creationMethods = [
    {
      type: 'idea' as const,
      icon: <Sparkles size={48} className="text-yellow-600" />,
      title: '一句话生成',
      description: '输入你的想法，AI 将为你生成完整的 PPT',
      example: '例如：生成一份关于 AI 发展史的演讲 PPT',
      color: 'from-yellow-400 to-orange-500',
      hoverColor: 'hover:shadow-yellow-500/50',
    },
    {
      type: 'outline' as const,
      icon: <FileText size={48} className="text-blue-600" />,
      title: '从大纲生成',
      description: '已有大纲？直接粘贴即可快速生成',
      example: 'AI 将自动切分为结构化大纲',
      color: 'from-blue-400 to-cyan-500',
      hoverColor: 'hover:shadow-blue-500/50',
    },
    {
      type: 'description' as const,
      icon: <FileEdit size={48} className="text-pink-600" />,
      title: '从描述生成',
      description: '已有完整描述？AI 将直接生成图片',
      example: '自动解析大纲并切分为每页描述',
      color: 'from-pink-400 to-rose-500',
      hoverColor: 'hover:shadow-pink-500/50',
    },
  ];

  const handleMethodClick = (type: 'idea' | 'outline' | 'description') => {
    navigate('/create', { state: { type } });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50/30 to-pink-50/50 relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-banana-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-orange-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* 导航栏 */}
      <nav className="relative h-16 md:h-18 bg-white/40 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={brandSettings?.brand_logo_url || '/logo.png'}
              alt={brandSettings?.brand_name || 'Logo'}
              className="h-10 md:h-12 w-auto rounded-lg object-contain"
            />
            <span className="text-xl md:text-2xl font-bold bg-gradient-to-r from-banana-600 via-orange-500 to-pink-500 bg-clip-text text-transparent">
              {brandSettings?.brand_name || '加载中...'}
            </span>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <Button
              variant="ghost"
              size="sm"
              icon={<ImagePlus size={16} />}
              onClick={() => navigate('/materials')}
              className="hidden sm:inline-flex hover:bg-banana-100/60"
            >
              素材生成
            </Button>
            <Button
              variant="ghost"
              size="sm"
              icon={<FolderOpen size={16} />}
              onClick={() => navigate('/materials')}
              className="hidden sm:inline-flex hover:bg-banana-100/60"
            >
              素材中心
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/history')}
              className="hover:bg-banana-100/60"
            >
              历史项目
            </Button>
          </div>
        </div>
      </nav>

      {/* 主内容 */}
      <main className="relative max-w-6xl mx-auto px-4 py-12 md:py-20">
        {/* Hero 区域 */}
        <div className="text-center mb-16 space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full border border-banana-200/50 shadow-sm mb-4">
            <Sparkles size={20} className="text-orange-500 animate-pulse" />
            <span className="text-sm font-medium text-gray-700">
              {brandSettings?.brand_description || '加载中...'}
            </span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold leading-tight">
            <span className="bg-gradient-to-r from-yellow-600 via-orange-500 to-pink-500 bg-clip-text text-transparent">
              {brandSettings?.brand_name || '加载中...'}
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-600 max-w-2xl mx-auto font-light">
            {brandSettings?.brand_slogan || '加载中...'}
          </p>
        </div>

        {/* 三个入口卡片 */}
        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          {creationMethods.map((method) => (
            <button
              key={method.type}
              onClick={() => handleMethodClick(method.type)}
              className={`
                group relative bg-white rounded-2xl p-8 
                shadow-lg hover:shadow-2xl ${method.hoverColor}
                transition-all duration-300 hover:scale-105
                border-2 border-transparent hover:border-gray-100
                text-left
              `}
            >
              {/* 渐变背景 */}
              <div className={`absolute inset-0 bg-gradient-to-br ${method.color} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity duration-300`}></div>
              
              {/* 内容 */}
              <div className="relative space-y-4">
                <div className="flex items-center justify-center w-20 h-20 bg-gradient-to-br ${method.color} rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  {method.icon}
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:bg-clip-text group-hover:${method.color}">
                  {method.title}
                </h3>
                
                <p className="text-gray-600 leading-relaxed">
                  {method.description}
                </p>
                
                <p className="text-sm text-gray-400 italic">
                  {method.example}
                </p>

                {/* 箭头指示 */}
                <div className="flex items-center gap-2 text-banana-600 font-medium group-hover:gap-4 transition-all">
                  <span>开始创建</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* 特性标签 */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-16">
          {[
            { icon: <Sparkles size={14} className="text-yellow-600" />, label: '一句话生成 PPT' },
            { icon: <FileEdit size={14} className="text-blue-500" />, label: '自然语言修改' },
            { icon: <FileText size={14} className="text-green-600" />, label: '一键导出 PPTX/PDF' },
          ].map((feature, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/70 backdrop-blur-sm rounded-full text-sm text-gray-700 border border-gray-200/50 shadow-sm"
            >
              {feature.icon}
              {feature.label}
            </span>
          ))}
        </div>
      </main>
    </div>
  );
};
