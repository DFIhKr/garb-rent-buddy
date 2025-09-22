// src/pages/UserDashboard.tsx - VERSI FINAL DENGAN FITUR PENGEMBALIAN (LENGKAP)

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
    if(profile) fetchAllData();
  }, [profile]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchProducts(), fetchBorrowedItems()]);
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

  const fetchBorrowedItems = async () => {
    if (!profile) return;
    const { data, error } = await supabase
      .from('transactions')
      .select(`id, quantity, returned_quantity, created_at, products (name)`)
      .eq('user_id', profile.id)
      .gtc('quantity', 'returned_quantity');
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
      toast({
