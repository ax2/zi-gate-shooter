import sharp from 'sharp';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const source='art/source/arc-player-v1.png', bytes=await readFile(source);
const metadata=await sharp(bytes).metadata();
if(metadata.width!==2172||metadata.height!==724||!metadata.hasAlpha) throw Error('Reinspect flanker source');
const frames=[], tiles=[];
for(let frame=0;frame<3;frame++){
  const box={left:frame*724+[58,0,-58][frame],top:0,width:724,height:724};
  const {data}=await sharp(bytes).extract(box).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  let edge=0, visible=0;
  for(let y=0;y<724;y++)for(let x=0;x<724;x++)if(data[(y*724+x)*4+3]>16){visible++;if(x<3||y<3||x>=721||y>=721)edge++;}
  if(!visible||edge)throw Error(`Unsafe flanker frame ${frame}`);
  // Whole cells preserve wings and the consistent central reactor axis.
  tiles.push({input:await sharp(bytes).extract(box).resize(256,256).png().toBuffer(),left:frame*256,top:0});
  frames.push({frame,box,visible,edge});
}
const output=await sharp({create:{width:768,height:256,channels:4,background:'#0000'}}).composite(tiles).png().toBuffer();
await writeFile('public/assets/arc-player-v1.png',output);
await mkdir('build/art',{recursive:true});
await writeFile('build/art/arc-player-v1.json',JSON.stringify({source,frames,bytes:output.length,sha256:createHash('sha256').update(output).digest('hex')},null,2));
console.log(`Arc player: ${output.length} bytes, all three frames have safe edges.`);

