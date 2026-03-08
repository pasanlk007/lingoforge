'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import wav from 'wav';

// Define input schema
const TTSInputSchema = z.object({
    text: z.string().describe("The text to be converted to speech."),
    languageName: z.string().describe("The language of the text, e.g., 'French'"),
});
export type TTSInput = z.infer<typeof TTSInputSchema>;

// Define output schema
const TTSOutputSchema = z.object({
    audioDataUri: z.string().describe("The generated audio as a base64 encoded data URI."),
});
export type TTSOutput = z.infer<typeof TTSOutputSchema>;

// Exported function for the client to call
export async function generateSpeech(input: TTSInput): Promise<TTSOutput> {
  return textToSpeechFlow(input);
}

const textToSpeechFlow = ai.defineFlow(
  {
    name: 'textToSpeechFlow',
    inputSchema: TTSInputSchema,
    outputSchema: TTSOutputSchema,
  },
  async ({ text, languageName }) => {
    
    // The model is smart enough to infer the language from the text content and surrounding context if provided.
    // For more explicit control, one could add instructions to the prompt,
    // e.g., `Speak the following text in ${languageName}: ${text}`
    const { media } = await ai.generate({
        model: googleAI.model('gemini-2.5-flash-preview-tts'),
        config: {
            responseModalities: ['AUDIO'],
        },
        prompt: text,
    });

    if (!media) {
      throw new Error('no media returned from TTS model');
    }

    const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );

    const wavBase64 = await toWav(audioBuffer);
    
    return {
      audioDataUri: 'data:audio/wav;base64,' + wavBase64,
    };
  }
);

/**
 * Converts raw PCM audio data to a base64 encoded WAV string.
 * @param pcmData The raw PCM audio buffer from the TTS model.
 * @param channels Number of audio channels.
 * @param rate Sample rate of the audio.
 * @param sampleWidth Bytes per sample.
 * @returns A Promise that resolves to the base64 encoded WAV string.
 */
async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    const bufs: Buffer[] = [];
    writer.on('error', reject);
    writer.on('data', (d: Buffer) => {
      bufs.push(d);
    });
    writer.on('end', () => {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}
