import sharp from 'sharp';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';

// Technical atlas packing only: preserve source pixels and alpha. No repainting.
const dir='build/art/Stage-250',source='art/source/interceptor-strip-v2.png';
const metadata=await sharp(source).metadata();
if(metadata.width!==2170||metadata.height!==725)throw Error('Recheck anchors for a different image');
const cells=[{left:0,width:723,center:378},{left:723,width:724,center:1084.5},{left:1447,width:723,center:1790.5}];
const layers=[];
for(const cell of cells){
 const shift=Math.round(362-(cell.center-cell.left));
 const trim=Math.max(0,-shift),left=Math.max(0,shift);
 const width=Math.min(cell.width-trim,724-left);
 const input=await sharp(source).extract({left:cell.left+trim,top:0,width,height:725}).png().toBuffer();
 layers.push({input,left:layers.length*724+left,top:0});
}
await mkdir(dir,{recursive:true});
const out=dir+'/interceptor-packed-v2.png';
await sharp({create:{width:2172,height:725,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(layers).png().toFile(out);
const {data,info}=await sharp(out).raw().toBuffer({resolveWithObject:true});
let clear=0,low=0,edgeMax=0;
for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++){
 const alpha=data[(y*info.width+x)*4+3];if(alpha===0)clear++;else if(alpha<16)low++;
 if(x===0||y===0||x===info.width-1||y===info.height-1)edgeMax=Math.max(edgeMax,alpha);
}
const report={source,output:out,width:info.width,height:info.height,clear,low,edgeMax,
 sha256:createHash('sha256').update(await readFile(out)).digest('hex'),cells,
 renderSize:{width:118*1.68,height:136*1.36},
 anchors:{sourceMuzzleY:629,centerX:362,wingOffsetPixels:[188,186,191]},
 note:'Manually measured muzzle centers; packing translates cells only. Candidate, not integrated. Native pixels and combat still require review.'};
await writeFile(dir+'/interceptor-packed-v2.json',JSON.stringify(report,null,2)+'\n');
await sharp(out).resize(1152,384).png().toFile(dir+'/interceptor-runtime-v2.png');
console.log(JSON.stringify(report));
