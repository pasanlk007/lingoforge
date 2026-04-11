'use client';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth as getFirebaseAuth } from 'firebase/auth';
import { getFirestore as getFirebaseFirestore } from 'firebase/firestore';
import { isNativePlatform, nativeGoogleSignIn } from '@/lib/nativeGoogleAuth';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth, useFirestore, initiateGoogleSignIn, useUser } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Languages } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

function AuthCheckLoading() {
  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-6">
        <Link href="/" className="inline-flex items-center gap-2">
          <Languages className="h-8 w-8 text-primary" />
          <span className="font-headline text-2xl font-black">LingoForge</span>
        </Link>
      </div>
      <Card>
        <CardHeader className="text-center">
          <Skeleton className="h-7 w-3/5 mx-auto" />
          <Skeleton className="h-5 w-4/5 mx-auto mt-2" />
        </CardHeader>
        <CardContent className="space-y-6">
          <Skeleton className="h-10 w-full" />
          <div className="relative flex justify-center text-xs uppercase">
            <span className="w-full border-t"></span>
            <span className="absolute top-1/2 -translate-y-1/2 bg-background px-2">
              <Skeleton className="h-4 w-20" />
            </span>
          </div>
          <div className="space-y-4">
             <div className="space-y-2"><Skeleton className="h-4 w-12" /><Skeleton className="h-10 w-full" /></div>
             <div className="space-y-2"><Skeleton className="h-4 w-16" /><Skeleton className="h-10 w-full" /></div>
          </div>
          <Skeleton className="h-10 w-full" />
        </CardContent>
        <CardFooter className="justify-center">
          <Skeleton className="h-5 w-48" />
        </CardFooter>
      </Card>
    </div>
  );
}


function getDirectFirebase() {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };
  const app = getApps().length === 0 ? initializeApp(config) : getApp();
  return { auth: getFirebaseAuth(app), firestore: getFirebaseFirestore(app) };
}

export function LoginFormContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setGoogleLoading] = useState(false);
  const searchParams = useSearchParams();
  const hookAuth = useAuth();
  const hookFirestore = useFirestore();
  const direct = typeof window !== 'undefined' ? getDirectFirebase() : null;
  const auth = hookAuth || direct?.auth || null;
  const firestore = hookFirestore || direct?.firestore || null;
  const { toast } = useToast();
  
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const redirectUrl = searchParams?.get('redirect') || '/dashboard';

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push(redirectUrl);
    }
  }, [user, isUserLoading, router, redirectUrl]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!auth) {
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: "The authentication service is not ready. Please wait a moment and try again.",
      });
      setIsLoading(false);
      return;
    }

    try {
        await signInWithEmailAndPassword(auth, email, password);
        
        toast({
          title: "Login Successful",
          description: "You are being redirected.",
        });
        
        router.push(redirectUrl);

    } catch (error: any) {
        console.error("Login failed:", error);
        let errorMessage = "An unknown error occurred.";
        if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
            errorMessage = 'Invalid email or password. Please try again.';
        } else {
            errorMessage = error.message;
        }
        
        toast({
            variant: "destructive",
            title: "Login Failed",
            description: errorMessage,
        });
        setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    if (!auth || !firestore) {
        toast({ variant: "destructive", title: "Error", description: "Authentication services are not ready." });
        setGoogleLoading(false);
        return;
    }
    
    try {
        let success = false;
        if (isNativePlatform()) {
            console.log("Native platform detected, attempting native sign-in...");
            const user = await nativeGoogleSignIn(auth);
            if (user) {
                success = true;
            }
        } else {
            console.log("Web environment, using web sign-in...");
            await initiateGoogleSignIn(auth, firestore);
            success = true;
        }

        if (success) {
            toast({ title: "Login Successful", description: "Welcome back!" });
            router.push(redirectUrl);
        } else {
            // This path is reached if native sign-in was attempted and failed/cancelled.
            // We simply stop loading and allow the user to try again.
            setGoogleLoading(false);
        }
    } catch (error: any) {
        // This catch block will primarily handle errors from the web-based flow.
        if (error.code !== 'auth/popup-closed-by-user') {
            toast({ variant: "destructive", title: "Google Sign-In Failed", description: error.message });
        }
        setGoogleLoading(false);
    }
  };

  if (isUserLoading || user) {
    return <AuthCheckLoading />;
  }

  return (
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
          <div className="space-y-4">
             <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isGoogleLoading || isLoading}>
               {isGoogleLoading ? 'Signing In...' : 'Continue with Google'}
             </Button>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>
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
                  disabled={isLoading || isGoogleLoading}
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
                  disabled={isLoading || isGoogleLoading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading || isGoogleLoading}>
                {isLoading ? 'Logging In...' : 'Log In with Email'}
              </Button>
            </form>
          </div>
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
  );
}
