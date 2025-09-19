// src/pages/AdminDashboard.tsx - VERSI FINAL (FIXED)

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
      const { data: productsData, error: productsError } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      if (productsError) throw productsError;
      const { data: transactionsData, error: transactionsError } = await supabase.from('transactions').select(`id, quantity, created_at, users (name, class), products (name)`).order('created_at', { ascending: false });
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

  const handleDeleteProduct = async (productId: number) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus produk ini? Tindakan ini tidak bisa dibatalkan.")) {
      return;
    }
    try {
      const { error } = await supabase.from('products').delete().eq('id', productId);
      if (error) throw error;
      setProducts(currentProducts => currentProducts.filter(p => p.id !== productId));
      toast({ title: "Berhasil!", description: "Produk telah dihapus.", variant: "default" });
    } catch (error: any) {
      toast({ title: "Gagal Menghapus", description: error.message || "Terjadi kesalahan. Produk ini mungkin terikat dengan data transaksi.", variant: "destructive" });
    }
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
          <p className="text-muted-foreground mt-2">Kelola produk dan pantau transaksi peminjaman</p>
        </div>
        
        <Tabs defaultValue="products" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="add-product" className="flex items-center space-x-2"><Plus className="h-4 w-4" /><span>Tambah Produk</span></TabsTrigger>
            <TabsTrigger value="products" className="flex items-center space-x-2"><Package className="h-4 w-4" /><span>Daftar Produk</span></TabsTrigger>
            <TabsTrigger value="transactions" className="flex items-center space-x-2"><Users className="h-4 w-4" /><span>Transaksi</span></TabsTrigger>
          </TabsList>
          
          <TabsContent value="add-product">
            <Card>
              <CardHeader>
                <CardTitle>Tambah Produk Baru</CardTitle>
                <CardDescription>Tambahkan produk baju ke inventory</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddProduct} className="space-y-4">
                  <div className="space-y-2"><Label htmlFor="product-name">Nama Produk</Label><Input id="product-name" value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="Contoh: Kemeja Putih" required /></div>
                  <div className="space-y-2"><Label htmlFor="product-stock">Stok</Label><Input id="product-stock" type="number" value={productStock} onChange={(e) => setProductStock(e.target.value)} placeholder="Jumlah stok" min="0" required /></div>
                  <div className="space-y-2"><Label htmlFor="product-image">Gambar Produk</Label><Input id="product-image" type="file" accept="image/*" onChange={(e) => setProductImage(e.target.files?.[0] || null)} /></div>
                  <Button type="submit" variant="gradient" disabled={uploading} className="w-full">
                    {uploading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Mengupload...</>) : (<><Plus className="mr-2 h-4 w-4" />Tambah Produk</>)}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

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
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Belum ada produk</TableCell></TableRow>
                    ) : (
                      products.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell>
                            {product.image_url ? (<img src={product.image_url} alt={product.name} className="w-12 h-12 rounded-lg object-cover" />) : (<div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center"><Package className="h-6 w-6 text-muted-foreground" /></div>)}
                          </TableCell>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-sm font-medium ${product.stock > 0 ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>{product.stock} unit</span>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{formatDate(product.created_at)}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="destructive" size="sm" onClick={() => handleDeleteProduct(product.id)}><Trash2 className="h-4 w-4" /></Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions">
            <Card>
              <CardHeader>
                <CardTitle>Riwayat Transaksi</CardTitle>
                <CardDescription>Pantau semua transaksi peminjaman</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama User</TableHead>
                      <TableHead>Kelas</TableHead>
                      <TableHead>Produk</TableHead>
                      <TableHead>Jumlah</TableHead>
                      <TableHead>Tanggal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Belum ada transaksi</TableCell></TableRow>
                    ) : (
                      transactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell className="font-medium">{transaction.users?.name || 'User tidak ditemukan'}</TableCell>
                          <TableCell>{transaction.users?.class || '-'}</TableCell>
                          <TableCell>{transaction.products?.name || 'Produk tidak ditemukan'}</TableCell>
                          <TableCell>{transaction.quantity} unit</TableCell>
                          <TableCell className="text-muted-foreground">{formatDate(transaction.created_at)}</TableCell>
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
