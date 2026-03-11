import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

const LOGO = path.join(__dirname, '..', 'public', 'logo.svg');
const OUTPUT = path.join(__dirname, '..', 'public');
const BRAND_BLUE = '#2563eb';

async function generate() {
  const svg = fs.readFileSync(LOGO);

  // Standard icons
  for (const size of [192, 512]) {
    await sharp(svg).resize(size, size).png().toFile(path.join(OUTPUT, `icon-${size}.png`));
    console.log(`Generated icon-${size}.png`);
  }

  // Maskable icons (20% padding on brand color background)
  for (const size of [192, 512]) {
    const padding = Math.floor(size * 0.2);
    const innerSize = size - padding * 2;
    const resized = await sharp(svg).resize(innerSize, innerSize).png().toBuffer();

    await sharp({
      create: { width: size, height: size, channels: 4, background: BRAND_BLUE },
    })
      .composite([{ input: resized, gravity: 'centre' }])
      .png()
      .toFile(path.join(OUTPUT, `icon-maskable-${size}.png`));
    console.log(`Generated icon-maskable-${size}.png`);
  }
}

generate().catch(console.error);
