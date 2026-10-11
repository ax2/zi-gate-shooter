import sharp from 'sharp';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';

// Read-only source inspection; no retouching or runtime export. Edge pixels
// detect unsafe exact-grid cuts, not subjective art quality or identity drift.
const reports = [];
for (const version of [1, 2]) {
  const source = `art/source/enemies-atlas-v${version}.png`;
  const bytes = await readFile(source);
  const { data, info } = await sharp(bytes).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  if (info.width % 3 || info.height % 3) throw Error(`${source}: nonintegral 3x3 grid`);
  const cw = info.width / 3, ch = info.height / 3;
  const cells = [];
  for (let frame = 0; frame < 9; frame++) {
    const left = frame % 3 * cw, top = Math.floor(frame / 3) * ch;
    const thresholds = [];
    for (const threshold of [16, 128, 240]) {
      let visible = 0, edge = 0, outsideRequestedGutter = 0;
      let minX = cw, minY = ch, maxX = -1, maxY = -1;
      for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
        if (data[((top + y) * info.width + left + x) * 4 + 3] <= threshold) continue;
        visible++;
        minX = Math.min(minX, x); maxX = Math.max(maxX, x);
        minY = Math.min(minY, y); maxY = Math.max(maxY, y);
        if (x < 2 || y < 2 || x >= cw - 2 || y >= ch - 2) edge++;
        if (x < cw * .18 || y < ch * .18 || x >= cw * .82 || y >= ch * .82) outsideRequestedGutter++;
      }
      thresholds.push({ threshold, visible, edge, outsideRequestedGutter, bounds: visible ? [minX, minY, maxX, maxY] : null });
    }
    cells.push({ frame, thresholds });
  }
  reports.push({ source, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex'),
    width: info.width, height: info.height, cell: [cw, ch], cells,
    safeExactGrid: cells.every(c => c.thresholds[0].visible > 0 && c.thresholds[0].edge === 0) });
}
const output = 'docs/stages/Stage-19/SOURCE_INSPECTION.json';
await writeFile(output, JSON.stringify({ method: 'alpha > threshold; 2px cell edge; requested 18% gutter; bounds local to cell', reports }, null, 2) + '\n');
console.log(JSON.stringify(reports.map(r => ({ source: r.source, size: [r.width, r.height], safeExactGrid: r.safeExactGrid,
  cellsWithEdgePixels: r.cells.filter(c => c.thresholds[0].edge > 0).map(c => c.frame) })), null, 2));
