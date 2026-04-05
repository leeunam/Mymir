import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/auth.store';
import { Toaster } from 'react-hot-toast';
import { LoginPage } from './pages/Login';
import { SignupPage } from './pages/Signup';
import { ChatPage } from './pages/Chat';
import { ProfilePage } from './pages/Profile';
import { DashboardLayout } from './components/layout/DashboardLayout';

function Private({ children }: { children: React.ReactNode }) {
  const { token } = useAuthStore();
  return token ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        
        {/* Protected Routes wrapped in DashboardLayout */}
        <Route
          path="/"
          element={
            <Private>
              <DashboardLayout>
                <ChatPage />
              </DashboardLayout>
            </Private>
          }
        />
        <Route
          path="/profile"
          element={
            <Private>
              <DashboardLayout>
                <ProfilePage />
              </DashboardLayout>
            </Private>
          }
        />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#1f2937',
            color: '#e5e7eb',
            border: '1px solid #374151',
            fontSize: '13px',
          },
        }}
      />
    </BrowserRouter>
  );
}
