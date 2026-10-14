import sharp from 'sharp';
import { stat } from 'node:fs/promises';

const output = 'public/assets/cooling-corridor-v1.jpg';
await sharp('art/source/cooling-corridor-v1.png').resize({ width: 720 }).jpeg({ quality: 84, mozjpeg: true }).toFile(output);
console.log(`${output}: ${(await stat(output)).size} bytes`);
