import React, { useState, useEffect } from 'react';
import { GripVertical, Edit2, Trash2, Check, X } from 'lucide-react';
import { Card, useConfirm, Markdown, ShimmerOverlay } from '@/components/shared';
import type { Page } from '@/types';

interface OutlineCardProps {
  page: Page;
  index: number;
  onUpdate: (data: Partial<Page>) => void;
  onDelete: () => void;
  onClick: () => void;
  isSelected: boolean;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
  isAiRefining?: boolean;
}

export const OutlineCard: React.FC<OutlineCardProps> = ({
  page,
  index,
  onUpdate,
  onDelete,
  onClick,
  isSelected,
  dragHandleProps,
  isAiRefining = false,
}) => {
  const { confirm, ConfirmDialog } = useConfirm();
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(page.outline_content.title);
  const [editPoints, setEditPoints] = useState(page.outline_content.points.join('\n'));

  // 当 page prop 变化时，同步更新本地编辑状态（如果不在编辑模式）
  useEffect(() => {
    if (!isEditing) {
      setEditTitle(page.outline_content.title);
      setEditPoints(page.outline_content.points.join('\n'));
    }
  }, [page.outline_content.title, page.outline_content.points, isEditing]);

  // 监听 Esc 键关闭编辑弹窗
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isEditing) {
        handleCancel();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditing]);

  const handleSave = () => {
    onUpdate({
      outline_content: {
        title: editTitle,
        points: editPoints.split('\n').filter((p) => p.trim()),
      },
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditTitle(page.outline_content.title);
    setEditPoints(page.outline_content.points.join('\n'));
    setIsEditing(false);
  };

  return (
    <>
      <Card
        className={`p-4 relative flex flex-col ${
          isSelected ? 'border-2 border-banana-500 shadow-yellow' : ''
        }`}
        style={{ minWidth: '0', width: '100%', height: '100%' }}
        onClick={!isEditing ? onClick : undefined}
      >
        <ShimmerOverlay show={isAiRefining} />
        
        <div className="flex items-start gap-3 relative z-10 flex-1 w-full min-w-0">
          {/* 拖拽手柄 */}
          <div 
            {...dragHandleProps}
            className="flex-shrink-0 cursor-move text-gray-400 hover:text-gray-600 pt-1"
          >
            <GripVertical size={20} />
          </div>

          {/* 内容区 */}
          <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
            {/* 页码和章节 */}
            <div className="flex items-center gap-2 mb-2 flex-shrink-0 overflow-hidden min-w-0">
              <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">
                第 {index + 1} 页
              </span>
              {page.part && (
                <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded whitespace-nowrap">
                  {page.part}
                </span>
              )}
            </div>

            {/* 查看模式 */}
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-gray-900 mb-2 whitespace-nowrap">
                {page.outline_content.title}
              </h4>
              <div className="text-gray-600 min-w-0 [&_p]:whitespace-nowrap [&_li]:whitespace-nowrap [&_ul]:min-w-0 [&_ol]:min-w-0">
                <Markdown>{page.outline_content.points.join('\n')}</Markdown>
              </div>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex-shrink-0 flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
              className="p-1.5 text-gray-500 hover:text-banana-600 hover:bg-banana-50 rounded transition-colors"
            >
              <Edit2 size={16} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                confirm(
                  '确定要删除这一页吗？',
                  onDelete,
                  { title: '确认删除', variant: 'danger' }
                );
              }}
              className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </Card>

      {/* Spotlight 风格编辑弹窗 */}
      {isEditing && (
        <>
          {/* 背景遮罩 */}
          <div 
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 animate-in fade-in duration-200"
            onClick={handleCancel}
          />
          
          {/* 浮动编辑框 */}
          <div className="fixed top-1/4 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-50 animate-in slide-in-from-top-4 fade-in duration-300">
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
              {/* 标题栏 */}
              <div className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-banana-400 to-orange-400 rounded-full flex items-center justify-center shadow-md">
                  <Edit2 size={20} className="text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    编辑大纲 - 第 {index + 1} 页
                  </h3>
                  <p className="text-sm text-gray-600">
                    修改标题和要点内容
                  </p>
                </div>
                <button
                  onClick={handleCancel}
                  className="flex-shrink-0 w-8 h-8 flex items-center justify-center hover:bg-white/80 rounded-lg transition-colors"
                >
                  <span className="text-gray-400 text-2xl leading-none">×</span>
                </button>
              </div>
              
              {/* 编辑区域 */}
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    标题
                  </label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-banana-500 focus:border-transparent"
                    placeholder="输入标题"
                    autoFocus
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    要点（每行一个）
                  </label>
                  <textarea
                    value={editPoints}
                    onChange={(e) => setEditPoints(e.target.value)}
                    rows={8}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-banana-500 focus:border-transparent resize-none"
                    placeholder="输入要点，每行一个"
                  />
                </div>
              </div>
              
              {/* 底部操作栏 */}
              <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-200">
                <div className="flex items-start gap-2 text-xs text-gray-500">
                  <span className="flex-shrink-0 mt-0.5">💡</span>
                  <span>按 Esc 取消编辑</span>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 text-sm font-medium bg-banana-500 text-black rounded-lg hover:bg-banana-600 transition-colors shadow-sm"
                  >
                    保存修改
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {ConfirmDialog}
    </>
  );
};

