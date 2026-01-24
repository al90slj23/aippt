import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HomeSimple } from './pages/HomeSimple';
import { Step1FillContent } from './pages/Step1.FillContent';
import { Step2SelectTemplate } from './pages/Step2.SelectTemplate';
import { History } from './pages/History';
import { Step3OutlineEditor } from './pages/Step3.OutlineEditor';
import { Step4DetailEditor } from './pages/Step4.DetailEditor';
import { Step5SlidePreview } from './pages/Step5.SlidePreview';
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
          <Route path="/create" element={<Step1FillContent />} />
          <Route path="/create/step2" element={<Step2SelectTemplate />} />
          <Route path="/project/:projectId/create" element={<Step1FillContent />} />
          <Route path="/project/:projectId/template" element={<Step2SelectTemplate />} />
          <Route path="/history" element={<History />} />
          <Route path="/settings" element={<Navigate to="/admin" replace />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/project/:projectId/outline" element={<Step3OutlineEditor />} />
          <Route path="/project/:projectId/detail" element={<Step4DetailEditor />} />
          <Route path="/project/:projectId/preview" element={<Step5SlidePreview />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <ToastContainer />
      </BrowserRouter>
    </BrandProvider>
  );
}

export default App;

