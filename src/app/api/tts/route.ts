// This API route has been deprecated.
// The app now uses a robust, client-side TTS solution (ResponsiveVoice.js)
// to ensure audio works across all platforms, including the Android WebView.
// This file can be safely deleted.

import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  return new NextResponse('This API route is no longer in use.', { status: 410 });
}
