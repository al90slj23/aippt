import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../api/client';

interface BrandSettings {
  brand_name: string;
  brand_slogan: string;
  brand_description: string;
  brand_logo_url: string;
  brand_favicon_url: string;
}

interface BrandContextType {
  brandSettings: BrandSettings | null;
  isLoading: boolean;
  reload: () => Promise<void>;
}

const BrandContext = createContext<BrandContextType>({
  brandSettings: null,
  isLoading: true,
  reload: async () => {},
});

export function BrandProvider({ children }: { children: React.ReactNode }) {
  const [brandSettings, setBrandSettings] = useState<BrandSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadBrandSettings = async () => {
    try {
      const response = await apiClient.get('/api/settings/brand');
      const settings = response.data.data;
      setBrandSettings(settings);
      
      // 更新页面标题
      document.title = `${settings.brand_name || '元愈PPT'} | AI 原生 PPT 生成器`;
      
      // 更新 favicon
      if (settings.brand_favicon_url) {
        const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
        if (link) {
          link.href = settings.brand_favicon_url;
        } else {
          const newLink = document.createElement('link');
          newLink.rel = 'icon';
          newLink.href = settings.brand_favicon_url;
          document.head.appendChild(newLink);
        }
      }
    } catch (error) {
      console.error('Failed to load brand settings:', error);
      // 加载失败时设置为 null，让组件自行处理
      setBrandSettings(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBrandSettings();
  }, []);

  return (
    <BrandContext.Provider value={{ brandSettings, isLoading, reload: loadBrandSettings }}>
      {children}
    </BrandContext.Provider>
  );
}

export function useBrand() {
  return useContext(BrandContext);
}
