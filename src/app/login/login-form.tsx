'use client';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth as getFirebaseAuth, User } from 'firebase/auth';
import { getFirestore as getFirebaseFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { isNativePlatform, nativeGoogleSignIn } from '@/lib/nativeGoogleAuth';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth, useFirestore, initiateGoogleSignIn, useUser, updateDocumentNonBlocking } from '@/firebase';
import { signInWithEmailAndPassword, updateProfile, createUserWithEmailAndPassword } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Languages, ArrowLeft, ArrowRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import type { UserProfile } from '@/lib/types';
import { cn } from '@/lib/utils';
import { targetLanguages } from '@/lib/translations';

const NATIVE_LANGS = [
    { name: 'English', flag: '🇬🇧' },
    { name: 'Sinhala', flag: '🇱🇰' },
    { name: 'Hindi', flag: '🇮🇳' },
    { name: 'Urdu', flag: '🇵🇰' },
    { name: 'Bengali', flag: '🇧🇩' },
    { name: 'Nepali', flag: '🇳🇵' },
];

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

export function LoginFormContent() {
  const [view, setView] = useState<'onboarding' | 'login'>('onboarding');
  const [step, setStep] = useState(1);
  const [nativeLanguage, setNativeLanguage] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setGoogleLoading] = useState(false);
  
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams?.get('redirect') || '/dashboard';

  useEffect(() => {
    if (!isUserLoading && user) {
      const url = redirectUrl.includes('?') ? `${redirectUrl}&app=1` : `${redirectUrl}?app=1`;
      window.location.href = url;
    }
  }, [user, isUserLoading, router, redirectUrl]);

  const handleNextStep = () => setStep(prev => prev + 1);
  const handlePrevStep = () => setStep(prev => prev - 1);

  const createOrUpdateFullUserProfile = async (currentUser: User) => {
    if (!firestore) return;
    const userDocRef = doc(firestore, 'userProfiles', currentUser.uid);
    const now = new Date();
    const docSnap = await getDoc(userDocRef);
    const isNewUser = !docSnap.exists();

    const profileData: Partial<UserProfile> = {
      id: currentUser.uid,
      displayName: displayName || currentUser.displayName || 'New User',
      email: email || currentUser.email!,
      nativeLanguage,
      selectedLanguage: targetLanguage,
      photoURL: currentUser.photoURL || undefined,
      lastActiveDate: now.toISOString().split('T')[0],
      ...(isNewUser && {
        createdAt: now.toISOString(),
        subscriptionActive: false,
        subscriptionSource: 'none',
        subscriptionExpiry: null,
        xpPoints: 0,
        currentStreak: 0,
        aiPlanningEnabled: false,
      })
    };

    localStorage.setItem('nativeLanguage', nativeLanguage);
    localStorage.setItem('targetLanguage', targetLanguage);
    
    await setDoc(userDocRef, profileData, { merge: true });
  };
  
  const handleGoogleSignIn = async () => {
    if (!auth || !firestore) return toast({ variant: "destructive", title: "Services not ready." });
    if (step < 5 && view === 'onboarding') return toast({ variant: "destructive", title: "Please complete the steps above first." });
    
    setGoogleLoading(true);
    try {
      const result = await initiateGoogleSignIn(auth, firestore, { displayName, nativeLanguage, selectedLanguage: targetLanguage });
      await createOrUpdateFullUserProfile(result.user);
      toast({ title: "Sign-Up Successful", description: "Welcome to LingoForge!" });
      const url = redirectUrl.includes('?') ? `${redirectUrl}&app=1` : `${redirectUrl}?app=1`;
      window.location.href = url;
    } catch (error: any) {
      if (error.code !== 'auth/popup-closed-by-user') {
        toast({ variant: "destructive", title: "Google Sign-In Failed", description: error.message });
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !firestore) return toast({ variant: "destructive", title: "Service Unavailable" });
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await updateProfile(user, { displayName });
      await createOrUpdateFullUserProfile(user);
      toast({ title: "Account Created!", description: "Welcome!" });
      const url = redirectUrl.includes('?') ? `${redirectUrl}&app=1` : `${redirectUrl}?app=1`;
      window.location.href = url;
    } catch (error: any) {
      toast({ variant: "destructive", title: "Signup Failed", description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return toast({ variant: "destructive", title: "Authentication service not ready." });
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({ title: "Login Successful", description: "You are being redirected." });
      const url = redirectUrl.includes('?') ? `${redirectUrl}&app=1` : `${redirectUrl}?app=1`;
      window.location.href = url;
    } catch (error: any) {
      let errorMessage = error.code === 'auth/invalid-credential' ? 'Invalid email or password.' : error.message;
      toast({ variant: "destructive", title: "Login Failed", description: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };
  
  const totalSteps = 5;
  const canGoNext = 
    (step === 1) ||
    (step === 2 && nativeLanguage) ||
    (step === 3 && targetLanguage) ||
    (step === 4 && displayName.trim().length > 2);

  if (isUserLoading) return <AuthCheckLoading />;

  return (
    <div className="w-full max-w-md space-y-4">
      <Card>
        {view === 'onboarding' ? (
          <>
            <CardHeader>
               <div className="flex justify-center items-center gap-2 mb-4">
                  {Array.from({ length: totalSteps }).map((_, i) => (
                    <div key={i} className={cn("h-2 rounded-full transition-all", i < step ? 'bg-primary w-8' : 'bg-muted w-4')} />
                  ))}
               </div>
              <CardTitle className="text-center">
                {step === 1 && 'Welcome to LingoForge!'}
                {step === 2 && 'What is your native language?'}
                {step === 3 && 'Which language will you learn?'}
                {step === 4 && 'What should we call you?'}
                {step === 5 && 'Create Your Account'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {step === 1 && (
                <div className="text-center text-muted-foreground p-8">
                  <p>Let's get you started on your language learning journey.</p>
                </div>
              )}
              {step === 2 && (
                <div className="grid grid-cols-2 gap-3">
                  {NATIVE_LANGS.map(lang => (
                    <button key={lang.name} onClick={() => setNativeLanguage(lang.name)}
                      className={cn("p-4 rounded-lg border-2 text-center transition-all flex flex-col items-center justify-center gap-2 aspect-square",
                        nativeLanguage === lang.name ? 'bg-primary/20 border-primary' : 'bg-muted/50 border-muted hover:border-primary/50'
                      )}>
                      <span className="text-4xl">{lang.flag}</span>
                      <span className="font-semibold text-sm">{lang.name}</span>
                    </button>
                  ))}
                </div>
              )}
              {step === 3 && (
                <div className="grid grid-cols-3 gap-2 max-h-[40vh] overflow-y-auto pr-2">
                  {targetLanguages.map(lang => (
                    <button key={lang.lang} onClick={() => setTargetLanguage(lang.lang)}
                      className={cn("p-3 rounded-lg border-2 text-center transition-all flex flex-col items-center justify-center gap-1.5",
                        targetLanguage === lang.lang ? 'bg-primary/20 border-primary' : 'bg-muted/50 border-muted hover:border-primary/50'
                      )}>
                       <span className="text-3xl">{lang.flag}</span>
                       <span className="font-semibold text-xs">{lang.lang}</span>
                    </button>
                  ))}
                </div>
              )}
              {step === 4 && (
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input id="displayName" type="text" placeholder="Your Name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} autoFocus />
                </div>
              )}
              {step === 5 && (
                  <div className="space-y-4">
                    <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isGoogleLoading || isLoading}>
                      {isGoogleLoading ? 'Processing...' : 'Continue with Google'}
                    </Button>
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                      <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">Or</span></div>
                    </div>
                    <form onSubmit={handleEmailSignup} className="space-y-4">
                      <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isLoading || isGoogleLoading} /></div>
                      <div className="space-y-2"><Label htmlFor="password">Password</Label><Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={isLoading || isGoogleLoading} minLength={6}/></div>
                      <div className="flex items-start space-x-3 pt-2">
                        <Checkbox id="terms" checked={agreedToTerms} onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)} disabled={isLoading || isGoogleLoading}/>
                        <div className="grid gap-1.5 leading-none"><label htmlFor="terms" className="text-sm font-medium">I agree to the <Link href="/terms" target="_blank" className="font-semibold text-primary hover:underline">Terms</Link> & <Link href="/privacy" target="_blank" className="font-semibold text-primary hover:underline">Privacy</Link>.</label></div>
                      </div>
                      <Button type="submit" className="w-full" disabled={isLoading || isGoogleLoading || !agreedToTerms}>{isLoading ? 'Creating Account...' : 'Create Account'}</Button>
                    </form>
                  </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-4 pt-4">
              <div className="flex justify-between w-full">
                {step > 1 ? (<Button variant="ghost" onClick={handlePrevStep}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>) : <div />}
                {step < totalSteps && <Button onClick={handleNextStep} disabled={!canGoNext}>Next <ArrowRight className="ml-2 h-4 w-4" /></Button>}
              </div>
              <p className="text-sm">Already have an account? <Button variant="link" className="p-0" onClick={() => setView('login')}>Log in</Button></p>
            </CardFooter>
          </>
        ) : (
          <>
            <CardHeader><CardTitle className="text-center">Welcome Back!</CardTitle><CardDescription className="text-center">Log in to continue your journey.</CardDescription></CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isGoogleLoading || isLoading}>{isGoogleLoading ? 'Signing In...' : 'Continue with Google'}</Button>
                <div className="relative"><div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">Or</span></div></div>
                <form onSubmit={handleEmailLogin} className="space-y-4">
                  <div className="space-y-2"><Label htmlFor="login-email">Email</Label><Input id="login-email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isLoading || isGoogleLoading} /></div>
                  <div className="space-y-2"><Label htmlFor="login-password">Password</Label><Input id="login-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={isLoading || isGoogleLoading} /></div>
                  <Button type="submit" className="w-full" disabled={isLoading || isGoogleLoading}>{isLoading ? 'Logging In...' : 'Log In with Email'}</Button>
                </form>
              </div>
            </CardContent>
            <CardFooter className="flex-col gap-2 text-center text-sm">
              <p>Don't have an account? <Button variant="link" className="p-0" onClick={() => { setView('onboarding'); setStep(1); }}>Sign up</Button></p>
            </CardFooter>
          </>
        )}
      </Card>
    </div>
  );
}
