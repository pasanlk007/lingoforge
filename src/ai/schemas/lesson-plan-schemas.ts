import { z } from 'zod';

export const LessonItemSchema = z.object({
  id: z.string().describe("A unique identifier for this vocabulary item (e.g., 'vocab-1')."),
  target: z.string().describe("The vocabulary word or phrase in the target language."),
  phonetic: z.string().optional().describe("A simplified phonetic transcription of the target word."),
  english: z.string().describe("The English translation of the target word."),
  exampleSentence: z.object({
    target: z.string().describe("An example sentence using the word in the target language."),
    english: z.string().describe("The English translation of the example sentence."),
  }).optional().describe("An optional example sentence to provide context."),
});

export const DialogueLineSchema = z.object({
  speaker: z.enum(["A", "B"]).describe("The speaker in the dialogue, either 'A' or 'B'."),
  target: z.string().describe("The dialogue line in the target language."),
  english: z.string().describe("The English translation of the dialogue line."),
  phonetic: z.string().optional().describe("A simplified phonetic transcription of the dialogue line."),
});

export const DialogueSchema = z.object({
  title: z.string().describe("The title of the dialogue (e.g., 'Ordering Coffee')."),
  lines: z.array(DialogueLineSchema).min(1, "Dialogue must have at least one line.").describe("An array of dialogue lines between two speakers."),
});

export const ExercisesSchema = z.object({
  fillBlanks: z.array(z.object({
    id: z.string().describe("A unique identifier for this fill-in-the-blank question (e.g., 'fb-1')."),
    sentence: z.string().describe("A sentence in the target language with a blank represented by '_____'. The user must fill this in."),
    answer: z.string().describe("The correct word or phrase for the blank."),
    hint: z.string().optional().describe("An optional hint, like the English translation of the answer."),
  })).optional().describe("An optional array of fill-in-the-blank exercises."),
  multipleChoice: z.array(z.object({
    id: z.string().describe("A unique identifier for this multiple-choice question (e.g., 'mc-1')."),
    question: z.string().describe("The question, usually in English, asking for a translation or concept."),
    options: z.array(z.string()).describe("An array of 4 possible answers in the target language."),
    correct: z.number().int().min(0).describe("The 0-based index of the correct answer in the 'options' array."),
    explanation: z.string().optional().describe("An optional brief explanation of why the answer is correct."),
  })).optional().describe("An optional array of multiple-choice questions."),
  matching: z.array(z.object({
    target: z.string().describe("A word or phrase in the target language."),
    english: z.string().describe("The corresponding English translation."),
  })).optional().describe("An optional array of word pairs for a matching game."),
});

export const DayLessonSchema = z.object({
  day: z.number().int().min(1).max(7).describe("The day number within the week (1-7)."),
  title: z.string().describe("The title for this day's lesson (e.g., 'Essential Greetings')."),
  type: z.enum(['vocabulary', 'grammar', 'dialogue', 'numbers', 'alphabet', 'reading', 'writing']).describe("The primary focus of the day's lesson."),
  items: z.array(LessonItemSchema).min(1, "A day's lesson must have at least one vocabulary item.").describe("An array of vocabulary words or phrases for the day."),
  dialogue: DialogueSchema.optional().describe("An optional dialogue to practice conversation skills."),
  exercises: ExercisesSchema.describe("An object containing different types of exercises to reinforce learning. Can be an empty object if no exercises are suitable."),
  culturalNote: z.string().optional().describe("An optional short, interesting cultural fact related to the lesson."),
  progressTracking: z.object({
    xpReward: z.number().int().describe("The number of experience points (XP) the user earns for completing the day."),
    streakBonus: z.number().int().describe("The bonus XP awarded for maintaining a learning streak."),
    badge: z.string().describe("The name of a simple badge earned for completing the day (e.g., 'Day 1 Complete')."),
  }).describe("Gamification elements for completing the lesson."),
});

export const WeeklyLessonPlanSchema = z.object({
  week: z.number().int().describe("The week number of this lesson plan."),
  language: z.string().describe("The target language for this lesson (e.g., 'French')."),
  path: z.union([z.literal('survival'), z.literal('alphabet'), z.literal('numbers')]).describe("The learning path this lesson belongs to."),
  title: z.string().describe("The overall title for the weekly lesson plan (e.g., 'Week 1: First Steps')."),
  description: z.string().describe("A brief description of what the user will learn this week."),
  days: z.array(DayLessonSchema).min(1, "A weekly lesson plan must have at least one day.").describe("An array of daily lessons for the week."),
});

export type WeeklyLessonPlanOutput = z.infer<typeof WeeklyLessonPlanSchema>;

export const GenerateLessonPlanInputSchema = z.object({
  language: z.string(),
  path: z.union([z.literal('survival'), z.literal('alphabet'), z.literal('numbers')]),
  week: z.number().int().min(1).max(48),
  nativeLanguage: z.string(),
  aiPlanningEnabled: z.boolean(),
  selectedTopic: z.string().optional(),
  previousPerformanceSummary: z.string().optional(),
});

export type GenerateLessonPlanInput = z.infer<typeof GenerateLessonPlanInputSchema>;
