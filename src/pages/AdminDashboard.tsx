// src/pages/AdminDashboard.tsx - VERSI BARU DENGAN TAB RIWAYAT

import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/enhanced-button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Package, Users, Upload, Loader2, Trash2, History } from 'lucide-react'; // Tambahkan ikon History

// ... (Interface Product dan Transaction tetap sama) ...
interface Product { id: number; name: string; image_url?: string; stock: number; created_at: string; }
interface Transaction { id: number; quantity: number; created_at: string; users: { name: string; class?: string; }; products: { name: string; }; }

// 1. BUAT INTERFACE BARU UNTUK DATA LOG
interface ActivityLogItem {
  activity_type: 'borrow' | 'return';
  event_date: string;
  user_name: string;
  product_name: string;
  quantity: number;
  reason: string;
  borrower_name: string;
}

const AdminDashboard = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  // 2. BUAT STATE BARU UNTUK MENYIMPAN LOG
  const [activityLog, setActivityLog] = useState<ActivityLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [productName, setProductName] = useState('');
  const [productStock, setProductStock] = useState('');
  const [productImage, setProductImage] = useState<File | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 3. PANGGIL SEMUA FUNGSI FETCH DATA
      await Promise.all([
        fetchProducts(),
        fetchTransactions(),
        fetchActivityLog()
      ]);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Gagal memuat data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    setProducts(data || []);
  };
  const fetchTransactions = async () => {
    const { data, error } = await supabase.from('transactions').select(`id, quantity, created_at, users (name, class), products (name)`).order('created_at', { ascending: false });
    if (error) throw error;
    setTransactions(data || []);
  };
  
  // 4. BUAT FUNGSI BARU UNTUK MENGAMBIL DATA DARI VIEW 'activity_log'
  const fetchActivityLog = async () => {
    const { data, error } = await supabase.from('activity_log').select('*');
    if (error) throw error;
    setActivityLog(data || []);
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    // ... (Fungsi handleAddProduct tidak berubah)
    // ... setelah berhasil, panggil fetchData() untuk refresh semua data termasuk log
    fetchData();
  };

  const handleDeleteProduct = async (productId: number) => {
    // ... (Fungsi handleDeleteProduct tidak berubah)
    // ... setelah berhasil, panggil fetchData() untuk refresh semua data termasuk log
    fetchData();
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  if (loading) {
    return <Layout><div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></Layout>;
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard Admin</h1>
          <p className="text-muted-foreground mt-2">Kelola produk, pantau transaksi, dan lihat riwayat aktivitas</p>
        </div>
        
        <Tabs defaultValue="products" className="space-y-6">
          {/* 5. TAMBAHKAN TRIGGER BARU UNTUK TAB RIWAYAT */}
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="add-product" className="flex items-center space-x-2"><Plus className="h-4 w-4" /><span>Tambah Produk</span></TabsTrigger>
            <TabsTrigger value="products" className="flex items-center space-x-2"><Package className="h-4 w-4" /><span>Daftar Produk</span></TabsTrigger>
            <TabsTrigger value="transactions" className="flex items-center space-x-2"><Users className="h-4 w-4" /><span>Peminjaman</span></TabsTrigger>
            <TabsTrigger value="history" className="flex items-center space-x-2"><History className="h-4 w-4" /><span>Riwayat</span></TabsTrigger>
          </TabsList>
          
          <TabsContent value="add-product">{/* ... Konten Tambah Produk ... */}</TabsContent>
          <TabsContent value="products">{/* ... Konten Daftar Produk ... */}</TabsContent>
          <TabsContent value="transactions">{/* ... Konten Transaksi ... */}</TabsContent>

          {/* 6. BUAT KONTEN BARU UNTUK TAB RIWAYAT */}
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Riwayat Aktivitas</CardTitle>
                <CardDescription>Mencatat semua aktivitas peminjaman dan pengembalian barang.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipe</TableHead>
                      <TableHead>Nama Peminjam</TableHead>
                      <TableHead>Nama Barang</TableHead>
                      <TableHead>Jumlah</TableHead>
                      <TableHead>Keterangan/Alasan</TableHead>
                      <TableHead>Tanggal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activityLog.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground">Belum ada aktivitas tercatat.</TableCell></TableRow>
                    ) : (
                      activityLog.map((log, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              log.activity_type === 'borrow' 
                                ? 'bg-yellow-100 text-yellow-800' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {log.activity_type === 'borrow' ? 'Meminjam' : 'Mengembalikan'}
                            </span>
                          </TableCell>
                          <TableCell className="font-medium">{log.borrower_name}</TableCell>
                          <TableCell>{log.product_name}</TableCell>
                          <TableCell>{log.quantity} unit</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{log.reason || '-'}</TableCell>
                          <TableCell>{formatDate(log.event_date)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
