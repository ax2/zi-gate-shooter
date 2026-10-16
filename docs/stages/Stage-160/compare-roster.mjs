import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync} from 'node:fs';
import {transformSync} from 'esbuild';
import assert from 'node:assert/strict';
function load(source){const module={exports:{}};new Function('module','exports',transformSync(source,{loader:'ts',format:'cjs',target:'es2022'}).code)(module,module.exports);return module.exports;}
const before=load(execFileSync('git',['show','b82247c:src/core/director.ts'],{encoding:'utf8'}));
const after=load(readFileSync('src/core/director.ts','utf8'));
const records=[];const counts=waves=>Object.fromEntries([...new Set(waves.map(s=>s.kind))].sort().map(kind=>[kind,waves.filter(s=>s.kind===kind).length]));
for(let round=1;round<=12;round++)for(const seed of [1,77,1337]){
 const old=before.timeline(round,seed),now=after.timeline(round,seed);
 const oldCounts=counts(old),newCounts=counts(now);assert.deepEqual(oldCounts,newCounts);
 const rewards=w=>w.filter(s=>['crate','gates','armory'].includes(s.kind));assert.deepEqual(rewards(old),rewards(now));
 if(round===1)assert.deepEqual(old,now);
 records.push({round,seed,countsUnchanged:true,rewardsUnchanged:true,firstChapterUnchanged:round===1?true:null,counts:newCounts,oldScreen:old.filter(s=>s.kind==='drone'&&s.at>=31&&s.at<37),newScreen:now.filter(s=>s.kind==='drone'&&s.at>=31&&s.at<37)});
}
writeFileSync('docs/stages/Stage-160/roster-comparison.json',JSON.stringify(records,null,2));console.log(`${records.length} actual old/new timelines: roster counts and reward windows preserved; first chapter identical`);
