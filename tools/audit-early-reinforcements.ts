import {World} from '../src/core/world';
import {runDefaultPressure} from '../tests/helpers/default-pressure-driver';
import {observedNoFireRoute} from '../tests/helpers/observed-route-driver';
import {writeFileSync} from 'node:fs';
const path='./baseline.mjs',Old=(await import(path)).World;
const mode=process.env.ROTATION_MODE??'normal',seconds=Number(process.env.ROTATION_SECONDS??300);
if(mode==='routes'){
 const routes=[];for(const r of [1,2,3,4,5,6,7,8,9,12])for(const plan of [0,1,2] as const)for(const x of [68,360,652]){
  const a=observedNoFireRoute(r,plan,x,r%2?1337:9001);routes.push(a);if(a.failureTime!==null||a.hp!==3||a.phase!=='boss-entry')console.log(JSON.stringify(a));
 }
 writeFileSync('build/qa/Stage-233/routes.json',JSON.stringify(routes,null,2));console.log(JSON.stringify({routes:routes.length,failed:routes.filter(a=>a.failureTime!==null||a.hp!==3||a.phase!=='boss-entry').length}));
}else{
 const runs=[];for(const route of ['ballistic','electric','optical'] as const)for(const policy of (seconds>300?['safe']:['safe','safe-then-aim']) as ('safe'|'safe-then-aim')[]){
  const before=runDefaultPressure(Old,route,policy,seconds),after=runDefaultPressure(World,route,policy,seconds);runs.push({before,after});
  console.log(JSON.stringify({route,policy,before:{hp:before.hp,time:before.time,round:before.round},after:{hp:after.hp,time:after.time,round:after.round,damage:after.damage},density:after.chapters.slice(0,3).map((c,i)=>({round:c.round,before:before.chapters[i]?.meanVisible,after:c.meanVisible,emptyBefore:before.chapters[i]?.emptyFraction,emptyAfter:c.emptyFraction}))}));
 }
 writeFileSync('build/qa/Stage-233/normal-'+seconds+'.json',JSON.stringify({seconds,seed:1337,method:'Normally earned progression and actual contacts; same input policy but state-dependent inputs. Safe is omniscient zero-reaction. Safe-then-aim earns the same first chapter then ignores dangers when aiming at targets from chapter two. Virtual60Hz, not human or device performance.',runs},null,2));
}
