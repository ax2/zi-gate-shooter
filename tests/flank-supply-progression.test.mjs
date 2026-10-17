import{it,expect}from'vitest';import{World}from'../src/core/world';import{runDefaultPressure}from'./helpers/default-pressure-driver';
const Old=(await import('../build/qa/Stage-218/baseline.mjs')).World;
it.each(['ballistic','electric','optical'])('%s retains earned growth and the full second-chapter roster during the earlier interception',route=>{
 const before=runDefaultPressure(Old,route,'safe',300),after=runDefaultPressure(World,route,'safe',300);
 expect(after.time).toBeGreaterThanOrEqual(300);expect(after.hp).toBe(3);expect(after.damage).toBe(0);expect(after.gates).toBe(before.gates);expect(after.pickups).toBe(before.pickups);
 expect(after.sources.filter(b=>b.round===2)).toHaveLength(before.sources.filter(b=>b.round===2).length);
 const chargers=after.sources.filter(b=>b.round===2&&b.kind==='charger'&&b.pattern==='flank'&&[280,440].includes(b.lane));
 expect(chargers).toHaveLength(3);expect(Math.min(...chargers.map(b=>b.roundTime))).toBeLessThan(49);
 if(route!=='optical')expect(chargers.some(b=>b.age>=2.6&&Math.abs(b.x-(b.lane===280?150:570))>1)).toBe(true);
},60000);
