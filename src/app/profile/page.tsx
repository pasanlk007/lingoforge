'use client';

import { useUser, useAuth, useFirestore, useMemoFirebase } from '@/firebase/provider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { doc } from 'firebase/firestore';
import { useDoc } from '@/firebase/firestore/use-doc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { UserProfile } from '@/lib/types';
import { Navigation } from '@/components/Navigation';
import type { User } from 'firebase/auth';
import { updateProfile } from 'firebase/auth';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Image from 'next/image';
import { Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';

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
                        <p className="text-lg font-bold capitalize">{userProfile?.subscriptionType || 'free'}</p>
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
