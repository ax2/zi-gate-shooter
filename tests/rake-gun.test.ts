import{battleIndex}from'../src/core/battle-plan';
import{it,expect}from'vitest';import{World}from'../src/core/world';import{C}from'../src/core/config';import{timeline}from'../src/core/director';import{closingAssault}from'../src/core/closing-assault';import{rakeBarrelAngle}from'../src/core/rake-gun';import{dangerTimeline,safeRoute}from'../src/core/reachability';
const path='../build/qa/Stage-256/baseline.mjs',old=await import(path);
function setup(round=1,x=240){const w=new World(1337,round);w.phase='boss';(w as any).scheduled=[];(w as any).shoot=()=>{};w.player.x=w.player.px=68;const b=w.spawn('armor',x,350);b.pattern='rake';b.timer=.1;return{w,b};}
function step(w:World,n=1,x=68){for(let i=0;i<n;i++){w.step(C.step,x);w.drainEffects();}}
it('keeps the original rake phrase in battle0 and leaves non-closing targets on their existing schedule',()=>{
 for(let r=1;r<=15;r++)for(const seed of[1,29,1337])for(const plan of[0,1,2]as const){
  const a=timeline(r,seed,plan),variation=battleIndex(r,plan),guns=a.filter(s=>s.pattern==='rake');
  expect(a.filter(s=>!s.closing)).toEqual(old.timeline(r,seed,plan).filter((s:any)=>!s.closing));
  expect(guns.every(s=>s.closing&&s.kind==='armor'&&s.at===68&&s.dropY===350)).toBe(true);
  if(variation===0){expect(guns.length).toBe(r%3===0?(r===3?1:2):0);if(guns.length===2)expect(guns[1].opening!-guns[0].opening!).toBeCloseTo(.25);}
 }
});
it('admits the entire real moving dual-gun/guard formation from either edge or center instead of stalling the director',()=>{
 for(const round of[3,6,9,12,15])for(const x of[68,360,652]){const w=new World(1337,round);w.player.x=w.player.px=x;w.roundTime=67.99;Object.assign(w,{scheduled:closingAssault(round,false),secondChance:true});(w as any).shoot=()=>{};step(w,1,x);expect(w.dropSpawns).toBe(3);expect(w.bodies.filter(b=>b.active)).toHaveLength(3);expect(w.phase).toBe('running');}
});
it.each([240,480])('fires nine actual shots in three distinct directions from x%s, with visible windup and accepted-shot recoil',x=>{
 const {w,b}=setup(1,x),seen=new Set<number>(),shots:{at:number;vx:number;vy:number;angle:number}[]=[];
 for(let f=0;f<108;f++){step(w);for(const s of w.bullets.filter(s=>s.hostile&&!seen.has(s.id))){seen.add(s.id);shots.push({at:w.time,vx:s.vx,vy:s.vy,angle:rakeBarrelAngle(b)});}}
 expect(shots).toHaveLength(9);expect(b.rakeShots).toBe(9);expect(shots[0].at).toBeCloseTo(.7,2);expect(shots[3].at-shots[0].at).toBeCloseTo(.25,2);expect(shots[6].at-shots[3].at).toBeCloseTo(.25,2);
 expect(shots.map(s=>s.vy).every(v=>v===310)).toBe(true);const sign=x<360?1:-1;expect([shots[1].vx,shots[4].vx,shots[7].vx]).toEqual([180*sign,0,-180*sign]);for(const i of[1,4,7])expect(shots[i].angle).toBeCloseTo(Math.atan2(shots[i].vx,shots[i].vy));expect(b.rakeFiring).toBe(false);expect(b.warning).toBe(0);
});
it('freezes the attack clock under EMP and resumes the remaining salvos without resetting the sequence',()=>{
 const {w,b}=setup();b.speed=0;step(w,43);expect(b.rakeShots).toBe(3);const timer=b.timer;b.empRemaining=1;step(w,59);expect(b.rakeShots).toBe(3);expect(b.timer).toBeCloseTo(timer);step(w,35);expect(b.rakeShots).toBe(9);
});
it('a destroyed emitter cannot fire the next beat, while its already-fired bolts remain dangerous',()=>{
 const {w,b}=setup();step(w,43);const ids=w.bullets.filter(s=>s.hostile).map(s=>s.id);expect(ids).toHaveLength(3);b.active=false;step(w,40);expect(w.bullets.filter(s=>s.hostile).map(s=>s.id)).toEqual(ids);expect(b.rakeShots).toBe(3);
});
it('obeys the existing hostile budget without fake recoil or accepted-shot counts when a full volley is rejected',()=>{
 const {w,b}=setup();for(let i=0;i<C.limits.hostile;i++)w.bullets.push({id:900000+i,x:100,y:200,px:100,py:200,vx:0,vy:0,age:0,damage:1,hostile:true,active:true});step(w,108);expect(w.bullets.filter(s=>s.hostile)).toHaveLength(C.limits.hostile);expect(b.rakeShots??0).toBe(0);expect(b.rakeFiredAt).toBeUndefined();
});
it('leaving the firing area cancels pending beats without despawning its existing shots',()=>{
 const {w,b}=setup();step(w,43);b.y=599;b.speed=110;step(w,40);expect(b.rakeShots).toBe(3);expect(b.rakeFiring).toBe(false);expect(b.warning).toBe(0);
});
it('the shared no-kill forecast covers actual scaled left/right salvos and provides a real collision-free route',()=>{
 const {w,b}=setup(6);const other=w.spawn('armor',480,350);other.pattern='rake';other.timer=.35;const before=JSON.stringify(w.bodies),hazards=dangerTimeline(w.bodies,[],5,{phase:'boss'});expect(JSON.stringify(w.bodies)).toBe(before);const route=safeRoute(68,w.bodies,[],5,{phase:'boss',reaction:.45});expect(route).not.toBeNull();let crossings=0;
 for(let f=0;f<300;f++){step(w,1,route![Math.floor(f/6)]??w.player.x);for(const s of w.bullets.filter(s=>s.hostile)){if(Math.min(s.py,s.y)-31<=C.playerY&&Math.max(s.py,s.y)+31>=C.playerY){expect(hazards[Math.floor(f/6)].some(([lo,hi])=>lo<=s.x-27&&hi>=s.x+27)).toBe(true);crossings++;}}}
 expect(crossings).toBeGreaterThan(0);expect(w.player.hp).toBe(3);expect(w.damageTaken).toBe(0);expect(b.rakeShots).toBeGreaterThanOrEqual(9);expect(other.rakeShots).toBeGreaterThanOrEqual(9);
});
