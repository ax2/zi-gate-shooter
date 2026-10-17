import {it,expect} from 'vitest';import {existsSync,writeFileSync} from 'node:fs';import {execFileSync} from 'node:child_process';import {World} from '../src/core/world';import {C} from '../src/core/config';import {MID_GATE_AT} from '../src/core/director';import {runCadence} from './helpers/cadence-driver';
if(!existsSync('build/qa/Stage-196/baseline-world.mjs'))execFileSync(process.execPath,['tools/capture-stage196-baseline.mjs']);const {World:OldWorld}=await import('../build/qa/Stage-196/baseline-world.mjs');
it('retimes just one single gate and preserves all other spawns, health, reward kinds, quantities and equipment timings',()=>{
 for(const plan of [0,1,2])for(const seed of [1,1337,9001])for(let round=1;round<=18;round++){
  const w=new World(seed,round,'scatter',plan),b=new OldWorld(seed,round,'scatter',plan);const normalized=w.scheduled.map(s=>s.kind==='gates'&&s.at===MID_GATE_AT?{...s,at:49.2}:s).sort((a,b)=>a.at-b.at);expect(normalized).toEqual(b.scheduled);expect(w.scheduled.filter(s=>s.kind==='gates'&&s.at===MID_GATE_AT)).toHaveLength(1);expect(w.scheduled.some(s=>s.at===49.2)).toBe(false);for(const kind of Object.keys(C.enemies))expect(w.spawn(kind,360).maxHp).toBe(b.spawn(kind,360).maxHp);expect(w.scheduled.filter(s=>s.kind==='armory').map(s=>s.at)).toEqual([16,48]);
 }
});
it('compares full actual-growth deltas against the old build over normal three-hundred-second inputs',()=>{
 const result=[];for(const policy of ['aim','safe'])for(const seed of [1337,9001]){const before=runCadence(OldWorld,policy,seed),after=runCadence(World,policy,seed);result.push({policy,seed,before,after});}
 writeFileSync('build/qa/Stage-196/cadence-comparison.json',JSON.stringify(result,null,2));for(const r of result){expect(r.after.time).toBeCloseTo(300,5);expect(r.after.hp).toBeGreaterThan(0);expect(r.after.maxGrowthGap).toBeLessThan(r.before.maxGrowthGap);expect(r.after.mastery).toBe(r.before.mastery);expect(r.after.gates.some(g=>Math.abs(g.roundTime-MID_GATE_AT)<.05)).toBe(true);}
},120000);
