import sharp from 'sharp';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const results=[];
for(const version of ['v1','v2']){
 const source=`art/source/boss-strip-${version}.png`,bytes=await readFile(source);
 const {data,info}=await sharp(bytes).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 if(info.width!==2172||info.height!==724)throw Error('Reinspect layout');
 const frames=[];
 for(let f=0;f<3;f++){
  const bounds=[724,724,-1,-1],core=[];let edge=0;
  for(let y=0;y<724;y++)for(let x=0;x<724;x++){
   const p=(y*info.width+f*724+x)*4;
   if(data[p+3]>16){bounds[0]=Math.min(bounds[0],x);bounds[1]=Math.min(bounds[1],y);bounds[2]=Math.max(bounds[2],x);bounds[3]=Math.max(bounds[3],y);if(x<3||y<3||x>720||y>720)edge++;}
   if(x>200&&x<500&&y>290&&y<390&&data[p]>180&&data[p]>data[p+1]*1.4&&data[p]>data[p+2]*1.5&&data[p+3]>240)core.push([x,y]);
  }
  frames.push({frame:f,bounds,edge,colorSamplePixels:core.length,colorSampleCenter:core.length?core.reduce((s,p)=>[s[0]+p[0]/core.length,s[1]+p[1]/core.length],[0,0]):null});
 }
 results.push({version,source,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex'),size:[info.width,info.height],frames});
}
await writeFile('docs/stages/Stage-24/SOURCE_INSPECTION.json',JSON.stringify(results,null,2)+'\n');console.log(JSON.stringify(results,null,2));
