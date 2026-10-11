import sharp from 'sharp';
import { mkdir, copyFile } from 'node:fs/promises';
import path from 'node:path';
const root = process.cwd();
await mkdir(path.join(root, 'art/source'), { recursive: true });
for (const name of ['units', 'props', 'runway']) {
  const original = path.join(root, 'art/source', name + '.png');
  try { await copyFile(path.join(root, 'public/assets', name + '.png'), original, 1); } catch (e) { if (e.code !== 'EEXIST') throw e; }
  if (name === 'runway') await sharp(original).resize({ width: 720 }).jpeg({ quality: 86, mozjpeg: true }).toFile(path.join(root, 'public/assets/runway.jpg'));
  else await sharp(original).resize(768, 512).png({ compressionLevel: 9, palette: true, colours: 256, effort: 10 }).toFile(path.join(root, 'public/assets', name + '.png'));
}
console.log('Exported optimized textures; original sources retained in art/source.');
