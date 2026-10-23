import sharp from 'sharp';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const source='art/source/flight-materials-v1.png',bytes=await readFile(source),meta=await sharp(bytes).metadata();
if(meta.width!==2172||meta.height!==724||!meta.hasAlpha)throw Error('Reinspect material atlas dimensions and alpha');
const frames=[],tiles=[];
for(const[i,part]of ['alloy','coil','lens'].entries()){
 const box={left:i*724,top:0,width:724,height:724};
 const {data}=await sharp(bytes).extract(box).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 let visible=0,edge=0;
 for(let y=0;y<724;y++)for(let x=0;x<724;x++)if(data[(y*724+x)*4+3]>16){visible++;if(x<3||y<3||x>=721||y>=721)edge++;}
 if(!visible||edge)throw Error(`Unsafe material cell ${part}: ${edge} edge pixels`);
 frames.push({part,frame:i,box,visible,edge});
 tiles.push({input:await sharp(bytes).extract(box).resize(224,224).png().toBuffer(),left:i*256+16,top:16});
}
const output=await sharp({create:{width:768,height:256,channels:4,background:'#0000'}}).composite(tiles).png().toBuffer();
await writeFile('public/assets/flight-materials-v1.png',output);
await mkdir('build/art',{recursive:true});
await writeFile('build/art/flight-materials-v1.json',JSON.stringify({source,sourceSha256:createHash('sha256').update(bytes).digest('hex'),frames,bytes:output.length,sha256:createHash('sha256').update(output).digest('hex')},null,2));
console.log(`Material atlas ${output.length} bytes; three readable parts with transparent safe edges.`);
