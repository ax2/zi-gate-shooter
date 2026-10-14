import sharp from 'sharp';
import {readFile, mkdir, writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const source='art/source/pierce-player-v2.png', bytes=await readFile(source);
const {data,info}=await sharp(bytes).ensureAlpha().raw().toBuffer({resolveWithObject:true});
if(info.width!==1836||info.height!==856)throw Error('Reinspect pierce source dimensions');
const tiles=[];
for(let frame=0;frame<3;frame++){
 const box={left:[12,612,1212][frame],top:0,width:612,height:856};
 let edge=0;
 for(let y=0;y<box.height;y++)for(let x=0;x<box.width;x++){
  if((x<3||x>=609||y<3||y>=853)&&data[(y*info.width+box.left+x)*4+3]>16)edge++;
 }
 if(edge)throw Error(`Pierce frame ${frame} has ${edge} visible edge pixels`);
 tiles.push({input:await sharp(bytes).extract(box).resize(192,256,{fit:'contain',background:'#0000'}).png().toBuffer(),left:frame*192,top:0});
}
await sharp({create:{width:576,height:256,channels:4,background:'#0000'}}).composite(tiles).png({compressionLevel:9}).toFile('public/assets/pierce-player-v2.png');
const out=await readFile('public/assets/pierce-player-v2.png');
await mkdir('build/art',{recursive:true});
await writeFile('build/art/pierce-player-v2.json',JSON.stringify({source,sourceSha256:createHash('sha256').update(bytes).digest('hex'),frameSize:[192,256],frames:3,bytes:out.length,rgbaDecodedBytes:576*256*4,outputSha256:createHash('sha256').update(out).digest('hex')},null,2));
console.log(`Pierce player atlas: ${out.length} bytes, 589824 decoded RGBA bytes`);

