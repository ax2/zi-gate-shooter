import {hasRelayScreen} from '../src/core/relay-screen';
import {it,expect} from 'vitest';import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';import {timeline,type Spawn} from '../src/core/director';import {World} from '../src/core/world';import {C} from '../src/core/config';import {advanceBody} from '../src/core/behavior';import {SWEEPER,sweeperDirection} from '../src/core/sweeper';import {safeRoute,dangerTimeline} from '../src/core/reachability';
const baseline:{seed:number;round:number;timeline:Spawn[]}[]=JSON.parse(readFileSync('docs/stages/Stage-173/baseline-timelines.json','utf8'));
it('preserves early and other chapters plus rewards, with exactly five authored tail replacements',()=>{
 for(const old of baseline){const now=timeline(old.round,old.seed),changed=old.round>=4&&(old.round-1)%3===0;
  if(!changed){if(hasRelayScreen(old.round))expect(now.filter(s=>s.pattern!=='relay-screen')).toEqual(old.timeline.filter(s=>s.at!==44.5));else expect(now).toEqual(old.timeline);continue;}
  const tail=now.filter(s=>s.pattern==='sweep'||s.kind==='drone'&&s.x===360&&s.dropY===SWEEPER.centerY),prior=old.timeline.filter(s=>s.kind==='drone'&&s.at>=62);
  expect(tail).toHaveLength(15);expect(prior).toHaveLength(15);expect(now.filter(s=>!tail.includes(s))).toEqual(old.timeline.filter(s=>!prior.includes(s)));
  expect(tail.filter(s=>s.kind==='armor')).toHaveLength(3);expect(tail.filter(s=>s.kind==='elite')).toHaveLength(2);expect(tail.filter(s=>s.pattern==='sweep')).toHaveLength(10);
  for(const row of [0,1,2,3,4]){const pack=tail.filter(s=>Math.round((s.at-58)/2)===row);expect(pack.map(s=>s.dropY??0).sort((a,b)=>a-b)).toEqual([400,560,800]);expect(pack.filter(s=>s.x!==360).every(s=>s.lane===720-s.x&&s.drop)).toBe(true);expect(pack.map(s=>s.at).sort()).toEqual([58+row*2,58.2+row*2,58.2+row*2]);}
 }
});
it('crosses to a fixed opposite lane with no overshoot and keeps normal vertical travel and immunity duration',()=>{
 for(const x of [200,520]){const w=new World();const b=w.spawn('drone',x,380);b.pattern='sweep';b.lane=720-x;b.dropGrace=.45;const y=b.y,speed=b.speed;for(let i=0;i<90;i++)advanceBody(b,C.step,'running',0,()=>{throw Error('Drone fired')});expect(b.x).toBe(b.lane);expect(b.y).toBeCloseTo(y+speed*1.5);expect(b.dropGrace).toBe(0);expect(sweeperDirection(b)).toBe(0);}
});
it('conservative hazard intervals include the actual moving drone at the player line',()=>{
 const w=new World(),b=w.spawn('drone',200,900);b.pattern='sweep';b.lane=520;const ghost={...b},slabs=dangerTimeline([b],[],1.8);for(let i=0;i<108;i++){advanceBody(ghost,C.step,'running',i*C.step,()=>{});if(Math.abs(ghost.y-C.playerY)<ghost.height/2+C.playerRadius)expect(slabs[Math.floor(i/6)].some(([lo,hi])=>ghost.x>=lo&&ghost.x<=hi)).toBe(true);}expect(b.x).toBe(200);
});
for(const round of [4,7,10])for(const start of [68,360,652])it(`keeps all five mixed crossing packs escapable without kills in R${round} x${start}`,()=>{
 const w=new World(1337,round);w.player.x=w.player.px=start;let path:number[]=[],planned=0,seenBodies=0,plannedSweepers=0;const seen=new Map<number,{id:number;lane:number;move:number;reached:boolean;shots:number}>();let emitted=0;
 for(let frame=0;frame<72*60&&w.phase!=='dead';frame++){
  if(frame===0||frame-planned>=60||w.bodies.length!==seenBodies||seen.size!==plannedSweepers){path=safeRoute(w.player.x,w.bodies,w.bullets,5,{phase:w.phase,phaseTime:w.phaseTime,reaction:frame===0||seen.size!==plannedSweepers?.45:0})??[];expect(path.length,`t=${w.time}, newSweep=${seen.size!==plannedSweepers}`).toBeGreaterThan(0);planned=frame;seenBodies=w.bodies.length;plannedSweepers=seen.size;}
  const bulletIds=new Set(w.bullets.filter(b=>b.hostile).map(b=>b.id));w.step(C.step,path[Math.floor((frame-planned)/6)]??w.player.x);w.drainEffects();emitted+=w.bullets.filter(b=>b.hostile&&!bulletIds.has(b.id)).length;w.bullets=w.bullets.filter(b=>b.hostile);
  for(const b of w.bodies)if(b.pattern==='sweep'){let record=seen.get(b.id);if(!record){record={id:b.id,lane:b.lane,move:0,reached:false,shots:0};seen.set(b.id,record);}record.shots=Math.max(record.shots,b.sweeperShots??0);record.move=Math.max(record.move,Math.abs(b.x-(720-b.lane)));record.reached||=b.x===b.lane;}
  expect(w.player.hp,`t=${w.time}`).toBe(3);
 }
 expect(w.kills).toBe(0);expect(seen.size).toBe(10);expect([...seen.values()].every(s=>s.reached&&s.move===320)).toBe(true);expect([...seen.values()].reduce((n,s)=>n+s.shots,0)).toBeGreaterThan(0);expect(emitted).toBeGreaterThan(0);expect(w.peakBodies).toBeLessThanOrEqual(32);expect(w.peakBullets).toBeLessThanOrEqual(128);mkdirSync('build/qa/Stage-173/routes',{recursive:true});writeFileSync(`build/qa/Stage-173/routes/${round}-${start}.json`,JSON.stringify({round,start,time:w.time,hp:w.player.hp,kills:w.kills,sweepers:[...seen.values()],emitted,peakBodies:w.peakBodies,peakBullets:w.peakBullets},null,2));
},60000);

it('moving escorts complete a full local warning before firing, keep their authored HP and continue down',()=>{for(const kind of ['armor','elite'] as const){const w=new World(),b=w.spawn(kind,200,SWEEPER.upperY),hp=b.hp;b.pattern='sweep';b.lane=520;b.timer=SWEEPER.opening;const shots:{age:number;x:number}[]=[];let warnedAt:number|undefined;for(let i=0;i<90;i++){advanceBody(b,C.step,'running',0,x=>shots.push({age:b.age,x}));if(b.warning>0&&warnedAt===undefined)warnedAt=b.age;}expect(shots.length).toBe(3);expect(shots[0].age-warnedAt!).toBeCloseTo(.6);expect(shots[0].x).toBeGreaterThan(200);expect(shots[0].x).toBeLessThan(520);expect(b.hp).toBe(hp);expect(b.y).toBeGreaterThan(SWEEPER.upperY);}});
