import sharp from 'sharp';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const source='art/source/flight-player-v1.png',output='public/assets/flight-player-v1.png';
const bytes=await readFile(source),meta=await sharp(bytes).metadata();
if(!meta.hasAlpha||meta.width!==1254||meta.height!==1254)throw Error('Reinspect flight source before exporting.');
await sharp(bytes).resize(512,512).png().toFile(output);await mkdir('build/art',{recursive:true});
const out=await readFile(output);await writeFile('build/art/flight-player-v1.json',JSON.stringify({source,output,sourceSha256:createHash('sha256').update(bytes).digest('hex'),sha256:createHash('sha256').update(out).digest('hex'),size:[512,512],alpha:true,bytes:out.length,origin:'Original built-in imagegen generation, Stage274; candidate art, not user final sign-off'},null,2));
console.log('Flight player exported:',out.length,'bytes');
