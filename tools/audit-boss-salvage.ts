import{World}from'../src/core/world';import{runDefaultPressure}from'../tests/helpers/default-pressure-driver';import{writeFileSync,readFileSync}from'node:fs';import assert from'node:assert/strict';
const route=(process.env.SALVAGE_ROUTE??'optical')as 'ballistic'|'electric'|'optical',events:any[]=[];
class Observe extends World{drainEffects(){const due=super.drainEffects();for(const e of due)if(e.type==='boss-salvage')events.push({time:this.time,round:this.round,hp:this.player.hp,phase:this.phase,charge:this.growth.energy,mastery:this.growth.mastery,...e});return due;}}
const result=runDefaultPressure(Observe,route,'safe',1200,'auto',0);
const before=JSON.parse(readFileSync('build/qa/Stage-249/normal-1200-plan0.json','utf8')).runs.find((r:any)=>r.after.route===route).after;
// The stored baseline is JSON: normalize omitted optional undefined properties,
// without dropping any value that can actually appear in that stored record.
for(const field of['growth','sources','chapters']as const)assert.deepEqual(JSON.parse(JSON.stringify(result[field].filter((r:any)=>r.round<=3))),before[field].filter((r:any)=>r.round<=3),'first three rounds '+field);
writeFileSync(`build/qa/Stage-251/salvage-${route}-1200.json`,JSON.stringify({method:'Normal earned inputs/rewards, omniscient operator, no World injection. Boss salvage candidate only, not heavy-hold candidate or human experience.',firstThreeRoundsSourceGrowthChapterRecordsEqual:true,route,events,result},null,2));
console.log(JSON.stringify({route,hp:result.hp,round:result.round,pickups:result.pickups,gates:result.gates,growthGap:result.maxGrowthGap,events:events.length,latest:events.slice(-4)}));
