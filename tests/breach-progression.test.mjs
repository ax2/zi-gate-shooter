import{it,expect}from'vitest';import{World}from'../src/core/world';import{runDefaultPressure}from'./helpers/default-pressure-driver';
const trio=r=>r.sources.filter(b=>b.round===3&&b.controlGroup===-3);
it.each(['ballistic','electric','optical'])('%s reaches a real firing breach and can shut it down through normal relay targeting',route=>{
 const auto=runDefaultPressure(World,route,'safe',300),relay=runDefaultPressure(World,route,'safe',300,'relay');
 for(const run of[auto,relay]){expect(run.time).toBeGreaterThanOrEqual(300);expect(run.hp).toBe(3);expect(run.gates).toBeGreaterThanOrEqual(13);expect(run.pickups).toBeGreaterThanOrEqual(11);expect(trio(run)).toHaveLength(3);}
 const shots=r=>trio(r).reduce((sum,b)=>sum+b.shots.length,0);
 expect(shots(auto)).toBeGreaterThanOrEqual(12);expect(shots(relay)).toBeLessThan(shots(auto));
 expect(trio(relay).every(b=>b.hp===0)).toBe(true);
 expect(trio(relay).find(b=>b.kind==='conduit').age).toBeLessThan(1);
},60000);
it('a focused earned ballistic build can break both guns without first killing their relay',()=>{
 const run=runDefaultPressure(World,'ballistic','safe',300,'guns'),group=trio(run);
 expect(run.hp).toBe(3);expect(group.filter(b=>b.kind==='armor').every(b=>b.hp===0)).toBe(true);
 expect(group.find(b=>b.kind==='conduit').hp).toBeGreaterThan(0);
 expect(group.reduce((sum,b)=>sum+b.shots.length,0)).toBeGreaterThanOrEqual(12);
},60000);
