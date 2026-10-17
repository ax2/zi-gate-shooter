import{it,expect}from'vitest';import{timeline}from'../src/core/director';import{World}from'../src/core/world';import{C}from'../src/core/config';import{fireControlSource}from'../src/core/fire-control';
const old=await import('../build/qa/Stage-216/baseline.mjs');
const previous=s=>s.drop&&((s.kind==='armor'&&s.dropY===350&&[21,22.8].includes(s.at))||(s.kind==='drone'&&s.at===21.6&&s.x===360&&s.dropY===470));
const tail=(s,offset=0)=>s.drop&&[[53.5,'armor',350],[54.1,'drone',470],[55.3,'armor',350],[55.9,'drone',470],[57.1,'armor',350],[57.7,'drone',470]].some(([at,kind,y])=>Math.abs(s.at+offset-at)<1e-8&&s.kind===kind&&s.dropY===y);
it('changes only the heavy breach trio and retimes its nine-unit late wave in 108 schedules, preserving counts and all rewards',()=>{
 for(let round=1;round<=12;round++)for(const seed of[1,29,1337])for(const plan of[0,1,2]){
  const a=old.timeline(round,seed,plan),b=timeline(round,seed,plan);expect(b.length).toBe(a.length);
  if(round%3!==0){expect(b).toEqual(a);continue;}
  expect(b.filter(s=>s.breach)).toHaveLength(3);expect(a.filter(previous)).toHaveLength(3);
  expect(b.filter(s=>!s.breach&&!tail(s,6.5))).toEqual(a.filter(s=>!previous(s)&&!tail(s)));
  const late=a.filter(s=>tail(s)),moved=b.filter(s=>tail(s,6.5));expect(late).toHaveLength(9);expect(moved).toHaveLength(9);
  expect(moved.map(({at,...s})=>s)).toEqual(late.map(({at,...s})=>s));
  expect(b.filter(s=>s.breach).map(s=>s.kind).sort()).toEqual(['armor','armor','conduit']);
 }
});
function group(){const w=new World(1337,3);w.scheduled=timeline(3,1337).filter(s=>s.breach);w.roundTime=20.99;w.step(C.step,652);w.drainEffects();return w;}
it('admits an atomic linked group with fixed durability and a separate supply circuit',()=>{
 const w=group(),guns=w.bodies.filter(b=>b.kind==='armor'),relay=w.bodies.find(b=>b.kind==='conduit');
 expect(guns).toHaveLength(2);expect(relay).toBeDefined();expect(w.dropSpawns).toBe(3);
 for(const gun of guns){expect(gun.maxHp).toBeCloseTo(489.6);expect(gun.controlShutter).toBe(true);expect(fireControlSource(gun,w.bodies)).toBe(relay);}
 const other=w.spawn('conduit',relay.x,relay.y);other.pattern='fire-control';other.controlGroup=3;relay.active=false;
 expect(guns.every(g=>!fireControlSource(g,w.bodies))).toBe(true);
});
