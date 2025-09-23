// src/pages/UserDashboard.tsx - VERSI DENGAN TAMPILAN BARU

import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/enhanced-button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Package, ShoppingCart, Loader2, Shirt, ArchiveRestore, Undo2 } from 'lucide-react';

// --- TIDAK ADA PERUBAHAN PADA INTERFACE & FUNGSI LOGIKA ---
interface Product { id: number; name: string; image_url?: string; stock: number; created_at: string; }
interface BorrowedItem { id: number; quantity: number; returned_quantity: number; created_at: string; products: { name: string }; }

const UserDashboard = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [borrowedItems, setBorrowedItems] = useState<BorrowedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [borrowDialog, setBorrowDialog] = useState({ open: false, product: null as Product | null });
  const [borrowerName, setBorrowerName] = useState('');
  const [borrowQuantity, setBorrowQuantity] = useState('');
  const [userClass, setUserClass] = useState('');
  const [borrowReason, setBorrowReason] = useState('');

  const [returnDialog, setReturnDialog] = useState({ open: false, item: null as BorrowedItem | null });
  const [returnQuantity, setReturnQuantity] = useState('');
  const [returnReason, setReturnReason] = useState('');

  const { profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => { if(profile) fetchAllData(); }, [profile]);

  const fetchAllData = async () => { /* ... (Tidak Berubah) ... */ };
  const fetchProducts = async () => { /* ... (Tidak Berubah) ... */ };
  const fetchBorrowedItems = async () => { /* ... (Tidak Berubah) ... */ };
  const handleBorrow = async (e: React.FormEvent) => { /* ... (Tidak Berubah) ... */ };
  const openBorrowDialog = (product: Product) => { /* ... (Tidak Berubah) ... */ };
  const handleReturn = async (e: React.FormEvent) => { /* ... (Tidak Berubah) ... */ };
  const openReturnDialog = (item: BorrowedItem) => { /* ... (Tidak Berubah) ... */ };
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  if (loading) {
    return <Layout><div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></Layout>;
  }

  return (
    <Layout>
      <div className="space-y-8"> {/* Memberi sedikit ruang ekstra antar elemen */}
        
        {/* --- HEADER HALAMAN BARU --- */}
        <div className="flex items-center space-x-4">
          <div className="bg-secondary p-3 rounded-lg">
            <ShoppingCart className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Katalog Produk</h1>
            <p className="text-muted-foreground mt-1">
              Lihat, pinjam, dan kembalikan barang inventaris yang tersedia.
            </p>
          </div>
        </div>

        <Tabs defaultValue="available" className="space-y-6">
          {/* --- TOMBOL TABS DENGAN GAYA BARU --- */}
          <TabsList className="grid w-full grid-cols-2 gap-2 p-1 rounded-lg bg-muted shadow-inner">
            <TabsTrigger
              value="available"
              className="flex items-center justify-center space-x-2 py-2 px-3 rounded-md transition-all
                         bg-card text-foreground border border-input shadow-[0_4px_14px_0_hsl(var(--primary)/10%)] 
                         data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-[0_4px_14px_0_hsl(var(--primary)/25%)]
                         hover:bg-accent hover:text-accent-foreground"
            >
              <ShoppingCart className="h-4 w-4" />
              <span className="text-sm font-medium">Barang Tersedia</span>
            </TabsTrigger>
            <TabsTrigger
              value="borrowed"
              className="flex items-center justify-center space-x-2 py-2 px-3 rounded-md transition-all
                         bg-card text-foreground border border-input shadow-[0_4px_14px_0_hsl(var(--primary)/10%)] 
                         data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-[0_4px_14px_0_hsl(var(--primary)/25%)]
                         hover:bg-accent hover:text-accent-foreground"
            >
              <ArchiveRestore className="h-4 w-4" />
              <span className="text-sm font-medium">Barang Dipinjam</span>
            </TabsTrigger>
          </TabsList>

          {/* --- KARTU PRODUK DENGAN EFEK HOVER --- */}
          <TabsContent value="available">
            {products.length === 0 ? (
              <div className="text-center py-20">
                <Package className="h-16 w-16 mx-auto text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold text-foreground">Tidak Ada Produk Tersedia</h3>
                <p className="mt-1 text-muted-foreground">Admin belum menambahkan produk atau semua produk sedang dipinjam.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product) => (
                  <Card 
                    key={product.id} 
                    className="overflow-hidden group transition-all duration-300 hover:shadow-xl hover:-translate-y-2 border"
                  >
                    <CardContent className="p-0">
                      <div className="aspect-[4/3] relative">
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-muted"><Shirt className="h-20 w-20 text-gray-300" /></div>
                        )}
                        <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-semibold text-white ${product.stock > 0 ? 'bg-green-500' : 'bg-red-500'}`}>
                          {product.stock > 0 ? `${product.stock} Tersedia` : 'Habis'}
                        </span>
                      </div>
                      <div className="p-4 space-y-3 bg-card">
                        <div>
                          <h3 className="font-bold text-lg text-foreground truncate">{product.name}</h3>
                          <p className="text-sm text-muted-foreground">Stok saat ini: {product.stock} unit</p>
                        </div>
                        <Button onClick={() => openBorrowDialog(product)} variant="gradient" className="w-full" disabled={product.stock <= 0}>
                          <ShoppingCart className="mr-2 h-4 w-4" />
                          {product.stock > 0 ? 'Pinjam Barang' : 'Stok Habis'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="borrowed">
            <Card>
              <CardHeader>
                <CardTitle>Barang yang Sedang Anda Pinjam</CardTitle>
                <CardDescription>Berikut adalah daftar barang yang statusnya masih dalam peminjaman Anda.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama Barang</TableHead>
                      <TableHead>Jumlah Dipinjam</TableHead>
                      <TableHead>Tanggal Pinjam</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {borrowedItems.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center py-12 h-40 text-muted-foreground">Anda tidak sedang meminjam barang.</TableCell></TableRow>
                    ) : (
                      borrowedItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.products.name}</TableCell>
                          <TableCell>{item.quantity - item.returned_quantity} dari {item.quantity} unit</TableCell>
                          <TableCell>{formatDate(item.created_at)}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="outline" size="sm" onClick={() => openReturnDialog(item)}><Undo2 className="h-4 w-4 mr-2"/>Kembalikan</Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* --- DIALOG-DIALOG DENGAN TATA LETAK LEBIH BAIK --- */}
        <Dialog open={borrowDialog.open} onOpenChange={(open) => setBorrowDialog({ ...borrowDialog, open: open, product: open ? borrowDialog.product : null })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Form Peminjaman</DialogTitle>
              <DialogDescription>Isi detail peminjaman untuk: <span className="font-semibold text-primary">{borrowDialog.product?.name}</span></DialogDescription>
            </DialogHeader>
            <form onSubmit={handleBorrow} className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="borrower-name">Nama Peminjam</Label>
                <Input id="borrower-name" value={borrowerName} onChange={(e) => setBorrowerName(e.target.value)} placeholder="Tulis nama peminjam" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="user-class">Kelas</Label>
                  <Input id="user-class" value={userClass} onChange={(e) => setUserClass(e.target.value)} placeholder="Contoh: XII RPL 1" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity">Jumlah</Label>
                  <Input id="quantity" type="number" value={borrowQuantity} onChange={(e) => setBorrowQuantity(e.target.value)} placeholder="Jumlah" min="1" max={borrowDialog.product?.stock || 0} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reason">Keterangan / Alasan Meminjam</Label>
                <Textarea id="reason" value={borrowReason} onChange={(e) => setBorrowReason(e.target.value)} placeholder="Contoh: Dipinjam untuk 4 orang untuk acara sekolah" />
              </div>
              <div className="flex space-x-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setBorrowDialog({ open: false, product: null })} className="flex-1">Batal</Button>
                <Button type="submit" variant="gradient" disabled={submitting} className="flex-1">
                  {submitting ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Memproses...</>) : 'Buat Laporan'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        
        <Dialog open={returnDialog.open} onOpenChange={(open) => setReturnDialog({ ...returnDialog, open: open, item: open ? returnDialog.item : null })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Form Pengembalian Barang</DialogTitle>
              <DialogDescription>Mengembalikan: <span className="font-semibold text-primary">{returnDialog.item?.products.name}</span></DialogDescription>
            </DialogHeader>
            <form onSubmit={handleReturn} className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="return-quantity">Jumlah yang Dikembalikan</Label>
                <Input id="return-quantity" type="number" value={returnQuantity} onChange={(e) => setReturnQuantity(e.target.value)} min="1" max={returnDialog.item ? returnDialog.item.quantity - returnDialog.item.returned_quantity : 0} required />
                <p className="text-xs text-muted-foreground">Masih dipinjam: {returnDialog.item ? returnDialog.item.quantity - returnDialog.item.returned_quantity : 0} unit</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="return-reason">Laporan / Alasan Pengembalian</Label>
                <Textarea id="return-reason" value={returnReason} onChange={(e) => setReturnReason(e.target.value)} placeholder="Contoh: Acara sudah selesai" />
              </div>
              <div className="flex space-x-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setReturnDialog({ open: false, item: null })} className="flex-1">Batal</Button>
                <Button type="submit" variant="gradient" disabled={submitting} className="flex-1">
                  {submitting ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Memproses...</>) : 'Kembalikan Barang'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default UserDashboard;
