'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navigation } from '@/components/Navigation';
import { Skeleton } from '@/components/ui/skeleton';

export default function NumbersPage() {
  const router = useRouter();

  useEffect(() => {
    const savedTargetLang = localStorage.getItem("targetLanguage") || 'french';
    router.replace(`/lessons/${savedTargetLang.toLowerCase()}/numbers/1/1`);
  }, [router]);

  // Show a loading state while redirecting
  return (
    <div className="flex min-h-dvh flex-col bg-background">
        <Navigation />
        <main className="flex-1 container mx-auto py-12">
            <div className="space-y-4">
                <Skeleton className="h-10 w-1/3" />
                <Skeleton className="h-8 w-1/4" />
                <div className="mt-8 space-y-6">
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-64 w-full" />
                </div>
            </div>
        </main>
    </div>
  );
}
