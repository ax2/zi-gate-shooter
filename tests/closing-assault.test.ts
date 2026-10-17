import{it,expect}from'vitest';import{World}from'../src/core/world';import{timeline}from'../src/core/director';import{closingAssault}from'../src/core/closing-assault';import{C}from'../src/core/config';
const path='../build/qa/Stage-223/baseline.mjs',old=await import(path);
function setup(round=1){const w=new World(1337,round);Object.assign(w,{scheduled:closingAssault(round,false),secondChance:true});w.roundTime=67.99;w.player.x=w.player.px=652;(w as any).shoot=()=>{};return w;}
function frames(w:World,n=1){for(let i=0;i<n;i++){w.step(C.step,652);w.drainEffects();}}
it('adds only one closing group per chapter across 108 schedules, without rescheduling any old target',()=>{
 for(let round=1;round<=12;round++)for(const seed of[1,29,1337])for(const plan of[0,1,2]as const){const a=timeline(round,seed,plan),closing=a.filter(s=>s.closing);expect(a.filter(s=>!s.closing)).toEqual(old.timeline(round,seed,plan));expect(closing.length).toBe((round-1)%3===0?4:3);expect(closing.every(s=>s.at===68&&s.drop&&(s.dropY??0)>=320)).toBe(true);}
});
it('waits for an unclaimed old reward to leave naturally, then deploys the complete group once',()=>{
 const w=setup(),crate=w.spawn('crate',240,800,2);frames(w,120);expect(crate.active).toBe(true);expect(w.dropSpawns).toBe(0);expect(w.phase).toBe('running');
 while(w.bodies.includes(crate)&&w.time<10)frames(w);expect(w.bodies.includes(crate)).toBe(false);frames(w);expect(w.dropSpawns).toBe(4);expect(w.bodies.filter(b=>b.active&&b.kind in C.enemies)).toHaveLength(4);frames(w,30);expect(w.dropSpawns).toBe(4);
});
it('retains already-fired projectiles when the closing group arrives',()=>{
 const w=setup();w.bullets.push({id:900001,x:100,y:600,px:100,py:600,vx:0,vy:100,damage:1,age:0,active:true,hostile:true});frames(w);expect(w.dropSpawns).toBe(4);expect(w.bullets.find(b=>b.id===900001)?.active).toBe(true);
});
it('rejects and retries the entire unadvertised group without consuming its schedule',()=>{
 const w=setup(),admit=(w as any).admit.bind(w);(w as any).admit=(b:any)=>{b.active=false;return false;};frames(w);expect(w.bodies.filter(b=>b.active)).toHaveLength(0);expect(w.dropSpawns).toBe(0);expect((w as any).scheduleIndex).toBe(0);
 (w as any).admit=admit;frames(w);expect(w.dropSpawns).toBe(4);expect((w as any).scheduleIndex).toBe(4);
});
it('does not skip a closing survivor or pickup, and starts the boss before the old idle deadline after clear',()=>{
 const w=setup();frames(w);expect(w.phase).toBe('running');for(const b of w.bodies)b.active=false;const pickup=w.spawn('pickup',240,900,2);frames(w);expect(w.phase).toBe('running');expect(pickup.active).toBe(true);pickup.active=false;frames(w);expect(w.phase).toBe('boss-entry');expect(w.roundTime).toBeLessThan(72);expect(w.bodies.filter(b=>b.active&&b.kind==='boss')).toHaveLength(1);frames(w,119);expect(w.phase).toBe('boss-entry');frames(w,2);expect(w.phase).toBe('boss');
});
it('each admitted final group really emits its chapter-specific attack without foreknowledge or forced enemy damage',()=>{
 for(const round of[1,2,3]){const w=setup(round);frames(w,95);const shots=w.bullets.filter(b=>b.hostile);expect(shots.length).toBeGreaterThan(0);if(round===2){const gun=w.bodies.find(b=>b.pattern==='lockshot')!;expect(gun.lockX).toBe(652);expect(shots.some(b=>b.sourceId===gun.id&&b.vx!==0)).toBe(true);}else expect(new Set(shots.map(b=>Math.sign(b.vx))).size).toBe(3);}
});
