import {it,expect} from 'vitest';import {writeFileSync,mkdirSync} from 'node:fs';import {World} from '../src/core/world';import {timeline} from '../src/core/director';
// @ts-expect-error Immutable historical bundle has no declarations; recreated by capture-stage198-baseline.mjs.
import {World as OldWorld} from '../build/qa/Stage-198/baseline.mjs';
import {C} from '../src/core/config';import {advanceBody,guardClosed} from '../src/core/behavior';import {RELAY_SCREEN,hasRotatingShields} from '../src/core/relay-screen';import {safeRoute} from '../src/core/reachability';import {shieldLatch} from '../src/game/shield-latch';import {contextGuide} from '../src/game/context-guide';
const setup=(turn:0|1)=>{const w=new World(1337,8);Object.assign(w,{scheduled:[]});const b=w.spawn('guard',turn?520:200,RELAY_SCREEN.guardY);b.pattern='relay-screen';b.shieldTurn=turn;b.timer=RELAY_SCREEN.guardOpening+turn*RELAY_SCREEN.stagger;return {w,b};};
it('changes only later side-screen ordering, notice and guard phase; roster, fixed health, all rewards and earlier chapters stay intact',()=>{
 const rows=[];for(const round of [1,2,3,5,6,8,9,11,14])for(const seed of [1,1337])for(const plan of [0,1,2]){
  const old=new OldWorld(seed,round,undefined,plan),now=new World(seed,round,undefined,plan as 0|1|2);const previous=(old as any).scheduled,current=timeline(round,seed,plan as 0|1|2);expect(current.length).toBe(previous.length);
  const normalized=current.map(s=>{const {shieldTurn:_turn,...p}=s;if(p.pattern==='relay-screen'&&p.kind==='conduit'&&Math.abs(p.at-47.2)<1e-6)p.at=45.7;if(hasRotatingShields(round)&&p.dropLabel==='轮换盾阵'){p.dropLabel='双盾哨阵';p.dropDetail='前盾后哨 · 中路中继可击破停火开盾';}return p;});expect(normalized).toEqual(previous);
  if(hasRotatingShields(round)){const guards=current.filter(s=>s.shieldTurn!==undefined);expect(guards.map(s=>s.shieldTurn).sort()).toEqual([0,1]);}
  rows.push({round,seed,plan,spawns:current.length,rotating:hasRotatingShields(round)});
  expect(now.spawn('guard',200,480).maxHp).toBe(old.spawn('guard',200,480).maxHp);
 }mkdirSync('build/qa/Stage-198',{recursive:true});writeFileSync('build/qa/Stage-198/schedule-comparison.json',JSON.stringify(rows,null,2));
});
it('opens opposite windows two seconds apart and emits real volleys using shared live and forecast behavior',()=>{
 const a=setup(0).b,b=setup(1).b,shots:{side:number;time:number}[]=[];let opposite=0;
 for(let i=0;i<4*60;i++){for(const [side,x]of [a,b].entries())advanceBody(x,C.step,'running',0,()=>shots.push({side,time:x.age}));if(guardClosed(a)!==guardClosed(b))opposite++;}
 expect(opposite/60).toBeGreaterThan(3);expect(shots.filter(s=>s.side===0)).toHaveLength(3);expect(shots.filter(s=>s.side===1)).toHaveLength(3);expect(shots.find(s=>s.side===1)!.time-shots[0].time).toBeCloseTo(2,6);expect(a.y).toBe(480);expect(b.y).toBe(480);
});
it('real damage respects current shield state, and actual relay destruction opens both without deleting old bullets',()=>{
 const {w,b}=setup(1);w.player.x=w.player.px=68;b.hp=b.maxHp=1000;const lead=w.spawn('guard',200,480);lead.pattern='relay-screen';lead.shieldTurn=0;lead.timer=.1;lead.burst=1;
 const hit=(target:typeof b,damage:number)=>{w.bullets.push({id:90000+w.hits,x:target.x,y:target.y,px:target.x,py:target.y,vx:0,vy:0,damage,age:0,active:true,hostile:false});w.step(C.step,68);};
 hit(b,100);expect(b.hp).toBe(980);b.burst=1;hit(b,100);expect(b.hp).toBe(880);b.burst=0;
 const relay=w.spawn('conduit',360,560);relay.pattern='relay-screen';w.bullets.push({id:88888,x:600,y:700,px:600,py:700,vx:0,vy:280,damage:1,age:0,active:true,hostile:true});hit(relay,9999);
 expect(guardClosed(b)).toBe(false);expect(guardClosed(lead)).toBe(false);expect(w.bullets.some(p=>p.id===88888&&p.active)).toBe(true);expect(b.shieldTurn).toBe(1);expect(w.empTargets).toBe(2);expect(w.conduitBursts).toBe(1);
});
it('reads actual open/closed/EMP state in the existing mechanical overlay and guidance without mutation',()=>{
 const {w,b}=setup(1);const before=JSON.stringify(b);let stack=0,calls=0;const c=new Proxy({}, {get(_t,k){return (...a:number[])=>{calls++;if(k==='save')stack++;if(k==='restore')stack--;for(const n of a)expect(Number.isFinite(n)).toBe(true);if(k==='fillRect'||k==='strokeRect'){expect(Math.max(Math.abs(a[0]),Math.abs(a[0]+a[2]))).toBeLessThan(85);expect(Math.abs(a[1])+a[3]).toBeLessThan(80);}};},set(){return true;}}) as CanvasRenderingContext2D;shieldLatch(c,b);expect(calls).toBeLessThan(40);expect(stack).toBe(0);expect(JSON.stringify(b)).toBe(before);expect(contextGuide(w).title).toContain('轮换');b.empRemaining=1;expect(guardClosed(b)).toBe(false);shieldLatch(c,b);expect(stack).toBe(0);
});
for(const round of [8,11,14])for(const plan of [0,1,2])for(const x of [68,360,652])it(`keeps a no-kill route R${round} P${plan} x${x}`,()=>{
 const w=new World(1337,round,undefined,plan as 0|1|2);w.player.x=w.player.px=x;let path:number[]=[],planned=-999,seenBodies=0,admitted=0;const seen=new Set<number>();let shots=0;
 for(let f=0;f<72*60&&w.phase!=='dead';f++){
  if(f===0||f-planned>=60||w.bodies.length!==seenBodies){path=safeRoute(w.player.x,w.bodies,w.bullets,8,{phase:w.phase,phaseTime:w.phaseTime,reaction:f===0||seen.size!==admitted?.45:0})??[];expect(path.length,`t=${w.time}`).toBeGreaterThan(0);planned=f;seenBodies=w.bodies.length;admitted=seen.size;}
  const watched=w.bodies.filter(b=>b.shieldTurn!==undefined);w.step(C.step,path[Math.floor((f-planned)/6)]??w.player.x);w.drainEffects();w.bullets=w.bullets.filter(p=>p.hostile);for(const b of [...watched,...w.bodies])if(b.shieldTurn!==undefined){seen.add(b.id);shots=Math.max(shots,b.formationShots??0);}expect(w.player.hp,`t=${w.time}`).toBe(3);
 }expect(w.kills).toBe(0);expect(seen.size).toBe(2);expect(shots).toBeGreaterThanOrEqual(3);mkdirSync('build/qa/Stage-198/routes',{recursive:true});writeFileSync(`build/qa/Stage-198/routes/${round}-${plan}-${x}.json`,JSON.stringify({round,plan,x,hp:w.player.hp,time:w.time,kills:w.kills,guards:seen.size,shots,peakBodies:w.peakBodies,peakBullets:w.peakBullets},null,2));
},60000);
