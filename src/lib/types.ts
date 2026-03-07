// === Main Lesson Structure ===

export interface ExampleSentence {
  target: string;
  english: string;
  sinhala: string;
  hindi: string;
  urdu: string;
  arabic: string;
  bengali: string;
}

export interface LessonItem {
  id: string;
  target: string;
  phonetic: string;
  english: string;
  sinhala: string;
  hindi: string;
  urdu: string;
  arabic: string;
  bengali: string;
  audioText: string;
  exampleSentence?: ExampleSentence;
}

export interface DialogueLine {
  speaker: "A" | "B";
  target: string;
  english: string;
  sinhala: string;
  phonetic: string;
}

export interface Dialogue {
  title: string;
  lines: DialogueLine[];
}

export interface FillBlankExercise {
  id: string;
  sentence: string;
  answer: string;
  hint: string;
}

export interface MultipleChoiceExercise {
  id: string;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

export interface MatchingPair {
  target: string;
  english: string;
}

export interface Exercises {
  fillBlanks: FillBlankExercise[];
  multipleChoice: MultipleChoiceExercise[];
  matching: MatchingPair[];
}

export interface ProgressTracking {
  xpReward: number;
  streakBonus: number;
  badge: string;
}

export interface LessonDay {
  day: number;
  title: string;
  type: "vocabulary" | "grammar" | "dialogue" | "numbers" | "alphabet" | "reading" | "writing";
  items: LessonItem[];
  dialogue: Dialogue;
  exercises: Exercises;
  culturalNote: string;
  progressTracking: ProgressTracking;
}

export interface LanguageLesson {
  week: number;
  language: string;
  path: "survival" | "alphabet" | "numbers";
  title: string;
  description: string;
  days: LessonDay[];
}


// === Firestore Data Structures ===

export interface LessonCache {
  lesson: LanguageLesson;
  cachedAt: any; // Firestore Timestamp
  language: string;
  path: string;
  week: number;
}

export interface UserProfile {
  displayName: string;
  email: string;
  nativeLanguage: string; // From NATIVE_LANGUAGES
  selectedLanguage: string; // From TARGET_LANGUAGES
  subscription: 'free' | 'monthly' | 'yearly';
  subscriptionExpiry?: any; // Firestore Timestamp
  xpPoints: number;
  currentStreak: number;
  lastActiveDate: string; // YYYY-MM-DD
  aiPlanningEnabled: boolean;
  photoURL?: string;
}

export interface UserLessonProgress {
  completed: boolean;
  score: number; // 0-100
  completedAt: any; // Firestore Timestamp
  exerciseResults: {
    [exerciseId: string]: boolean; // e.g., { "mc1": true, "fb2": false }
  };
}

export interface UserWeekProgress {
  language: string;
  path: string;
  week: number;
  daysCompleted: number[];
  weekCompleted: boolean;
  selectedTopic?: string;
}


// === App-specific types ===

export type LearningPath = "survival" | "alphabet" | "numbers";

export type TargetLanguage =
  | "French" | "German" | "Spanish" | "Italian" | "Portuguese"
  | "Dutch" | "Polish" | "Romanian" | "Greek" | "Serbian"
  | "Russian" | "Finnish" | "Korean" | "Japanese" | "Arabic"
  | "Hebrew" | "English";

export type NativeLanguage = "English" | "Sinhala" | "Hindi" | "Urdu" | "Arabic" | "Bengali";

export interface Language {
  code: string;
  name: TargetLanguage;
  flag: string;
}
