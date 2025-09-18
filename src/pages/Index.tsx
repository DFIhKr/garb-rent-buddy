import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/enhanced-button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Package, TrendingUp, Shirt } from 'lucide-react';

const Index = () => {
  const { profile, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  // Redirect based on user role
  if (profile?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }
  
  if (profile?.role === 'user') {
    return <Navigate to="/user" replace />;
  }

  // Fallback - this shouldn't happen if auth is working properly
  return <Navigate to="/auth" replace />;
};

export default Index;
