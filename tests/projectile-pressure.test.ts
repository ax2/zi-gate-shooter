import {it,expect} from 'vitest';
import {World} from '../src/core/world';import {C} from '../src/core/config';
import {enemyProjectileScale} from '../src/core/projectile-pressure';import {dangerTimeline} from '../src/core/reachability';
it('keeps round one intact and caps later speed without reading player power',()=>{
 expect([1,2,3,4,20].map(enemyProjectileScale)).toEqual([1,1.1,1.2,1.3,1.3]);
 const a=new World(1,4),b=new World(1,4);b.growth.mastery=100;b.growth.stage=3;b.growth.bonus=100;
 expect(a.spawn('sniper',360).shotScale).toBe(1.3);expect(b.spawn('sniper',360).shotScale).toBe(1.3);
});
it('real later bullets hit an idle observer sooner with unchanged charge and damage',()=>{
 const results=[];
 for(const round of [1,4]){
  const w=new World(1,round);w.phase='boss';w.player.x=w.player.px=200;
  const gun=w.spawn('armor',200,500);gun.speed=0;gun.timer=.1;let warning=0,shot=0,hit=0,vy=0;
  for(let f=0;f<180;f++){
   w.step(C.step,200);w.drainEffects();w.bullets=w.bullets.filter(b=>b.hostile);
   if(gun.warning>0&&!warning)warning=w.time;
   const bullet=w.bullets.find(b=>b.hostile);if(bullet&&!shot){shot=w.time;vy=bullet.vy;}
   if(w.player.hp<3){hit=w.time;break;}
  }
  results.push({warning,shot,hit,vy,hp:w.player.hp,kills:w.kills});
 }
 expect(results[0].warning).toBeCloseTo(results[1].warning);expect(results[0].shot).toBeCloseTo(results[1].shot);
 expect(results[0].vy).toBe(280);expect(results[1].vy).toBe(364);expect(results[1].hit).toBeLessThan(results[0].hit-.2);
 for(const result of results){expect(result.hit).toBeGreaterThan(1);expect(result.hp).toBe(2);expect(result.kills).toBe(0);}
});
it('shared forecast covers real scaled fan shots with the same angles and no state mutation',()=>{
 const w=new World(1,4);w.phase='boss';const gun=w.spawn('elite',360,450);gun.pattern='fan';gun.speed=0;gun.timer=.1;
 const before=JSON.stringify(w.bodies),forecast=dangerTimeline(w.bodies,[],4,{phase:'boss'});expect(JSON.stringify(w.bodies)).toBe(before);
 let crossings=0;const velocities=new Set<number>();
 for(let f=0;f<240;f++){
  w.step(C.step,68);w.drainEffects();w.bullets=w.bullets.filter(b=>b.hostile);
  for(const b of w.bullets){velocities.add(b.vx);if(Math.min(b.py,b.y)-31<=C.playerY&&Math.max(b.py,b.y)+31>=C.playerY){
   expect(forecast[Math.floor(f/6)].some(([lo,hi])=>lo<=b.x-27&&hi>=b.x+27)).toBe(true);crossings++;
  }}
 }
 expect(crossings).toBeGreaterThan(0);expect(velocities.has(-130)).toBe(true);expect(velocities.has(130)).toBe(true);expect(w.player.hp).toBe(3);
});
