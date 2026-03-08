
import { genkit } from 'genkit';
import { anthropic } from '@genkit-ai/anthropic';
import 'dotenv/config';

export const ai = genkit({
  plugins: [
    anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }),
  ],
});
