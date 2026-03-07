import { z } from 'zod';

export const LessonItemSchema = z.object({
  id: z.string(),
  target: z.string(),
  phonetic: z.string().optional(),
  english: z.string(),
  exampleSentence: z.object({
    target: z.string(),
    english: z.string(),
  }).optional(),
});

export const DialogueLineSchema = z.object({
  speaker: z.enum(["A", "B"]),
  target: z.string(),
  english: z.string(),
  phonetic: z.string().optional(),
});

export const DialogueSchema = z.object({
  title: z.string(),
  lines: z.array(DialogueLineSchema).min(1, "Dialogue must have at least one line."),
});

export const ExercisesSchema = z.object({
  fillBlanks: z.array(z.object({
    id: z.string(),
    sentence: z.string(),
    answer: z.string(),
    hint: z.string().optional(),
  })).optional(),
  multipleChoice: z.array(z.object({
    id: z.string(),
    question: z.string(),
    options: z.array(z.string()),
    correct: z.number().int().min(0),
    explanation: z.string().optional(),
  })).optional(),
  matching: z.array(z.object({
    target: z.string(),
    english: z.string(),
  })).optional(),
});

export const DayLessonSchema = z.object({
  day: z.number().int().min(1).max(7),
  title: z.string(),
  type: z.enum(['vocabulary', 'grammar', 'dialogue', 'numbers', 'alphabet', 'reading', 'writing']),
  items: z.array(LessonItemSchema).min(1, "A day's lesson must have at least one vocabulary item."),
  dialogue: DialogueSchema.optional(),
  exercises: ExercisesSchema,
  culturalNote: z.string().optional(),
  progressTracking: z.object({
    xpReward: z.number().int(),
    streakBonus: z.number().int(),
    badge: z.string(),
  }),
});

export const WeeklyLessonPlanSchema = z.object({
  week: z.number().int(),
  language: z.string(),
  path: z.union([z.literal('survival'), z.literal('alphabet'), z.literal('numbers')]),
  title: z.string(),
  description: z.string(),
  days: z.array(DayLessonSchema).min(1, "A weekly lesson plan must have at least one day."),
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
