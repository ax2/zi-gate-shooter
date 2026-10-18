import {World} from '../src/core/world';import {runDefaultPressure} from '../tests/helpers/default-pressure-driver';import {writeFileSync} from 'node:fs';
const path='./baseline.mjs',Old=(await import(path)).World;
const seconds=Number(process.env.ESCORT_SECONDS??300),plan=Number(process.env.ESCORT_PLAN??0)as 0|1|2,runs=[];
for(const route of ['ballistic','electric','optical']as const)for(const policy of(seconds>300?['safe']:['safe','safe-then-aim'])as ('safe'|'safe-then-aim')[]){
 const pair:any={};for(const [name,Runtime]of [['before',Old],['after',World]]as const){
  const bodies:any[]=[];class Observe extends Runtime{spawn(...a:Parameters<World['spawn']>){const b=super.spawn(...a);bodies.push({id:b.id,round:this.round,time:this.roundTime,body:b});return b;}}
  const r=runDefaultPressure(Observe as typeof World,route,policy,seconds,'auto',plan);
  pair[name]={...r,escorts:bodies.filter(b=>b.body.heavyReserve).map(b=>({id:b.id,round:b.round,at:b.time,kind:b.body.kind,pattern:b.body.pattern,hp:b.body.hp,maxHp:b.body.maxHp,shots:r.sources.find(s=>s.id===b.id)?.shots.length??0,seen:r.sources.some(s=>s.id===b.id)}))};
 }
 runs.push(pair);console.log(JSON.stringify({route,policy,before:{hp:pair.before.hp,round:pair.before.round,pickups:pair.before.pickups,gates:pair.before.gates},after:{hp:pair.after.hp,round:pair.after.round,pickups:pair.after.pickups,gates:pair.after.gates,escorts:pair.after.escorts.length},heavy:pair.after.chapters.filter((c:any)=>c.round%3===0).map((c:any)=>({round:c.round,mean:c.meanVisible,empty:c.longestEmpty}))}));
}
writeFileSync(`build/qa/Stage-249/normal-${seconds}-plan${plan}.json`,JSON.stringify({seconds,plan,method:'Normal earned builds/rewards, identical input policies but state-dependent movement. Safe uses an omniscient test operator; safe-then-aim ignores danger after chapter1. Actual contacts and shots are measured, not human difficulty or performance.',runs},null,2));
