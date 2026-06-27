import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { initializeFirebase } from '@/firebase/server-init';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('x-admin-secret');
    if (authHeader !== process.env.ADMIN_SECRET_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { firestore } = initializeFirebase();
    const resend = new Resend(process.env.RESEND_API_KEY);

    const body = await req.json();
    const { language, campaignId, dryRun } = body;

    if (!language || !campaignId) {
      return NextResponse.json({ error: 'language and campaignId are required' }, { status: 400 });
    }

    const usersSnapshot = await firestore
      .collection('userProfiles')
      .where('selectedLanguage', '==', language)
      .get();

    const results: { email: string; status: string }[] = [];

    for (const docSnap of usersSnapshot.docs) {
      const profile = docSnap.data();
      const email = profile.email;
      const name = profile.displayName || 'there';

      if (!email || email === 'test@example.com') {
        results.push({ email: 'unknown', status: 'skipped-no-email' });
        continue;
      }

      const sentLogRef = firestore.collection('emailCampaignLog').doc(`${docSnap.id}_${campaignId}`);
      const sentLogSnap = await sentLogRef.get();
      if (sentLogSnap.exists) {
        results.push({ email, status: 'already-sent' });
        continue;
      }

      if (dryRun) {
        results.push({ email, status: 'would-send' });
        continue;
      }

      try {
        await resend.emails.send({
          from: 'LingoForge <support@lingoforge.app>',
          to: email,
          subject: getCampaignSubject(campaignId, language),
          html: getCampaignTemplate(campaignId, language, name),
        });

        await sentLogRef.set({
          email,
          campaignId,
          sentAt: new Date().toISOString(),
        });

        results.push({ email, status: 'sent' });
      } catch (err: any) {
        results.push({ email, status: `error: ${err.message}` });
      }
    }

    return NextResponse.json({
      campaignId,
      language,
      dryRun: !!dryRun,
      totalMatched: usersSnapshot.size,
      results,
    });
  } catch (error: any) {
    console.error('Campaign send error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function getCampaignSubject(campaignId: string, language: string): string {
  const subjects: Record<string, string> = {
    'pro-launch-2026-05': `🎉 New: AI-Powered ${language} Pro Lessons Are Here`,
  };
  return subjects[campaignId] || 'Update from LingoForge';
}

function getCampaignTemplate(campaignId: string, language: string, name: string): string {
  if (campaignId === 'pro-launch-2026-05') {
    return `
      <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; background: #0f1923; color: #e2e8f0; padding: 32px; border-radius: 12px;">
        <h1 style="color: #22d3ee; font-size: 24px;">Hi ${name}! 👋</h1>
        <p style="font-size: 16px; line-height: 1.6;">
          We noticed you've been learning <strong>${language}</strong> with LingoForge. We just launched
          <strong>LingoForge Pro</strong> — AI-generated citizenship and integration lessons tailored to your goals.
        </p>
        <p style="font-size: 16px; line-height: 1.6;">
          New lessons cover real situations: government paperwork, job interviews, healthcare visits, and more —
          all explained in your own language.
        </p>
        <a href="https://lingoforge.app/dashboard"
           style="display: inline-block; margin-top: 16px; padding: 14px 28px; background: linear-gradient(135deg, #06b6d4, #0891b2); color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">
          Try LingoForge Pro →
        </a>
        <p style="font-size: 13px; color: #94a3b8; margin-top: 32px;">
          You're receiving this because you have a LingoForge account.
          <a href="https://lingoforge.app/unsubscribe" style="color: #94a3b8;">Unsubscribe</a>
        </p>
      </div>
    `;
  }
  return `<p>Hi ${name}, check out the latest from LingoForge!</p>`;
}
