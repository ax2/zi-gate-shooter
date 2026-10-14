import sharp from 'sharp';
import {readFile, mkdir, writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const source='art/source/scatter-player-v1.png', bytes=await readFile(source);
const {data,info}=await sharp(bytes).ensureAlpha().raw().toBuffer({resolveWithObject:true});
if(info.width!==1536||info.height!==1024)throw Error('Reinspect scatter source dimensions');
const tiles=[];
for(let frame=0;frame<3;frame++){
 const box={left:frame*512,top:64,width:512,height:896};
 let edge=0;
 for(let y=0;y<box.height;y++)for(let x=0;x<box.width;x++){
  if((x<3||x>=509||y<3||y>=893)&&data[((y+64)*info.width+box.left+x)*4+3]>16)edge++;
 }
 if(edge)throw Error(`Scatter frame ${frame} has ${edge} visible edge pixels`);
 tiles.push({input:await sharp(bytes).extract(box).resize(192,256,{fit:'contain',background:'#0000'}).png().toBuffer(),left:frame*192,top:0});
}
await sharp({create:{width:576,height:256,channels:4,background:'#0000'}}).composite(tiles).png({compressionLevel:9}).toFile('public/assets/scatter-player-v1.png');
const out=await readFile('public/assets/scatter-player-v1.png');
await mkdir('build/art',{recursive:true});
await writeFile('build/art/scatter-player-v1.json',JSON.stringify({source,sourceSha256:createHash('sha256').update(bytes).digest('hex'),frameSize:[192,256],frames:3,bytes:out.length,rgbaDecodedBytes:576*256*4,outputSha256:createHash('sha256').update(out).digest('hex')},null,2));
console.log(`Scatter player atlas: ${out.length} bytes, 589824 decoded RGBA bytes`);
