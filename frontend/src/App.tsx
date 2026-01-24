import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HomeSimple } from './pages/HomeSimple';
import { CreateProject } from './pages/CreateProject';
import { History } from './pages/History';
import { OutlineEditor } from './pages/OutlineEditor';
import { DetailEditor } from './pages/DetailEditor';
import { SlidePreview } from './pages/SlidePreview';
import Admin from './pages/Admin';
import { useProjectStore } from './store/useProjectStore';
import { useToast } from './components/shared';
import { BrandProvider } from './contexts/BrandContext';

function App() {
  const { currentProject, syncProject, error, setError } = useProjectStore();
  const { show, ToastContainer } = useToast();

  // 恢复项目状态
  useEffect(() => {
    const savedProjectId = localStorage.getItem('currentProjectId');
    if (savedProjectId && !currentProject) {
      syncProject();
    }
  }, [currentProject, syncProject]);

  // 显示全局错误
  useEffect(() => {
    if (error) {
      show({ message: error, type: 'error' });
      setError(null);
    }
  }, [error, setError, show]);

  return (
    <BrandProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomeSimple />} />
          <Route path="/create" element={<CreateProject />} />
          <Route path="/history" element={<History />} />
          <Route path="/settings" element={<Navigate to="/admin" replace />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/project/:projectId/outline" element={<OutlineEditor />} />
          <Route path="/project/:projectId/detail" element={<DetailEditor />} />
          <Route path="/project/:projectId/preview" element={<SlidePreview />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <ToastContainer />
      </BrowserRouter>
    </BrandProvider>
  );
}

export default App;

