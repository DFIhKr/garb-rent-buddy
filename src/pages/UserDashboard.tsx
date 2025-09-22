// src/pages/UserDashboard.tsx - FINAL DENGAN PEMANGGILAN RPC YANG STABIL

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

interface Product {
  id: number; name: string; image_url?: string; stock: number; created_at: string;
}

interface BorrowedItem {
  id: number; quantity: number; returned_quantity: number; created_at: string; products: { name: string };
}

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

  useEffect(() => {
    if(profile) {
      fetchAllData();
    }
  }, [profile]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchProducts(), fetchBorrowedItems()]);
    } catch (error: any) {
      toast({ title: "Error Memuat Data", description: error.message || "Gagal memuat data dari database.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    setProducts(data || []);
  };

  const fetchBorrowedItems = async () => {
    if (!profile) return;
    // ===== INI ADALAH BARIS YANG DIPERBAIKI: MEMANGGIL FUNGSI RPC =====
    const { data, error } = await supabase.rpc('get_active_transactions');
    if (error) throw error;
    setBorrowedItems(data || []);
  };

  const handleBorrow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!borrowDialog.product || !borrowQuantity || !borrowerName || !profile) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from('transactions').insert([{
          user_id: profile.id, product_id: borrowDialog.product.id, quantity: parseInt(borrowQuantity),
          borrower_name: borrowerName, reason: borrowReason
      }]);
      if (error) throw error;
      toast({ title: "Berhasil!", description: `Laporan peminjaman ${borrowDialog.product.name} berhasil dibuat`, variant: "default" });
      setBorrowDialog({ open: false, product: null });
      fetchAllData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Gagal membuat laporan peminjaman", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };
  
  const openBorrowDialog = (product: Product) => {
    if (product.stock <= 0) { toast({ title: "Stok Habis", variant: "destructive" }); return; }
    setBorrowerName(profile?.name || '');
    setUserClass(profile?.class || '');
    setBorrowReason('');
    setBorrowQuantity('1');
    setBorrowDialog({ open: true, product });
  };

  const handleReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnDialog.item || !returnQuantity) return;
    const quantityToReturn = parseInt(returnQuantity);
    const item = returnDialog.item;
    const maxReturn = item.quantity - item.returned_quantity;
    if (quantityToReturn <= 0 || quantityToReturn > maxReturn) {
      toast({ title: "Error", description: `Jumlah harus antara 1 dan ${maxReturn}`, variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.rpc('handle_return', {
        p_transaction_id: item.id, p_return_quantity: quantityToReturn, p_return_reason: returnReason
      });
      if (error) throw error;
      toast({ title: "Berhasil!", description: "Barang telah dikembalikan.", variant: "default" });
      setReturnDialog({ open: false, item: null });
      fetchAllData();
    } catch (error: any) {
      toast({ title: "Gagal Mengembalikan", description: error.message || "Terjadi kesalahan.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const openReturnDialog = (item: BorrowedItem) => {
    setReturnQuantity('1');
    setReturnReason('');
    setReturnDialog({ open: true, item });
  };
  
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  if (loading) {
    return <Layout><div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></Layout>;
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard User</h1>
          <p className="text-muted-foreground mt-2">Lihat produk yang tersedia, pinjam, dan kembalikan barang</p>
        </div>

        <Tabs defaultValue="available" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="available" className="flex items-center space-x-2"><ShoppingCart className="h-4 w-4" /><span>Barang Dapat Dipinjam</span></TabsTrigger>
            <TabsTrigger value="borrowed" className="flex items-center space-x-2"><ArchiveRestore className="h-4 w-4" /><span>Barang yang Dipinjam</span></TabsTrigger>
          </TabsList>

          <TabsContent value="available">
            <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <Card key={product.id} className="hover:shadow-lg transition-all duration-300 hover:scale-[1.02] bg-gradient-card border-0">
                  <CardContent className="p-0">
                    <div className="aspect-square relative overflow-hidden rounded-t-lg bg-muted">
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-primary-light"><Shirt className="h-16 w-16 text-primary" /></div>
                      )}
                      <div className="absolute top-3 right-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${product.stock > 0 ? 'bg-success text-success-foreground' : 'bg-destructive text-destructive-foreground'}`}>
                          {product.stock > 0 ? `${product.stock} tersedia` : 'Habis'}
                        </span>
                      </div>
                    </div>
                    <div className="p-4 space-y-3">
                      <div>
                        <h3 className="font-semibold text-lg text-card-foreground">{product.name}</h3>
                        <p className="text-sm text-muted-foreground">Stok: {product.stock} unit</p>
                      </div>
                      <Button onClick={() => openBorrowDialog(product)} variant="gradient" className="w-full" disabled={product.stock <= 0}>
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        {product.stock > 0 ? 'Pinjam' : 'Stok Habis'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="borrowed">
            <Card>
              <CardContent className="p-4">
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
                      <TableRow><TableCell colSpan={4} className="text-center py-12 text-muted-foreground">Anda tidak sedang meminjam barang.</TableCell></TableRow>
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
        
        <Dialog open={borrowDialog.open} onOpenChange={(open) => setBorrowDialog({ ...borrowDialog, open: open, product: open ? borrowDialog.product : null })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Buat Laporan Peminjaman</DialogTitle>
              <DialogDescription>Isi form berikut untuk meminjam {borrowDialog.product?.name}</DialogDescription>
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
              <DialogDescription>Mengembalikan: {returnDialog.item?.products.name}</DialogDescription>
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
