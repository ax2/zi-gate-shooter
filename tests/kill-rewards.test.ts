import { expect, it } from 'vitest';
import { World } from '../src/core/world';
import { C } from '../src/core/config';

function hit(w:World,x:number,y:number){w.bullets.push({id:999,x,y,px:x,py:y,vx:0,vy:0,damage:2,age:0,active:true,hostile:false});}

it.each([2,3])('boss charge is granted once, with truthful armor recovery at %s HP', hp => {
  const w=new World();w.phase='boss';w.player.hp=hp;w.player.x=68;
  w.growth.energy=50;w.growth.mastery=2;
  const boss=w.spawn('boss',360,C.bossY);boss.hp=1;
  hit(w,360,C.bossY);w.step(C.step,68);
  expect(w.phase).toBe('recovery');expect(w.player.hp).toBe(3);
  expect(w.growth.mastery).toBe(3);expect(w.growth.energy).toBe(0);expect(w.growth.overload).toBe(6);
  const events=w.drainEffects(),receipt=events.find(e=>e.type==='victory')!;
  expect(receipt.text).toContain('充能+50');expect(receipt.detail).toContain('激光解锁');
  expect(receipt.detail).toContain(hp===2?'装甲恢复+1':'装甲完好');
  expect(events.filter(e=>e.type==='overload')).toHaveLength(1);
  w.step(C.step,68);expect(w.growth.mastery).toBe(3);expect(w.growth.energy).toBe(0);
  expect(w.drainEffects().some(e=>e.type==='victory')).toBe(false);
});

it('elite charge preserves the remainder and does not grant duplicate rewards', () => {
  const w=new World();w.phase='boss-entry';w.growth.energy=90;
  const elite=w.spawn('elite',360,500);elite.hp=1;elite.speed=0;
  hit(w,360,500);w.step(C.step);
  expect(w.growth.mastery).toBe(1);expect(w.growth.energy).toBe(5);
  expect(w.drainEffects().filter(e=>e.type==='reward')).toHaveLength(1);
  w.step(C.step);expect(w.growth.energy).toBe(5);expect(w.drainEffects().some(e=>e.type==='reward')).toBe(false);
});

it('simultaneous player death still wins over boss recovery and its charge reward', () => {
  const w=new World();w.phase='boss';w.player.hp=1;w.growth.energy=50;
  const boss=w.spawn('boss',360,C.bossY);boss.hp=1;
  hit(w,360,C.bossY);
  w.bullets.push({id:1000,x:360,y:C.playerY,px:360,py:C.playerY,vx:0,vy:0,damage:1,age:0,active:true,hostile:true});
  w.step(C.step);expect(w.phase).toBe('dead');expect(w.growth.energy).toBe(50);
  expect(w.drainEffects().some(e=>e.type==='victory')).toBe(false);
});
