import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
const source = 'art/source/crate-atlas-v3.png';
const { data, info } = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
if (info.width !== 1254 || info.height !== 1254) throw Error('Reinspect new source dimensions before changing packing.');
// The selected third iteration has safe 3x3 gutters. A common crop for all
// three crate states restores the intended runtime size without pivot jitter.
const frames = [], tiles = [];
for (let frame = 0; frame < 9; frame++) {
  const col = frame % 3, row = Math.floor(frame / 3);
  const box = frame < 3 ? { left: col * 418 + 80, top: 110, width: 280, height: 290 }
    : { left: col * 418, top: row * 418, width: 418, height: 418 };
  let visible = 0, transparent = 0, edge = 0;
  for (let y = 0; y < box.height; y++) for (let x = 0; x < box.width; x++) {
    const alpha = data[((box.top + y) * info.width + box.left + x) * 4 + 3];
    if (alpha > 16) { visible++; if (x < 2 || y < 2 || x >= box.width - 2 || y >= box.height - 2) edge++; }
    if (!alpha) transparent++;
  }
  if (!visible || !transparent || edge) throw Error(`Cell ${frame} empty/opaque/clipped: visible=${visible} edge=${edge}`);
  tiles.push({ input: await sharp(source).extract(box).resize(256, 256, { fit: 'contain', background: '#0000' }).png().toBuffer(), left: col * 256, top: row * 256 });
  frames.push({ frame, source: box, visiblePixels: visible, transparentPixels: transparent, edgePixels: edge });
}
await mkdir('public/assets', { recursive: true });
await sharp({ create: { width: 768, height: 768, channels: 4, background: '#0000' } }).composite(tiles).png({ compressionLevel: 9 }).toFile('public/assets/crate-v1.png');
await mkdir('build/art', { recursive: true });
await writeFile('build/art/crate-v1.json', JSON.stringify({ source, sourceSize: [1254, 1254], output: 'public/assets/crate-v1.png', outputSize: [768, 768], rgbaDecodedBytes: 2359296, frames }, null, 2));
console.log('Packed 3 crate states and 6 physical shards; 768x768, RGBA decoded 2359296 bytes.');
