import{it,expect}from'vitest';import{World}from'../src/core/world';import{runDefaultPressure}from'./helpers/default-pressure-driver';
const basePath='../build/qa/Stage-219/baseline.mjs',Old=(await import(basePath)).World;
it.each(['ballistic','electric','optical']as const)('%s encounters actual opening volleys and more live pressure with normally earned weapons',route=>{
 const before=runDefaultPressure(Old,route,'safe',300),after=runDefaultPressure(World,route,'safe',300);
 expect(after.time).toBeGreaterThanOrEqual(300);expect(after.hp).toBe(3);expect(after.damage).toBe(0);expect(after.pickups).toBe(before.pickups);expect(after.gates).toBeGreaterThanOrEqual(14);
 for(const round of[2,3]){expect(after.sources.filter(s=>s.round===round)).toHaveLength(before.sources.filter(s=>s.round===round).length+(round===2?18:12));const a=after.chapters.find(s=>s.round===round)!,b=before.chapters.find(s=>s.round===round)!;expect(a.meanVisible).toBeGreaterThan(b.meanVisible);expect(a.emptyFraction).toBeLessThan(b.emptyFraction);}
 const guns=after.sources.filter(s=>s.round===2&&s.kind==='sniper'&&s.pattern==='lockshot'&&s.roundTime<3);expect(guns).toHaveLength(2);expect(guns.reduce((n,s)=>n+s.shots.length,0)).toBeGreaterThanOrEqual(2);
},60000);
