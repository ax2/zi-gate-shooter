import {World} from '../src/core/world';
import {runDefaultPressure} from '../tests/helpers/default-pressure-driver';
import {writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';import{C}from'../src/core/config';import{safeRoute}from'../src/core/reachability';
const Old=(await import('../build/qa/Stage-217/baseline.mjs')).World as typeof World;
const runs=[];
for(const route of ['ballistic','electric','optical'] as const)for(const policy of ['safe','aim','hold'] as const){
 const before=runDefaultPressure(Old,route,policy,300),after=runDefaultPressure(World,route,policy,300);runs.push({before,after});
 console.log(JSON.stringify({route,policy,before:{time:before.time,hp:before.hp,chapters:before.chapters},after:{time:after.time,hp:after.hp,damage:after.damage,chapters:after.chapters}}));
}
writeFileSync('build/qa/Stage-217/pressure.json',JSON.stringify({method:'Normal earned builds, 60Hz virtual inputs; visible counts measured after step, omniscient safe operator; not human difficulty or performance',runs},null,2));
// Audit a wider-check failure rather than hiding it or treating it as a new regression.
function existingSideRoute(Runtime:typeof World){const w=new Runtime(1337,2,undefined,1);w.player.x=w.player.px=68;const hash=createHash('sha256');let path:number[]=[] ,planned=0,seen=0;
 for(let f=0;f<35*60;f++){
  if(f===0||f-planned>=60||seen!==w.dropSpawns){const route=safeRoute(w.player.x,w.bodies,w.bullets,8,{phase:w.phase,phaseTime:w.phaseTime,reaction:f===0||seen!==w.dropSpawns?.45:0});if(!route)return{failedAt:w.time,hp:w.player.hp,hash:hash.digest('hex')};path=route;planned=f;seen=w.dropSpawns;}
  w.step(C.step,path[Math.floor((f-planned)/6)]??w.player.x);hash.update(JSON.stringify(w.drainEffects()));w.bullets=w.bullets.filter(b=>b.hostile);hash.update(JSON.stringify(w));
 }return{failedAt:null,hp:w.player.hp,hash:hash.digest('hex')};
}
const previous=existingSideRoute(Old),current=existingSideRoute(World);
writeFileSync('build/qa/Stage-217/existing-side-route.json',JSON.stringify({method:'Isolated R2/P1/1337/x68 no-kill route, unchanged 450ms new-drop reaction. This is an open defect, not normal-play proof.',previous,current,identical:JSON.stringify(previous)===JSON.stringify(current)},null,2));
