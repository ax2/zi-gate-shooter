import {it,expect} from 'vitest';
import {World} from '../src/core/world';
import {progressionTarget} from './helpers/progression-driver';
import {writeFileSync,mkdirSync} from 'node:fs';
it('measures actual opening contract combat without state boosting',()=>{
 const records=[];
 for(const seed of [1337,1,77]){
  const w=new World(seed);w.acceptContract('precision');let target=360;
  for(let frame=0;frame<31*60&&w.phase!=='dead';frame++){
   if(frame%6===0)target=progressionTarget(w);
   w.step(1/60,target);w.drainEffects();
  }
  records.push({seed,time:w.time,hp:w.player.hp,kills:w.kills,contract:w.contract,peakBodies:w.peakBodies});
  expect(w.contract.status).not.toBe('active');
 }
 const directory=`build/qa/runs/${new Date().toISOString().replace(/[:.]/g,'-')}-contracts`;
 mkdirSync(directory,{recursive:true});
 writeFileSync(`${directory}/contracts.json`,JSON.stringify(records,null,2));
 expect(records.some(r=>r.contract?.status==='won')).toBe(true);
});

