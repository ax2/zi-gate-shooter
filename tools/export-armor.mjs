import sharp from 'sharp';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const source='art/source/armor-strip-v1.png',bytes=await readFile(source);
const {data,info}=await sharp(bytes).ensureAlpha().raw().toBuffer({resolveWithObject:true});
if(info.width!==2172||info.height!==724)throw Error('Reinspect source dimensions.');
const tiles=[],frames=[];
// Source core axes 383/363/340; equal 640x724 windows align them at x320.
// Bounds after alignment: x66..574, x66..572, x66..574. No per-frame scaling.
for(let frame=0;frame<3;frame++){
 const box={left:frame*724+[63,43,20][frame],top:0,width:640,height:724};
 let visible=0,edge=0;
 for(let y=0;y<724;y++)for(let x=0;x<640;x++){
  if(data[(y*info.width+box.left+x)*4+3]<=16)continue;
  visible++;if(x<3||y<3||x>=637||y>=721)edge++;
 }
 if(!visible||edge)throw Error(`Unsafe crop ${frame}: ${edge}`);
 tiles.push({input:await sharp(bytes).extract(box).resize(256,256,{fit:'contain',background:'#0000'}).png().toBuffer(),left:frame*256,top:0});
 frames.push({frame,source:box,visiblePixels:visible,edgePixels:edge});
}
await mkdir('public/assets',{recursive:true});
await sharp({create:{width:768,height:256,channels:4,background:'#0000'}}).composite(tiles).png({compressionLevel:9}).toFile('public/assets/armor-v1.png');
const output=await readFile('public/assets/armor-v1.png');await mkdir('build/art',{recursive:true});
await writeFile('build/art/armor-v1.json',JSON.stringify({source,sourceSize:[2172,724],sourceBytes:bytes.length,sourceSha256:createHash('sha256').update(bytes).digest('hex'),frames,outputSize:[768,256],bytes:output.length,rgbaDecodedBytes:786432,outputSha256:createHash('sha256').update(output).digest('hex')},null,2)+'\n');
console.log(`Armor strip ${output.length} bytes; RGBA decoded 786432; safe aligned source windows.`);
