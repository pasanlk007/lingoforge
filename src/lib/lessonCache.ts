import type { LearningPath } from "./types";

export async function getOrGenerateLesson(
  language: string,
  path: LearningPath,
  week: number,
  nativeLanguage: string = "English",
  day: number = 1
): Promise<any | null> {
  try {
    const native = nativeLanguage.toLowerCase();
    const target = language.toLowerCase();
    const filePath = `lessons/${native}_${target}/${path}/week_${String(week).padStart(2, '0')}.json`;

    let weekData: any = null;

    if (typeof window === 'undefined') {
      const { readFileSync, existsSync } = require('fs');
      const { join } = require('path');
      const fullPath = join(process.cwd(), 'public', filePath);
      if (!existsSync(fullPath)) {
        console.error(`[JSON Loader] File not found: ${fullPath}`);
        return null;
      }
      weekData = JSON.parse(readFileSync(fullPath, 'utf-8'));
    } else {
      const res = await fetch(`/${filePath}`);
      if (!res.ok) {
        console.error(`[JSON Loader] Not found: /${filePath}`);
        return null;
      }
      weekData = await res.json();
    }

    if (!weekData || !weekData.days) return null;

    // Return week data with days array — component uses lesson.days.find(d => d.day === currentDay)
    return {
      week: weekData.week,
      language: language,
      path: path,
      title: weekData.days[0]?.title || `Week ${week}`,
      description: weekData.days[0]?.theme || '',
      days: weekData.days
    };

  } catch (error) {
    console.error('[JSON Loader] Error:', error);
    return null;
  }
}
