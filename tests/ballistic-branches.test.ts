import {expect,it} from 'vitest';
import {World} from '../src/core/world';
import {C} from '../src/core/config';
import type {BallisticBranch} from '../src/core/build-tree';
import {weaponProfile} from '../src/core/weapons';
function setup(branch:BallisticBranch){const w=new World();w.growth.mastery=2;w.chooseBuild('ballistic');w.chooseBuild('ballistic',branch);w.player.x=w.player.px=68;return w;}
function target(w:World,x=360,y=600,kind:'armor'|'guard'|'boss'='armor'){const b=w.spawn(kind,x,y);b.hp=b.maxHp=1000;b.speed=0;b.timer=999;return b;}
function fire(w:World,x=360,y=730){const p=w.profileFor('scatter');w.bullets=[{id:999999,x,y,px:x,py:y,vx:0,vy:-1200,damage:10,age:0,active:true,hostile:false,weaponKind:'scatter',remainingTargets:p.targets,hitBodies:[],splashRadius:p.splashRadius,chainHops:p.chainHops}];}
function frames(w:World,n=25){for(let i=0;i<n;i++){w.step(C.step,68);w.drainEffects();}}
it('requires an earned immutable ballistic fork and retains damage, pellets, weapons and storm prerequisites',()=>{
 for(const branch of ['penetrator','fragment'] as const){const w=setup(branch),base=weaponProfile('scatter',1),p=w.profileFor('scatter');
 expect(p.damage).toEqual(base.damage.map(n=>n*1.3));expect(p.offsets).toEqual(base.offsets);expect(p.vx).toEqual(base.vx);expect(w.activeWeapons).toEqual(['pulse','scatter']);expect(w.build.spent).toBe(2);
 expect(w.chooseBuild('ballistic',branch==='penetrator'?'fragment':'penetrator')).toBe(false);w.growth.mastery=5;expect(w.chooseBuild('ballistic')).toBe(false);expect(w.chooseBuild('electric')).toBe(true);expect(w.chooseBuild('ballistic')).toBe(true);expect(w.profileFor('scatter').chainHops).toBe(1);
 expect(w.build.ballisticBranch).toBe(branch);expect(w.chooseBuild('ballistic')).toBe(true);expect(w.profileFor('scatter').targets).toBe(p.targets);expect(w.profileFor('scatter').splashRadius).toBe(p.splashRadius);
 }
 const w=new World();w.growth.mastery=2;expect(w.chooseBuild('ballistic','fragment')).toBe(false);w.chooseBuild('ballistic');expect(w.chooseBuild('ballistic','capacitor')).toBe(false);expect(w.build.spent).toBe(1);
});
it('one moving penetrator pellet damages two aligned enemies once and cannot hit a third',()=>{
 const w=setup('penetrator'),a=target(w),b=target(w,360,450),c=target(w,360,300);fire(w);frames(w,30);
 expect(a.hp).toBe(990);expect(b.hp).toBe(990);expect(c.hp).toBe(1000);expect(w.scatterPierces).toBe(1);expect(w.scatterBursts).toBe(0);
});
it.each(['crate','gate','guard'] as const)('a %s absorbs the penetrator pellet before the rear target',kind=>{
 const w=setup('penetrator'),b=w.spawn(kind,360,600),rear=target(w,360,450);b.hp=b.maxHp=1000;b.speed=0;b.timer=999;fire(w);frames(w);
 expect(rear.hp).toBe(1000);expect(w.scatterPierces).toBe(0);if(kind==='gate')expect(b.energy).toBe(10);else expect(b.hp).toBeLessThan(1000);
});
it('fragment adds one nonrecursive enemy splash, not a reward or off-strip hit',()=>{
 const w=setup('fragment'),a=target(w),b=target(w,420),far=target(w,540),off=target(w,360,200),gate=w.spawn('gate',300,580),crate=w.spawn('crate',300,570);gate.speed=crate.speed=0;
 // Keep reward boxes out of the direct finite trajectory while inside the splash radius.
 fire(w);frames(w,10);expect(a.hp).toBe(990);expect(b.hp).toBe(995);expect(far.hp).toBe(1000);expect(off.hp).toBe(1000);expect(gate.energy).toBe(0);expect(crate.hp).toBe(crate.maxHp);expect(w.scatterBursts).toBe(1);expect(w.scatterSplashHits).toBe(1);expect(w.fractureBursts).toBe(0);
});
it('closed shield stops fragment propagation but a nearby open target can still transmit reduced damage to it',()=>{
 const w=setup('fragment'),shield=target(w,360,600,'guard'),b=target(w,420);fire(w);frames(w,10);expect(shield.hp).toBe(995);expect(b.hp).toBe(1000);expect(w.scatterBursts).toBe(0);
 fire(w,420);frames(w,10);expect(b.hp).toBe(990);expect(shield.hp).toBe(992.5);expect(w.scatterBursts).toBe(1);
});
it('neither ballistic fork farms an entry boss through direct or secondary contacts',()=>{
 for(const branch of ['penetrator','fragment'] as const){const w=setup(branch);w.phase='boss-entry';const boss=target(w,420,600,'boss');target(w);fire(w);frames(w,10);expect(boss.hp).toBe(1000);}
});
it('legacy chain, pulse refraction and blast splash respect entry boss protection',()=>{
 for(const kind of ['arc','pulse','blast'] as const){const w=new World();w.growth.mastery=5;w.phase='boss-entry';target(w);const boss=target(w,420,600,'boss');
 w.bullets=[{id:999999,x:360,y:600,px:360,py:600,vx:0,vy:0,damage:10,age:0,active:true,hostile:false,weaponKind:kind,chainHops:kind==='arc'?2:0,splashRadius:kind==='blast'?90:0}];
 w.step(C.step,68);expect(boss.hp).toBe(1000);}
});
