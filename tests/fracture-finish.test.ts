import {runReport} from '../src/game/run-report';
import {it,expect} from 'vitest';
import {World,type Body} from '../src/core/world';
import {C} from '../src/core/config';
import type {WeaponKind} from '../src/core/weapons';
import {fractureWaveLight} from '../src/game/fracture-light';
import {recipePerformance} from '../src/core/recipe-goal';
function ready(branch:'fracture-line'|'fracture-quick'|null='fracture-line'){const w=new World();Object.assign(w,{scheduled:[]});w.player.x=w.player.px=68;w.phase='recovery';for(const kind of ['pierce','blast'] as const){const p=w.spawn('pickup',68,C.playerY,2);p.weaponKind=kind;w.step(C.step,68);w.drainEffects();}w.growth.mastery=8;w.chooseBuild('electric');for(let i=0;i<3;i++)w.chooseBuild('ballistic');if(branch)w.chooseBuild('ballistic',branch);w.phase='running';w.bullets=[];return w;}
function target(w:World,x=360,y=800,kind:Body['kind']='armor',hp=1000){const b=w.spawn(kind,x,y);b.hp=b.maxHp=hp;b.timer=999;b.speed=0;return b;}
let id=185000;function hit(w:World,b:Body,damage=10,kind:WeaponKind='pierce'){w.bullets=[{id:id++,x:b.x,y:b.y,px:b.x,py:b.y,vx:0,vy:0,damage,age:0,active:true,hostile:false,weaponKind:kind,remainingTargets:1,hitBodies:[]}];w.step(C.step,68);return w.drainEffects();}
it('direct piercing defeat releases one forward wave without requiring three surviving hits',()=>{
 const w=ready(),front=target(w,360,800,'drone',5),rear=target(w,360,630);const events=hit(w,front);
 expect(front.active).toBe(false);expect(rear.hp).toBe(992.5);expect(w.fractureBursts).toBe(0);expect(w.fractureWaves).toBe(1);expect(events.filter(e=>e.type==='fracture-wave')).toHaveLength(1);
 expect(recipePerformance(w,'fracture').label).toBe('爆0/穿1');expect(recipePerformance(w,'fracture').count).toBe(1);const before=JSON.stringify(w);expect(runReport(w,[],[]).mechanics.join(' ')).toContain('穿震1');expect(JSON.stringify(w)).toBe(before);
});
it('overlapping impact draws a bounded origin rupture, no invented forward travel; expired and reversed waves draw nothing',()=>{
 for(const weak of [false,true]){const points:number[][]=[];let depth=0;const c=new Proxy({}, {get(_t,k){return (...args:unknown[])=>{if(k==='save')depth++;if(k==='restore')depth--;if(k==='moveTo'||k==='lineTo')points.push(args as number[]);};},set(){return true;}}) as CanvasRenderingContext2D;
  fractureWaveLight(c,360,800,360,800,.2,weak);expect(depth).toBe(0);expect(points.length).toBeGreaterThan(0);for(const [x,y]of points){expect(Math.abs(x)).toBeLessThanOrEqual(120);expect(y).toBeGreaterThanOrEqual(-8);expect(y).toBeLessThanOrEqual(0);}points.length=0;
  fractureWaveLight(c,360,800,360,850,.2,weak);fractureWaveLight(c,360,800,360,650,0,weak);expect(points).toEqual([]);expect(depth).toBe(0);
 }
});

it('a same-row body whose front overlaps the wave is reached, but a wholly trailing body is not',()=>{const w=ready(),b=target(w,360,800,'drone',5),row=target(w,460,800),behind=target(w,360,950);hit(w,b);expect(row.hp).toBe(992.5);expect(behind.hp).toBe(1000);});
it('secondary defeats do not recurse and effective damage excludes overkill',()=>{const w=ready(),b=target(w,360,800,'drone',5),a=target(w,360,650,'drone',2),c=target(w,360,540,'drone',2),d=target(w,360,490);hit(w,b);expect(w.fractureFinishWaves).toBe(1);expect(w.fractureFinishHits).toBe(2);expect(w.fractureWaves).toBe(1);expect(w.fractureWaveDamage).toBe(4);expect(d.hp).toBe(1000);expect(w.kills).toBe(3);expect(a.active).toBe(false);expect(c.active).toBe(false);});
for(const marks of [0,1,2])it('lethal direct hit with '+marks+' marks never doubles an explosion',()=>{const w=ready(),b=target(w,360,800,'armor',5);b.fractureHits=marks;hit(w,b);expect(w.fractureFinishWaves).toBe(1);expect(w.fractureBursts).toBe(0);});
for(const kind of ['pulse','blast','arc','scatter'] as const)it(kind+' direct kills never release a finish wave',()=>{const w=ready(),b=target(w,360,800,'drone',5);hit(w,b,10,kind);expect(w.fractureFinishWaves).toBe(0);});
for(const kind of ['gate','crate'] as const)it(kind+' never releases or receives finish damage behind a blocking reward',()=>{const w=ready(),b=target(w,360,800,'drone',5),reward=target(w,360,650,kind),rear=target(w,360,500);hit(w,b);expect(reward.hp).toBe(1000);expect(rear.hp).toBe(1000);if(kind==='gate')expect(reward.energy).toBe(0);hit(w,reward,2000);expect(w.fractureFinishWaves).toBe(1);});
it('entry protection cannot be used as a kill trigger',()=>{const w=ready(),b=target(w,360,800,'drone',1);b.dropGrace=1;hit(w,b);expect(b.hp).toBe(1);expect(w.fractureFinishWaves).toBe(0);});
it('closed rear shield takes mitigated damage and stops the finish wave',()=>{const w=ready(),b=target(w,360,800,'drone',5),guard=target(w,360,630,'guard'),rear=target(w,360,500);hit(w,b);expect(guard.hp).toBe(996.25);expect(rear.hp).toBe(1000);});
it('defeating a boss never emits a wave into its escorts or creates a second reward',()=>{const w=ready();w.phase='boss';const boss=target(w,360,800,'boss',5),escort=target(w,360,630,'elite',1);hit(w,boss);expect(w.bossWins).toBe(1);expect(w.kills).toBe(1);expect(escort.hp).toBe(1);expect(w.fractureFinishWaves).toBe(0);});
it('a finish-wave boss defeat stops before the next escort',()=>{const w=ready();w.phase='boss';const b=target(w,360,850,'drone',5),boss=target(w,360,680,'boss',5),escort=target(w,360,550,'elite',1);hit(w,b);expect(w.bossWins).toBe(1);expect(w.kills).toBe(2);expect(escort.hp).toBe(1);expect(w.fractureFinishHits).toBe(1);expect(w.fractureWaveDamage).toBe(5);expect(boss.active).toBe(false);});
it('surviving three-hit detonation still produces only its original wave',()=>{const w=ready(),b=target(w),rear=target(w,360,630);for(let i=0;i<3;i++)hit(w,b);expect(b.hp).toBe(950);expect(rear.hp).toBe(992.5);expect(w.fractureBursts).toBe(1);expect(w.fractureWaves).toBe(1);expect(w.fractureFinishWaves).toBe(0);});

it('quick and unrefined builds keep their old direct-kill behavior; a new run has no retained telemetry',()=>{for(const branch of ['fracture-quick',null] as const){const w=ready(branch),b=target(w,360,800,'drone',5),rear=target(w,360,630);hit(w,b);expect(rear.hp).toBe(1000);expect(w.fractureFinishWaves).toBe(0);}const w=new World();expect(w.fractureFinishWaves+w.fractureFinishHits+w.fractureWaveDamage).toBe(0);expect(w.lastFractureWaveHit).toBeUndefined();});
