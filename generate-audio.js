import fs from 'fs';
import textToSpeech from '@google-cloud/text-to-speech';

const client = new textToSpeech.TextToSpeechClient();

const words = [
  "bine",
  "salut",
  "mulțumesc"
];

const outputDir = "./audio/romanian/week1/day1";
fs.mkdirSync(outputDir, { recursive: true });

for (const text of words) {
  const request = {
    input: { text },
    voice: { languageCode: "ro-RO", ssmlGender: "FEMALE" },
    audioConfig: { audioEncoding: "MP3" },
  };

  const [response] = await client.synthesizeSpeech(request);

  const filePath = `${outputDir}/${text}.mp3`;
  fs.writeFileSync(filePath, response.audioContent);

  console.log("Generated:", filePath);
}
