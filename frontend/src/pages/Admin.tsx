import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Save, Eye, EyeOff, Settings as SettingsIcon, Palette, Upload, X } from 'lucide-react';
import { Button, Input, Textarea, Toast } from '../components/shared';
import { apiClient } from '../api/client';
import { Settings } from './Settings';
import { uploadMaterial } from '../api/endpoints';

interface BrandSettings {
  brand_name: string;
  brand_slogan: string;
  brand_description: string;
  brand_logo_url: string;
  brand_favicon_url: string;
}

type TabType = 'brand' | 'system';

export default function Admin() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('brand');
  
  // 品牌设置
  const [brandSettings, setBrandSettings] = useState<BrandSettings>({
    brand_name: '',
    brand_slogan: '',
    brand_description: '',
    brand_logo_url: '',
    brand_favicon_url: '',
  });
  
  const [newPassword, setNewPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingFavicon, setIsUploadingFavicon] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    // 加载当前品牌配置
    loadBrandSettings();
  }, []);

  const loadBrandSettings = async () => {
    try {
      const response = await apiClient.get('/api/settings/brand');
      setBrandSettings(response.data.data);
    } catch (error) {
      console.error('Failed to load brand settings:', error);
    }
  };

  const handleVerifyPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);

    try {
      const response = await apiClient.post('/api/settings/brand/admin/verify', {
        password,
      });

      if (response.data.data.valid) {
        setIsAuthenticated(true);
        setToast({ message: '验证成功', type: 'success' });
      } else {
        setToast({ message: '密码错误', type: 'error' });
      }
    } catch (error) {
      console.error('Password verification failed:', error);
      setToast({ message: '验证失败', type: 'error' });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSaveBrand = async () => {
    setIsSaving(true);

    try {
      const payload: any = {
        password,
        ...brandSettings,
      };

      if (newPassword) {
        payload.new_password = newPassword;
      }

      await apiClient.put('/api/settings/brand/admin', payload);
      setToast({ message: '保存成功', type: 'success' });
      
      if (newPassword) {
        setPassword(newPassword);
        setNewPassword('');
      }

      // 刷新页面以应用新的品牌设置
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error: any) {
      console.error('Failed to save brand settings:', error);
      const message = error.response?.data?.message || '保存失败';
      setToast({ message, type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      setToast({ message: '请上传图片文件', type: 'error' });
      return;
    }

    setIsUploadingLogo(true);
    try {
      const response = await uploadMaterial(file, null);
      if (response?.data?.url) {
        setBrandSettings({ ...brandSettings, brand_logo_url: response.data.url });
        setToast({ message: 'Logo 上传成功', type: 'success' });
      }
    } catch (error) {
      console.error('Failed to upload logo:', error);
      setToast({ message: 'Logo 上传失败', type: 'error' });
    } finally {
      setIsUploadingLogo(false);
      e.target.value = '';
    }
  };

  const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      setToast({ message: '请上传图片文件', type: 'error' });
      return;
    }

    setIsUploadingFavicon(true);
    try {
      const response = await uploadMaterial(file, null);
      if (response?.data?.url) {
        setBrandSettings({ ...brandSettings, brand_favicon_url: response.data.url });
        setToast({ message: 'Favicon 上传成功', type: 'success' });
      }
    } catch (error) {
      console.error('Failed to upload favicon:', error);
      setToast({ message: 'Favicon 上传失败', type: 'error' });
    } finally {
      setIsUploadingFavicon(false);
      e.target.value = '';
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex flex-col items-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-banana-500 to-orange-500 rounded-full flex items-center justify-center mb-4">
                <Lock className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">管理后台</h1>
              <p className="text-sm text-gray-600 mt-2">请输入管理员密码</p>
            </div>

            <form onSubmit={handleVerifyPassword} className="space-y-4">
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="管理员密码"
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full"
                disabled={isVerifying || !password}
              >
                {isVerifying ? '验证中...' : '登录'}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  返回首页
                </button>
              </div>
            </form>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-800">
                💡 默认密码：<code className="bg-blue-100 px-2 py-1 rounded">admin</code>
              </p>
            </div>
          </div>
        </div>

        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-5xl mx-auto p-4 md:p-8">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-banana-500 to-orange-500 p-6 md:p-8">
            <h1 className="text-2xl md:text-3xl font-bold text-white">系统管理</h1>
            <p className="text-white/90 mt-2">配置品牌信息和系统设置</p>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('brand')}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'brand'
                    ? 'border-banana-500 text-banana-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Palette size={18} />
                品牌配置
              </button>
              <button
                onClick={() => setActiveTab('system')}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'system'
                    ? 'border-banana-500 text-banana-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <SettingsIcon size={18} />
                系统设置
              </button>
            </nav>
          </div>

          {/* Content */}
          <div className="p-6 md:p-8">
            {activeTab === 'brand' ? (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    品牌 Logo
                  </label>
                  <div className="flex items-start gap-4">
                    {brandSettings.brand_logo_url && (
                      <div className="relative">
                        <img
                          src={brandSettings.brand_logo_url}
                          alt="Brand Logo"
                          className="w-24 h-24 object-contain rounded-lg border border-gray-200"
                        />
                        <button
                          onClick={() => setBrandSettings({ ...brandSettings, brand_logo_url: '' })}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}
                    <div className="flex-1">
                      <label className="cursor-pointer">
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-banana-400 transition-colors">
                          <div className="flex flex-col items-center gap-2">
                            <Upload size={24} className="text-gray-400" />
                            <span className="text-sm text-gray-600">
                              {isUploadingLogo ? '上传中...' : '点击上传 Logo'}
                            </span>
                            <span className="text-xs text-gray-400">
                              建议尺寸：200x200px，支持 PNG/JPG/SVG
                            </span>
                          </div>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          disabled={isUploadingLogo}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    将显示在导航栏左上角
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    网站图标 (Favicon)
                  </label>
                  <div className="flex items-start gap-4">
                    {brandSettings.brand_favicon_url && (
                      <div className="relative">
                        <img
                          src={brandSettings.brand_favicon_url}
                          alt="Favicon"
                          className="w-16 h-16 object-contain rounded border border-gray-200"
                        />
                        <button
                          onClick={() => setBrandSettings({ ...brandSettings, brand_favicon_url: '' })}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}
                    <div className="flex-1">
                      <label className="cursor-pointer">
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-banana-400 transition-colors">
                          <div className="flex flex-col items-center gap-2">
                            <Upload size={24} className="text-gray-400" />
                            <span className="text-sm text-gray-600">
                              {isUploadingFavicon ? '上传中...' : '点击上传 Favicon'}
                            </span>
                            <span className="text-xs text-gray-400">
                              建议尺寸：32x32px 或 64x64px，支持 PNG/ICO
                            </span>
                          </div>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFaviconUpload}
                          disabled={isUploadingFavicon}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    将显示在浏览器标签页
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    品牌名称
                  </label>
                  <Input
                    value={brandSettings.brand_name}
                    onChange={(e) =>
                      setBrandSettings({ ...brandSettings, brand_name: e.target.value })
                    }
                    placeholder="例如：元愈PPT"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    将显示在页面标题、导航栏等位置
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    品牌标语
                  </label>
                  <Input
                    value={brandSettings.brand_slogan}
                    onChange={(e) =>
                      setBrandSettings({ ...brandSettings, brand_slogan: e.target.value })
                    }
                    placeholder="例如：从想法到演示，只需一瞬间"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    将显示在首页等位置
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    品牌描述
                  </label>
                  <Textarea
                    value={brandSettings.brand_description}
                    onChange={(e) =>
                      setBrandSettings({ ...brandSettings, brand_description: e.target.value })
                    }
                    placeholder="例如：新一代 AI 原生 PPT 生成器"
                    rows={3}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    将显示在首页等位置
                  </p>
                </div>

                <div className="border-t pt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    修改管理员密码（可选）
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="留空则不修改"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button
                    variant="primary"
                    onClick={handleSaveBrand}
                    disabled={isSaving}
                    className="flex-1"
                  >
                    <Save size={18} className="mr-2" />
                    {isSaving ? '保存中...' : '保存品牌配置'}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => navigate('/')}
                    className="flex-1"
                  >
                    返回首页
                  </Button>
                </div>
              </div>
            ) : (
              <Settings />
            )}
          </div>
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
