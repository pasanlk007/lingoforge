'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth, initiateEmailSignIn } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Languages } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const auth = useAuth();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // We use the non-blocking sign-in function
      await initiateEmailSignIn(auth, email, password);
      // Because onAuthStateChanged handles redirects, we can just show a toast here.
      toast({
        title: "Login Initiated",
        description: "You will be redirected shortly.",
      });

      const redirectUrl = searchParams.get('redirect');
      router.push(redirectUrl || '/dashboard');
      
    } catch (error: any) {
      console.error("Login failed:", error);
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message || "An unknown error occurred.",
      });
      setIsLoading(false);
    }
    // No need to set isLoading to false on success, as the page will redirect.
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2">
            <Languages className="h-8 w-8 text-primary" />
            <span className="font-headline text-2xl font-black">LingoForge</span>
          </Link>
        </div>
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Welcome Back!</CardTitle>
            <CardDescription>Log in to continue your language journey.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
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
                  disabled={isLoading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Logging In...' : 'Log In'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="text-center text-sm">
            <p className="w-full">
              Don't have an account?{' '}
              <Link href="/signup" className="font-semibold text-primary hover:underline">
                Sign up
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
