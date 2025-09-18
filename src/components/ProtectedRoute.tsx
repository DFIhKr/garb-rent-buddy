// src/components/ProtectedRoute.tsx
import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'user';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const didRedirect = useRef(false);

  // Hanya jalankan redirect ONCE setelah loading selesai
  useEffect(() => {
    if (loading) return;

    // jika belum login -> ke /auth
    if (!user || !profile) {
      if (!didRedirect.current) {
        didRedirect.current = true;
        navigate('/auth', { replace: true });
      }
      return;
    }

    // jika role tidak sesuai -> redirect ke home (sekali)
    if (requiredRole && profile.role !== requiredRole) {
      if (!didRedirect.current) {
        didRedirect.current = true;
        navigate('/', { replace: true });
      }
      return;
    }

    // kalau sampai sini berarti boleh akses -> reset flag agar tidak menghalangi navigasi lain
    didRedirect.current = false;
  }, [loading, user, profile, requiredRole, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-primary flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-white mx-auto mb-4" />
          <p className="text-white/80">Loading...</p>
        </div>
      </div>
    );
  }

  // Kalau sedang redirect, jangan render children (return null supaya tidak menggandakan navigasi)
  if (!user || !profile) return null;
  if (requiredRole && profile.role !== requiredRole) return null;

  return <>{children}</>;
};

export default ProtectedRoute;
