'use server';
/**
 * @fileOverview An AI guide for language learners.
 *
 * - chatWithAIGuide - A function that allows users to chat with an AI guide for explanations, grammar, or cultural insights.
 * - ChatWithAIGuideInput - The input type for the chatWithAIGuide function.
 * - ChatWithAIGuideOutput - The return type for the chatWithAIGuide function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ChatWithAIGuideInputSchema = z.object({
  userQuestion: z.string().describe('The question or query from the language learner.').min(1, 'Question cannot be empty.'),
  lessonContext: z.string().optional().describe('Optional context about the current lesson, e.g., the current language, topic, or vocabulary being learned. This helps the AI provide more relevant answers.'),
});
export type ChatWithAIGuideInput = z.infer<typeof ChatWithAIGuideInputSchema>;

const ChatWithAIGuideOutputSchema = z.object({
  aiResponse: z.string().describe('The AI guide\u0027s response, providing explanations, grammar clarifications, or cultural insights.'),
});
export type ChatWithAIGuideOutput = z.infer<typeof ChatWithAIGuideOutputSchema>;

export async function chatWithAIGuide(input: ChatWithAIGuideInput): Promise<ChatWithAIGuideOutput> {
  return chatWithAIGuideFlow(input);
}

const chatPrompt = ai.definePrompt({
  name: 'chatPrompt',
  input: {schema: ChatWithAIGuideInputSchema},
  output: {schema: ChatWithAIGuideOutputSchema},
  prompt: `You are an expert language teacher and an AI guide named LingoForge AI. Your goal is to help a language learner deepen their understanding by providing clear explanations, grammar clarifications, or cultural insights related to their lessons.

Maintain a supportive, encouraging, and clear tone.

Here is some context about the user's current lesson (if available):
{{{lessonContext}}}

Here is the user's question:
{{{userQuestion}}}`,
});

const chatWithAIGuideFlow = ai.defineFlow(
  {
    name: 'chatWithAIGuideFlow',
    inputSchema: ChatWithAIGuideInputSchema,
    outputSchema: ChatWithAIGuideOutputSchema,
  },
  async (input) => {
    const {output} = await chatPrompt(input);
    return output!;
  }
);
