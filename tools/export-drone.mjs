import sharp from 'sharp';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const source = 'art/source/drone-strip-v1.png';
const bytes = await readFile(source);
const { data, info } = await sharp(bytes).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
if (info.width !== 2172 || info.height !== 724) throw Error('Reinspect new source dimensions.');
const tiles = [], frames = [];
// Nose center measured at source y550/y580: 358, 362.5, 368.5.
// Equal-size crops align the nose, without per-frame trimming or rescaling.
for (let frame = 0; frame < 3; frame++) {
  const box = { left: frame * 724 + [8, 12, 18][frame], top: 0, width: 700, height: 724 };
  let visible = 0, edge = 0;
  for (let y = 0; y < box.height; y++) for (let x = 0; x < box.width; x++) {
    if (data[((box.top + y) * info.width + box.left + x) * 4 + 3] <= 16) continue;
    visible++;
    if (x < 3 || y < 3 || x >= box.width - 3 || y >= box.height - 3) edge++;
  }
  if (!visible || edge) throw Error(`Frame ${frame}: unsafe common crop ${edge}`);
  tiles.push({ input: await sharp(bytes).extract(box).resize(256,256,{fit:'contain',background:'#0000'}).png().toBuffer(), left:frame*256, top:0 });
  frames.push({frame,source:box,visiblePixels:visible,edgePixels:edge});
}
await mkdir('public/assets',{recursive:true});
await sharp({create:{width:768,height:256,channels:4,background:'#0000'}}).composite(tiles).png({compressionLevel:9}).toFile('public/assets/drone-v1.png');
await mkdir('build/art',{recursive:true});
const output = await readFile('public/assets/drone-v1.png');
await writeFile('build/art/drone-v1.json',JSON.stringify({source,sourceSha256:createHash('sha256').update(bytes).digest('hex'),sourceSize:[2172,724],frames,outputSize:[768,256],bytes:output.length,rgbaDecodedBytes:786432,outputSha256:createHash('sha256').update(output).digest('hex')},null,2)+'\n');
console.log(`Drone strip: ${output.length} bytes; RGBA decoded 786432 bytes; three safe aligned crops.`);
