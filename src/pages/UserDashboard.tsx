// src/pages/UserDashboard.tsx - VERSI FINAL YANG SUDAH DIPERBAIKI

import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/enhanced-button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Package, ShoppingCart, Loader2, Shirt } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  image_url?: string;
  stock: number;
  created_at: string;
}

const UserDashboard = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [borrowerName, setBorrowerName] = useState('');
  const [borrowQuantity, setBorrowQuantity] = useState('');
  const [userClass, setUserClass] = useState('');
  const [borrowReason, setBorrowReason] = useState('');

  const { profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Gagal memuat produk", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleBorrow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !borrowQuantity || !borrowerName || !profile) return;

    const quantity = parseInt(borrowQuantity);
    if (quantity <= 0) {
      toast({ title: "Error", description: "Jumlah harus lebih dari 0", variant: "destructive" });
      return;
    }
    if (quantity > selectedProduct.stock) {
      toast({ title: "Error", description: "Jumlah melebihi stok yang tersedia", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      if (userClass && userClass !== profile.class) {
        await supabase.from('users').update({ class: userClass }).eq('id', profile.id);
      }

      const { error } = await supabase
        .from('transactions')
        .insert([{
          user_id: profile.id,
          product_id: selectedProduct.id,
          quantity: quantity,
          borrower_name: borrowerName,
          reason: borrowReason
        }]);

      if (error) throw error;

      toast({ title: "Berhasil!", description: `Laporan peminjaman ${selectedProduct.name} berhasil dibuat`, variant: "default" });

      setBorrowQuantity('');
      setUserClass('');
      setBorrowerName('');
      setBorrowReason('');
      setSelectedProduct(null);
      setDialogOpen(false);
      
      fetchProducts();
    } catch (error: any) { // <-- KESALAHAN SEBELUMNYA ADA DI SINI, SEKARANG SUDAH DIPERBAIKI
      toast({ title: "Error", description: error.message || "Gagal membuat laporan peminjaman", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const openBorrowDialog = (product: Product) => {
    if (product.stock <= 0) {
      toast({ title: "Stok Habis", description: "Produk ini tidak tersedia", variant: "destructive" });
      return;
    }
    setSelectedProduct(product);
    setBorrowerName(profile?.name || '');
    setUserClass(profile?.class || '');
    setBorrowReason('');
    setBorrowQuantity('1');
    setDialogOpen(true);
  };

  if (loading) {
    return <Layout><div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></Layout>;
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard User</h1>
          <p className="text-muted-foreground mt-2">Lihat produk yang tersedia dan buat laporan peminjaman</p>
        </div>
        <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.length === 0 ? (
              <div className="col-span-full text-center py-12">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground">Belum ada produk</h3>
              </div>
          ) : (
            products.map((product) => (
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
            ))
          )}
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Buat Laporan Peminjaman</DialogTitle>
              <DialogDescription>Isi form berikut untuk meminjam {selectedProduct?.name}</DialogDescription>
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
                  <Input id="quantity" type="number" value={borrowQuantity} onChange={(e) => setBorrowQuantity(e.target.value)} placeholder="Jumlah" min="1" max={selectedProduct?.stock || 0} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reason">Keterangan / Alasan Meminjam</Label>
                <Textarea id="reason" value={borrowReason} onChange={(e) => setBorrowReason(e.target.value)} placeholder="Contoh: Dipinjam untuk 4 orang untuk acara sekolah" />
              </div>
              <div className="flex space-x-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="flex-1">Batal</Button>
                <Button type="submit" variant="gradient" disabled={submitting} className="flex-1">
                  {submitting ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Memproses...</>) : 'Buat Laporan'}
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
