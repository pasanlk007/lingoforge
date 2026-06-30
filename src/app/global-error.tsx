'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

// Next.js App Router global error boundary. Catches any otherwise-unhandled
// render-time exception (e.g. a ReferenceError from a missing browser API
// like speechSynthesis on some Android WebViews) and shows a recoverable
// screen instead of the hard "Application error: a client-side exception
// has occurred" crash with no way to continue.

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global error boundary caught:', error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="flex min-h-dvh flex-col items-center justify-center bg-background p-6 text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
          <h1 className="text-xl font-bold mb-2">Something went wrong</h1>
          <p className="text-muted-foreground mb-6 max-w-sm">
            An unexpected error occurred. You can try again, or go back to the home screen.
          </p>
          <div className="flex gap-3">
            <Button onClick={() => reset()}>Try again</Button>
            <Button variant="outline" onClick={() => { window.location.href = '/dashboard'; }}>
              Go to Dashboard
            </Button>
          </div>
        </div>
      </body>
    </html>
  );
}
