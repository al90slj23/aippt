import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Save, Eye, EyeOff, Settings as SettingsIcon, Palette } from 'lucide-react';
import { Button, Input, Textarea, Toast } from '../components/shared';
import { apiClient } from '../api/client';

interface BrandSettings {
  brand_name: string;
  brand_slogan: string;
  brand_description: string;
}

interface SystemSettings {
  ai_provider_format: 'openai' | 'gemini';
  api_base_url: string;
  api_key: string;
  text_model: string;
  image_model: string;
  image_resolution: string;
  image_aspect_ratio: string;
  max_description_workers: number;
  max_image_workers: number;
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
  });
  
  // 系统设置
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    ai_provider_format: 'gemini',
    api_base_url: '',
    api_key: '',
    text_model: '',
    image_model: '',
    image_resolution: '2K',
    image_aspect_ratio: '16:9',
    max_description_workers: 5,
    max_image_workers: 8,
  });
  
  const [newPassword, setNewPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    // 加载当前品牌配置
    loadBrandSettings();
    // 加载系统设置
    loadSystemSettings();
  }, []);

  const loadBrandSettings = async () => {
    try {
      const response = await apiClient.get('/api/settings/brand');
      setBrandSettings(response.data.data);
    } catch (error) {
      console.error('Failed to load brand settings:', error);
    }
  };

  const loadSystemSettings = async () => {
    try {
      const response = await apiClient.get('/api/settings');
      const data = response.data.data;
      setSystemSettings({
        ai_provider_format: data.ai_provider_format || 'gemini',
        api_base_url: data.api_base_url || '',
        api_key: '', // 不显示实际密钥
        text_model: data.text_model || '',
        image_model: data.image_model || '',
        image_resolution: data.image_resolution || '2K',
        image_aspect_ratio: data.image_aspect_ratio || '16:9',
        max_description_workers: data.max_description_workers || 5,
        max_image_workers: data.max_image_workers || 8,
      });
    } catch (error) {
      console.error('Failed to load system settings:', error);
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

  const handleSaveSystem = async () => {
    setIsSaving(true);

    try {
      const payload: any = { ...systemSettings };
      
      // 如果 API Key 为空，不发送（保持原值）
      if (!payload.api_key) {
        delete payload.api_key;
      }

      await apiClient.put('/api/settings', payload);
      setToast({ message: '系统设置保存成功', type: 'success' });
      
      // 清空密钥输入框
      setSystemSettings(prev => ({ ...prev, api_key: '' }));
      
      // 重新加载设置
      await loadSystemSettings();
    } catch (error: any) {
      console.error('Failed to save system settings:', error);
      const message = error.response?.data?.message || '保存失败';
      setToast({ message, type: 'error' });
    } finally {
      setIsSaving(false);
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
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">AI 服务配置</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        AI 提供商格式
                      </label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSystemSettings({ ...systemSettings, ai_provider_format: 'gemini' })}
                          className={`flex-1 px-4 py-2 rounded-lg border-2 transition-colors ${
                            systemSettings.ai_provider_format === 'gemini'
                              ? 'border-banana-500 bg-banana-50 text-banana-700'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          Gemini 格式
                        </button>
                        <button
                          onClick={() => setSystemSettings({ ...systemSettings, ai_provider_format: 'openai' })}
                          className={`flex-1 px-4 py-2 rounded-lg border-2 transition-colors ${
                            systemSettings.ai_provider_format === 'openai'
                              ? 'border-banana-500 bg-banana-50 text-banana-700'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          OpenAI 格式
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        API Base URL
                      </label>
                      <Input
                        value={systemSettings.api_base_url}
                        onChange={(e) =>
                          setSystemSettings({ ...systemSettings, api_base_url: e.target.value })
                        }
                        placeholder="https://api.example.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        API Key
                      </label>
                      <Input
                        type="password"
                        value={systemSettings.api_key}
                        onChange={(e) =>
                          setSystemSettings({ ...systemSettings, api_key: e.target.value })
                        }
                        placeholder="留空则保持当前设置不变"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        文本模型
                      </label>
                      <Input
                        value={systemSettings.text_model}
                        onChange={(e) =>
                          setSystemSettings({ ...systemSettings, text_model: e.target.value })
                        }
                        placeholder="例如：gemini-3-flash-preview"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        图像模型
                      </label>
                      <Input
                        value={systemSettings.image_model}
                        onChange={(e) =>
                          setSystemSettings({ ...systemSettings, image_model: e.target.value })
                        }
                        placeholder="例如：gemini-3-pro-image-preview"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">图像生成配置</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        图像分辨率
                      </label>
                      <div className="flex gap-2">
                        {['1K', '2K', '4K'].map((res) => (
                          <button
                            key={res}
                            onClick={() => setSystemSettings({ ...systemSettings, image_resolution: res })}
                            className={`flex-1 px-4 py-2 rounded-lg border-2 transition-colors ${
                              systemSettings.image_resolution === res
                                ? 'border-banana-500 bg-banana-50 text-banana-700'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            {res}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        图像宽高比
                      </label>
                      <Input
                        value={systemSettings.image_aspect_ratio}
                        onChange={(e) =>
                          setSystemSettings({ ...systemSettings, image_aspect_ratio: e.target.value })
                        }
                        placeholder="16:9"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">并发配置</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        描述生成并发数 (1-20)
                      </label>
                      <Input
                        type="number"
                        min="1"
                        max="20"
                        value={systemSettings.max_description_workers}
                        onChange={(e) =>
                          setSystemSettings({ ...systemSettings, max_description_workers: parseInt(e.target.value) || 5 })
                        }
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        图像生成并发数 (1-20)
                      </label>
                      <Input
                        type="number"
                        min="1"
                        max="20"
                        value={systemSettings.max_image_workers}
                        onChange={(e) =>
                          setSystemSettings({ ...systemSettings, max_image_workers: parseInt(e.target.value) || 8 })
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button
                    variant="primary"
                    onClick={handleSaveSystem}
                    disabled={isSaving}
                    className="flex-1"
                  >
                    <Save size={18} className="mr-2" />
                    {isSaving ? '保存中...' : '保存系统设置'}
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
