import {it,expect} from 'vitest';
import {World} from '../src/core/world';
import {C} from '../src/core/config';
it('round depth increases enemy durability without reading player growth',()=>{
 const low=new World(1,7),high=new World(1,7);
 high.growth.stage=3;high.growth.mastery=100;high.growth.bonus=100;
 for(const kind of ['boss','guard','elite','armor','sniper','charger','drone'] as const){
  const a=low.spawn(kind,360),b=high.spawn(kind,360);
  expect(a.hp).toBe(b.hp);
  expect(a.hp).toBeGreaterThanOrEqual(C.enemies[kind].hp);
 }
 expect(low.spawn('drone',360).hp).toBe(C.enemies.drone.hp);
 expect(low.spawn('boss',360).hp).toBeGreaterThan(new World(1,4).spawn('boss',360).hp);
});
it('the first boss emits real shots before two seconds of combat and keeps a local charge period',()=>{
 const w=new World();w.phase='boss';w.player.x=68;w.player.px=68;
 const boss=w.spawn('boss',360,260);let firstShot=0,warningTime=0;
 for(let i=0;i<120;i++){
  w.step(C.step,68);w.drainEffects();
  if(boss.warning>0&&!warningTime)warningTime=w.time;
  if(w.bullets.some(b=>b.hostile)&&!firstShot)firstShot=w.time;
 }
 expect(warningTime).toBeCloseTo(.45);expect(firstShot).toBeCloseTo(1.8);
 expect(firstShot-warningTime).toBeCloseTo(1.35);
});
