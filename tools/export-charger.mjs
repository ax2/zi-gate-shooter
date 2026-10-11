import sharp from 'sharp';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const source='art/source/charger-strip-v1.png', bytes=await readFile(source);
const {data,info}=await sharp(bytes).ensureAlpha().raw().toBuffer({resolveWithObject:true});
if(info.width!==2172||info.height!==724)throw Error('Reinspect source dimensions.');
const tiles=[],frames=[];
// Amber face centroids x401.1/351.6/298.8, y361.3/360.8/364.8.
// Same-size source windows align the core without per-pose scaling or retouch.
for(let frame=0;frame<3;frame++){
 const box={left:frame*724+[101,52,0][frame],top:0,width:600,height:724};
 let visible=0,edge=0;
 for(let y=0;y<box.height;y++)for(let x=0;x<box.width;x++){
  if(data[(y*info.width+box.left+x)*4+3]<=16)continue;
  visible++;if(x<3||y<3||x>=box.width-3||y>=box.height-3)edge++;
 }
 if(!visible||edge)throw Error(`Unsafe crop ${frame}: ${edge}`);
 tiles.push({input:await sharp(bytes).extract(box).resize(256,256,{fit:'contain',background:'#0000'}).png().toBuffer(),left:frame*256,top:0});
 frames.push({frame,source:box,visiblePixels:visible,edgePixels:edge});
}
await mkdir('public/assets',{recursive:true});
await sharp({create:{width:768,height:256,channels:4,background:'#0000'}}).composite(tiles).png({compressionLevel:9}).toFile('public/assets/charger-v1.png');
const output=await readFile('public/assets/charger-v1.png');await mkdir('build/art',{recursive:true});
await writeFile('build/art/charger-v1.json',JSON.stringify({source,sourceSize:[2172,724],sourceBytes:bytes.length,sourceSha256:createHash('sha256').update(bytes).digest('hex'),frames,outputSize:[768,256],bytes:output.length,rgbaDecodedBytes:786432,outputSha256:createHash('sha256').update(output).digest('hex')},null,2)+'\n');
console.log(`Charger strip ${output.length} bytes; RGBA decoded 786432; three safe aligned source windows.`);
