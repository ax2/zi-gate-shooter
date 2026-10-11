import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';

// Technical Android density exports from the preserved original imagegen asset.
// No character repainting; alpha and the source remain intact.
const source = 'art/source/launcher-mech-v1.png';
const res = 'android/app/src/main/res';
const background = '#101B28';
const subject = await sharp(source).trim({ background: '#00000000', threshold: 8 }).png().toBuffer();
async function foreground(size, fraction) {
  const fitted = await sharp(subject).resize(Math.round(size * fraction), Math.round(size * fraction), { fit: 'inside' }).png().toBuffer();
  return sharp({ create: { width: size, height: size, channels: 4, background: '#00000000' } }).composite([{ input: fitted, gravity: 'centre' }]).png().toBuffer();
}
await mkdir('art/exports', { recursive: true });
const record = [];
for (const [density, multiplier] of [['mdpi', 1], ['hdpi', 1.5], ['xhdpi', 2], ['xxhdpi', 3], ['xxxhdpi', 4]]) {
  const folder = `${res}/mipmap-${density}`;
  await mkdir(folder, { recursive: true });
  const adaptiveSize = Math.round(108 * multiplier);
  const adaptive = await foreground(adaptiveSize, 56 / 108);
  await sharp(adaptive).toFile(`${folder}/ic_launcher_foreground.png`);
  const { data, info } = await sharp(adaptive).raw().toBuffer({ resolveWithObject: true });
  let radius = 0;
  for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) {
    if (data[(y * info.width + x) * 4 + 3] > 32)
      radius = Math.max(radius, Math.hypot(x + .5 - adaptiveSize / 2, y + .5 - adaptiveSize / 2));
  }
  if (radius / multiplier > 33) throw new Error(`Adaptive icon leaves 66dp safe circle: ${density}`);
  const legacySize = Math.round(48 * multiplier);
  const roundedTile = Buffer.from(`<svg width="${legacySize}" height="${legacySize}"><rect width="${legacySize}" height="${legacySize}" rx="${legacySize * .22}" fill="white"/></svg>`);
  const legacy = await sharp(await foreground(legacySize, .82)).flatten({ background }).ensureAlpha().composite([{ input: roundedTile, blend: 'dest-in' }]).png().toBuffer();
  await sharp(legacy).toFile(`${folder}/ic_launcher.png`);
  const circle = Buffer.from(`<svg width="${legacySize}" height="${legacySize}"><circle cx="${legacySize / 2}" cy="${legacySize / 2}" r="${legacySize / 2}" fill="white"/></svg>`);
  await sharp(legacy).ensureAlpha().composite([{ input: circle, blend: 'dest-in' }]).png().toFile(`${folder}/ic_launcher_round.png`);
  record.push({ density, legacySize, adaptiveSize, opaqueRadiusDp: +((radius / multiplier).toFixed(2)) });
}
await mkdir(`${res}/drawable-nodpi`, { recursive: true });
await sharp(await foreground(576, 160 / 288)).toFile(`${res}/drawable-nodpi/launch_mark.png`);
await sharp(await foreground(512, .82)).flatten({ background }).png().toFile('art/exports/launcher-store-v1.png');
const themedAlpha = await sharp(await foreground(432, 56 / 108)).extractChannel('alpha').png().toBuffer();
await sharp({ create: { width: 432, height: 432, channels: 3, background: '#163446' } }).joinChannel(themedAlpha).png().toFile('art/exports/launcher-themed-preview.png');
await writeFile('art/exports/launcher-export.json', JSON.stringify({ source, background, safeCircleDp: 66, candidate: true, densities: record }, null, 2));
console.log('Launcher density exports generated; all visible artwork fits the 66dp safe circle.');
