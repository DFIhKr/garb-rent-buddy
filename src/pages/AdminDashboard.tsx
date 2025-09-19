// src/pages/AdminDashboard.tsx - VERSI FINAL YANG SUDAH DIPERBAIKI

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
    return <Layout><div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-
