import sharp from 'sharp';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const source='art/source/boss-strip-v2.png',bytes=await readFile(source);
const {data,info}=await sharp(bytes).ensureAlpha().raw().toBuffer({resolveWithObject:true});
if(info.width!==2172||info.height!==724)throw Error('Reinspect source dimensions.');
const tiles=[],frames=[];
// Geometric core axes 406/362/318; equal 600x600 windows align at x300.
for(let frame=0;frame<3;frame++){
 const box={left:frame*724+[106,62,18][frame],top:50,width:600,height:600};
 let visible=0,edge=0;
 for(let y=0;y<600;y++)for(let x=0;x<600;x++){
  if(data[((y+box.top)*info.width+box.left+x)*4+3]<=16)continue;
  visible++;if(x<3||y<3||x>=597||y>=597)edge++;
 }
 if(!visible||edge)throw Error(`Unsafe crop ${frame}: ${edge}`);
 tiles.push({input:await sharp(bytes).extract(box).resize(256,256,{fit:'contain',background:'#0000'}).png().toBuffer(),left:frame*256,top:0});
 frames.push({frame,source:box,visiblePixels:visible,edgePixels:edge});
}
await mkdir('public/assets',{recursive:true});
await sharp({create:{width:768,height:256,channels:4,background:'#0000'}}).composite(tiles).png({compressionLevel:9}).toFile('public/assets/boss-v1.png');
const output=await readFile('public/assets/boss-v1.png');await mkdir('build/art',{recursive:true});
await writeFile('build/art/boss-v1.json',JSON.stringify({source,sourceSize:[2172,724],sourceBytes:bytes.length,sourceSha256:createHash('sha256').update(bytes).digest('hex'),frames,outputSize:[768,256],bytes:output.length,rgbaDecodedBytes:786432,outputSha256:createHash('sha256').update(output).digest('hex')},null,2)+'\n');
console.log(`Boss strip ${output.length} bytes; RGBA decoded 786432; safe aligned source windows.`);
