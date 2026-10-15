import {it,expect} from 'vitest';
import {World} from '../src/core/world';
import {C} from '../src/core/config';
import {ARC_SHOT} from '../src/core/weapons';
function setup(){const w=new World();w.weaponKind='arc';return w;}
function enemy(w:World,x:number,y=500){const b=w.spawn('armor',x,y);b.speed=0;b.timer=999;return b;}
it('launches toward a nearby visible enemy at fixed speed, without moving or damaging it instantly',()=>{
 const w=setup(),b=enemy(w,480);w.step(C.step,360);const shot=w.bullets.find(b=>b.weaponKind==='arc')!;
 expect(shot.vx).toBeGreaterThan(0);expect(Math.hypot(shot.vx,shot.vy)).toBeCloseTo(ARC_SHOT.speed);expect(b.hp).toBe(b.maxHp);
 const velocity=[shot.vx,shot.vy];b.x=200;w.step(C.step,360);expect([shot.vx,shot.vy]).toEqual(velocity);
});
it('prefers the closest forward enemy with deterministic ties, rather than aiming at arbitrary distant targets',()=>{
 const w=setup();enemy(w,240,500);enemy(w,440,700);w.step(C.step,360);expect(w.bullets[0].vx).toBeGreaterThan(0);
});
it.each(['crate','gate'] as const)('keeps an aimed %s on the straight shot, without auto-steering to enemies',kind=>{
 const w=setup(),reward=w.spawn(kind,360,700);reward.speed=0;enemy(w,480,500);w.step(C.step,360);expect(w.bullets[0].vx).toBe(0);
 for(let i=0;i<12;i++)w.step(C.step,360);expect(kind==='gate'?reward.energy>0:reward.hp<reward.maxHp).toBe(true);
});
it('does not acquire off-strip, too close, protected, rear or far-side targets',()=>{
 for(const [x,y,protectedEntry] of [[360,200,false],[410,900,false],[450,500,true],[360,1100,false],[600,500,false]] as const){
 const w=setup(),b=enemy(w,x,y);if(protectedEntry)b.dropGrace=.45;w.step(C.step,360);expect(w.bullets[0].vx).toBe(0);
 }
 const w=setup();w.phase='boss-entry';enemy(w,480);w.step(C.step,360);expect(w.bullets).toHaveLength(0);
});
it('still collides with an intervening closed shield, rather than teleporting damage to its aim target',()=>{
 const w=setup(),guard=w.spawn('guard',360,700),rear=enemy(w,360,400);guard.speed=0;guard.timer=999;
 for(let i=0;i<16;i++)w.step(C.step,360);expect(guard.hp).toBeLessThan(guard.maxHp);expect(rear.hp).toBe(rear.maxHp);expect(w.arcLinks).toBe(0);
});
it('gets real chain damage in a cumulative pulse/arc/scatter build against a normal-health protected arrival row',()=>{
 const w=new World();w.growth.stage=2;w.growth.mastery=2;w.chooseBuild('electric');w.chooseBuild('electric','spread');
 const item=w.spawn('pickup',246,C.playerY,2);item.weaponKind='scatter';w.player.x=246;w.step(C.step,246);
 for(const x of [180,240,300]){const b=w.spawn('drone',x,360);b.dropGrace=.45;}
 for(let i=0;i<60;i++)w.step(C.step,246);
 expect(w.activeWeapons).toEqual(expect.arrayContaining(['pulse','arc','scatter']));expect(w.dropKills).toBe(3);expect(w.arcLinks).toBeGreaterThan(0);
});
