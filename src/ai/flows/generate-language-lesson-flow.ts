'use server';
/**
 * @fileOverview This file defines a Genkit flow for generating language lesson plans.
 *
 * - generateLanguageLesson - A function that orchestrates the generation of a 7-day lesson plan
 *                            using the Claude AI generator.
 * - GenerateLanguageLessonInput - The input type for the generateLanguageLesson function.
 * - GenerateLanguageLessonOutput - The return type for the generateLanguageLesson function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { generateLesson } from '@/lib/claudeGenerator';

// --- Schemas for the lesson structure ---

const ExampleSentenceSchema = z.object({
  target: z.string(),
  english: z.string(),
  sinhala: z.string(),
  hindi: z.string(),
  urdu: z.string(),
  arabic: z.string(),
  bengali: z.string(),
});

const LessonItemSchema = z.object({
  id: z.string(),
  target: z.string(),
  phonetic: z.string(),
  english: z.string(),
  sinhala: z.string(),
  hindi: z.string(),
  urdu: z.string(),
  arabic: z.string(),
  bengali: z.string(),
  audioText: z.string(),
  exampleSentence: ExampleSentenceSchema,
});

const DialogueLineSchema = z.object({
  speaker: z.string(),
  target: z.string(),
  english: z.string(),
  sinhala: z.string(),
  phonetic: z.string(),
});

const DialogueSchema = z.object({
  title: z.string(),
  lines: z.array(DialogueLineSchema),
});

const FillBlankExerciseSchema = z.object({
  id: z.string(),
  sentence: z.string(),
  answer: z.string(),
  hint: z.string(),
});

const MultipleChoiceExerciseSchema = z.object({
  id: z.string(),
  question: z.string(),
  options: z.array(z.string()),
  correct: z.number().int(),
  explanation: z.string(),
});

const MatchingPairSchema = z.object({
  target: z.string(),
  english: z.string(),
});

const ExercisesSchema = z.object({
  fillBlanks: z.array(FillBlankExerciseSchema),
  multipleChoice: z.array(MultipleChoiceExerciseSchema),
  matching: z.array(MatchingPairSchema),
});

const ProgressTrackingSchema = z.object({
  xpReward: z.number().int(),
  streakBonus: z.number().int(),
  badge: z.string(),
});

const DaySchema = z.object({
  day: z.number().int(),
  title: z.string(),
  type: z.enum(['vocabulary', 'grammar', 'dialogue', 'numbers', 'alphabet', 'reading', 'writing']),
  items: z.array(LessonItemSchema),
  dialogue: DialogueSchema,
  exercises: ExercisesSchema,
  culturalNote: z.string(),
  progressTracking: ProgressTrackingSchema,
});

// --- Input and Output Schemas for the Genkit Flow ---

export const GenerateLanguageLessonInputSchema = z.object({
  language: z.string().describe('The target language for the lesson (e.g., "French").'),
  path: z.enum(['survival', 'alphabet', 'numbers']).describe('The learning path (e.g., "survival", "alphabet", "numbers").'),
  week: z.number().int().positive().describe('The week number for the lesson plan (1-48).'),
  nativeLanguage: z.string().default("English").describe('The native language of the student for translations (e.g., "English").'),
  topic: z.string().optional().describe('An optional specific theme for the week, overriding the default based on path and week.'),
});

export type GenerateLanguageLessonInput = z.infer<typeof GenerateLanguageLessonInputSchema>;

export const GenerateLanguageLessonOutputSchema = z.object({
  week: z.number().int(),
  language: z.string(),
  path: z.enum(['survival', 'alphabet', 'numbers']),
  title: z.string(),
  description: z.string(),
  days: z.array(DaySchema),
});

export type GenerateLanguageLessonOutput = z.infer<typeof GenerateLanguageLessonOutputSchema>;

// --- Wrapper function for direct call ---

export async function generateLanguageLesson(input: GenerateLanguageLessonInput): Promise<GenerateLanguageLessonOutput> {
  return generateLanguageLessonFlow(input);
}

// --- Genkit Flow Definition ---

const generateLanguageLessonFlow = ai.defineFlow(
  {
    name: 'generateLanguageLessonFlow',
    inputSchema: GenerateLanguageLessonInputSchema,
    outputSchema: GenerateLanguageLessonOutputSchema,
  },
  async (input) => {
    const { language, path, week, nativeLanguage, topic } = input;

    // Call the external Claude generator function
    const lessonData = await generateLesson(
      language,
      path,
      week,
      nativeLanguage,
      topic
    );

    // The output from generateLesson should conform to GenerateLanguageLessonOutputSchema
    // We cast it to the expected type as the external function is responsible for adherence.
    return lessonData as GenerateLanguageLessonOutput;
  }
);
