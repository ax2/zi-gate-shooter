import sharp from 'sharp';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const source='art/source/mounted-modules-v1.png';
const bytes=await readFile(source),meta=await sharp(bytes).metadata();
if(meta.width!==1536||meta.height!==1024||!meta.hasAlpha)throw Error('Reinspect module atlas dimensions and alpha');
const frames=[],tiles=[];
for(let i=0;i<6;i++){
 const box={left:(i%3)*512,top:Math.floor(i/3)*512,width:512,height:512};
 const {data}=await sharp(bytes).extract(box).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 let visible=0,edge=0;
 for(let y=0;y<512;y++)for(let x=0;x<512;x++)if(data[(y*512+x)*4+3]>16){visible++;if(x<3||y<3||x>=509||y>=509)edge++;}
 if(!visible||edge)throw Error(`Unsafe atlas cell ${i}: ${edge} edge pixels`);
 frames.push({frame:i,box,visible,edge});
 tiles.push({input:await sharp(bytes).extract(box).resize(256,256).png().toBuffer(),left:(i%3)*256,top:Math.floor(i/3)*256});
}
const output=await sharp({create:{width:768,height:512,channels:4,background:'#0000'}}).composite(tiles).png().toBuffer();
await writeFile('public/assets/mounted-modules-v1.png',output);
await mkdir('build/art',{recursive:true});
await writeFile('build/art/mounted-modules-v1.json',JSON.stringify({source,frames,bytes:output.length,sha256:createHash('sha256').update(output).digest('hex')},null,2));
console.log(`Module atlas ${output.length} bytes; six cells with transparent safe edges.`);
