import {World} from '../src/core/world';
import {runDefaultPressure} from '../tests/helpers/default-pressure-driver';
import {readFileSync,writeFileSync} from 'node:fs';
const route=(process.env.HEAVY_ROUTE??'optical')as 'ballistic'|'electric'|'optical';
const multiplier=Number(process.env.HEAVY_DURABILITY??3);
const hold=Number(process.env.HEAVY_HOLD??0);
const before=(JSON.parse(readFileSync('build/qa/Stage-249/normal-300-plan0.json','utf8')).runs as any[]).find(r=>r.after.route===route&&r.after.policy==='safe').after;
const observed:any[]=[];
class Observe extends World{spawn(...a:Parameters<World['spawn']>){const b=super.spawn(...a);observed.push(b);return b;}}
const after=runDefaultPressure(Observe,route,'safe',300,'auto',0);
const escortIds=new Set(observed.filter(b=>b.heavyReserve&&b.kind==='armor').map(b=>b.id));
const guns=(report:any,ids:Set<number>)=>report.sources.filter((s:any)=>ids.has(s.id)).map((s:any)=>({id:s.id,round:s.round,at:s.roundTime,age:s.age,hp:s.hp,maxHp:s.maxHp,shots:s.shots.length,active:s.active,pattern:s.pattern}));
const oldIds=new Set<number>(before.escorts.filter((s:any)=>s.kind==='armor').map((s:any)=>s.id));
const compact=(r:any)=>({hp:r.hp,round:r.round,time:r.time,pickups:r.pickups,gates:r.gates,damage:r.damage,chapters:r.chapters,maxGrowthGap:r.maxGrowthGap,damageEvents:r.damageEvents});
const report={route,multiplier,hold,method:'Normal earned build/rewards with an omniscient test operator. Fixed heavy-reserve non-bankshot cannon HP/initial hold candidate. Not human difficulty acceptance.',before:compact(before),after:compact(after),guns:{before:guns(before,oldIds),after:guns(after,escortIds)},rawAfter:after};
writeFileSync(`build/qa/Stage-250/heavy-durability-${multiplier}-hold${hold}-${route}.json`,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({...report,rawAfter:undefined}));
