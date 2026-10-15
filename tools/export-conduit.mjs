import sharp from 'sharp';import {readFile,writeFile,mkdir} from 'node:fs/promises';import {createHash} from 'node:crypto';
const source='art/source/conduit-v1.png',bytes=await readFile(source),meta=await sharp(bytes).metadata();
if(!meta.hasAlpha)throw Error('Conduit source must preserve generated transparency');
const output=await sharp(bytes).trim().resize(224,224,{fit:'contain',background:'#0000'}).extend({top:16,bottom:16,left:16,right:16,background:'#0000'}).png().toBuffer();
const {data,info}=await sharp(output).ensureAlpha().raw().toBuffer({resolveWithObject:true});let visible=0,edge=0;
for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]>16){visible++;if(x<3||y<3||x>=info.width-3||y>=info.height-3)edge++;}
if(!visible||edge)throw Error('Unsafe exported conduit silhouette');
await writeFile('public/assets/conduit-v1.png',output);await mkdir('build/art',{recursive:true});
await writeFile('build/art/conduit-v1.json',JSON.stringify({source,width:meta.width,height:meta.height,alpha:meta.hasAlpha,sourceSha256:createHash('sha256').update(bytes).digest('hex'),outputSha256:createHash('sha256').update(output).digest('hex'),visible,edge,exported:info},null,2));
console.log(`conduit-v1: ${info.width}x${info.height}, ${output.length} bytes, safe transparent border`);
