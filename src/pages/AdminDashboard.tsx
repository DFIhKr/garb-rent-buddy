// src/pages/AdminDashboard.tsx - VERSI SANGAT SEDERHANA UNTUK TES

import React from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus } from 'lucide-react';

const AdminDashboard = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard Admin (Mode Tes)</h1>
          <p className="text-muted-foreground mt-2">Tes untuk menampilkan konten statis.</p>
        </div>
        
        <Tabs defaultValue="add-product" className="space-y-6">
          <TabsList>
            <TabsTrigger value="add-product" className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Tambah Produk</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="add-product">
            <Card>
              <CardHeader>
                <CardTitle>Form Tambah Produk Seharusnya Muncul di Sini</CardTitle>
                <CardDescription>
                  Jika Anda bisa melihat teks ini, berarti komponen Tabs dan Layout berfungsi. Masalahnya ada pada pengambilan data.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="font-bold text-lg">Ini adalah konten statis yang berhasil ditampilkan.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
