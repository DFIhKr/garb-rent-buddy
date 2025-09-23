// src/pages/AdminDashboard.tsx - VERSI DENGAN TAMPILAN YANG DIPERBAIKI

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
import { Plus, Package, Users, Upload, Loader2, Trash2, History, FileText, Archive } from 'lucide-react';

// --- TIDAK ADA PERUBAHAN PADA INTERFACE ---
interface Product { id: number; name: string; image_url?: string; stock: number; is_archived: boolean; created_at: string; }
interface Transaction { id: number; quantity: number; created_at: string; users: { name: string; class?: string; }; products: { name: string; }; }
interface ActivityLogItem { activity_type: 'borrow' | 'return'; event_date: string; user_name: string; product_name: string; quantity: number; reason: string; borrower_name: string; }

const AdminDashboard = () => {
  // --- TIDAK ADA PERUBAHAN PADA STATE DAN FUNGSI ---
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
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
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
    const { data, error } = await supabase.from('products').select('*').eq('is_archived', false).order('created_at', { ascending: false });
    if (error) throw error;
    setProducts(data || []);
  };
  
  const fetchTransactions = async () => {
    const { data, error } = await supabase
      .from('transactions')
      .select(`id, quantity, created_at, users (name, class), products!inner (name, is_archived)`)
      .eq('products.is_archived', false)
      .order('created_at', { ascending: false });
    if (error) throw error;
    setTransactions(data || []);
  };
  
  const fetchActivityLog = async () => {
    const { data, error } = await supabase.from('activity_log').select('*');
    if (error) throw error;
    setActivityLog(data || []);
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName || !productStock) return;
    setUploading(true);
    try {
      let imageUrl = null;
      if (productImage) {
        const fileName = `${Date.now()}-${productImage.name}`;
        const { error: uploadError } = await supabase.storage.from('products').upload(fileName, productImage);
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from('products').getPublicUrl(fileName);
        imageUrl = data.publicUrl;
      }
      const { error } = await supabase.from('products').insert([{ name: productName, stock: parseInt(productStock), image_url: imageUrl }]);
      if (error) throw error;
      toast({ title: "Berhasil!", description: "Produk berhasil ditambahkan" });
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

  const handleArchiveProduct = async (productId: number) => {
    if (!window.confirm("Apakah Anda yakin ingin mengarsipkan produk ini? Riwayatnya akan disembunyikan dari daftar utama.")) {
      return;
    }
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_archived: true })
        .eq('id', productId);
      if (error) throw error;
      toast({ title: "Berhasil!", description: "Produk telah diarsipkan." });
      fetchData();
    } catch (error: any) {
      toast({ title: "Gagal Mengarsipkan", description: error.message, variant: "destructive" });
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
          <p className="text-muted-foreground mt-2">Kelola produk, pantau transaksi, dan lihat riwayat aktivitas</p>
        </div>
        
        <Tabs defaultValue="add-product" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 gap-2 p-1 rounded-lg bg-muted shadow-inner">
            <TabsTrigger
              value="add-product"
              className="flex items-center justify-center space-x-2 py-2 px-3 rounded-md transition-all
                         bg-card text-foreground border border-input
                         shadow-[0_4px_14px_0_hsl(var(--primary)/10%)] 
                         data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-[0_4px_14px_0_hsl(var(--primary)/25%)]
                         hover:bg-accent hover:text-accent-foreground"
            >
              <Plus className="h-4 w-4" />
              <span className="text-sm font-medium">Tambah Produk</span>
            </TabsTrigger>
            <TabsTrigger
              value="products"
              className="flex items-center justify-center space-x-2 py-2 px-3 rounded-md transition-all
                         bg-card text-foreground border border-input
                         shadow-[0_4px_14px_0_hsl(var(--primary)/10%)]
                         data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-[0_4px_14px_0_hsl(var(--primary)/25%)]
                         hover:bg-accent hover:text-accent-foreground"
            >
              <Package className="h-4 w-4" />
              <span className="text-sm font-medium">Daftar Produk</span>
            </TabsTrigger>
            <TabsTrigger
              value="transactions"
              className="flex items-center justify-center space-x-2 py-2 px-3 rounded-md transition-all
                         bg-card text-foreground border border-input
                         shadow-[0_4px_14px_0_hsl(var(--primary)/10%)]
                         data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-[0_4px_14px_0_hsl(var(--primary)/25%)]
                         hover:bg-accent hover:text-accent-foreground"
            >
              <Users className="h-4 w-4" />
              <span className="text-sm font-medium">Peminjaman</span>
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="flex items-center justify-center space-x-2 py-2 px-3 rounded-md transition-all
                         bg-card text-foreground border border-input
                         shadow-[0_4px_14px_0_hsl(var(--primary)/10%)]
                         data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-[0_4px_14px_0_hsl(var(--primary)/25%)]
                         hover:bg-accent hover:text-accent-foreground"
            >
              <History className="h-4 w-4" />
              <span className="text-sm font-medium">Riwayat</span>
            </TabsTrigger>
          </TabsList>          
          {/* ===== PERUBAHAN TAMPILAN DIMULAI DARI SINI ===== */}
          <TabsContent value="add-product">
            <Card>
              <CardHeader>
                <CardTitle>Tambah Produk Baru</CardTitle>
                <CardDescription>Isi detail di bawah ini untuk menambahkan produk baru ke dalam inventaris.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddProduct} className="space-y-6">
                  {/* Nama Produk (Satu baris penuh) */}
                  <div className="space-y-2">
                    <Label htmlFor="product-name">Nama Produk</Label>
                    <Input id="product-name" value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="Contoh: Kemeja Putih OSIS Lengan Panjang" required />
                  </div>

                  {/* Layout Grid untuk Stok dan Gambar */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="product-stock">Stok Awal</Label>
                      <Input id="product-stock" type="number" value={productStock} onChange={(e) => setProductStock(e.target.value)} placeholder="e.g., 10" min="0" required />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="product-image">Gambar Produk</Label>
                      {/* Input file kustom */}
                      <Label 
                        htmlFor="product-image"
                        className="cursor-pointer bg-secondary hover:bg-muted text-secondary-foreground flex items-center justify-center h-10 w-full rounded-md border-2 border-dashed border-border transition-colors"
                      >
                        <Upload className="h-5 w-5 mr-3" />
                        <span className="text-sm">{productImage ? 'Ganti file gambar' : 'Pilih file gambar'}</span>
                      </Label>
                      <Input 
                        id="product-image" 
                        type="file" 
                        accept="image/*" 
                        className="hidden" // Input asli kita sembunyikan
                        onChange={(e) => setProductImage(e.target.files?.[0] || null)} 
                      />
                      {/* Tampilkan nama file yang dipilih */}
                      {productImage && (
                        <div className="text-sm text-muted-foreground flex items-center pt-1">
                          <FileText className="h-4 w-4 mr-2 flex-shrink-0" />
                          <span className="truncate">{productImage.name}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tombol Aksi */}
                  <div className="pt-2">
                    <Button type="submit" variant="gradient" disabled={uploading} className="w-full">
                      {uploading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Mengupload...</>) : (<><Plus className="mr-2 h-4 w-4" />Tambah Produk ke Inventaris</>)}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
          {/* ===== AKHIR DARI PERUBAHAN TAMPILAN ===== */}

          <TabsContent value="products">
            <Card>
              <CardHeader><CardTitle>Daftar Produk</CardTitle><CardDescription>Kelola inventaris produk yang tersedia.</CardDescription></CardHeader>
              <CardContent><Table>
                <TableHeader><TableRow><TableHead>Gambar</TableHead><TableHead>Nama</TableHead><TableHead>Stok</TableHead><TableHead>Ditambahkan</TableHead><TableHead className="text-right">Aksi</TableHead></TableRow></TableHeader>
                <TableBody>
                  {products.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Belum ada produk aktif.</TableCell></TableRow>
                  ) : ( products.map((product) => ( <TableRow key={product.id}>
                          <TableCell>{product.image_url ? <img src={product.image_url} alt={product.name} className="w-12 h-12 rounded-lg object-cover" /> : <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center"><Package className="h-6 w-6 text-muted-foreground" /></div>}</TableCell>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell><span className={`px-2 py-1 rounded-full text-sm font-medium ${product.stock > 0 ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>{product.stock} unit</span></TableCell>
                          <TableCell className="text-muted-foreground">{formatDate(product.created_at)}</TableCell>
                          <TableCell className="text-right"><Button variant="outline" size="sm" onClick={() => handleArchiveProduct(product.id)}><Archive className="h-4 w-4" /></Button></TableCell>
                  </TableRow>)))}
                </TableBody>
              </Table></CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="transactions">
            <Card>
              <CardHeader><CardTitle>Daftar Peminjaman Aktif</CardTitle><CardDescription>Pantau semua transaksi peminjaman yang sedang berjalan.</CardDescription></CardHeader>
              <CardContent><Table>
                <TableHeader><TableRow><TableHead>Nama User</TableHead><TableHead>Kelas</TableHead><TableHead>Produk</TableHead><TableHead>Jumlah</TableHead><TableHead>Tanggal</TableHead></TableRow></TableHeader>
                <TableBody>
                  {transactions.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Tidak ada peminjaman aktif.</TableCell></TableRow>
                  ) : ( transactions.map((transaction) => ( <TableRow key={transaction.id}>
                          <TableCell className="font-medium">{transaction.users?.name || 'User Dihapus'}</TableCell>
                          <TableCell>{transaction.users?.class || '-'}</TableCell>
                          <TableCell>{transaction.products?.name || 'Produk Dihapus'}</TableCell>
                          <TableCell>{transaction.quantity} unit</TableCell>
                          <TableCell className="text-muted-foreground">{formatDate(transaction.created_at)}</TableCell>
                  </TableRow>)))}
                </TableBody>
              </Table></CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader><CardTitle>Riwayat Aktivitas</CardTitle><CardDescription>Mencatat semua aktivitas peminjaman dan pengembalian barang dari produk yang aktif.</CardDescription></CardHeader>
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
