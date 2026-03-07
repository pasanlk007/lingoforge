import { z } from 'zod';

export const LessonItemExampleSentenceSchema = z.object({
  target: z.string(),
  english: z.string(),
});

export const LessonItemSchema = z.object({
  id: z.string().describe('Unique ID for the vocabulary item, e.g., w1'),
  target: z.string(),
  phonetic: z.string(),
  english: z.string(),
  audioText: z.string(),
  exampleSentence: LessonItemExampleSentenceSchema.optional(),
});

export const DialogueLineSchema = z.object({
  speaker: z.string(),
  target: z.string(),
  english: z.string(),
  phonetic: z.string(),
});

export const DialogueSchema = z.object({
  title: z.string(),
  lines: z.array(DialogueLineSchema).length(4).describe('Exactly 4 dialogue lines.'),
});

export const FillBlankExerciseSchema = z.object({
  id: z.string().describe('Unique ID for the fill-in-the-blank question, e.g., fb1'),
  sentence: z.string(),
  answer: z.string(),
  hint: z.string(),
});

export const MultipleChoiceExerciseSchema = z.object({
  id: z.string().describe('Unique ID for the multiple choice question, e.g., mc1'),
  question: z.string(),
  options: z.array(z.string()).length(4).describe('Exactly 4 options for multiple choice.'),
  correct: z.number().int().min(0).max(3).describe('Index of the correct option (0-3).'),
  explanation: z.string(),
});

export const MatchingExerciseSchema = z.object({
  target: z.string(),
  english: z.string(),
});

export const ExercisesSchema = z.object({
  fillBlanks: z.array(FillBlankExerciseSchema).length(3).describe('Exactly 3 fill-in-the-blank questions.'),
  multipleChoice: z.array(MultipleChoiceExerciseSchema).length(3).describe('Exactly 3 multiple choice questions.'),
  matching: z.array(MatchingExerciseSchema).length(5).describe('Exactly 5 matching pairs.'),
});

export const CulturalNoteSchema = z.string();

export const ProgressTrackingSchema = z.object({
  xpReward: z.number().int(),
  streakBonus: z.number().int(),
  badge: z.string(),
});

export const DayLessonSchema = z.object({
  day: z.number().int().min(1).max(7),
  title: z.string(),
  type: z.enum(['vocabulary', 'grammar', 'dialogue', 'numbers', 'alphabet', 'reading', 'writing']),
  items: z.array(LessonItemSchema).length(5).describe('Exactly 5 vocabulary items.'),
  dialogue: DialogueSchema,
  exercises: ExercisesSchema,
  culturalNote: CulturalNoteSchema,
  progressTracking: ProgressTrackingSchema,
});

export const WeeklyLessonPlanSchema = z.object({
  week: z.number().int(),
  language: z.string(),
  path: z.union([z.literal('survival'), z.literal('alphabet'), z.literal('numbers')]),
  title: z.string(),
  description: z.string(),
  days: z.array(DayLessonSchema).length(7).describe('Exactly 7 days of lessons.'),
});
export type WeeklyLessonPlanOutput = z.infer<typeof WeeklyLessonPlanSchema>;

export const GenerateLessonPlanInputSchema = z.object({
  language: z.string().describe('The target language for the lesson.'),
  path: z.union([z.literal('survival'), z.literal('alphabet'), z.literal('numbers')]).describe('The learning path.'),
  week: z.number().int().min(1).max(48).describe('The week number for the lesson.'),
  nativeLanguage: z.string().describe('The native language of the student.'),
  aiPlanningEnabled: z.boolean().describe('Whether AI planning for the topic is enabled.'),
  selectedTopic: z.string().optional().describe('User-selected topic if AI planning is disabled.'),
  previousPerformanceSummary: z.string().optional().describe('Summary of previous performance for AI planning.'),
});
export type GenerateLessonPlanInput = z.infer<typeof GenerateLessonPlanInputSchema>;
