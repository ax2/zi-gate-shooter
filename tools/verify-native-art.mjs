import sharp from 'sharp';
import { readFile } from 'node:fs/promises';
const entries = JSON.parse(await readFile(process.argv[2], 'utf8'));
for (const entry of entries) {
  const [source, packaged] = await Promise.all([entry.source, entry.packaged].map(file => sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true })));
  if (source.info.width !== packaged.info.width || source.info.height !== packaged.info.height || !source.data.equals(packaged.data))
    throw new Error(`Compiled APK pixels differ: ${entry.name}`);
}
console.log(`Compiled APK native artwork verified: ${entries.length} decoded RGBA images match.`);
