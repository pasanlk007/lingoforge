import { z } from 'zod';

export const LessonItemExampleSentenceSchema = z.object({
  target: z.string(),
  english: z.string(),
});

export const LessonItemSchema = z.object({
  id: z.string().describe('Unique ID for the vocabulary item, e.g., w1'),
  target: z.string(),
  phonetic: z.string().optional(),
  english: z.string(),
  audioText: z.string().optional(),
  exampleSentence: LessonItemExampleSentenceSchema.optional(),
});

export const DialogueLineSchema = z.object({
  speaker: z.string(),
  target: z.string(),
  english: z.string(),
  phonetic: z.string().optional(),
});

export const DialogueSchema = z.object({
  title: z.string().optional(),
  lines: z.array(DialogueLineSchema).describe('Dialogue lines.').optional(),
});

export const FillBlankExerciseSchema = z.object({
  id: z.string().describe('Unique ID for the fill-in-the-blank question, e.g., fb1'),
  sentence: z.string(),
  answer: z.string(),
  hint: z.string().optional(),
});

export const MultipleChoiceExerciseSchema = z.object({
  id: z.string().describe('Unique ID for the multiple choice question, e.g., mc1'),
  question: z.string(),
  options: z.array(z.string()).describe('Options for multiple choice.').optional(),
  correct: z.number().int().min(0).describe('Index of the correct option (0-based).').optional(),
  explanation: z.string().optional(),
});

export const MatchingExerciseSchema = z.object({
  target: z.string().optional(),
  english: z.string().optional(),
});

export const ExercisesSchema = z.object({
  fillBlanks: z.array(FillBlankExerciseSchema).describe('Fill-in-the-blank questions.').optional(),
  multipleChoice: z.array(MultipleChoiceExerciseSchema).describe('Multiple choice questions.').optional(),
  matching: z.array(MatchingExerciseSchema).describe('Matching pairs.').optional(),
});

export const CulturalNoteSchema = z.string();

export const ProgressTrackingSchema = z.object({
  xpReward: z.number().int().optional(),
  streakBonus: z.number().int().optional(),
  badge: z.string().optional(),
});

export const DayLessonSchema = z.object({
  day: z.number().int().min(1).max(7),
  title: z.string().optional(),
  type: z.enum(['vocabulary', 'grammar', 'dialogue', 'numbers', 'alphabet', 'reading', 'writing']).optional(),
  items: z.array(LessonItemSchema).describe('Vocabulary items.').optional(),
  dialogue: DialogueSchema.optional(),
  exercises: ExercisesSchema.optional(),
  culturalNote: CulturalNoteSchema.optional(),
  progressTracking: ProgressTrackingSchema.optional(),
});

export const WeeklyLessonPlanSchema = z.object({
  week: z.number().int(),
  language: z.string(),
  path: z.union([z.literal('survival'), z.literal('alphabet'), z.literal('numbers')]),
  title: z.string().optional(),
  description: z.string().optional(),
  days: z.array(DayLessonSchema).describe('Days of lessons.').optional(),
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
