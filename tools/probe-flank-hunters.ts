import{World}from'../src/core/world';import{runDefaultPressure}from'../tests/helpers/default-pressure-driver';import{writeFileSync}from'node:fs';
const plan=Number(process.env.HUNTER_PLAN??0)as 0|1|2,refs:any[]=[];
class Observe extends World{spawn(...args:Parameters<World['spawn']>){const b=super.spawn(...args);refs.push({b,round:this.round,at:this.roundTime});return b;}}
const run=runDefaultPressure(Observe,'electric','safe',500,'auto',plan);
const hunters=refs.filter(s=>s.b.flankReserve).map(s=>({id:s.b.id,kind:s.b.kind,pattern:s.b.pattern,round:s.round,at:s.at,hp:s.b.hp,maxHp:s.b.maxHp,active:s.b.active,shots:run.sources.find(b=>b.id===s.b.id)?.shots??[]}));
const result={plan,hp:run.hp,round:run.round,hunters};writeFileSync(`build/qa/Stage-246/normal-hunters-${plan}.json`,JSON.stringify(result,null,2));console.log(JSON.stringify({plan,hp:run.hp,count:hunters.length,emitters:hunters.filter(b=>b.shots.length).length,shots:hunters.reduce((n,b)=>n+b.shots.length,0),killed:hunters.filter(b=>b.hp===0).length}));
