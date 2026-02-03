import React, { useState } from 'react';
import { Button } from '@/components/shared';

interface ExportMenuProps {
  showExportMenu: boolean;
  setShowExportMenu: (show: boolean) => void;
  isMultiSelectMode: boolean;
  selectedPageIds: Set<string>;
  handleExport: (type: 'pptx' | 'pdf' | 'editable-pptx') => Promise<string | null>;
}

// 检测是否在微信浏览器中
const isWechat = () => {
  const ua = navigator.userAgent.toLowerCase();
  return ua.includes('micromessenger');
};

// 检测是否在移动设备上
const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

export const ExportMenu: React.FC<ExportMenuProps> = ({
  showExportMenu,
  setShowExportMenu,
  isMultiSelectMode,
  selectedPageIds,
  handleExport,
}) => {
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [exportType, setExportType] = useState<string>('');
  const [isExporting, setIsExporting] = useState(false);
  const [downloadAttempted, setDownloadAttempted] = useState(false);

  if (!showExportMenu) return null;

  // 多种下载方式尝试
  const triggerDownload = (url: string, filename: string) => {
    setDownloadAttempted(true);
    
    // 方法1: 使用 a 标签下载（最兼容）
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    
    try {
      link.click();
    } catch (e) {
      console.warn('方法1下载失败:', e);
    }
    
    // 清理
    setTimeout(() => {
      document.body.removeChild(link);
    }, 100);
    
    // 方法2: 如果不是微信，尝试新窗口打开
    if (!isWechat()) {
      setTimeout(() => {
        try {
          window.open(url, '_blank');
        } catch (e) {
          console.warn('方法2下载失败:', e);
        }
      }, 200);
    }
    
    // 方法3: 如果是移动设备，尝试直接跳转
    if (isMobile()) {
      setTimeout(() => {
        try {
          window.location.href = url;
        } catch (e) {
          console.warn('方法3下载失败:', e);
        }
      }, 400);
    }
  };

  const handleExportClick = async (type: 'pptx' | 'pdf' | 'editable-pptx') => {
    setIsExporting(true);
    setDownloadAttempted(false);
    const typeLabel = type === 'pptx' ? 'PPTX' : type === 'pdf' ? 'PDF' : '可编辑 PPTX';
    setExportType(typeLabel);
    
    try {
      const url = await handleExport(type);
      if (url) {
        setDownloadUrl(url);
        
        // 生成文件名
        const ext = type === 'pdf' ? 'pdf' : 'pptx';
        const filename = `presentation_${Date.now()}.${ext}`;
        
        // 尝试自动下载
        triggerDownload(url, filename);
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleClose = () => {
    setShowExportMenu(false);
    setDownloadUrl(null);
    setExportType('');
    setDownloadAttempted(false);
  };

  const copyToClipboard = async () => {
    if (downloadUrl) {
      try {
        await navigator.clipboard.writeText(downloadUrl);
        alert('下载链接已复制到剪贴板');
      } catch (e) {
        // Fallback for older browsers or insecure contexts
        const textArea = document.createElement('textarea');
        textArea.value = downloadUrl;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        try {
          document.execCommand('copy');
          alert('下载链接已复制到剪贴板');
        } catch (err) {
          alert('复制失败，请手动复制链接');
        }
        document.body.removeChild(textArea);
      }
    }
  };

  const handleManualDownload = () => {
    if (downloadUrl) {
      const ext = exportType.includes('PDF') ? 'pdf' : 'pptx';
      const filename = `presentation_${Date.now()}.${ext}`;
      triggerDownload(downloadUrl, filename);
    }
  };

  const isInWechat = isWechat();
  const isOnMobile = isMobile();

  return (
    <div 
      className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center p-4" 
      onClick={handleClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md" 
        onClick={(e) => e.stopPropagation()}
      >
        {!downloadUrl ? (
          <>
            <h3 className="text-lg font-semibold mb-4">选择导出格式</h3>
            {isMultiSelectMode && selectedPageIds.size > 0 && (
              <div className="mb-4 text-sm text-gray-600">
                将导出选中的 {selectedPageIds.size} 页
              </div>
            )}
            <div className="space-y-2">
              <button
                onClick={() => handleExportClick('pptx')}
                disabled={isExporting}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors rounded-lg border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="font-medium">导出为 PPTX</div>
                <div className="text-sm text-gray-500">标准 PowerPoint 格式</div>
              </button>
              <button
                onClick={() => handleExportClick('editable-pptx')}
                disabled={isExporting}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors rounded-lg border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="font-medium">导出可编辑 PPTX（Beta）</div>
                <div className="text-sm text-gray-500">可编辑文本和元素</div>
              </button>
              <button
                onClick={() => handleExportClick('pdf')}
                disabled={isExporting}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors rounded-lg border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="font-medium">导出为 PDF</div>
                <div className="text-sm text-gray-500">便于分享和打印</div>
              </button>
            </div>
            {isExporting && (
              <div className="mt-4 text-center text-sm text-gray-600">
                正在生成 {exportType} 文件，请稍候...
              </div>
            )}
            <div className="mt-4 flex justify-end">
              <Button variant="ghost" onClick={handleClose} disabled={isExporting}>
                取消
              </Button>
            </div>
          </>
        ) : (
          <>
            <h3 className="text-lg font-semibold mb-4">
              {downloadAttempted ? '下载链接' : '导出成功'}
            </h3>
            <div className="mb-4">
              {isInWechat && (
                <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800 font-medium mb-1">
                    💡 微信浏览器提示
                  </p>
                  <p className="text-xs text-yellow-700">
                    请点击右上角"..."，选择"在浏览器中打开"，然后再次点击导出下载
                  </p>
                </div>
              )}
              
              <p className="text-sm text-gray-600 mb-3">
                {downloadAttempted 
                  ? `${exportType} 文件已生成。如果未自动下载，请使用下方按钮：`
                  : `${exportType} 文件已生成`
                }
              </p>
              
              {/* 下载链接显示 */}
              <div className="bg-gray-50 p-3 rounded border border-gray-200 mb-3">
                <p className="text-xs text-gray-500 mb-1">下载地址：</p>
                <p className="text-sm text-gray-700 break-all font-mono">
                  {downloadUrl}
                </p>
              </div>
              
              {/* 操作按钮 */}
              <div className="space-y-2">
                <button
                  onClick={handleManualDownload}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  点击下载文件
                </button>
                
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-center font-medium text-sm"
                  >
                    新窗口打开
                  </a>
                  <button
                    onClick={copyToClipboard}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
                  >
                    复制链接
                  </button>
                </div>
              </div>
              
              {/* 额外提示 */}
              {isOnMobile && !isInWechat && (
                <p className="mt-3 text-xs text-gray-500 text-center">
                  💡 如无法下载，请长按链接选择"下载"或"保存"
                </p>
              )}
            </div>
            
            <div className="flex justify-end pt-2 border-t">
              <Button variant="ghost" onClick={handleClose}>
                关闭
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
