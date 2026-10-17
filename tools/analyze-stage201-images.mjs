import {readFileSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import sharp from 'sharp';
const root='build/qa/Stage-201', rows=[];
for(const stage of ['healthy-hull','worn-hull','critical-hull']){
 const states={};
 for(const version of ['baseline','initial-coalesced','current']){
  const d=JSON.parse(readFileSync(`${root}/${version}-${stage}.json`));states[version]=d;
  const {data,info}=await sharp(`${root}/screenshots/${version}-${stage}.png`).removeAlpha().raw().toBuffer({resolveWithObject:true});
  const v=d.viewport,c=v.canvas,b=d.current.observedBoss[0],s=Math.min(c.width/720,c.height/1280),k=info.width/v.width;
  const x=(c.x+(c.width-720*s)/2+b.x*s)*k,y=(c.y+(c.height-1280*s)/2+b.y*s)*k,r=48*s*k;
  let white=0,total=0;
  for(let py=Math.max(0,Math.floor(y-r));py<Math.min(info.height,Math.ceil(y+r));py++)for(let px=Math.max(0,Math.floor(x-r));px<Math.min(info.width,Math.ceil(x+r));px++){const i=(py*info.width+px)*info.channels;total++;if(data[i]>=235&&data[i+1]>=235&&data[i+2]>=235)white++;}
  rows.push({stage,version,time:d.current.time,particles:d.current.particles,hotParticles:d.current.hotParticles,white,total,viewport:v});
 }
 assert.deepEqual(states.current.physical,states.baseline.physical);
 assert.deepEqual(states.current.physical,states['initial-coalesced'].physical);
}
writeFileSync(`${root}/browser-comparison.json`,JSON.stringify({physicalEqual:true,metric:'RGB channels >=235 in boss-centered logical 96x96 box; static proxy only',rows},null,2));
console.log(JSON.stringify(rows.map(({viewport,...r})=>r),null,2));
