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

function getField(doc: any, field: string): any {
  const f = doc?.fields?.[field];
  if (!f) return undefined;
  if (f.integerValue !== undefined) return parseInt(f.integerValue, 10);
  if (f.doubleValue !== undefined) return parseFloat(f.doubleValue);
  if (f.booleanValue !== undefined) return f.booleanValue;
  if (f.stringValue !== undefined) return f.stringValue;
  if (f.nullValue !== undefined) return null;
  return undefined;
}

function getMapField(doc: any, ...keys: string[]): any {
  let current = doc?.fields;
  for (const key of keys) {
    current = current?.[key]?.mapValue?.fields;
    if (!current) return undefined;
  }
  return current;
}

async function patchUser(token: string, userId: string, fields: Record<string, any>, masks: string[]) {
  const url = `${scenarioFirestoreBaseUrl()}/userProfiles/${userId}`;
  const maskQuery = masks.map(m => {
    // Fields with dots containing hyphens (e.g. dailyXpLog.2026-07-10)
    // need backtick quoting in the Firestore REST updateMask
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

    // Read current values
    const currentXP = getField(userDoc, 'xpPoints') || 0;
    const currentStreak = getField(userDoc, 'currentStreak') || 0;
    const lastActiveDate = getField(userDoc, 'lastActiveDate') || '';

    // Get existing completedDays for this path
    const pathFields = getMapField(userDoc, 'languageProgress', langKey, path);
    const completedDays: string[] = [];
    if (pathFields?.completedDays?.arrayValue?.values) {
      pathFields.completedDays.arrayValue.values.forEach((v: any) => {
        if (v.stringValue) completedDays.push(v.stringValue);
      });
    }

    // Already completed — don't double award XP
    if (completedDays.includes(dayKey)) {
      return NextResponse.json({
        xpPoints: currentXP,
        currentStreak,
        alreadyCompleted: true,
      });
    }

    // Calculate new values
    const newXP = currentXP + XP_PER_LESSON;
    const isNewDay = lastActiveDate !== today;

    let newStreak = currentStreak;
    if (isNewDay) {
      if (lastActiveDate) {
        const last = new Date(lastActiveDate);
        const todayDate = new Date(today);
        const diffDays = Math.round((todayDate.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
        newStreak = diffDays === 1 ? currentStreak + 1 : 1;
      } else {
        newStreak = 1;
      }
    }

    const newCompletedDays = [...completedDays, dayKey];

    // Get existing daily XP and add to it
    const dailyXpFields = getMapField(userDoc, 'dailyXpLog');
    const existingDailyXp = dailyXpFields?.[today]?.integerValue
      ? parseInt(dailyXpFields[today].integerValue, 10)
      : 0;

    // Write all scalar fields first
    const fields: Record<string, any> = {
      xpPoints: newXP,
      currentStreak: newStreak,
      lastActiveDate: today,
      activePath: path,
      [`languageProgress.${langKey}.${path}.lastWeek`]: parseInt(String(week), 10),
      [`languageProgress.${langKey}.${path}.lastDay`]: parseInt(String(day), 10),
      [`dailyXpLog.${today}`]: existingDailyXp + XP_PER_LESSON,
    };

    const masks = [
      'xpPoints',
      'currentStreak',
      'lastActiveDate',
      'activePath',
      `languageProgress.${langKey}.${path}.lastWeek`,
      `languageProgress.${langKey}.${path}.lastDay`,
      `dailyXpLog.${today}`,
    ];

    await patchUser(token, userId, fields, masks);

    // Write completedDays array separately
    const completedDaysField = `languageProgress.${langKey}.${path}.completedDays`;
    await patchUser(token, userId, {
      [completedDaysField]: newCompletedDays,
    }, [completedDaysField]);

    console.log(`✅ ${userId} ${langKey}/${path} ${dayKey} | XP: ${currentXP}→${newXP} | Streak: ${currentStreak}→${newStreak}`);

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