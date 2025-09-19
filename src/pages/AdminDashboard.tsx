// src/pages/AdminDashboard.tsx

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
// 1. IMPORT IKON BARU UNTUK TOMBOL HAPUS
import { Plus, Package, Users, Upload, Loader2, Trash2 } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  image_url?: string;
  stock: number;
  created_at: string;
}

interface Transaction {
  id: number;
  quantity: number;
  created_at: string;
  users: {
    name: string;
    class?: string;
  };
  products: {
    name: string;
  };
}

const AdminDashboard = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Form states
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
      // ... (fetchData tidak berubah)
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      if (productsError) throw productsError;
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select(`id, quantity, created_at, users (name, class), products (name)`)
        .order('created_at', { ascending: false });
      if (transactionsError) throw transactionsError;
      setProducts(productsData || []);
      setTransactions(transactionsData || []);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Gagal memuat data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };
  
  const uploadImage = async (file: File): Promise<string | null> => {
    // ... (uploadImage tidak berubah)
    try {
      const fileName = `${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from('products').upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('products').getPublicUrl(fileName);
      return data.publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      return null;
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    // ... (handleAddProduct tidak berubah)
    e.preventDefault();
    if (!productName || !productStock) return;
    setUploading(true);
    try {
      let imageUrl = null;
      if (productImage) {
        imageUrl = await uploadImage(productImage);
        if (!imageUrl) throw new Error('Gagal mengupload gambar');
      }
      const { error } = await supabase.from('products').insert([{ name: productName, stock: parseInt(productStock), image_url: imageUrl }]);
      if (error) throw error;
      toast({ title: "Berhasil!", description: "Produk berhasil ditambahkan", variant: "default" });
      setProductName('');
      setProductStock('');
      setProductImage(null);
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Gagal menambah produk", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  // 2. BUAT FUNGSI BARU UNTUK MENGHAPUS PRODUK
  const handleDeleteProduct = async (productId: number) => {
    // Minta konfirmasi sebelum menghapus
    if (!window.confirm("Apakah Anda yakin ingin menghapus produk ini? Tindakan ini tidak bisa dibatalkan.")) {
      return;
    }

    try {
      // Kirim perintah hapus ke Supabase
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) {
        // Jika ada error (misal: foreign key constraint), lempar error
        throw error;
      }

      // Jika berhasil, update state products dengan menghapus produk yang sesuai
      setProducts(currentProducts => currentProducts.filter(p => p.id !== productId));
      
      toast({
        title: "Berhasil!",
        description: "Produk telah dihapus.",
        variant: "default"
      });

    } catch (error: any) {
      toast({
        title: "Gagal Menghapus",
        description: error.message || "Terjadi kesalahan. Produk ini mungkin terikat dengan data transaksi.",
        variant: "destructive"
      });
    }
  };

  const formatDate = (dateString: string) => {
    // ... (formatDate tidak berubah)
    return new Date(dateString).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    // ... (loading state tidak berubah)
    return <Layout><div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></Layout>;
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* ... (Header tidak berubah) ... */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard Admin</h1>
          <p className="text-muted-foreground mt-2">
            Kelola produk dan pantau transaksi peminjaman
          </p>
        </div>
        
        <Tabs defaultValue="products" className="space-y-6">
          {/* ... (TabsList dan TabsContent 'add-product' tidak berubah) ... */}
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="add-product" className="flex items-center space-x-2"><Plus className="h-4 w-4" /><span>Tambah Produk</span></TabsTrigger>
            <TabsTrigger value="products" className="flex items-center space-x-2"><Package className="h-4 w-4" /><span>Daftar Produk</span></TabsTrigger>
            <TabsTrigger value="transactions" className="flex items-center space-x-2"><Users className="h-4 w-4" /><span>Transaksi</span></TabsTrigger>
          </TabsList>
          
          <TabsContent value="add-product">{/* ... */}</TabsContent>
          
          <TabsContent value="products">
            <Card>
              <CardHeader>
                <CardTitle>Daftar Produk</CardTitle>
                <CardDescription>Kelola inventory produk yang tersedia</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Gambar</TableHead>
                      <TableHead>Nama</TableHead>
                      <TableHead>Stok</TableHead>
                      <TableHead>Ditambahkan</TableHead>
                      {/* 3. TAMBAHKAN KOLOM BARU UNTUK AKSI */}
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Belum ada produk</TableCell></TableRow>
                    ) : (
                      products.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell>{/* ... */}</TableCell>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell>{/* ... */}</TableCell>
                          <TableCell className="text-muted-foreground">{formatDate(product.created_at)}</TableCell>
                          {/* 4. TAMBAHKAN TOMBOL HAPUS DI SINI */}
                          <TableCell className="text-right">
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteProduct(product.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="transactions">{/* ... */}</TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
