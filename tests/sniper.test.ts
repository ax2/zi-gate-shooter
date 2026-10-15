import {expect,it} from 'vitest';
import {World} from '../src/core/world';
import {C} from '../src/core/config';
import {advanceBody} from '../src/core/behavior';
import {safeRoute} from '../src/core/reachability';
import {timeline} from '../src/core/director';

it('stops at its firing position, warns before fast three-shot volleys and leaves finitely',()=>{
 const w=new World(),b=w.spawn('sniper',220,-90),shots:{age:number,x:number,vy:number|undefined}[]=[];
 let warningAt=-1;
 for(let i=0;i<18*60;i++){
  advanceBody(b,C.step,'running',0,(x,_y,_vx,vy)=>shots.push({age:b.age,x,vy}));
  if(b.warning>0&&warningAt<0)warningAt=b.age;
  if(b.warning>0)expect(b.y).toBe(320);
 }
 expect(warningAt).toBeGreaterThan(2.4);
 expect(shots[0].age-warningAt).toBeCloseTo(1.2,5);
 expect(shots.length).toBeGreaterThanOrEqual(3);expect(shots.length%3).toBe(0);
 expect(shots.every(s=>s.x===220&&s.vy===620&&s.age<10)).toBe(true);
 expect(b.y).toBeGreaterThan(1280);expect(b.warning).toBe(0);
});

it('has a reachable route with a crossing charger, without assuming kills',()=>{
 const w=new World(),b=w.spawn('sniper',220,320);b.timer=0;
 const charger=w.spawn('charger',580,100);charger.pattern='flank';charger.lane=480;
 for(const x of [C.minX,220,360,C.maxX])expect(safeRoute(x,[b,charger],[],7)).not.toBeNull();
});

it('killing a charging sentry cancels its shot and grants its score once',()=>{
 const w=new World();const b=w.spawn('sniper',360,320);b.warning=1.2;b.timer=1.2;b.hp=4;
 w.bullets.push({id:9999,x:360,y:320,px:360,py:320,vx:0,vy:0,damage:4,age:0,active:true,hostile:false});
 w.step(C.step);const effects=w.drainEffects();
 expect(effects.filter(e=>e.type==='kill'&&e.enemyKind==='sniper')).toHaveLength(1);
 for(let i=0;i<90;i++){w.step(C.step);w.drainEffects();}
 expect(w.bullets.some(b=>b.hostile)).toBe(false);expect(w.score).toBe(C.enemies.sniper.score);
});

it('keeps sentries out of the first supply tutorial, then introduces them in chapter pressure windows',()=>{
 expect(timeline(1,1337).some(s=>s.kind==='sniper'&&s.at<30)).toBe(false);
 expect(timeline(1,1337).some(s=>s.kind==='sniper'&&s.at>=50)).toBe(true);
 for(const round of [2,3,5,6])expect(timeline(round,1337).some(s=>s.kind==='sniper')).toBe(true);
});
