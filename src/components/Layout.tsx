// src/components/ProtectedRoute.tsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'user';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { profile, loading } = useAuth();
  const location = useLocation();

  // 1. Tampilkan layar loading jika konteks masih memeriksa status otentikasi
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-primary flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-white mx-auto mb-4" />
          <p className="text-white/80">Memverifikasi sesi...</p>
        </div>
      </div>
    );
  }

  // 2. Jika loading selesai dan TIDAK ADA profil, arahkan ke halaman login
  if (!profile) {
    // Simpan halaman yang ingin dituju agar bisa kembali setelah login
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // 3. Jika ada role yang dibutuhkan dan role pengguna tidak sesuai, arahkan ke halaman yang sesuai
  if (requiredRole && profile.role !== requiredRole) {
    // Jika admin mencoba akses halaman user, arahkan ke dashboard admin, begitu juga sebaliknya.
    const redirectTo = profile.role === 'admin' ? '/admin' : '/user';
    return <Navigate to={redirectTo} replace />;
  }

  // 4. Jika semua pemeriksaan lolos, tampilkan halaman yang seharusnya
  return <>{children}</>;
};

export default ProtectedRoute;
