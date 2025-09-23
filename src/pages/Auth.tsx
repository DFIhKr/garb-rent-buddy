import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/enhanced-button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Shirt } from 'lucide-react';
import heroImage from '@/assets/hero-clothing.jpg';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'admin' | 'user'>('user');
  const [loading, setLoading] = useState(false);

  const { user, signIn, signUp } = useAuth();
  const { toast } = useToast();

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) throw error;
        
        toast({
          title: "Login berhasil!",
          description: "Selamat datang kembali",
          variant: "default"
        });
      } else {
        const { error } = await signUp(email, password, name, role);
        if (error) throw error;
        
        toast({
          title: "Registrasi berhasil!",
          description: "Silakan login dengan akun baru Anda",
          variant: "default"
        });
        setIsLogin(true);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Terjadi kesalahan",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative"
      style={{
        backgroundImage: `linear-gradient(135deg, rgba(102, 126, 234, 0.9), rgba(118, 75, 162, 0.9)), url(${heroImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-primary opacity-80" />
      
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="bg-white rounded-full p-4 w-16 h-16 mx-auto mb-4 shadow-glow">
            <Shirt className="w-8 h-8 text-primary mx-auto" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">CatatPinjam</h1>
          <p className="text-white/80">Sistem Inventaris Peminjaman Barang</p>
        </div>

        <Card className="shadow-glow bg-white/95 backdrop-blur-sm border-0">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">
              {isLogin ? 'Login' : 'Daftar Akun'}
            </CardTitle>
            <CardDescription>
              {isLogin 
                ? 'Masuk ke akun Anda' 
                : 'Buat akun baru untuk mengakses sistem'}
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {!isLogin && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">Nama Lengkap</Label>
                    <Input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required={!isLogin}
                      placeholder="Masukkan nama lengkap"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select value={role} onValueChange={(value: 'admin' | 'user') => setRole(value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="nama@email.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Masukkan password"
                />
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <Button 
                type="submit" 
                variant="gradient"
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isLogin ? 'Masuk...' : 'Daftar...'}
                  </>
                ) : (
                  isLogin ? 'Masuk' : 'Daftar'
                )}
              </Button>

              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                {isLogin 
                  ? 'Belum punya akun? Daftar di sini' 
                  : 'Sudah punya akun? Login di sini'}
              </button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
