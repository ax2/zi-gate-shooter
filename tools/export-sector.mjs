import sharp from 'sharp';
import { stat } from 'node:fs/promises';

for (const name of ['cooling-corridor-v1', 'armored-corridor-v1']) {
  const output = `public/assets/${name}.jpg`;
  await sharp(`art/source/${name}.png`).resize({ width: 720 }).jpeg({ quality: 84, mozjpeg: true }).toFile(output);
  console.log(`${output}: ${(await stat(output)).size} bytes`);
}
