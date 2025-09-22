// src/pages/AdminDashboard.tsx - VERSI DEBUG DENGAN CONSOLE.LOG

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
import { Plus, Package, Users, Upload, Loader2, Trash2, History } from 'lucide-react';

interface Product { id: number; name: string; image_url?: string; stock: number; created_at: string; }
interface Transaction { id: number; quantity: number; created_at: string; users: { name: string; class?: string; }; products: { name: string; }; }
interface ActivityLogItem { activity_type: 'borrow' | 'return'; event_date: string; user_name: string; product_name: string; quantity: number; reason: string; borrower_name: string; }

const AdminDashboard = () => {
  console.log('[RENDER] Komponen AdminDashboard mulai dirender.');

  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [productName, setProductName] = useState('');
  const [productStock, setProductStock] = useState('');
  const [productImage, setProductImage] = useState<File | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    console.log('[EFFECT] useEffect dipanggil, akan menjalankan fetchData.');
    fetchData();
  }, []);

  const fetchData = async () => {
    console.log('[FETCH] Fungsi fetchData dimulai.');
    setLoading(true);
    try {
      await Promise.all([
        fetchProducts(),
        fetchTransactions(),
        fetchActivityLog()
      ]);
      console.log('[FETCH] Semua data berhasil diambil.');
    } catch (error: any) {
      console.error('[FETCH ERROR] Terjadi error saat mengambil data:', error);
      toast({ title: "Error", description: error.message || "Gagal memuat data", variant: "destructive" });
    } finally {
      console.log('[FETCH] Proses fetch selesai, setLoading(false).');
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    console.log('...mengambil data products');
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    console.log('   -> Data Products:', data);
    if (error) {
      console.error('   -> Error Products:', error);
      throw error;
    }
    setProducts(data || []);
  };
  
  const fetchTransactions = async () => {
    console.log('...mengambil data transactions');
    const { data, error } = await supabase.from('transactions').select(`id, quantity, created_at, users (name, class), products (name)`).order('created_at', { ascending: false });
    console.log('   -> Data Transactions:', data);
    if (error) {
      console.error('   -> Error Transactions:', error);
      throw error;
    }
    setTransactions(data || []);
  };
  
  const fetchActivityLog = async () => {
    console.log('...mengambil data activity_log');
    const { data, error } = await supabase.from('activity_log').select('*');
    console.log('   -> Data Activity Log:', data);
    if (error) {
      console.error('   -> Error Activity Log:', error);
      throw error;
    }
    setActivityLog(data || []);
  };

  // ... (sisa fungsi handleAdd, handleDelete, formatDate tidak perlu diubah)
  const handleAddProduct = async (e: React.FormEvent) => { /* ... */ fetchData(); };
  const handleDeleteProduct = async (productId: number) => { /* ... */ fetchData(); };
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  if (loading) {
    console.log('[RENDER] Status: LOADING...');
    return <Layout><div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></Layout>;
  }
  
  console.log('[RENDER] Status: render UI utama dengan data:', { products, transactions, activityLog });

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard Admin</h1>
          <p className="text-muted-foreground mt-2">Kelola produk, pantau transaksi, dan lihat riwayat aktivitas</p>
        </div>
        
        <Tabs defaultValue="products" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="add-product" className="flex items-center space-x-2"><Plus className="h-4 w-4" /><span>Tambah Produk</span></TabsTrigger>
            <TabsTrigger value="products" className="flex items-center space-x-2"><Package className="h-4 w-4" /><span>Daftar Produk</span></TabsTrigger>
            <TabsTrigger value="transactions" className="flex items-center space-x-2"><Users className="h-4 w-4" /><span>Peminjaman</span></TabsTrigger>
            <TabsTrigger value="history" className="flex items-center space-x-2"><History className="h-4 w-4" /><span>Riwayat</span></TabsTrigger>
          </TabsList>
          
          <TabsContent value="add-product">
            <Card>
              <CardHeader><CardTitle>Tambah Produk Baru</CardTitle><CardDescription>Tambahkan produk baju ke inventory</CardDescription></CardHeader>
              <CardContent><form onSubmit={handleAddProduct} className="space-y-4">
                  {/* ... form content ... */}
              </form></CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products">
            <Card>
              <CardHeader><CardTitle>Daftar Produk</CardTitle><CardDescription>Kelola inventory produk yang tersedia</CardDescription></CardHeader>
              <CardContent><Table>
                <TableHeader><TableRow><TableHead>Gambar</TableHead><TableHead>Nama</TableHead><TableHead>Stok</TableHead><TableHead>Ditambahkan</TableHead><TableHead className="text-right">Aksi</TableHead></TableRow></TableHeader>
                <TableBody>
                  {products.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Belum ada produk</TableCell></TableRow>
                  ) : ( products.map((product) => ( <TableRow key={product.id}>
                          {/* ... table content ... */}
                  </TableRow>)))}
                </TableBody>
              </Table></CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="transactions">
            <Card>
              <CardHeader><CardTitle>Riwayat Transaksi</CardTitle><CardDescription>Pantau semua transaksi peminjaman</CardDescription></CardHeader>
              <CardContent><Table>
                <TableHeader><TableRow><TableHead>Nama User</TableHead><TableHead>Kelas</TableHead><TableHead>Produk</TableHead><TableHead>Jumlah</TableHead><TableHead>Tanggal</TableHead></TableRow></TableHeader>
                <TableBody>
                  {transactions.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Belum ada transaksi</TableCell></TableRow>
                  ) : ( transactions.map((transaction) => ( <TableRow key={transaction.id}>
                          {/* ... table content ... */}
                  </TableRow>)))}
                </TableBody>
              </Table></CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader><CardTitle>Riwayat Aktivitas</CardTitle><CardDescription>Mencatat semua aktivitas peminjaman dan pengembalian barang.</CardDescription></CardHeader>
              <CardContent><Table>
                <TableHeader><TableRow><TableHead>Tipe</TableHead><TableHead>Nama Peminjam</TableHead><TableHead>Nama Barang</TableHead><TableHead>Jumlah</TableHead><TableHead>Keterangan/Alasan</TableHead><TableHead>Tanggal</TableHead></TableRow></TableHeader>
                <TableBody>
                  {activityLog.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground">Belum ada aktivitas tercatat.</TableCell></TableRow>
                  ) : (
                    activityLog.map((log, index) => (
                      <TableRow key={index}>
                        <TableCell><span className={`px-2 py-1 text-xs font-medium rounded-full ${ log.activity_type === 'borrow' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800' }`}>
                          {log.activity_type === 'borrow' ? 'Meminjam' : 'Mengembalikan'}
                        </span></TableCell>
                        <TableCell className="font-medium">{log.borrower_name}</TableCell>
                        <TableCell>{log.product_name}</TableCell>
                        <TableCell>{log.quantity} unit</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{log.reason || '-'}</TableCell>
                        <TableCell>{formatDate(log.event_date)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table></CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
