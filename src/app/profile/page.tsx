'use client';

import { useUser, useAuth, useFirestore, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { doc } from 'firebase/firestore';
import { useDoc, WithId } from '@/firebase/firestore/use-doc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { UserProfile } from '@/lib/types';
import { Navigation } from '@/components/Navigation';

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const userProfileRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'userProfiles', user.uid);
  }, [user, firestore]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  const handleLogout = () => {
    if (!auth) return;
    auth.signOut();
    router.push('/');
  };

  if (isUserLoading || isProfileLoading) {
    return (
      <>
        <Navigation />
        <div className="container mx-auto max-w-2xl py-12">
          <Skeleton className="h-48 w-full" />
        </div>
      </>
    );
  }
  
  if (!user) {
    return null; // Redirect is happening
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <Navigation />
      <main className="flex-1">
        <div className="container mx-auto max-w-2xl py-12">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={user.photoURL || undefined} alt={userProfile?.displayName} />
                  <AvatarFallback>{userProfile?.displayName?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-3xl">{userProfile?.displayName}</CardTitle>
                  <CardDescription>{userProfile?.email}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <p className="font-semibold text-muted-foreground">XP Points</p>
                        <p className="text-lg font-bold">{userProfile?.xpPoints || 0}</p>
                    </div>
                    <div>
                        <p className="font-semibold text-muted-foreground">Current Streak</p>
                        <p className="text-lg font-bold">{userProfile?.currentStreak || 0} days</p>
                    </div>
                    <div>
                        <p className="font-semibold text-muted-foreground">Subscription</p>
                        <p className="text-lg font-bold capitalize">{userProfile?.subscription || 'free'}</p>
                    </div>
                     <div>
                        <p className="font-semibold text-muted-foreground">Selected Language</p>
                        <p className="text-lg font-bold">{userProfile?.selectedLanguage}</p>
                    </div>
                </div>

              <Button variant="outline" onClick={handleLogout} className="w-full">
                Log Out
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
