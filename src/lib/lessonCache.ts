import { db } from "@/firebase";
import { collection, doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { generateLesson } from "./claudeGenerator";
import type { LanguageLesson, LearningPath } from "./types";

const lessonCacheCollection = collection(db, 'lessonCache');

/**
 * Retrieves a lesson from Firestore cache or generates and caches it if not found.
 * @param language - The target language (e.g., "French").
 * @param path - The learning path (e.g., "survival").
 * @param week - The week number.
 * @returns The language lesson object.
 */
export async function getOrGenerateLesson(
  language: string,
  path: LearningPath,
  week: number
): Promise<LanguageLesson | null> {
  const cacheKey = `${language.toLowerCase()}_${path}_week${week}`;
  const docRef = doc(lessonCacheCollection, cacheKey);

  try {
    // 1. Check cache
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      console.log(`[Cache HIT] Found lesson for ${cacheKey} in Firestore.`);
      // The document data will be validated against the LanguageLesson type on retrieval
      return docSnap.data().lesson as LanguageLesson;
    }

    // 2. If miss, generate
    console.log(`[Cache MISS] Generating lesson for ${cacheKey}.`);
    const newLesson = await generateLesson(language, path, week);

    if (!newLesson) {
      throw new Error("Lesson generation failed.");
    }
    
    // 3. Save to cache
    console.log(`[Cache SET] Saving new lesson for ${cacheKey} to Firestore.`);
    const cacheData = {
      lesson: newLesson,
      cachedAt: serverTimestamp(),
      language: language,
      path: path,
      week: week,
    };

    await setDoc(docRef, cacheData);
    
    // 4. Return
    return newLesson;

  } catch (error) {
    console.error(`Error in getOrGenerateLesson for ${cacheKey}:`, error);
    return null;
  }
}
