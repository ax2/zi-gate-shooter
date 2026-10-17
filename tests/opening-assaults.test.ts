import{restoreChapterLayers}from'./helpers/restore-chapter-layers';
import{it,expect}from'vitest';import{enemyHealthScale}from'../src/core/difficulty';import{openingAssaults}from'../src/core/opening-assaults';import{timeline}from'../src/core/director';import{World}from'../src/core/world';import{C}from'../src/core/config';import{dangerTimeline}from'../src/core/reachability';
const path='../build/qa/Stage-225/baseline.mjs',old=await import(path);
it('adds only the explicit chapter-specific opening roster across 108 schedules and preserves all rewards and prior fights',()=>{
 for(let round=1;round<=12;round++)for(const seed of[1,29,1337])for(const plan of[0,1,2]as const){
  const actual=restoreChapterLayers(timeline(round,seed,plan),round,seed,plan),added=actual.filter(s=>s.openingAssault);
  expect(actual.filter(s=>!s.openingAssault).map(s=>s.pattern==='rake'?{...s,pattern:'fan',opening:.1}:s)).toEqual(old.timeline(round,seed,plan));
  expect(added.length).toBe(round===1?4:(round-1)%3===0?6:(round-1)%3===1?5:4);
  expect(added.every(s=>s.at>=6.5&&s.at<=8.6&&s.drop&&s.kind in C.enemies)).toBe(true);
  expect(added.filter(s=>s.dropLabel)).toHaveLength(1);
 }
});
it('keeps the first crate approach clear in every first-chapter plan and mirrors later lanes and short-dash targets together',()=>{
 for(const plan of[0,1,2]as const)expect(timeline(1,1337,plan).filter(s=>s.openingAssault).every(s=>s.kind==='drone'&&s.x>=440)).toBe(true);
 for(const round of[2,3,4])for(const variation of[0,1,2]){
  const a=openingAssaults(round,false,variation),b=openingAssaults(round,true,variation);
  expect(b).toEqual(a.map(s=>({...s,x:720-s.x,lane:s.lane===undefined?undefined:720-s.lane})));
 }
});
function run(round:number,x=652){const w=new World(1337,round);(w as any).scheduled=openingAssaults(round,false,0);(w as any).shoot=()=>{};w.roundTime=6.49;w.player.x=w.player.px=x;return w;}
it('admits real shooters with ordinary fixed durability and keeps their live firing inside the conservative forecast',()=>{
 for(const round of[2,3,4]){
  const w=run(round);for(let f=0;f<180&&!w.bodies.some(b=>b.kind==='armor'||b.kind==='sniper');f++){w.step(C.step,652);w.drainEffects();}const gun=w.bodies.find(b=>b.kind==='armor'||b.kind==='sniper')!;
  expect(gun).toBeDefined();expect(gun.maxHp).toBe(C.enemies[gun.kind as keyof typeof C.enemies].hp*enemyHealthScale(gun.kind as keyof typeof C.enemies,round));
  // Isolate the admitted emitter after checking its real admission, not its AI.
  (w as any).scheduled=[];w.bodies=w.bodies.filter(b=>b.id===gun.id);const before=JSON.stringify(w.bodies),forecast=dangerTimeline(w.bodies,[],4,{phase:'running'});expect(JSON.stringify(w.bodies)).toBe(before);
  let shots=0,crossings=0;const ids=new Set<number>();
  for(let f=0;f<240;f++){w.step(C.step,68);w.drainEffects();for(const b of w.bullets.filter(b=>b.hostile)){if(!ids.has(b.id)){ids.add(b.id);shots++;}if(Math.min(b.py,b.y)-31<=C.playerY&&Math.max(b.py,b.y)+31>=C.playerY){expect(forecast[Math.floor(f/6)].some(([lo,hi])=>lo<=b.x-27&&hi>=b.x+27)).toBe(true);crossings++;}}}
  expect(shots).toBeGreaterThan(0);expect(crossings).toBeGreaterThan(0);
 }
});
it('does not consume an unadmitted opening slot or clear old bullets to make space',()=>{
 const w=run(2);(w as any).admit=(b:any)=>{b.active=false;return false;};w.bullets.push({id:900001,x:100,y:600,px:100,py:600,vx:0,vy:100,damage:1,age:0,active:true,hostile:true});w.step(C.step,652);w.drainEffects();expect((w as any).scheduleIndex).toBe(0);expect(w.dropSpawns).toBe(0);expect(w.bullets.some(b=>b.id===900001&&b.active)).toBe(true);
});
