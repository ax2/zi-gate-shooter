import sharp from 'sharp';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const source='art/source/gate-frame-v1.png',bytes=await readFile(source),meta=await sharp(bytes).metadata();
if(meta.width!==1659||meta.height!==948||!meta.hasAlpha)throw Error('Reinspect new gate source before export');
const {data,info}=await sharp(bytes).ensureAlpha().raw().toBuffer({resolveWithObject:true});
let minX=info.width,minY=info.height,maxX=0,maxY=0,visible=0,centerOpaque=0,centerPixels=0;
for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++){const a=data[(y*info.width+x)*4+3];if(a>1){visible++;minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);}if(x>info.width*.22&&x<info.width*.78&&y>info.height*.24&&y<info.height*.76){centerPixels++;if(a>1)centerOpaque++;}}
if(centerOpaque||!visible||minX<8||minY<8||maxX>=info.width-8||maxY>=info.height-8)throw Error('Gate center/background/padding failed');
const box={left:minX-8,top:minY-8,width:maxX-minX+17,height:maxY-minY+17};
const output=await sharp(bytes).extract(box).resize({width:640}).png({compressionLevel:9}).toBuffer();
const outMeta=await sharp(output).metadata();await writeFile('public/assets/gate-frame-v1.png',output);await mkdir('build/art',{recursive:true});
const record={source,sourceSize:[meta.width,meta.height],sourceSHA256:createHash('sha256').update(bytes).digest('hex'),box,centerOpaque,centerPixels,visible,output:'public/assets/gate-frame-v1.png',outputSize:[outMeta.width,outMeta.height],outputBytes:output.length,rgbaDecodedBytes:outMeta.width*outMeta.height*4,outputSHA256:createHash('sha256').update(output).digest('hex')};await writeFile('build/art/gate-frame-v1.json',JSON.stringify(record,null,2));console.log(record);
