'use client';

import { useUser, useAuth, useFirestore, useMemoFirebase } from '@/firebase/provider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { doc } from 'firebase/firestore';
import { useDoc } from '@/firebase/firestore/use-doc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button, buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { UserProfile } from '@/lib/types';
import { Navigation } from '@/components/Navigation';
import type { User } from 'firebase/auth';
import { deleteUser } from 'firebase/auth';
import { deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

function ProfilePageLoading() {
  return (
    <>
      <Navigation />
      <div className="container mx-auto max-w-2xl py-12">
        <Skeleton className="h-48 w-full" />
      </div>
    </>
  );
}

function ProfileContent({ user }: { user: User }) {
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

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

  const handleDeleteAccount = async () => {
    if (!auth?.currentUser || !userProfileRef) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not delete account. User not found.",
      });
      return;
    }
    
    deleteDocumentNonBlocking(userProfileRef);

    try {
      await deleteUser(auth.currentUser);
      toast({
        title: "Account Deleted",
        description: "Your account and all associated data have been deleted.",
      });
      router.push('/');
    } catch (error: any) {
      console.error("Error deleting account:", error);
      toast({
        variant: "destructive",
        title: "Deletion Failed",
        description: `This is a sensitive operation that requires a recent login. Please log out, log back in, and try again. Error: ${error.message}`,
      });
    }
  };

  const profileBg = PlaceHolderImages.find(p => p.id === 'profile-background');

  if (isProfileLoading) {
    return <ProfilePageLoading />;
  }
  
  const photoURL = user.photoURL;

  const subscriptionStatus = userProfile?.subscriptionActive ? "Active" : "Free Plan";
  const subscriptionSource = userProfile?.subscriptionSource !== 'none' ? userProfile?.subscriptionSource : '';
  const subscriptionExpiry = userProfile?.subscriptionExpiry ? new Date(userProfile.subscriptionExpiry).toLocaleDateString() : 'Lifetime';

  return (
     <div className="relative min-h-dvh flex flex-col">
      {profileBg && (
          <div className="fixed inset-0 z-[-1] opacity-20">
              <Image
                  src={profileBg.imageUrl}
                  alt={profileBg.description}
                  fill
                  style={{ objectFit: 'cover' }}
                  data-ai-hint={profileBg.imageHint}
              />
              <div className="absolute inset-0 bg-background/50"></div>
          </div>
      )}
      <Navigation />
      <main className="flex-1">
        <div className="container mx-auto max-w-2xl py-12 space-y-8">
          <Card className="bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                    <AvatarImage src={photoURL || undefined} alt={userProfile?.displayName} />
                    <AvatarFallback>{userProfile?.displayName?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>

                <div>
                  <CardTitle className="text-3xl">{userProfile?.displayName}</CardTitle>
                  <CardDescription>{userProfile?.email}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
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
                        <p className="text-lg font-bold capitalize">{subscriptionStatus}</p>
                    </div>
                     {userProfile?.subscriptionActive && (
                        <>
                          <div>
                              <p className="font-semibold text-muted-foreground">Source</p>
                              <p className="text-lg font-bold capitalize">{subscriptionSource}</p>
                          </div>
                          <div>
                              <p className="font-semibold text-muted-foreground">Expires</p>
                              <p className="text-lg font-bold">{subscriptionExpiry}</p>
                          </div>
                        </>
                    )}
                     <div>
                        <p className="font-semibold text-muted-foreground">Selected Language</p>
                        <p className="text-lg font-bold">{userProfile?.selectedLanguage}</p>
                    </div>
                </div>

              <div className="flex flex-col space-y-2 pt-4 border-t">
                <Button variant="outline" onClick={handleLogout} className="w-full">
                  Log Out
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full">Delete Account</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your
                        account and remove your data from our servers.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteAccount} className={buttonVariants({ variant: "destructive" })}>
                        Yes, delete my account
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
          
        </div>
      </main>
    </div>
  )
}

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || !user) {
    return <ProfilePageLoading />;
  }
  
  return <ProfileContent user={user} />;
}
