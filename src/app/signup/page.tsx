'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth, useFirestore, initiateGoogleSignIn, initiateEmailSignUp } from '@/firebase';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { doc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Languages } from 'lucide-react';
import type { UserProfile } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { nativeLanguages } from '@/lib/translations';
import { Separator } from '@/components/ui/separator';

export default function SignupPage() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nativeLanguage, setNativeLanguage] = useState('English');
  const [referralCode, setReferralCode] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setGoogleLoading] = useState(false);
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    if (!auth || !firestore) {
        toast({ variant: "destructive", title: "Error", description: "Authentication services are not ready." });
        setGoogleLoading(false);
        return;
    }
    
    try {
        await initiateGoogleSignIn(auth, firestore);

        toast({ title: "Sign-In Successful", description: "Welcome to LingoForge!" });
        // Force a full page reload to ensure auth state is propagated correctly.
        window.location.href = '/dashboard';

    } catch (error: any) {
        if (error.code !== 'auth/popup-closed-by-user') {
            toast({ variant: "destructive", title: "Google Sign-In Failed", description: error.message });
        }
        setGoogleLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!auth || !firestore) {
      toast({
        variant: "destructive",
        title: "Service Unavailable",
        description: "Cannot connect to the required services. Please try again later.",
      });
      setIsLoading(false);
      return;
    }

    try {
      const userCredential = await initiateEmailSignUp(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, { displayName });
      const now = new Date();
      const userProfile: UserProfile = {
        id: user.uid,
        displayName: displayName,
        email: user.email!,
        nativeLanguage: nativeLanguage,
        selectedLanguage: 'French',
        subscriptionActive: false,
        subscriptionSource: 'none',
        subscriptionExpiry: null,
        xpPoints: 0,
        currentStreak: 0,
        lastActiveDate: now.toISOString().split('T')[0],
        aiPlanningEnabled: false,
        activePath: 'survival',
        lastLessonWeek: 1,
        lastLessonDay: 0,
        referredBy: referralCode.trim() || undefined,
      };

      const userDocRef = doc(firestore, 'userProfiles', user.uid);
      setDocumentNonBlocking(userDocRef, userProfile, { merge: true });
      toast({
        title: "Account Created!",
        description: "You're all set. Welcome to LingoForge!",
      });

      // Also use full reload here for consistency.
      window.location.href = '/dashboard';

    } catch (error: any) {
      console.error("Signup failed:", error);
      toast({
        variant: "destructive",
        title: "Signup Failed",
        description: error.message || "Could not create your account.",
      });
      setIsLoading(false);
    }
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
            <CardTitle>Create Your Account</CardTitle>
            <CardDescription>Join LingoForge and start your language journey today.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
               <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isGoogleLoading || isLoading}>
                 {isGoogleLoading ? 'Processing...' : 'Continue with Google'}
               </Button>
               <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or with email</span>
                </div>
               </div>
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    type="text"
                    placeholder="Your Name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                    disabled={isLoading || isGoogleLoading}
                  />
                </div>
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
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading || isGoogleLoading}
                    minLength={6}
                  />
                </div>

                 <div className="space-y-2">
                  <Label htmlFor="referralCode">Referral Code (Optional)</Label>
                  <Input
                    id="referralCode"
                    type="text"
                    placeholder="ABC1234"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value)}
                    disabled={isLoading || isGoogleLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nativeLanguage">Your Native Language</Label>
                  <Select value={nativeLanguage} onValueChange={setNativeLanguage} disabled={isLoading || isGoogleLoading}>
                      <SelectTrigger id="nativeLanguage" className="w-full">
                          <SelectValue placeholder="Select your native language" />
                      </SelectTrigger>
                      <SelectContent>
                          {nativeLanguages.map((lang) => (
                              <SelectItem key={lang} value={lang}>
                                  {lang}
                              </SelectItem>
                          ))}
                      </SelectContent>
                  </Select>
                </div>

                 <div className="flex items-start space-x-3 pt-2">
                  <Checkbox
                    id="terms"
                    checked={agreedToTerms}
                    onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                    disabled={isLoading || isGoogleLoading}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor="terms"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      I agree to the{' '}
                      <Link href="/terms" target="_blank" className="font-semibold text-primary hover:underline">
                        Terms of Service
                      </Link>{' '}
                      and{' '}
                      <Link href="/privacy" target="_blank" className="font-semibold text-primary hover:underline">
                        Privacy Policy
                      </Link>
                      .
                    </label>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading || isGoogleLoading || !agreedToTerms}>
                  {isLoading ? 'Creating Account...' : 'Create Account with Email'}
                </Button>
              </form>
            </div>
          </CardContent>
          <CardFooter className="text-center text-sm">
            <p className="w-full">
              Already have an account?{' '}
              <Link href="/login" className="font-semibold text-primary hover:underline">
                Log in
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
