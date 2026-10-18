import {it,expect} from 'vitest';
import {heavyEscorts,HEAVY_ESCORTS} from '../src/core/heavy-escorts';
import {timeline,Random} from '../src/core/director';import {battleIndex} from '../src/core/battle-plan';
import {World} from '../src/core/world';import {C} from '../src/core/config';
import {enemyHealthScale} from '../src/core/difficulty';import {BANKSHOT} from '../src/core/bankshot';
import {observedNoFireRoute} from './helpers/observed-route-driver';
import {mkdirSync,writeFileSync} from 'node:fs';
const path='../build/qa/Stage-249/baseline.mjs',old=await import(path);
it('retains every old spawn and reward across108 schedules and adds12 only to heavy chapters',()=>{
 for(let r=1;r<=12;r++)for(const seed of [1,29,1337])for(const plan of [0,1,2] as const){
  const actual=timeline(r,seed,plan),base=old.timeline(r,seed,plan);
  expect(actual.filter(s=>!s.heavyReserve)).toEqual(base);
  const extra=actual.filter(s=>s.heavyReserve);expect(extra).toHaveLength(r%3===0?12:0);
  expect(extra).toEqual(heavyEscorts(r,r>1&&new Random(seed).next()>.5,battleIndex(r,plan)).sort((a,b)=>a.at-b.at));
 }
});
it.each([0,1,2])('keeps a shielded cannon and an independent opposing flank, with mirrored coordinates v%s',v=>{
 const a=heavyEscorts(3,false,v);expect(heavyEscorts(3,true,v)).toEqual(a.map(s=>({...s,x:720-s.x,lane:s.lane===undefined?undefined:720-s.lane})));
 for(const at of HEAVY_ESCORTS.starts){const g=a.filter(s=>s.at>=at&&s.at<at+2),shield=g.find(s=>s.kind==='guard')!,gun=g.find(s=>s.kind==='armor')!,charger=g.find(s=>s.kind==='charger')!;
  expect(g).toHaveLength(6);expect(gun.x).toBe(shield.x);expect(gun.dropY!+100).toBeLessThan(shield.dropY!);expect(charger.x+shield.x).toBe(720);
  expect(gun.pattern).toBe(['fan','bankshot','sweep'][v]);expect(charger.at-shield.at).toBeCloseTo(1.05);expect(g.every(s=>s.drop&&s.dropY!<=520&&s.x>=68&&s.x<=652)).toBe(true);
 }
});
function isolated(v:number){const w=new World(1337,3);Object.assign(w,{scheduled:heavyEscorts(3,false,v)});w.roundTime=14.65;w.player.x=w.player.px=68;(w as any).shoot=()=>{};return w;}
it('uses the actual front shield to absorb a shot without granting invulnerability to the rear cannon',()=>{
 const w=isolated(0);for(let i=0;i<60;i++)w.step(C.step,68);
 const shield=w.bodies.find(b=>b.active&&b.heavyReserve&&b.kind==='guard')!,gun=w.bodies.find(b=>b.active&&b.heavyReserve&&b.kind==='armor')!;
 expect(shield).toBeDefined();expect(gun).toBeDefined();const hp=shield.hp,rear=gun.hp;
 w.bullets.push({id:900001,x:shield.x,y:shield.y+30,px:shield.x,py:shield.y+30,vx:0,vy:-1200,age:0,damage:10,hostile:false,active:true});w.step(C.step,68);
 expect(shield.hp).toBeLessThan(hp);expect(gun.hp).toBe(rear);
 w.bullets.push({id:900002,x:shield.x,y:shield.y+30,px:shield.x,py:shield.y+30,vx:0,vy:-1200,age:0,damage:10000,hostile:false,active:true});w.step(C.step,68);expect(shield.active).toBe(false);expect(w.kills).toBe(1);expect(w.score).toBe(C.enemies.guard.score);
 w.bullets.push({id:900003,x:gun.x,y:gun.y+30,px:gun.x,py:gun.y+30,vx:0,vy:-1200,age:0,damage:10000,hostile:false,active:true});w.step(C.step,68);expect(gun.active).toBe(false);expect(w.kills).toBe(2);
});
it.each([0,1,2])('admits the authored gun and launches actual hostile ammunition v%s',v=>{
 const w=isolated(v),admitted:any[]=[],shots:any[]=[];const spawn=w.spawn.bind(w);w.spawn=((...a:any[])=>{const b=(spawn as any)(...a);admitted.push(b);return b;})as any;
 const fire=(w as any).hostile.bind(w);(w as any).hostile=(...a:any[])=>{const n=w.bullets.length;fire(...a);if(w.bullets.length>n)shots.push(w.bullets.at(-1));};
 for(let i=0;i<240;i++)w.step(C.step,68);
 const guns=admitted.filter(b=>b.heavyReserve&&b.kind==='armor');expect(guns).toHaveLength(1);expect(guns[0].maxHp).toBe(C.enemies.armor.hp*enemyHealthScale('armor',3)*(v===1?BANKSHOT.durability:1));
 expect(shots.some(b=>b.hostile&&b.sourceId===guns[0].id)).toBe(true);
 expect(admitted.filter(b=>b.heavyReserve)).toHaveLength(6);
});
it.each([3,6,9,12].flatMap(round=>[0,1,2].flatMap(plan=>[68,360,652].map(start=>({round,plan:plan as 0|1|2,start})))))('delayed no-fire escape through real heavy chapter r$round p$plan x$start',({round,plan,start})=>{
 const result=observedNoFireRoute(round,plan,start,1337);mkdirSync('build/qa/Stage-249/routes',{recursive:true});writeFileSync(`build/qa/Stage-249/routes/${round}-${plan}-${start}.json`,JSON.stringify(result,null,2));
 expect(result.failureTime).toBeNull();expect(result.hp).toBe(3);expect(result.phase).toBe('boss-entry');
},120000);
