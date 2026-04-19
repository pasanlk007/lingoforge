'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, useFirestore, initiateGoogleSignIn, initiateEmailSignUp, useUser } from '@/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Languages, ArrowLeft, ArrowRight } from 'lucide-react';
import type { UserProfile } from '@/lib/types';
import { targetLanguages, nativeLanguages } from '@/lib/translations';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

const NATIVE_LANGS = [
    { name: 'English', flag: '🇬🇧' },
    { name: 'Sinhala', flag: '🇱🇰' },
    { name: 'Hindi', flag: '🇮🇳' },
    { name: 'Urdu', flag: '🇵🇰' },
    { name: 'Bengali', flag: '🇧🇩' },
    { name: 'Nepali', flag: '🇳🇵' },
];

function SignupPageLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <Skeleton className="h-2 w-full" />
          <Skeleton className="h-8 w-3/4 mx-auto mt-4" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SignupPage() {
  const [step, setStep] = useState(1);
  
  // Onboarding data
  const [nativeLanguage, setNativeLanguage] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // System state
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setGoogleLoading] = useState(false);
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push('/dashboard');
    }
  }, [user, isUserLoading, router]);

  const handleNextStep = () => setStep(prev => prev + 1);
  const handlePrevStep = () => setStep(prev => prev - 1);

  const createOrUpdateFullUserProfile = async (user: any) => {
    if (!firestore) return;
    const userDocRef = doc(firestore, 'userProfiles', user.uid);
    const now = new Date();

    const docSnap = await getDoc(userDocRef);
    const isNewUser = !docSnap.exists();

    const profileData: Partial<UserProfile> = {
        id: user.uid,
        displayName: displayName || user.displayName,
        email: email || user.email,
        nativeLanguage: nativeLanguage,
        selectedLanguage: targetLanguage,
        photoURL: user.photoURL || undefined,
        lastActiveDate: now.toISOString().split('T')[0],
        ...(isNewUser && { 
            createdAt: now.toISOString(),
            subscriptionActive: false,
            subscriptionSource: 'none',
            subscriptionExpiry: null,
            xpPoints: 0,
            currentStreak: 0,
            aiPlanningEnabled: false
        })
    };
    
    await setDoc(userDocRef, profileData, { merge: true });
  };
  
  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    if (!auth || !firestore) {
        toast({ variant: "destructive", title: "Error", description: "Authentication services are not ready." });
        setGoogleLoading(false);
        return;
    }
    
    try {
        const result = await initiateGoogleSignIn(auth, firestore);
        await createOrUpdateFullUserProfile(result.user);
        
        toast({ title: "Sign-Up Successful", description: "Welcome to LingoForge!" });
        window.location.href = '/dashboard';

    } catch (error: any) {
        if (error.code !== 'auth/popup-closed-by-user') {
            toast({ variant: "destructive", title: "Google Sign-In Failed", description: error.message });
        }
        setGoogleLoading(false);
    }
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!auth || !firestore) {
      toast({ variant: "destructive", title: "Service Unavailable" });
      setIsLoading(false);
      return;
    }

    try {
      const userCredential = await initiateEmailSignUp(auth, email, password);
      const user = userCredential.user;
      await updateProfile(user, { displayName });
      await createOrUpdateFullUserProfile(user);
      
      toast({ title: "Account Created!", description: "Welcome!" });
      window.location.href = '/dashboard';

    } catch (error: any) {
      toast({ variant: "destructive", title: "Signup Failed", description: error.message });
      setIsLoading(false);
    }
  };

  const totalSteps = 4;
  const canGoNext = 
    (step === 1 && nativeLanguage) ||
    (step === 2 && targetLanguage) ||
    (step === 3 && displayName.trim().length > 2);

  if (isUserLoading || (user && !isUserLoading)) {
    return <div className="flex min-h-screen items-center justify-center bg-background"><Languages className="h-12 w-12 text-primary animate-pulse" /></div>;
  }
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 font-body">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2">
            <Languages className="h-8 w-8 text-primary" />
            <span className="font-headline text-2xl font-black">LingoForge</span>
          </Link>
        </div>

        <Card>
          <CardHeader>
             <div className="flex justify-center items-center gap-2 mb-4">
                {Array.from({ length: totalSteps }).map((_, i) => (
                  <div key={i} className={cn("h-2 rounded-full transition-all", i < step ? 'bg-primary w-8' : 'bg-muted w-4')} />
                ))}
             </div>
            <CardTitle className="text-center">
              {step === 1 && 'What is your native language?'}
              {step === 2 && 'Which language will you learn?'}
              {step === 3 && 'What should we call you?'}
              {step === 4 && 'Create Your Account'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {step === 1 && (
              <div className="grid grid-cols-2 gap-3">
                {NATIVE_LANGS.map(lang => (
                  <button key={lang.name} onClick={() => { setNativeLanguage(lang.name); handleNextStep(); }}
                    className={cn("p-4 rounded-lg border-2 text-center transition-all flex flex-col items-center justify-center gap-2 aspect-square",
                      nativeLanguage === lang.name ? 'bg-primary/20 border-primary' : 'bg-muted/50 border-muted hover:border-primary/50'
                    )}>
                    <span className="text-4xl">{lang.flag}</span>
                    <span className="font-semibold text-sm">{lang.name}</span>
                  </button>
                ))}
              </div>
            )}
            
            {step === 2 && (
              <div className="grid grid-cols-3 gap-2 max-h-[40vh] overflow-y-auto pr-2">
                {targetLanguages.map(lang => (
                  <button key={lang.lang} onClick={() => { setTargetLanguage(lang.lang); handleNextStep(); }}
                    className={cn("p-3 rounded-lg border-2 text-center transition-all flex flex-col items-center justify-center gap-1.5",
                      targetLanguage === lang.lang ? 'bg-primary/20 border-primary' : 'bg-muted/50 border-muted hover:border-primary/50'
                    )}>
                     <span className="text-3xl">{lang.flag}</span>
                     <span className="font-semibold text-xs">{lang.lang}</span>
                  </button>
                ))}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  type="text"
                  placeholder="Your Name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  autoFocus
                />
              </div>
            )}

            {step === 4 && (
                <div className="space-y-4">
                  <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isGoogleLoading || isLoading}>
                    {isGoogleLoading ? 'Processing...' : 'Continue with Google'}
                  </Button>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">Or with email</span>
                    </div>
                  </div>
                  <form onSubmit={handleEmailSignup} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isLoading || isGoogleLoading} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={isLoading || isGoogleLoading} minLength={6}/>
                    </div>
                    <div className="flex items-start space-x-3 pt-2">
                      <Checkbox id="terms" checked={agreedToTerms} onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)} disabled={isLoading || isGoogleLoading}/>
                      <div className="grid gap-1.5 leading-none">
                        <label htmlFor="terms" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          I agree to the{' '}
                          <Link href="/terms" target="_blank" className="font-semibold text-primary hover:underline">Terms</Link> & <Link href="/privacy" target="_blank" className="font-semibold text-primary hover:underline">Privacy Policy</Link>.
                        </label>
                      </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading || isGoogleLoading || !agreedToTerms}>
                      {isLoading ? 'Creating Account...' : 'Create Account'}
                    </Button>
                  </form>
                </div>
            )}
          </CardContent>

          <CardFooter className="flex justify-between items-center pt-4">
            {step > 1 ? (
              <Button variant="ghost" onClick={handlePrevStep}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
            ) : <div />}

            {step === 3 && (
              <Button onClick={handleNextStep} disabled={!canGoNext}>
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}

            {step === 4 && (
                <p className="text-sm text-center w-full">
                  Already have an account?{' '}
                  <Link href="/login" className="font-semibold text-primary hover:underline">
                    Log in
                  </Link>
                </p>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
