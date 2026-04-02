import { config } from 'dotenv';
import { mkdirSync, writeFileSync } from 'fs';
import OpenAI from 'openai';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../server/.env') });

const openai = new OpenAI({ apiKey: process.env.OPEN_AI_API_KEY });

const MASCOT_DIR = resolve(__dirname, '../web-client/public/mascot');

const BASE_PROMPT = `1950s retro airline poster illustration style, Fallout Vault-Tec aesthetic. A warm, enthusiastic airline captain character. South Asian or Pacific Islander man with a big confident smile, wearing a classic navy airline captain uniform with gold epaulets and captain's hat. Mid-century illustration style with warm cream and navy tones. Clean vector-like illustration, not photorealistic. White/cream background.`;

const poses = [
  {
    name: 'hero',
    prompt: `${BASE_PROMPT} Full figure, confident stance, pointing forward with one hand. Heroic pose.`,
  },
  {
    name: 'welcome',
    prompt: `${BASE_PROMPT} Upper body, waving warmly or tipping his captain's hat. Welcoming gesture.`,
  },
  {
    name: 'thinking',
    prompt: `${BASE_PROMPT} Upper body, hand on chin, looking thoughtfully at a document or clipboard. Contemplative.`,
  },
  {
    name: 'thumbsup',
    prompt: `${BASE_PROMPT} Upper body, giving an enthusiastic thumbs up with a big smile. Celebrating.`,
  },
  {
    name: 'concerned',
    prompt: `${BASE_PROMPT} Upper body, slight concerned expression, one hand raised in a calming gesture. Reassuring.`,
  },
  {
    name: 'clipboard',
    prompt: `${BASE_PROMPT} Upper body, holding an empty clipboard and looking expectantly at the viewer. Inviting.`,
  },
];

async function generateMascot() {
  mkdirSync(MASCOT_DIR, { recursive: true });

  for (const pose of poses) {
    console.log(`Generating: ${pose.name}...`);
    try {
      const response = await openai.images.generate({
        model: 'dall-e-3',
        prompt: pose.prompt,
        n: 1,
        size: '1024x1024',
        quality: 'hd',
      });

      const imageUrl = response.data[0]?.url;
      if (!imageUrl) {
        console.error(`No URL returned for ${pose.name}`);
        continue;
      }

      const imageResponse = await fetch(imageUrl);
      const buffer = Buffer.from(await imageResponse.arrayBuffer());
      const filePath = resolve(MASCOT_DIR, `captain-${pose.name}.png`);
      writeFileSync(filePath, buffer);
      console.log(`Saved: ${filePath}`);
    } catch (err) {
      console.error(`Failed to generate ${pose.name}:`, err);
    }
  }

  console.log('Mascot generation complete!');
}

generateMascot();
