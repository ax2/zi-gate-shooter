import {World} from '../src/core/world';
import {runDefaultPressure} from '../tests/helpers/default-pressure-driver';
import {writeFileSync} from 'node:fs';
const Old=(await import('../build/qa/Stage-215/baseline.mjs')).World as typeof World;
const runs=[];
for(const route of ['ballistic','electric','optical'] as const)for(const policy of ['safe','aim','hold'] as const){
 const before=runDefaultPressure(Old,route,policy,300),after=runDefaultPressure(World,route,policy,300);runs.push({before,after});
 console.log(JSON.stringify({route,policy,before:{time:before.time,hp:before.hp,chapters:before.chapters},after:{time:after.time,hp:after.hp,damage:after.damage,chapters:after.chapters}}));
}
writeFileSync('build/qa/Stage-215/pressure.json',JSON.stringify({method:'Normal earned builds, 60Hz virtual inputs; visible counts measured after step, omniscient safe operator; not human difficulty or performance',runs},null,2));
