'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Gift, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';
import { translations } from '@/lib/translations';

// Simple hash function to generate a code from UID
function generateReferralCode(uid: string) {
    let hash = 0;
    for (let i = 0; i < uid.length; i++) {
        const char = uid.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0; // Convert to 32bit integer
    }
    // Make it uppercase and alphanumeric, and take a slice
    return ('U' + Math.abs(hash).toString(36).toUpperCase()).slice(0, 7);
}

export function ReferralCard() {
  const [nativeLanguage, setNativeLanguage] = useState<keyof typeof translations>('English');
  const [isMounted, setIsMounted] = useState(false);
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const userProfileRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'userProfiles', user.uid);
  }, [user, firestore]);

  const { data: userProfile } = useDoc<UserProfile>(userProfileRef);

  const t_dashboard = (isMounted && translations[nativeLanguage]?.dashboard) ? translations[nativeLanguage].dashboard : translations.English.dashboard;

  useEffect(() => {
    setIsMounted(true);
    const savedNativeLang = localStorage.getItem("nativeLanguage") as keyof typeof translations;
    if (savedNativeLang && translations[savedNativeLang]) {
      setNativeLanguage(savedNativeLang);
    }
    
    // Generate and set referral code if it doesn't exist
    if (user && userProfileRef && userProfile && !userProfile.referralCode) {
        const code = generateReferralCode(user.uid);
        updateDocumentNonBlocking(userProfileRef, { referralCode: code });
    }

  }, [user, userProfile, userProfileRef]);
  
  const handleCopyCode = () => {
    if (!userProfile?.referralCode) return;
    navigator.clipboard.writeText(userProfile.referralCode);
    toast({
      title: t_dashboard.referrals.copied,
    });
  }

  if (!isMounted || !userProfile) {
    return null; // Don't show the card if data is not ready
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-primary" />
          {t_dashboard.referrals.title}
        </CardTitle>
        <CardDescription>
          {t_dashboard.referrals.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm font-semibold text-green-500 text-center">{t_dashboard.referrals.bonus}</p>
        <div className="flex gap-2">
            <Input readOnly value={userProfile.referralCode || '...'} aria-label="Referral Code" />
            <Button onClick={handleCopyCode} variant="outline" size="icon" disabled={!userProfile.referralCode}>
                <Copy className="h-4 w-4" />
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}
