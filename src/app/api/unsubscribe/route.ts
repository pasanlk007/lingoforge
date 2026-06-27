import { NextRequest, NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase/server-init';

export async function GET(req: NextRequest) {
  try {
    const { firestore } = initializeFirebase();
    const email = req.nextUrl.searchParams.get('email');

    if (!email) {
      return new NextResponse('Missing email parameter', { status: 400 });
    }

    const usersSnapshot = await firestore
      .collection('userProfiles')
      .where('email', '==', email)
      .get();

    if (usersSnapshot.empty) {
      return new NextResponse(getUnsubscribeHtml('We could not find an account with that email.'), {
        headers: { 'Content-Type': 'text/html' },
      });
    }

    for (const docSnap of usersSnapshot.docs) {
      await docSnap.ref.update({ emailOptOut: true });
    }

    return new NextResponse(getUnsubscribeHtml("You've been unsubscribed from marketing emails. You'll still receive important account-related messages."), {
      headers: { 'Content-Type': 'text/html' },
    });
  } catch (error: any) {
    console.error('Unsubscribe error:', error);
    return new NextResponse('An error occurred. Please contact support@lingoforge.app', { status: 500 });
  }
}

function getUnsubscribeHtml(message: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><title>Unsubscribed - LingoForge</title></head>
    <body style="font-family: -apple-system, sans-serif; background: #0f1923; color: #e2e8f0; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0;">
      <div style="text-align: center; max-width: 400px; padding: 32px;">
        <h1 style="color: #22d3ee;">LingoForge</h1>
        <p style="font-size: 16px; line-height: 1.6;">${message}</p>
        <a href="https://lingoforge.app" style="color: #22d3ee;">Return to LingoForge</a>
      </div>
    </body>
    </html>
  `;
}
