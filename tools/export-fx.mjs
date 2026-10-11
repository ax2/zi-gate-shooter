import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';

// Technical atlas packing only: retain the generated source and its alpha channel.
const source = 'art/source/explosion-atlas-v1.png';
const { data, info } = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
if (info.width !== info.height || info.channels !== 4) throw new Error('Expected a square RGBA source atlas.');
const tiles = [], frames = [];
for (let frame = 0; frame < 9; frame++) {
  const column = frame % 3, row = Math.floor(frame / 3);
  const left = Math.round(column * info.width / 3), top = Math.round(row * info.height / 3);
  const width = Math.round((column + 1) * info.width / 3) - left;
  const height = Math.round((row + 1) * info.height / 3) - top;
  let visible = 0, transparent = 0, edge = 0;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const alpha = data[((top + y) * info.width + left + x) * 4 + 3];
    if (alpha > 16) { visible++; if (x < 3 || y < 3 || x >= width - 3 || y >= height - 3) edge++; }
    if (alpha === 0) transparent++;
  }
  if (!visible || !transparent || edge) throw new Error(`Frame ${frame} is empty, opaque-backed or touches its cell edge.`);
  frames.push({ frame, source: { left, top, width, height }, visiblePixels: visible, transparentPixels: transparent, edgePixels: edge });
  tiles.push({ input: await sharp(source).extract({ left, top, width, height }).resize(256, 256, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer(), left: column * 256, top: row * 256 });
}
await mkdir('public/assets', { recursive: true });
await sharp({ create: { width: 768, height: 768, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).composite(tiles).png({ compressionLevel: 9, palette: true, colours: 256, effort: 10 }).toFile('public/assets/explosion-v1.png');
await mkdir('build/art', { recursive: true });
await writeFile('build/art/explosion-v1.json', JSON.stringify({ source, sourceSize: [info.width, info.height], output: 'public/assets/explosion-v1.png', outputSize: [768, 768], rgbaDecodedBytes: 768 * 768 * 4, frames }, null, 2));
console.log('Exported 9 alpha-safe frames, 768x768; decoded RGBA 2359296 bytes.');
