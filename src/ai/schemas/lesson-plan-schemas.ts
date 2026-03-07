
import { z } from 'zod';

// Describes a single vocabulary word or phrase for a lesson.
export const LessonItemSchema = z.object({
  id: z.string().describe('A unique identifier for the vocabulary item, e.g., "word1".'),
  target: z.string().describe('The vocabulary word or phrase in the target language.'),
  phonetic: z.string().optional().describe('An optional phonetic pronunciation guide for the target word.'),
  english: z.string().describe('The English translation of the target word.'),
  exampleSentence: z.object({
    target: z.string().describe('An example sentence using the word in the target language.'),
    english: z.string().describe('The English translation of the example sentence.'),
  }).optional().describe('An optional example sentence demonstrating usage.'),
});

// Describes a single line of conversation in a dialogue.
export const DialogueLineSchema = z.object({
  speaker: z.enum(["A", "B"]).describe('The speaker identifier, either "A" or "B".'),
  target: z.string().describe('The line of dialogue in the target language.'),
  english: z.string().describe('The English translation of the dialogue line.'),
  phonetic: z.string().optional().describe('An optional phonetic pronunciation guide for the dialogue line.'),
});

// Describes a complete dialogue for a lesson.
export const DialogueSchema = z.object({
  title: z.string().describe('The title of the dialogue, summarizing its context (e.g., "Ordering Coffee").'),
  lines: z.array(DialogueLineSchema).describe('An array of dialogue lines, forming the conversation.'),
});

// Describes the set of exercises for a daily lesson.
export const ExercisesSchema = z.object({
  fillBlanks: z.array(z.object({
    id: z.string().describe('A unique identifier for this exercise, e.g., "fb1".'),
    sentence: z.string().describe('A sentence in the target language with a blank represented by "_____".'),
    answer: z.string().describe('The correct word or phrase to fill the blank.'),
    hint: z.string().optional().describe('An optional hint for the user.'),
  })).optional().describe('An optional array of fill-in-the-blank exercises.'),
  multipleChoice: z.array(z.object({
    id: z.string().describe('A unique identifier for this question, e.g., "mc1".'),
    question: z.string().describe('The multiple-choice question.'),
    options: z.array(z.string()).describe('An array of possible answers.'),
    correct: z.number().int().min(0).describe('The zero-based index of the correct option in the "options" array.'),
    explanation: z.string().optional().describe('An optional explanation for why the correct answer is right.'),
  })).optional().describe('An optional array of multiple-choice questions.'),
  matching: z.array(z.object({
    target: z.string().describe('A word or phrase in the target language.'),
    english: z.string().describe('The corresponding English translation to be matched.'),
  })).optional().describe('An optional array of word pairs for a matching exercise.'),
});

// Describes the full content for a single day's lesson.
export const DayLessonSchema = z.object({
  day: z.number().int().min(1).max(7).describe('The day number within the week (1-7).'),
  title: z.string().describe('The title of the daily lesson (e.g., "Common Greetings").'),
  type: z.enum(['vocabulary', 'grammar', 'dialogue', 'numbers', 'alphabet', 'reading', 'writing']).describe('The primary focus of the day\'s lesson.'),
  items: z.array(LessonItemSchema).describe('An array of vocabulary items to be learned.'),
  dialogue: DialogueSchema.describe('A dialogue to practice conversation.'),
  exercises: ExercisesSchema.describe('A set of exercises to test understanding.'),
  culturalNote: z.string().optional().describe('An optional interesting cultural fact related to the lesson.'),
  progressTracking: z.object({
    xpReward: z.number().int().describe('The number of experience points awarded for completing the lesson.'),
    streakBonus: z.number().int().describe('A bonus XP amount for maintaining a learning streak.'),
    badge: z.string().describe('The name of the badge awarded for completion (e.g., "Week1-Day1-Badge").'),
  }).describe('Metadata for tracking user progress and rewards.'),
});

// Describes a complete 7-day lesson plan for a single week.
export const WeeklyLessonPlanSchema = z.object({
  week: z.number().int().describe('The week number of this lesson plan.'),
  language: z.string().describe('The target language for this lesson plan (e.g., "French").'),
  path: z.union([z.literal('survival'), z.literal('alphabet'), z.literal('numbers')]).describe('The learning path this lesson belongs to.'),
  title: z.string().describe('The overall title for the weekly theme (e.g., "Mastering Basic Greetings").'),
  description: z.string().describe('A brief summary of what the user will learn this week.'),
  days: z.array(DayLessonSchema).length(7, "The lesson plan must contain exactly 7 days.").describe('An array containing the lesson content for each of the 7 days.'),
});

export type WeeklyLessonPlanOutput = z.infer<typeof WeeklyLessonPlanSchema>;

// Describes the input required to generate a weekly lesson plan.
export const GenerateLessonPlanInputSchema = z.object({
  language: z.string().describe('The target language for the lesson (e.g., "French").'),
  path: z.union([z.literal('survival'), z.literal('alphabet'), z.literal('numbers')]).describe('The learning path selected by the user.'),
  week: z.number().int().min(1).max(48).describe('The week number for the lesson.'),
  nativeLanguage: z.string().describe('The user\'s native language, for translation context (e.g., "English").'),
  aiPlanningEnabled: z.boolean().describe('A flag indicating if the AI should choose the weekly topic.'),
  selectedTopic: z.string().optional().describe('A user-selected topic, if AI planning is disabled.'),
  previousPerformanceSummary: z.string().optional().describe('An optional summary of the user\'s past performance to inform AI topic selection.'),
});

export type GenerateLessonPlanInput = z.infer<typeof GenerateLessonPlanInputSchema>;
