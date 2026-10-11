import sharp from 'sharp';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const results=[];
for(const version of ['v1','v2']){
 const source=`art/source/elite-strip-${version}.png`,bytes=await readFile(source);
 const {data,info}=await sharp(bytes).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 if(info.width!==2172||info.height!==724)throw Error('Reinspect exact layout');
 const frames=[];
 for(let f=0;f<3;f++){
  const bounds=[724,724,-1,-1],counts={a16:0,a128:0,a240:0};let edge=0;
  const redCore=[];
  for(let y=0;y<724;y++)for(let x=0;x<724;x++){
   const p=(y*info.width+f*724+x)*4,[r,g,b,a]=data.subarray(p,p+4);
   if(a>16){bounds[0]=Math.min(bounds[0],x);bounds[1]=Math.min(bounds[1],y);bounds[2]=Math.max(bounds[2],x);bounds[3]=Math.max(bounds[3],y);if(x<3||y<3||x>720||y>720)edge++;}
   if(r>220&&g<65&&b<65){
    if(y>260&&y<350&&x>240&&x<480&&a>240)redCore.push([x,y]);
    // Exterior band excludes the reactor rectangle, not an assertion of ownership.
    if(!(y>260&&y<350&&x>240&&x<480)){if(a>16)counts.a16++;if(a>128)counts.a128++;if(a>240)counts.a240++;}
   }
  }
  frames.push({frame:f,bounds,edge,exteriorRed:counts,reactorPixels:redCore.length,reactorCenter:redCore.reduce((s,p)=>[s[0]+p[0]/redCore.length,s[1]+p[1]/redCore.length],[0,0])});
 }
 results.push({version,source,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex'),size:[info.width,info.height],frames});
}
await mkdir('docs/stages/Stage-23',{recursive:true});await writeFile('docs/stages/Stage-23/SOURCE_INSPECTION.json',JSON.stringify(results,null,2)+'\n');console.log(JSON.stringify(results,null,2));
