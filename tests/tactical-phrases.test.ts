import {it,expect} from 'vitest';import {World} from '../src/core/world';import {C} from '../src/core/config';import {timeline,SWARM} from '../src/core/director';
it('authors two finite, differently shaped chapter phrases while preserving the first chapter and original rewards',()=>{
 expect(timeline(1,1337).some(s=>s.dropY!==undefined)).toBe(false);
 for(const [round,count,first] of [[2,7,'sniper'],[3,6,'armor'],[4,7,'guard']] as const){
  for(const seed of [1,77,1337]){const list=timeline(round,seed),phrases=list.filter(s=>s.drop&&[44.5,55.5].includes(s.at));
   expect(phrases).toHaveLength(count);expect(phrases[0].kind).toBe(first);expect(phrases.filter(s=>s.dropLabel)).toHaveLength(2);
   expect(phrases.every(s=>s.drop&&s.x>=180&&s.x<=540&&s.dropY!>=320&&s.dropY!<=440&&[44.5,55.5].includes(s.at))).toBe(true);
   expect(list.filter(s=>s.kind==='armory')).toHaveLength(2);expect(list.filter(s=>s.kind==='gates')).toHaveLength(4);
  }
 }
});
it('moves a finite existing opening and tail roster into visible protected entry, without altering reward windows',()=>{
 for(const [round,count] of [[2,16],[3,13],[4,22]] as const){const list=timeline(round,1337),bridge=list.filter(s=>s.drop&&(s.at<=13||s.at>=60));
  expect(bridge).toHaveLength(count);expect(bridge.every(s=>s.dropY===SWARM.arrivalY)).toBe(true);
  expect(list.filter(s=>['crate','gates','armory'].includes(s.kind)).every(s=>!s.drop)).toBe(true);
 }
});
it('uses real chapter health, local protection and a single announcement after actual admission',()=>{
 for(const round of [2,3,4]){
  const w=new World(1337,round);Object.assign(w,{scheduled:timeline(round,1337).filter(s=>s.dropY!==undefined&&s.at===44.5)});w.roundTime=44.49;
  w.step(C.step,68);const bodies=w.bodies.filter(b=>b.active&&b.kind in C.enemies),first=bodies[0];
  expect(bodies.length).toBeGreaterThan(0);expect(bodies.every(b=>b.y>=320&&b.y<445&&b.dropGrace!>0&&b.dropGrace!<=SWARM.grace)).toBe(true);
  const control=new World(1337,round).spawn(first.kind,first.x,first.y);expect(first.maxHp).toBe(control.maxHp);
  const events=w.drainEffects();expect(events.filter(e=>e.type==='drop-wave')).toHaveLength(1);
  for(let i=0;i<5;i++)w.step(C.step,68);expect(w.drainEffects().some(e=>e.type==='drop-wave')).toBe(false);expect(w.kills).toBe(0);expect(w.growth.energy).toBe(0);
 }
});
