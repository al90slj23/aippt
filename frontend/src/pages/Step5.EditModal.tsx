import React from 'react';
import { ChevronDown, ChevronUp, X, Upload, Sparkles, ImagePlus } from 'lucide-react';
import { Modal, Textarea, Button } from '@/components/shared';
import { getImageUrl } from '@/api/client';
import type { Project, Page, DescriptionContent } from '@/types';

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  imageRef: React.MutableRefObject<HTMLImageElement | null>;
  isRegionSelectionMode: boolean;
  setIsRegionSelectionMode: (mode: boolean) => void;
  selectionRect: { left: number; top: number; width: number; height: number } | null;
  handleSelectionMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
  handleSelectionMouseMove: (e: React.MouseEvent<HTMLDivElement>) => void;
  handleSelectionMouseUp: () => void;
  isOutlineExpanded: boolean;
  setIsOutlineExpanded: (expanded: boolean) => void;
  editOutlineTitle: string;
  setEditOutlineTitle: (title: string) => void;
  editOutlinePoints: string;
  setEditOutlinePoints: (points: string) => void;
  isDescriptionExpanded: boolean;
  setIsDescriptionExpanded: (expanded: boolean) => void;
  editDescription: string;
  setEditDescription: (description: string) => void;
  currentProject: Project;
  selectedPage: Page | undefined;
  selectedContextImages: {
    useTemplate: boolean;
    descImageUrls: string[];
    uploadedFiles: File[];
  };
  setSelectedContextImages: React.Dispatch<React.SetStateAction<{
    useTemplate: boolean;
    descImageUrls: string[];
    uploadedFiles: File[];
  }>>;
  extractImageUrlsFromDescription: (descriptionContent: DescriptionContent | undefined) => string[];
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeUploadedFile: (index: number) => void;
  setIsMaterialSelectorOpen: (open: boolean) => void;
  editPrompt: string;
  setEditPrompt: (prompt: string) => void;
  handleSaveOutlineAndDescription: () => void;
  handleSubmitEdit: () => void;
}

export const EditModal: React.FC<EditModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  imageRef,
  isRegionSelectionMode,
  setIsRegionSelectionMode,
  selectionRect,
  handleSelectionMouseDown,
  handleSelectionMouseMove,
  handleSelectionMouseUp,
  isOutlineExpanded,
  setIsOutlineExpanded,
  editOutlineTitle,
  setEditOutlineTitle,
  editOutlinePoints,
  setEditOutlinePoints,
  isDescriptionExpanded,
  setIsDescriptionExpanded,
  editDescription,
  setEditDescription,
  currentProject,
  selectedPage,
  selectedContextImages,
  setSelectedContextImages,
  extractImageUrlsFromDescription,
  handleFileUpload,
  removeUploadedFile,
  setIsMaterialSelectorOpen,
  editPrompt,
  setEditPrompt,
  handleSaveOutlineAndDescription,
  handleSubmitEdit,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="编辑页面"
      size="lg"
    >
      <div className="space-y-4">
        {/* 图片（支持矩形区域选择） */}
        <div
          className="aspect-video bg-gray-100 rounded-lg overflow-hidden relative"
          onMouseDown={handleSelectionMouseDown}
          onMouseMove={handleSelectionMouseMove}
          onMouseUp={handleSelectionMouseUp}
          onMouseLeave={handleSelectionMouseUp}
        >
          {imageUrl && (
            <>
              {/* 左上角：区域选图模式开关 */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsRegionSelectionMode(!isRegionSelectionMode);
                }}
                className="absolute top-2 left-2 z-10 px-2 py-1 rounded bg-white/80 text-[10px] text-gray-700 hover:bg-banana-50 shadow-sm flex items-center gap-1"
              >
                <Sparkles size={12} />
                <span>{isRegionSelectionMode ? '结束区域选图' : '区域选图'}</span>
              </button>

              <img
                ref={imageRef}
                src={imageUrl}
                alt="Current slide"
                className="w-full h-full object-contain select-none"
                draggable={false}
                crossOrigin="anonymous"
              />
              {selectionRect && (
                <div
                  className="absolute border-2 border-banana-500 bg-banana-400/10 pointer-events-none"
                  style={{
                    left: selectionRect.left,
                    top: selectionRect.top,
                    width: selectionRect.width,
                    height: selectionRect.height,
                  }}
                />
              )}
            </>
          )}
        </div>

        {/* 大纲内容 - 可编辑 */}
        <div className="bg-gray-50 rounded-lg border border-gray-200">
          <button
            onClick={() => setIsOutlineExpanded(!isOutlineExpanded)}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-100 transition-colors"
          >
            <h4 className="text-sm font-semibold text-gray-700">页面大纲（可编辑）</h4>
            {isOutlineExpanded ? (
              <ChevronUp size={18} className="text-gray-500" />
            ) : (
              <ChevronDown size={18} className="text-gray-500" />
            )}
          </button>
          {isOutlineExpanded && (
            <div className="px-4 pb-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">标题</label>
                <input
                  type="text"
                  value={editOutlineTitle}
                  onChange={(e) => setEditOutlineTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-banana-500"
                  placeholder="输入页面标题"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">要点（每行一个）</label>
                <textarea
                  value={editOutlinePoints}
                  onChange={(e) => setEditOutlinePoints(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-banana-500 resize-none"
                  placeholder="每行输入一个要点"
                />
              </div>
            </div>
          )}
        </div>

        {/* 描述内容 - 可编辑 */}
        <div className="bg-blue-50 rounded-lg border border-blue-200">
          <button
            onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-blue-100 transition-colors"
          >
            <h4 className="text-sm font-semibold text-gray-700">页面描述（可编辑）</h4>
            {isDescriptionExpanded ? (
              <ChevronUp size={18} className="text-gray-500" />
            ) : (
              <ChevronDown size={18} className="text-gray-500" />
            )}
          </button>
          {isDescriptionExpanded && (
            <div className="px-4 pb-4">
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={8}
                className="w-full px-3 py-2 text-sm border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-banana-500 resize-none"
                placeholder="输入页面的详细描述内容"
              />
            </div>
          )}
        </div>

        {/* 上下文图片选择 */}
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 space-y-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">选择上下文图片（可选）</h4>
          
          {/* Template图片选择 */}
          {currentProject?.template_image_path && (
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="use-template"
                checked={selectedContextImages.useTemplate}
                onChange={(e) =>
                  setSelectedContextImages((prev) => ({
                    ...prev,
                    useTemplate: e.target.checked,
                  }))
                }
                className="w-4 h-4 text-banana-600 rounded focus:ring-banana-500"
              />
              <label htmlFor="use-template" className="flex items-center gap-2 cursor-pointer">
                <span className="text-sm text-gray-700">使用模板图片</span>
                {currentProject.template_image_path && (
                  <img
                    src={getImageUrl(currentProject.template_image_path, currentProject.updated_at)}
                    alt="Template"
                    className="w-16 h-10 object-cover rounded border border-gray-300"
                  />
                )}
              </label>
            </div>
          )}

          {/* Desc中的图片 */}
          {selectedPage?.description_content && (() => {
            const descImageUrls = extractImageUrlsFromDescription(selectedPage.description_content);
            return descImageUrls.length > 0 ? (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">描述中的图片：</label>
                <div className="grid grid-cols-3 gap-2">
                  {descImageUrls.map((url, idx) => (
                    <div key={idx} className="relative group">
                      <img
                        src={url}
                        alt={`Desc image ${idx + 1}`}
                        className="w-full h-20 object-cover rounded border-2 border-gray-300 cursor-pointer transition-all"
                        style={{
                          borderColor: selectedContextImages.descImageUrls.includes(url)
                            ? '#f59e0b'
                            : '#d1d5db',
                        }}
                        onClick={() => {
                          setSelectedContextImages((prev) => {
                            const isSelected = prev.descImageUrls.includes(url);
                            return {
                              ...prev,
                              descImageUrls: isSelected
                                ? prev.descImageUrls.filter((u) => u !== url)
                                : [...prev.descImageUrls, url],
                            };
                          });
                        }}
                      />
                      {selectedContextImages.descImageUrls.includes(url) && (
                        <div className="absolute inset-0 bg-banana-500/20 border-2 border-banana-500 rounded flex items-center justify-center">
                          <div className="w-6 h-6 bg-banana-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">✓</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : null;
          })()}

          {/* 上传图片 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">上传图片：</label>
              {currentProject?.id && (
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<ImagePlus size={16} />}
                  onClick={() => setIsMaterialSelectorOpen(true)}
                >
                  从素材库选择
                </Button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedContextImages.uploadedFiles.map((file, idx) => (
                <div key={idx} className="relative group">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Uploaded ${idx + 1}`}
                    className="w-20 h-20 object-cover rounded border border-gray-300"
                  />
                  <button
                    onClick={() => removeUploadedFile(idx)}
                    className="no-min-touch-target absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              <label className="w-20 h-20 border-2 border-dashed border-gray-300 rounded flex flex-col items-center justify-center cursor-pointer hover:border-banana-500 transition-colors">
                <Upload size={20} className="text-gray-400 mb-1" />
                <span className="text-xs text-gray-500">上传</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>
            </div>
          </div>
        </div>

        {/* 编辑框 */}
        <Textarea
          label="输入修改指令(将自动添加页面描述)"
          placeholder="例如：将框选区域内的素材移除、把背景改成蓝色、增大标题字号、更改文本框样式为虚线..."
          value={editPrompt}
          onChange={(e) => setEditPrompt(e.target.value)}
          rows={4}
        />
        <div className="flex justify-between gap-3">
          <Button 
            variant="secondary" 
            onClick={() => {
              handleSaveOutlineAndDescription();
              onClose();
            }}
          >
            仅保存大纲/描述
          </Button>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={onClose}>
              取消
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmitEdit}
              disabled={!editPrompt.trim()}
            >
              生成图片
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
