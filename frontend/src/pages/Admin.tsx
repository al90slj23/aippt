import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Save, Eye, EyeOff } from 'lucide-react';
import { Button, Input, Textarea, Toast } from '../components/shared';
import { apiClient } from '../api/client';

interface BrandSettings {
  brand_name: string;
  brand_slogan: string;
  brand_description: string;
}

export default function Admin() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [brandSettings, setBrandSettings] = useState<BrandSettings>({
    brand_name: '',
    brand_slogan: '',
    brand_description: '',
  });
  const [newPassword, setNewPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    // 加载当前品牌配置
    loadBrandSettings();
  }, []);

  const loadBrandSettings = async () => {
    try {
      const response = await apiClient.get('/api/settings/brand');
      setBrandSettings(response.data);
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

      if (response.data.valid) {
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

  const handleSave = async () => {
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
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-banana-500 to-orange-500 p-6 md:p-8">
            <h1 className="text-2xl md:text-3xl font-bold text-white">品牌配置管理</h1>
            <p className="text-white/90 mt-2">自定义您的品牌信息</p>
          </div>

          {/* Content */}
          <div className="p-6 md:p-8 space-y-6">
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
                placeholder="例如：Vibe your PPT like vibing code"
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
                placeholder="例如：基于 nano banana pro🍌 的原生 AI PPT 生成器"
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

            {/* Actions */}
            <div className="flex gap-4 pt-4">
              <Button
                variant="primary"
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1"
              >
                <Save size={18} className="mr-2" />
                {isSaving ? '保存中...' : '保存配置'}
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
