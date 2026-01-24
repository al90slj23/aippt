import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../api/client';

interface BrandSettings {
  brand_name: string;
  brand_slogan: string;
  brand_description: string;
}

const defaultSettings: BrandSettings = {
  brand_name: '元愈PPT',
  brand_slogan: 'Vibe your PPT like vibing code',
  brand_description: '基于 nano banana pro🍌 的原生 AI PPT 生成器',
};

interface BrandContextType {
  brandSettings: BrandSettings;
  isLoading: boolean;
  reload: () => Promise<void>;
}

const BrandContext = createContext<BrandContextType>({
  brandSettings: defaultSettings,
  isLoading: true,
  reload: async () => {},
});

export function BrandProvider({ children }: { children: React.ReactNode }) {
  const [brandSettings, setBrandSettings] = useState<BrandSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  const loadBrandSettings = async () => {
    try {
      const response = await apiClient.get('/api/settings/brand');
      setBrandSettings(response.data);
      
      // 更新页面标题
      document.title = `${response.data.brand_name} | AI 原生 PPT 生成器`;
    } catch (error) {
      console.error('Failed to load brand settings:', error);
      // 使用默认值
      setBrandSettings(defaultSettings);
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
