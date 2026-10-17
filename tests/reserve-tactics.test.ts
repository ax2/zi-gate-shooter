import{it,expect}from'vitest';
import{timeline}from'../src/core/director';
import{pursuitWaves}from'../src/core/pursuit-waves';
import{advanceBody}from'../src/core/behavior';
import{World}from'../src/core/world';
import{C}from'../src/core/config';
import{BANKSHOT,advanceProjectile}from'../src/core/bankshot';
const baselinePath='../build/qa/Stage-222/baseline.mjs',old=await import(baselinePath);

it('keeps tutorial, reward schedules and roster size across 108 chapter schedules',()=>{
 for(let round=1;round<=12;round++)for(const seed of[1,29,1337])for(const plan of[0,1,2]as const){
  const before=old.timeline(round,seed,plan),after=timeline(round,seed,plan);
  expect(after.length).toBe(before.length);
  expect(after.filter(s=>['gates','crate','armory'].includes(s.kind))).toEqual(before.filter((s:any)=>['gates','crate','armory'].includes(s.kind)));
  if(round===1)expect(after).toEqual(before);
  // All changed spawns must belong to a pursuit slot; other attacks remain exact.
  const rest=[...after],removed=[];
  for(const s of before){const i=rest.findIndex(t=>JSON.stringify(t)===JSON.stringify(s));if(i>=0)rest.splice(i,1);else removed.push(s);}
  const starts=(round-1)%3===0?[.5,18.5,28.5]:[.5,14,26];
  for(const s of[...removed,...rest])expect(starts.some(at=>s.at>=at-1e-8&&s.at<=at+1.3)).toBe(true);
 }
});

it('provides nine distinct mirrored tactics with unchanged per-chapter reserve counts',()=>{
 for(const round of[4,5,6]){
  const variants=[0,1,2].map(v=>pursuitWaves(round,false,v));
  expect(new Set(variants.map(xs=>JSON.stringify(xs.map(s=>[s.kind,s.pattern,s.lane,s.forkshot])))).size).toBe(3);
  for(const v of[0,1,2]){
   const a=variants[v],b=pursuitWaves(round,true,v);
   expect(a.length).toBe(round===6?12:18);expect(a.filter(s=>s.dropLabel)).toHaveLength(3);
   for(let i=0;i<a.length;i++){expect(b[i].x).toBe(720-a[i].x);if(a[i].lane!==undefined)expect(b[i].lane).toBe(720-a[i].lane!);}
  }
 }
 expect(pursuitWaves(4,false,1).filter(s=>s.kind==='armor')).toHaveLength(6);
 expect(pursuitWaves(4,false,2).filter(s=>s.kind==='sniper')).toHaveLength(3);
 expect(pursuitWaves(4,false,2).filter(s=>s.kind==='charger')).toHaveLength(3);
});

it('moving cannon actually leaves its shield and emits a fan while traversing',()=>{
 const s=pursuitWaves(6,false,2).find(s=>s.kind==='armor')!,w=new World(1337,6),b=w.spawn('armor',s.x,s.dropY);
 b.pattern=s.pattern;b.lane=s.lane!;b.timer=.1;const shots:number[][]=[];
 for(let f=0;f<60;f++)advanceBody(b,C.step,'running',f*C.step,(...args)=>shots.push(args as number[]));
 expect(b.x-s.x).toBeGreaterThan(200);expect(shots.length).toBe(3);expect(shots.map(s=>s[2])).toEqual([-130,0,130]);
});

it('live admissions let reserve fan guns and mobile sentries charge and fire before the old idle delay',()=>{
 for(const[round,plan,kind,pattern,deadline]of[[4,0,'armor','fan',1.4],[2,2,'sniper','relocate',1.9]]as const){
  const w=new World(1337,round,undefined,plan);(w as any).shoot=()=>{};
  for(let f=0;f<Math.ceil(deadline*60);f++){w.step(C.step,68);w.drainEffects();}
  const gun=w.bodies.find(b=>b.active&&b.kind===kind&&b.pattern===pattern)!;
  expect(gun).toBeDefined();expect(w.bullets.filter(b=>b.hostile&&b.sourceId===gun.id)).toHaveLength(3);
  expect(w.player.hp).toBe(3);
 }
});

it('bank cannon emits outward shots that return once, rather than straight shield fire',()=>{
 for(const mirror of[false,true]){
  const s=pursuitWaves(6,mirror,1).find(s=>s.kind==='armor')!,w=new World(1337,6),b=w.spawn('armor',s.x,s.dropY);
  b.pattern=s.pattern;b.timer=BANKSHOT.opening;const shots:number[][]=[];
  for(let f=0;f<180;f++)advanceBody(b,C.step,'running',f*C.step,(...args)=>shots.push(args as number[]));
  expect(shots.length).toBeGreaterThan(0);expect(Math.sign(shots[0][2])).toBe(Math.sign(s.x-360));
  const [x,y,vx,vy]=shots[0],bullet={x,y,px:x,py:y,vx,vy,age:0,bankRemaining:1,hostile:true};
  for(let f=0;f<90;f++)advanceProjectile(bullet,C.step);
  expect(bullet.bankRemaining).toBe(0);expect(Math.sign(bullet.vx)).toBe(-Math.sign(vx));
 }
});
