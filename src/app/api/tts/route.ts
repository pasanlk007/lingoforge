import { NextResponse } from 'next/server';

// This API route has been deprecated and is no longer used.
// The app now uses a client-side text-to-speech engine.
// This file can be safely deleted.

export async function POST(req: Request) {
  return new NextResponse('This API route is deprecated.', { status: 410 });
}

export async function GET(req: Request) {
  return new NextResponse('This API route is deprecated.', { status: 410 });
}
