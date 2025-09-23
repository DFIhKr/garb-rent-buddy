// src/components/Layout.tsx - VERSI RESPONSIVE

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/enhanced-button';
import { LogOut, Shirt, User } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { profile, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header Responsif */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Bagian Kiri Header */}
            <div className="flex items-center space-x-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <Shirt className="h-6 w-6 text-primary" />
              </div>
              <div className="hidden sm:block"> {/* Sembunyikan di layar kecil */}
                <h1 className="text-xl font-bold text-gray-800 dark:text-white">Garb Rent</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                  Dashboard {profile?.role}
                </p>
              </div>
            </div>

            {/* Bagian Kanan Header */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="hidden sm:flex items-center space-x-2 text-gray-700 dark:text-gray-300">
                <User className="h-4 w-4" />
                <span className="text-sm font-medium">{profile?.name}</span>
              </div>
              
              <Button
                onClick={signOut}
                variant="ghost"
                size="icon" // Ubah menjadi icon di layar kecil
                className="sm:size-auto sm:px-3 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <LogOut className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Keluar</span> {/* Sembunyikan teks di layar kecil */}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Konten Utama */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;
