import {World} from '../src/core/world';
import {runDefaultPressure} from '../tests/helpers/default-pressure-driver';
import {writeFileSync} from 'node:fs';
const Old=(await import('../build/qa/Stage-216/baseline.mjs')).World as typeof World;
const runs=[];
for(const route of ['ballistic','electric','optical'] as const){
 const before=runDefaultPressure(Old,route,'safe',300);
 for(const engagement of ['auto','relay','guns'] as const){
  const after=runDefaultPressure(World,route,'safe',300,engagement);runs.push({route,engagement,before,after});
  console.log(JSON.stringify({route,engagement,time:after.time,hp:after.hp,gates:after.gates,pickups:after.pickups,group:after.sources.filter(b=>b.round===3&&b.controlGroup===-3).map(b=>({kind:b.kind,hp:b.hp,age:b.age,shots:b.shots.length}))}));
 }
}
writeFileSync('build/qa/Stage-216/pressure.json',JSON.stringify({method:'Normal 60Hz inputs and earned builds. Focus strategies only change movement to observed targets; no world injection. Not human/device performance.',runs},null,2));
