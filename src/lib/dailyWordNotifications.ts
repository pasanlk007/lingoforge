'use client';

// Daily "2 Words a Day" local notification system.
//
// This is the local-notifications MVP version: everything runs on-device
// using @capacitor/local-notifications (already installed natively — no new
// AAB needed). It schedules a rolling batch of individually-timed, one-shot
// notifications (not a single repeating one), each pre-filled with real
// vocabulary content, since local notifications can't fetch fresh content
// from a server at fire-time the way FCM push can.
//
// Word selection priority implemented here: current week's lesson vocabulary
// only. The original plan's "words the user often forgets" / "high-frequency
// words" / spaced-repetition prioritization needs a per-word performance
// tracking system that doesn't exist yet — that's a real gap versus the full
// plan, not an oversight, and would be a good next step once this ships.

import { getOrGenerateLesson } from './lessonCache';
import { targetLanguages } from './translations';
import type { UserProfile } from './types';

const NOTIFICATION_ID_BASE = 5000; // reserved range, won't collide with ReminderCard's id:1
const DAYS_TO_SCHEDULE = 14;
const STORAGE_KEY_SCHEDULED_THROUGH = 'lingoforge_words_scheduled_through';
const STORAGE_KEY_USED_WORDS = 'lingoforge_notified_word_ids';

interface VocabWord {
  target: string;
  native_meaning: string;
  phonetic?: string;
}

type NotifDay = 0 | 1 | 2 | 3 | 4 | 5 | 6; // JS Date.getDay(): 0=Sunday

function getFlag(targetLanguage: string): string {
  return targetLanguages.find(l => l.lang.toLowerCase() === targetLanguage.toLowerCase())?.flag || '🌍';
}

function loadUsedWordIds(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USED_WORDS);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveUsedWordIds(ids: Set<string>) {
  // Keep the used-list bounded so it doesn't grow forever — once we've used
  // more words than exist in a typical week's pool, older entries can be
  // forgotten and safely reused.
  const trimmed = Array.from(ids).slice(-200);
  localStorage.setItem(STORAGE_KEY_USED_WORDS, JSON.stringify(trimmed));
}

/** Pull the vocabulary pool from the user's current (or first) lesson week. */
async function getWordPool(
  targetLanguage: string,
  nativeLanguage: string,
  userProfile: UserProfile | null | undefined
): Promise<VocabWord[]> {
  const langKey = targetLanguage.toLowerCase();
  const progress = userProfile?.languageProgress?.[langKey]?.['survival'];
  const completedDays: string[] = progress?.completedDays || [];

  // Current week = 1 + however many full weeks of 7 days are already done.
  const currentWeek = Math.max(1, Math.floor(completedDays.length / 7) + 1);

  const lesson = await getOrGenerateLesson(langKey, 'survival', currentWeek, nativeLanguage, 1);
  const pool: VocabWord[] = [];
  if (lesson?.days) {
    for (const day of lesson.days) {
      for (const w of day.words || []) {
        if (w.target && w.native_meaning && w.target !== 'Placeholder') {
          pool.push({ target: w.target, native_meaning: w.native_meaning, phonetic: w.phonetic });
        }
      }
    }
  }
  return pool;
}

function pickWordsForDay(pool: VocabWord[], usedIds: Set<string>, count = 2): VocabWord[] {
  const fresh = pool.filter(w => !usedIds.has(w.target));
  const source = fresh.length >= count ? fresh : pool; // fall back to reusing if pool exhausted
  const picked: VocabWord[] = [];
  const shuffled = [...source].sort(() => Math.random() - 0.5);
  for (const w of shuffled) {
    if (picked.length >= count) break;
    picked.push(w);
  }
  return picked;
}

/** Weekday-themed notification content. Vocab words are injected where relevant. */
function buildNotificationContent(
  dayOfWeek: NotifDay,
  words: VocabWord[],
  targetLanguage: string,
  flag: string
) {
  const wordLines = words.map(w => `${w.target} = ${w.native_meaning}`).join('\n');

  switch (dayOfWeek) {
    case 1: // Monday — new words
      return {
        title: `${flag} Today's 2 ${targetLanguage} Words`,
        body: `${wordLines}\nTap to hear pronunciation & practice.`,
      };
    case 2: // Tuesday — useful phrase (reuse a word pairing as a mini phrase prompt)
      return {
        title: `${flag} Useful ${targetLanguage} Phrase`,
        body: `${words[0]?.target || ''} — ${words[0]?.native_meaning || ''}\nCan you use it in a sentence today?`,
      };
    case 3: // Wednesday — quiz
      return {
        title: `${flag} Quick Quiz`,
        body: `Which one means "${words[0]?.native_meaning || ''}"?\nOpen app to answer.`,
      };
    case 4: // Thursday — pronunciation challenge
      return {
        title: `${flag} Pronunciation Challenge 🎙️`,
        body: `Practice saying: ${words.map(w => w.target).join(', ')}`,
      };
    case 5: // Friday — culture tip (generic framing; real per-language tips are a future upgrade)
      return {
        title: `${flag} Culture Tip`,
        body: `Today's words: ${wordLines}\nSmall daily practice builds real fluency.`,
      };
    case 6: // Saturday — motivation
      return {
        title: `${flag} You're closer than you think`,
        body: `You're only 2 words away from speaking better ${targetLanguage} today.\n${wordLines}`,
      };
    case 0: // Sunday — weekly review framing
      return {
        title: `${flag} Weekly Review`,
        body: `Keep your streak going — review this week's words:\n${wordLines}`,
      };
  }
}

/**
 * Schedules the next DAYS_TO_SCHEDULE days of "2 Words a Day" notifications.
 * Safe to call every time the app opens — it only reschedules if the
 * previously-scheduled batch is running low (within 3 days of running out).
 */
export async function scheduleDailyWordNotifications(params: {
  targetLanguage: string;
  nativeLanguage: string;
  userProfile: UserProfile | null | undefined;
  hour: number;
  minute: number;
  force?: boolean; // bypass the throttle — use for explicit user actions (e.g. Save button),
                    // not for automatic background calls (e.g. on every app open)
}): Promise<void> {
  const { targetLanguage, nativeLanguage, userProfile, hour, minute, force = false } = params;

  const scheduledThroughRaw = localStorage.getItem(STORAGE_KEY_SCHEDULED_THROUGH);
  const scheduledThrough = scheduledThroughRaw ? new Date(scheduledThroughRaw) : null;
  const daysRemaining = scheduledThrough
    ? Math.ceil((scheduledThrough.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0;

  if (!force && scheduledThrough && daysRemaining > 3) {
    return; // still have a healthy buffer scheduled, nothing to do
  }

  const { LocalNotifications } = await import('@capacitor/local-notifications');

  const pool = await getWordPool(targetLanguage, nativeLanguage, userProfile);
  if (pool.length === 0) return; // no vocab available yet (e.g. brand new user, no lesson generated)

  const usedIds = loadUsedWordIds();
  const flag = getFlag(targetLanguage);

  // Cancel any previously-scheduled notifications in our reserved ID range
  // before scheduling the fresh batch, to avoid duplicates/stale content.
  const cancelIds = Array.from({ length: DAYS_TO_SCHEDULE }, (_, i) => ({ id: NOTIFICATION_ID_BASE + i }));
  await LocalNotifications.cancel({ notifications: cancelIds });

  const notifications = [];
  const now = new Date();
  for (let i = 0; i < DAYS_TO_SCHEDULE; i++) {
    const fireDate = new Date(now);
    fireDate.setDate(fireDate.getDate() + i + 1); // start from tomorrow
    fireDate.setHours(hour, minute, 0, 0);

    const dayOfWeek = fireDate.getDay() as NotifDay;
    const words = pickWordsForDay(pool, usedIds, 2);
    words.forEach(w => usedIds.add(w.target));

    const content = buildNotificationContent(dayOfWeek, words, targetLanguage, flag);

    notifications.push({
      id: NOTIFICATION_ID_BASE + i,
      title: content.title,
      body: content.body,
      schedule: { at: fireDate, allowWhileIdle: true },
      sound: 'default',
      extra: {
        type: 'daily_words',
        targetLanguage,
        deepLink: `/dashboard`, // MVP: land on dashboard; today's-lesson deep link is a follow-up
      },
    });
  }

  await LocalNotifications.schedule({ notifications });

  saveUsedWordIds(usedIds);
  const lastFireDate = notifications[notifications.length - 1].schedule.at;
  localStorage.setItem(STORAGE_KEY_SCHEDULED_THROUGH, lastFireDate.toISOString());
}

/** Cancels all scheduled "2 Words a Day" notifications and clears local state. */
export async function cancelDailyWordNotifications(): Promise<void> {
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const cancelIds = Array.from({ length: DAYS_TO_SCHEDULE }, (_, i) => ({ id: NOTIFICATION_ID_BASE + i }));
    await LocalNotifications.cancel({ notifications: cancelIds });
  } catch (e) {
    console.error('Failed to cancel daily word notifications', e);
  }
  localStorage.removeItem(STORAGE_KEY_SCHEDULED_THROUGH);
}
