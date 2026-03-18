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
import { updateProfile, deleteUser } from 'firebase/auth';
import { deleteDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Image from 'next/image';
import { Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
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

const EMOJIS = ['😀', '😎', '🥸', '🥳', '👽', '🤖', '👾', '👻', '🤠', '🤡', '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🦁', '🐯', '🦄', '🐲', '🐳', '🚀', '🌟', '🎸'];
const profileAvatars = PlaceHolderImages.filter(p => p.id.startsWith('avatar-'));

function AvatarSelector({ onSelect }: { onSelect: (url: string) => void }) {
  return (
    <Tabs defaultValue="pictures" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="pictures">Pictures</TabsTrigger>
        <TabsTrigger value="emojis">Emojis</TabsTrigger>
      </TabsList>
      <TabsContent value="pictures">
        <p className="text-sm text-muted-foreground text-center py-2">Select a funny picture</p>
        <div className="grid grid-cols-4 gap-4 py-4">
          {profileAvatars.map(avatar => (
            <button key={avatar.id} onClick={() => onSelect(avatar.imageUrl)} className="rounded-full overflow-hidden aspect-square border-2 border-transparent hover:border-primary focus:border-primary focus:outline-none transition-all">
              <Image src={avatar.imageUrl} alt={avatar.description} width={100} height={100} className="w-full h-full object-cover" data-ai-hint={avatar.imageHint} />
            </button>
          ))}
        </div>
      </TabsContent>
      <TabsContent value="emojis">
        <p className="text-sm text-muted-foreground text-center py-2">Select an emoji</p>
        <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 py-4">
          {EMOJIS.map(emoji => (
            <button key={emoji} onClick={() => onSelect(emoji)} className="flex items-center justify-center text-3xl sm:text-4xl p-2 rounded-lg hover:bg-muted focus:bg-muted focus:outline-none transition-all">
              {emoji}
            </button>
          ))}
        </div>
      </TabsContent>
    </Tabs>
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
    
    // First, delete Firestore data. This only deletes the main profile.
    // A complete solution would use a Cloud Function to delete all user-related data.
    deleteDocumentNonBlocking(userProfileRef);

    // Then, delete the user from Firebase Auth
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

  const handleUpdateProfilePicture = (newPhotoURL: string) => {
    if (!user || !userProfileRef || !auth?.currentUser) return;
    
    // Update firestore user profile
    updateDocumentNonBlocking(userProfileRef, { photoURL: newPhotoURL });

    // If it's a URL, update auth profile too.
    // If it's an emoji, clear the auth photoURL to avoid invalid URL errors.
    const isUrl = newPhotoURL.startsWith('http');
    updateProfile(auth.currentUser, {
        photoURL: isUrl ? newPhotoURL : '' // Set to empty string for emoji
    }).catch(error => {
        // This is not a critical error, so we can just log it.
        console.error("Failed to update auth profile picture", error);
    });
  };

  if (isProfileLoading) {
    return <ProfilePageLoading />;
  }
  
  const photoURL = userProfile?.photoURL || user.photoURL;
  const isEmoji = photoURL && !photoURL.startsWith('http');

  const subscriptionStatus = userProfile?.subscriptionActive ? "Active" : "Free Plan";
  const subscriptionSource = userProfile?.subscriptionSource !== 'none' ? userProfile?.subscriptionSource : '';
  const subscriptionExpiry = userProfile?.subscriptionExpiry ? new Date(userProfile.subscriptionExpiry).toLocaleDateString() : 'Lifetime';

  return (
     <div className="flex min-h-dvh flex-col bg-background">
      <Navigation />
      <main className="flex-1">
        <div className="container mx-auto max-w-2xl py-12">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className={cn("h-16 w-16", isEmoji && "flex items-center justify-center bg-muted")}>
                    {isEmoji ? (
                      <span className="text-4xl">{photoURL}</span>
                    ) : (
                      <>
                        <AvatarImage src={photoURL || undefined} alt={userProfile?.displayName} />
                        <AvatarFallback>{userProfile?.displayName?.charAt(0) || 'U'}</AvatarFallback>
                      </>
                    )}
                  </Avatar>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="icon" variant="secondary" className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full border-2 border-background">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Choose your new avatar</DialogTitle>
                      </DialogHeader>
                      <AvatarSelector onSelect={handleUpdateProfilePicture} />
                    </DialogContent>
                  </Dialog>
                </div>

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
