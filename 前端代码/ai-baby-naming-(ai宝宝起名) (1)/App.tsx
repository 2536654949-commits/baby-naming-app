import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import InputPage from './pages/InputPage';
import LoadingPage from './pages/LoadingPage';
import ResultsPage from './pages/ResultsPage';
import DetailPage from './pages/DetailPage';
import HistoryPage from './pages/HistoryPage';
import FavoritesPage from './pages/FavoritesPage';
import ActivationPage from './pages/ActivationPage';

// Protected Route Component
interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const token = localStorage.getItem('AI_BABY_NAMING_TOKEN');

  // 开发环境测试模式：自动注入测试 token
  // 注意：import.meta.env.DEV 代码块在生产构建时会被 Vite 自动移除
  if (import.meta.env.DEV && import.meta.env.VITE_TEST_MODE === 'true') {
    if (!token) {
      // 注入测试 token，格式与生产环境一致
      localStorage.setItem('AI_BABY_NAMING_TOKEN', 'BABY-TEST-DEV-MODE');
    }
    return <>{children}</>;
  }

  if (!token) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// Simple Bottom Navigation Component
const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-gray-100 flex justify-around items-center py-3 pb-safe z-50 max-w-md mx-auto">
      <button
        onClick={() => navigate('/')}
        className={`flex flex-col items-center gap-1 ${isActive('/') ? 'text-primary' : 'text-gray-400'}`}
      >
        <span className={`material-symbols-outlined ${isActive('/') ? 'filled-icon' : ''}`}>home</span>
        <span className="text-[10px] font-medium">首页</span>
      </button>
      <button
         onClick={() => navigate('/history')}
         className={`flex flex-col items-center gap-1 ${isActive('/history') ? 'text-primary' : 'text-gray-400'}`}
      >
        <span className={`material-symbols-outlined ${isActive('/history') ? 'filled-icon' : ''}`}>history</span>
        <span className="text-[10px] font-medium">历史</span>
      </button>
      <button
        onClick={() => navigate('/favorites')}
        className={`flex flex-col items-center gap-1 ${isActive('/favorites') ? 'text-primary' : 'text-gray-400'}`}
      >
        <span className={`material-symbols-outlined ${isActive('/favorites') ? 'filled-icon' : ''}`}>favorite</span>
        <span className="text-[10px] font-medium">收藏</span>
      </button>
    </nav>
  );
};

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthExpired = () => {
      navigate('/activation', { replace: true });
    };
    window.addEventListener('auth:expired', handleAuthExpired);
    return () => window.removeEventListener('auth:expired', handleAuthExpired);
  }, [navigate]);

  const location = useLocation();
  // Removed '/activation' from showNavRoutes so the dock doesn't appear on the activation screen
  const showNavRoutes = ['/', '/history', '/favorites'];
  const showNav = showNavRoutes.includes(location.pathname);

  return (
    <div className="bg-background-light min-h-screen font-sans text-slate-900 flex justify-center bg-gray-100">
      <div className="w-full max-w-md bg-background-light min-h-screen relative shadow-2xl flex flex-col">
        <div className={`flex-1 ${showNav ? 'pb-20' : ''}`}>
          {children}
        </div>
        {showNav && <BottomNav />}
      </div>
    </div>
  );
};

export default function App() {
  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/activation" element={<ActivationPage />} />
          <Route path="/input" element={<ProtectedRoute><InputPage /></ProtectedRoute>} />
          <Route path="/loading" element={<ProtectedRoute><LoadingPage /></ProtectedRoute>} />
          <Route path="/results" element={<ProtectedRoute><ResultsPage /></ProtectedRoute>} />
          <Route path="/detail/:id" element={<ProtectedRoute><DetailPage /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
          <Route path="/favorites" element={<ProtectedRoute><FavoritesPage /></ProtectedRoute>} />
        </Routes>
      </Layout>
    </HashRouter>
  );
}
