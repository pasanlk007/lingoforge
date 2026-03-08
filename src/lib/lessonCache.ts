
'use server';

import type { LanguageLesson, LessonDay, LearningPath } from "./types";
import { promises as fs } from 'fs';
import path from 'path';

/**
 * Loads a single day's lesson from a local JSON file.
 * This function is designed to run on the server.
 * @param language The target language (e.g., "French").
 * @param pathName The learning path (e.g., "survival").
 * @param week The week number.
 * @param nativeLanguage The user's native language.
 * @param day The day number.
 * @returns A LanguageLesson object containing the data for the requested day, or null if not found.
 */
export async function getLessonFromFile(
  language: string,
  pathName: LearningPath,
  week: number,
  nativeLanguage: string = "English",
  day: number = 1
): Promise<LanguageLesson | null> {
  try {
    const native = nativeLanguage.toLowerCase();
    const target = language.toLowerCase();
    // Pad week for consistent file naming (e.g., week_01).
    const weekFolder = `week_${String(week).padStart(2, '0')}`;
    const dayFile = `day_${day}.json`;

    const filePath = path.join(
        process.cwd(), 
        'public', 
        'lessons', 
        `${native}_${target}`, 
        pathName, 
        weekFolder, 
        dayFile
    );

    const fileContents = await fs.readFile(filePath, 'utf-8');
    const dayData: LessonDay = JSON.parse(fileContents);

    // Wrap the single day's data into the LanguageLesson structure.
    // This creates the { days: [...] } array that client components expect.
    const lesson: LanguageLesson = {
      week: dayData.week,
      language: dayData.targetLanguage,
      path: dayData.path,
      title: dayData.theme || `Week ${dayData.week}`,
      description: `Lesson for ${dayData.targetLanguage}, ${dayData.path} path, week ${dayData.week}.`,
      days: [dayData] // Place the loaded day's data into the 'days' array.
    };

    return lesson;

  } catch (error) {
    // Log a detailed error if the file can't be read or parsed.
    console.error(`[LessonCache] Error loading lesson file.`, {
        language, pathName, week, nativeLanguage, day, error
    });
    return null;
  }
}
