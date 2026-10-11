import sharp from 'sharp';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const source = 'art/source/drone-wreck-v1.png';
const bytes = await readFile(source);
const { data, info } = await sharp(bytes).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
if (info.width !== 1254 || info.height !== 1254) throw new Error('Reinspect changed wreck source');
let count = 0, edge = 0, minX = info.width, minY = info.height, maxX = -1, maxY = -1;
for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) {
  if (data[(y * info.width + x) * 4 + 3] <= 16) continue;
  count++; minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
  if (x < 3 || y < 3 || x >= info.width - 3 || y >= info.height - 3) edge++;
}
if (!count || edge) throw new Error('Unsafe wreck margins');
await mkdir('public/assets', { recursive: true }); await mkdir('build/art', { recursive: true });
const output = await sharp(bytes).resize(256, 256).png({ compressionLevel: 9 }).toBuffer();
await writeFile('public/assets/drone-wreck-v1.png', output);
const report = { source, sourceSha256: createHash('sha256').update(bytes).digest('hex'), sourceSize: [info.width, info.height], alphaBounds: [minX,minY,maxX,maxY], visiblePixels: count, edgePixels: edge,
  outputSize: [256,256], bytes: output.length, rgbaDecodedBytes: 262144, outputSha256: createHash('sha256').update(output).digest('hex') };
await writeFile('build/art/drone-wreck-v1.json', JSON.stringify(report, null, 2) + '\n');
await sharp(bytes).flatten({ background: '#0a1119' }).resize(640,640).png().toFile('build/art/drone-wreck-dark.png');
console.log(JSON.stringify(report));
