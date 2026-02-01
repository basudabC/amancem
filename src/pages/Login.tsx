// ============================================================
// AMAN CEMENT CRM — Login Page
// ============================================================

import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { APP_CONFIG } from '@/lib/constants';
import { Building2, Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';

export function Login() {
  const { login } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { error: loginError } = await login(email, password);
      
      if (loginError) {
        setError(loginError.message || 'Invalid credentials');
        return;
      }

      // Navigate will happen automatically via auth state change
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#061A3A] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-[#C41E3A] to-[#9B1830] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xl">
            <Building2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-[#F0F4F8] mb-1">
            {APP_CONFIG.shortName}
          </h1>
          <p className="text-[#8B9CB8]">{APP_CONFIG.name}</p>
          <p className="text-[#4A5B7A] text-sm mt-1">{APP_CONFIG.company}</p>
        </div>

        {/* Login Card */}
        <Card className="bg-[#0A2A5C] border-white/10 shadow-2xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-[#F0F4F8] text-xl">Sign In</CardTitle>
            <CardDescription className="text-[#8B9CB8]">
              Enter your credentials to access the CRM
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert className="bg-[#E74C5E]/10 border-[#E74C5E]/30">
                  <AlertCircle className="w-4 h-4 text-[#E74C5E]" />
                  <AlertDescription className="text-[#E74C5E]">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-[#F0F4F8]">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B9CB8]" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@amancem.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-[#0F3460] border-white/10 text-[#F0F4F8] placeholder:text-[#4A5B7A] focus:border-[#C41E3A] focus:ring-[#C41E3A]"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-[#F0F4F8]">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B9CB8]" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 bg-[#0F3460] border-white/10 text-[#F0F4F8] placeholder:text-[#4A5B7A] focus:border-[#C41E3A] focus:ring-[#C41E3A]"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#C41E3A] hover:bg-[#9B1830] text-[#F0F4F8] h-11"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            {/* Demo Credentials */}
            <div className="mt-6 pt-4 border-t border-white/10">
              <p className="text-[#8B9CB8] text-xs text-center mb-3">
                Demo Credentials
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setEmail('rep@amancem.com');
                    setPassword('password');
                  }}
                  className="p-2 bg-[#0F3460] rounded text-[#8B9CB8] hover:text-[#F0F4F8] transition-colors"
                >
                  Sales Rep
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('manager@amancem.com');
                    setPassword('password');
                  }}
                  className="p-2 bg-[#0F3460] rounded text-[#8B9CB8] hover:text-[#F0F4F8] transition-colors"
                >
                  Manager
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-[#4A5B7A] text-xs">
            {APP_CONFIG.headOffice}
          </p>
          <p className="text-[#4A5B7A] text-xs mt-1">
            {APP_CONFIG.phone} | {APP_CONFIG.website}
          </p>
        </div>
      </div>
    </div>
  );
}
