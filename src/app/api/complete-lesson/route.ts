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

function getIntField(doc: any, field: string): number {
  const f = doc?.fields?.[field];
  if (!f) return 0;
  if (f.integerValue !== undefined) return parseInt(f.integerValue, 10);
  return 0;
}

function getStringField(doc: any, field: string): string {
  return doc?.fields?.[field]?.stringValue || '';
}

async function patchScalar(token: string, userId: string, fields: Record<string, any>, masks: string[]) {
  const url = `${scenarioFirestoreBaseUrl()}/userProfiles/${userId}`;
  const maskQuery = masks.map(m => {
    const needsQuoting = /[^a-zA-Z0-9_.]/.test(m);
    if (needsQuoting) {
      const parts = m.split('.');
      const quoted = parts.map((p: string) => /[^a-zA-Z0-9_]/.test(p) ? '`' + p + '`' : p).join('.');
      return `updateMask.fieldPaths=${encodeURIComponent(quoted)}`;
    }
    return `updateMask.fieldPaths=${encodeURIComponent(m)}`;
  }).join('&');

  const firestoreFields: any = {};
  for (const [key, value] of Object.entries(fields)) {
    if (typeof value === 'number') firestoreFields[key] = { integerValue: String(Math.round(value)) };
    else if (typeof value === 'string') firestoreFields[key] = { stringValue: value };
  }

  const res = await fetch(`${url}?${maskQuery}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: firestoreFields }),
  });
  if (!res.ok) throw new Error(`Scalar patch failed: ${await res.text()}`);
  return res.json();
}

export async function POST(req: NextRequest) {
  try {
    const { userId, language, path, week, day } = await req.json();
    if (!userId || !language || !path || !week || !day) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const token = await getScenarioFirebaseToken();
    const userDoc = await getUser(token, userId);
    if (!userDoc) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const today = new Date().toISOString().split('T')[0];
    const dayKey = `${week}-${day}`;
    const langKey = language.toLowerCase();

    const currentXP = getIntField(userDoc, 'xpPoints');
    const realStreak = getIntField(userDoc, 'currentStreak');
    const lastActiveDate = getStringField(userDoc, 'lastActiveDate');

    // Read existing languageProgress
    let lpMap: any = {};
    try {
      const lpRes = await fetch(
        `${scenarioFirestoreBaseUrl()}/userProfiles/${userId}?mask.fieldPaths=languageProgress`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (lpRes.ok) {
        const lpDoc = await lpRes.json();
        lpMap = lpDoc?.fields?.languageProgress?.mapValue?.fields || {};
      }
    } catch(e) { console.warn('[XP] LP read error:', e); }

    // Ensure nested structure exists
    if (!lpMap[langKey]) lpMap[langKey] = { mapValue: { fields: {} } };
    const langMap = lpMap[langKey].mapValue.fields;
    if (!langMap[path]) langMap[path] = { mapValue: { fields: {} } };
    const pathMap = langMap[path].mapValue.fields;

    // Check re-completion
    const lastWeekStored = pathMap?.lastWeek?.integerValue ? parseInt(pathMap.lastWeek.integerValue) : 0;
    const lastDayStored = pathMap?.lastDay?.integerValue ? parseInt(pathMap.lastDay.integerValue) : 0;
    console.log('[XP] lastWeek/lastDay stored:', lastWeekStored, lastDayStored, 'current:', week, day);

    if (lastWeekStored === parseInt(String(week)) && lastDayStored === parseInt(String(day))) {
      console.log('[XP] Already completed');
      return NextResponse.json({ xpPoints: currentXP, currentStreak: realStreak, alreadyCompleted: true });
    }

    // Calculate new values
    const newXP = currentXP + XP_PER_LESSON;
    console.log('[XP] lastActiveDate:', lastActiveDate, 'today:', today, 'isNewDay:', lastActiveDate !== today, 'realStreak:', realStreak);
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

    // Get existing daily XP
    const dailyXpF = userDoc?.fields?.dailyXpLog?.mapValue?.fields;
    const existingDailyXp = dailyXpF?.[today]?.integerValue ? parseInt(dailyXpF[today].integerValue) : 0;

    // Step 1: Write scalar fields (xpPoints, streak, dates)
    const scalarResult = await patchScalar(token, userId, {
      xpPoints: newXP,
      currentStreak: newStreak,
      lastActiveDate: today,
      activePath: path,
    }, ['xpPoints', 'currentStreak', 'lastActiveDate', 'activePath']);
    console.log('[XP] scalar write xpPoints:', scalarResult?.fields?.xpPoints?.integerValue);

    // Step 2: Write dailyXpLog with backtick quoting for date key
    await patchScalar(token, userId, {
      [`dailyXpLog.${today}`]: existingDailyXp + XP_PER_LESSON,
    }, [`dailyXpLog.${today}`]);

    // Step 3: Update completedDays + lastWeek/lastDay in languageProgress map
    const existingVals = pathMap?.completedDays?.arrayValue?.values || [];
    const existingDays: string[] = existingVals.map((v: any) => v.stringValue).filter(Boolean);
    if (!existingDays.includes(dayKey)) existingDays.push(dayKey);

    pathMap.completedDays = { arrayValue: { values: existingDays.map((d: string) => ({ stringValue: d })) } };
    pathMap.lastWeek = { integerValue: String(week) };
    pathMap.lastDay = { integerValue: String(day) };

    console.log('[XP] writing LP:', langKey, path, 'completedDays:', existingDays, 'lastWeek:', week, 'lastDay:', day);

    const lpUrl = `${scenarioFirestoreBaseUrl()}/userProfiles/${userId}?updateMask.fieldPaths=languageProgress`;
    const lpWriteRes = await fetch(lpUrl, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: { languageProgress: { mapValue: { fields: lpMap } } } }),
    });
    if (!lpWriteRes.ok) {
      console.error('[XP] LP write failed:', await lpWriteRes.text());
    } else {
      console.log('[XP] LP write success');
    }

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
