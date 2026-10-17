import {it,expect} from 'vitest';
import {World} from '../src/core/world';
import {runDefaultPressure} from './helpers/default-pressure-driver';
const Old=(await import('../build/qa/Stage-215/baseline.mjs')).World;
it.each(['ballistic','electric','optical'])('%s earns its normal build through all three denser chapters with less empty battlefield time',route=>{
 const before=runDefaultPressure(Old,route,'safe',300),after=runDefaultPressure(World,route,'safe',300);
 expect(after.time).toBeGreaterThanOrEqual(300);expect(after.round).toBeGreaterThanOrEqual(4);expect(after.hp).toBe(3);
 for(let round=1;round<=3;round++){
  const a=before.chapters.find(r=>r.round===round),b=after.chapters.find(r=>r.round===round);
  expect(b.seconds).toBeGreaterThanOrEqual(72);
  expect(b.meanVisible).toBeGreaterThan(a.meanVisible*1.15);
 }
 // Stronger earned chains can clear a later chapter faster. Require less empty
 // time over the full three-chapter loop, not a forced nerf of each build.
 const empty=r=>r.chapters.slice(0,3).reduce((sum,c)=>sum+c.emptyFraction,0)/3;
 expect(empty(after)).toBeLessThan(empty(before)-.03);
 expect(after.pickups).toBeGreaterThanOrEqual(10);expect(after.gates).toBeGreaterThanOrEqual(13);
 expect(after.maxGrowthGap).toBeLessThan(22);expect(after.peakBodies).toBeLessThanOrEqual(32);
},60000);
