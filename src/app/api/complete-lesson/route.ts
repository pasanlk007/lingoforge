import { NextRequest, NextResponse } from 'next/server';
import { getScenarioFirebaseToken, scenarioFirestoreBaseUrl } from '@/lib/scenarioFirestoreAdmin';

const XP_PER_LESSON = 100;

async function getUser(token: string, userId: string) {
  const res = await fetch(`${scenarioFirestoreBaseUrl()}/userProfiles/${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  return await res.json();
}

async function patchUser(token: string, userId: string, fields: Record<string, any>, masks: string[]) {
  const url = `${scenarioFirestoreBaseUrl()}/userProfiles/${userId}`;
  const maskQuery = masks.map(m => {
    const needsQuoting = /[^a-zA-Z0-9_.]/.test(m);
    if (needsQuoting) {
      const parts = m.split('.');
      const quoted = parts.map(p => /[^a-zA-Z0-9_]/.test(p) ? '`' + p + '`' : p).join('.');
      return `updateMask.fieldPaths=${encodeURIComponent(quoted)}`;
    }
    return `updateMask.fieldPaths=${encodeURIComponent(m)}`;
  }).join('&');

  const firestoreFields: any = {};
  for (const [key, value] of Object.entries(fields)) {
    if (value === null) firestoreFields[key] = { nullValue: null };
    else if (typeof value === 'boolean') firestoreFields[key] = { booleanValue: value };
    else if (typeof value === 'number') firestoreFields[key] = { integerValue: String(Math.round(value)) };
    else if (typeof value === 'string') firestoreFields[key] = { stringValue: value };
    else if (Array.isArray(value)) {
      firestoreFields[key] = { arrayValue: { values: value.map(v => ({ stringValue: String(v) })) } };
    }
  }

  const res = await fetch(`${url}?${maskQuery}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: firestoreFields }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Firestore patch failed: ${err}`);
  }
  return res.json();
}

function getIntField(doc: any, field: string): number {
  const f = doc?.fields?.[field];
  if (!f) return 0;
  if (f.integerValue !== undefined) return parseInt(f.integerValue, 10);
  return 0;
}

function getStringField(doc: any, field: string): string {
  return doc?.fields?.[field]?.stringValue || '';
}

export async function POST(req: NextRequest) {
  try {
    const { userId, language, path, week, day } = await req.json();

    if (!userId || !language || !path || !week || !day) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const token = await getScenarioFirebaseToken();
    const userDoc = await getUser(token, userId);
    if (!userDoc) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const today = new Date().toISOString().split('T')[0];
    const dayKey = `${week}-${day}`;
    const langKey = language.toLowerCase();

    const currentXP = getIntField(userDoc, 'xpPoints');
    const currentStreak = getIntField(userDoc, 'xpPoints') ? getIntField(userDoc, 'currentStreak') : 0;
    const lastActiveDate = getStringField(userDoc, 'lastActiveDate');
    const realStreak = getIntField(userDoc, 'currentStreak');

    // Re-completion check using lastWeek + lastDay
    const lpF = userDoc?.fields?.languageProgress?.mapValue?.fields;
    const lkF = lpF?.[langKey]?.mapValue?.fields;
    const pathF = lkF?.[path]?.mapValue?.fields;
    const lastWeekStored = pathF?.lastWeek?.integerValue ? parseInt(pathF.lastWeek.integerValue) : 0;
    const lastDayStored = pathF?.lastDay?.integerValue ? parseInt(pathF.lastDay.integerValue) : 0;

    console.log('[XP] stored lastWeek/lastDay:', lastWeekStored, lastDayStored, 'current:', week, day);

    if (lastWeekStored === parseInt(String(week)) && lastDayStored === parseInt(String(day))) {
      console.log('[XP] Already completed, skipping');
      return NextResponse.json({ xpPoints: currentXP, currentStreak: realStreak, alreadyCompleted: true });
    }

    // Calculate new values
    const newXP = currentXP + XP_PER_LESSON;
    const isNewDay = lastActiveDate !== today;
    let newStreak = realStreak;
    if (isNewDay) {
      if (lastActiveDate) {
        const diffDays = Math.round((new Date(today).getTime() - new Date(lastActiveDate).getTime()) / 86400000);
        newStreak = diffDays === 1 ? realStreak + 1 : 1;
      } else {
        newStreak = 1;
      }
    }

    // Get existing dailyXp
    const dailyXpF = userDoc?.fields?.dailyXpLog?.mapValue?.fields;
    const existingDailyXp = dailyXpF?.[today]?.integerValue ? parseInt(dailyXpF[today].integerValue) : 0;

    // Write scalar fields
    const fields: Record<string, any> = {
      xpPoints: newXP,
      currentStreak: newStreak,
      lastActiveDate: today,
      activePath: path,
      [`languageProgress.${langKey}.${path}.lastWeek`]: parseInt(String(week)),
      [`languageProgress.${langKey}.${path}.lastDay`]: parseInt(String(day)),
      [`dailyXpLog.${today}`]: existingDailyXp + XP_PER_LESSON,
    };

    const masks = [
      'xpPoints', 'currentStreak', 'lastActiveDate', 'activePath',
      `languageProgress.${langKey}.${path}.lastWeek`,
      `languageProgress.${langKey}.${path}.lastDay`,
      `dailyXpLog.${today}`,
    ];

    await patchUser(token, userId, fields, masks);

    // Read and update completedDays array
    const completedDaysField = `languageProgress.${langKey}.${path}.completedDays`;
    let existingDays: string[] = [];
    try {
      const cdRes = await fetch(
        `${scenarioFirestoreBaseUrl()}/userProfiles/${userId}?mask.fieldPaths=${encodeURIComponent(completedDaysField)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (cdRes.ok) {
        const cdDoc = await cdRes.json();
        const vals = cdDoc?.fields?.languageProgress?.mapValue?.fields?.[langKey]?.mapValue?.fields?.[path]?.mapValue?.fields?.completedDays?.arrayValue?.values;
        if (vals) existingDays = vals.map((v: any) => v.stringValue).filter(Boolean);
      }
    } catch(e) {
      console.warn('[XP] completedDays read error:', e);
    }

    if (!existingDays.includes(dayKey)) {
      existingDays = [...existingDays, dayKey];
    }
    console.log('[XP] writing completedDays:', existingDays.length, 'entries including', dayKey);
    await patchUser(token, userId, { [completedDaysField]: existingDays }, [completedDaysField]);

    console.log(`✅ ${userId} ${langKey}/${path} ${dayKey} | XP: ${currentXP}→${newXP} | Streak: ${realStreak}→${newStreak}`);

    return NextResponse.json({
      xpPoints: newXP,
      currentStreak: newStreak,
      xpEarned: XP_PER_LESSON,
      isNewDay,
      alreadyCompleted: false,
    });

  } catch (error: any) {
    console.error('complete-lesson error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
