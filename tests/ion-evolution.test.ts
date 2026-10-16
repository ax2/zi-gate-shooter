import {it,expect} from 'vitest';
import {World,type Body} from '../src/core/world';
import {C} from '../src/core/config';
import {buildPreview} from '../src/game/build-preview';
import {runReport} from '../src/game/run-report';
import {ION_ORB,ION_SPEAR,type IonAugment} from '../src/core/ion-storm';
function setup(option?:IonAugment){
 const w=new World();w.growth.mastery=20;for(let i=0;i<5;i++)w.chooseBuild('electric');
 w.phase='recovery';const p=w.spawn('pickup',360,C.playerY,3);p.weaponKind='arc';w.step(C.step,360);w.drainEffects();
 w.phase='boss';w.player.x=w.player.px=68;if(option)expect(w.chooseBuild('electric',option)).toBe(true);return w;
}
function enemy(w:World,x=360,y=600,kind:'armor'|'guard'|'elite'|'boss'='armor'){
 const b=w.spawn(kind,x,y);b.hp=b.maxHp=1000;b.speed=0;b.timer=999;return b;
}
function fire(w:World,b:Body){w.bullets=[{id:99999,x:b.x,y:b.y,px:b.x,py:b.y,vx:0,vy:0,damage:10,age:0,active:true,hostile:false,weaponKind:'arc'}];w.step(C.step,68);w.drainEffects();}
function charge(w:World,b:Body){for(let i=0;i<6;i++)fire(w,b);expect(w.ionBursts).toBe(1);}
function advance(w:World,n:number,x=68){for(let i=0;i<n;i++){w.bullets=[];w.step(C.step,x);w.drainEffects();}}
it('requires real T3 arc, two refinements and resolves an available magnetic choice first',()=>{
 const w=setup();expect(w.canRefineIon()).toBe(true);
 const p=w.spawn('pickup',360,C.playerY,2);p.weaponKind='blast';w.player.x=w.player.px=360;w.phase='recovery';w.step(C.step,360);w.phase='boss';
 expect(w.canRefineMagnetic()).toBe(true);const saved=JSON.stringify(w);expect(w.chooseBuild('electric','ion-orb')).toBe(false);expect(JSON.stringify(w)).toBe(saved);
 expect(w.chooseBuild('electric','field-wide')).toBe(true);expect(w.chooseBuild('electric','ion-orb')).toBe(true);
 const low=new World();low.growth.mastery=20;for(let i=0;i<5;i++)low.chooseBuild('electric');expect(low.chooseBuild('electric','ion-orb')).toBe(false);
});
it.each(['ion-orb','ion-spear'] as const)('%s previews without mutation, retains charge/weapons, adds normal refinement and cannot swap',option=>{
 const w=setup(),a=enemy(w);fire(w,a);const saved=JSON.stringify(w),preview=buildPreview(w,'electric',option),old=w.activeWeapons.map(k=>[k,w.weaponStage(k)]);
 expect(preview.valid).toBe(true);expect(JSON.stringify(w)).toBe(saved);expect(w.chooseBuild('optical',option)).toBe(false);
 expect(w.chooseBuild('electric',option)).toBe(true);expect(w.ionCharge).toBe(1);expect(w.build.refinements.electric).toBe(3);
 expect(w.profileFor('arc').damage).toEqual(preview.after.damage);expect(w.profileFor('arc').damage[0]).toBeGreaterThan(preview.before.damage[0]);expect(w.activeWeapons.map(k=>[k,w.weaponStage(k)])).toEqual(old);
 expect(runReport(w,[],[]).routes[1]).toContain(option==='ion-orb'?'巡航雷核':'分岔雷矛');
 const chosen=JSON.stringify(w);expect(w.chooseBuild('electric',option==='ion-orb'?'ion-spear':'ion-orb')).toBe(false);expect(JSON.stringify(w)).toBe(chosen);
 expect(w.chooseBuild('electric')).toBe(true);expect(w.build.ionAugment).toBe(option);
});
it('orb moves forward and pulses at three real instants, caps each pulse and never chains or charges rewards',()=>{
 const w=setup('ion-orb'),a=enemy(w),b=enemy(w,375,540),c=enemy(w,345,500),d=enemy(w,380,470),gate=w.spawn('gate',600,600),crate=w.spawn('crate',600,500);
 charge(w,a);expect(w.ionOrbs).toHaveLength(1);expect(w.ionOrbHits).toBe(0);const oldCharge=w.ionCharge;
 advance(w,60);expect(w.ionOrbHits).toBeGreaterThan(0);expect(w.ionOrbHits).toBeLessThanOrEqual(6);expect(w.ionOrbs).toHaveLength(0);
 expect(b.hp+c.hp+d.hp).toBeLessThan(3000);expect(w.ionCharge).toBe(oldCharge);expect(w.arcLinks).toBe(0);expect(w.ionBursts).toBe(1);expect(w.ionBonusDamage).toBeCloseTo(w.ionOrbHits*10*ION_ORB.damage);expect(gate.energy).toBe(0);expect(crate.hp).toBe(crate.maxHp);
});
it('diagonal spears hit both wings, pierce twice, exclude the origin and do not recurse',()=>{
 const w=setup('ion-spear'),a=enemy(w),left=enemy(w,260,488),right=enemy(w,460,488),far=enemy(w,160,388),third=enemy(w,60,288);
 charge(w,a);const originHp=a.hp,thirdHp=third.hp;expect(w.ionSpearShots).toBe(2);w.player.x=w.player.px=652;advance(w,20,652);
 expect(a.hp).toBe(originHp);expect(left.hp).toBeLessThan(1000);expect(right.hp).toBeLessThan(1000);expect(far.hp).toBeLessThan(1000);expect(third.hp).toBe(thirdHp);
 expect(w.ionSpearHits).toBe(3);expect(w.ionBonusDamage).toBeCloseTo(3*10*ION_SPEAR.damage);expect(w.ionCharge).toBe(0);expect(w.arcLinks).toBe(0);
});
it.each(['crate','gate','guard','protected'] as const)('spears stop at %s, never farming a reward or shield-protected neighbor',kind=>{
 const w=setup('ion-spear'),a=enemy(w);const b=kind==='crate'||kind==='gate'?w.spawn(kind,260,488):enemy(w,260,488,kind==='guard'?'guard':'armor');b.speed=0;b.timer=999;if(kind==='protected')b.dropGrace=2;
 const old=b.hp,behind=enemy(w,160,388);charge(w,a);const behindHp=behind.hp;advance(w,20);expect(behind.hp).toBe(behindHp);expect(b.energy).toBe(0);
 expect(b.hp).toBe(kind==='guard'?old-10*ION_SPEAR.damage*.5:old);expect(w.ionSpearHits).toBe(kind==='guard'?1:0);
});
it.each(['crate','gate','guard'] as const)('orb is absorbed by %s before it can pulse through the cover',kind=>{
 const w=setup('ion-orb'),a=enemy(w);charge(w,a);const b=kind==='guard'?enemy(w,360,650,'guard'):w.spawn(kind,360,650);b.speed=0;b.timer=999;const old=b.hp;
 advance(w,30);expect(w.ionOrbs).toHaveLength(0);expect(w.ionOrbHits).toBe(0);expect(b.hp).toBe(old);expect(b.energy).toBe(0);
});
it('boss victory stops bonus damage, gives one reward and clears both pools; restart is empty',()=>{
 const w=setup('ion-spear'),a=enemy(w),boss=enemy(w,260,488,'boss'),behind=enemy(w,160,388,'elite');charge(w,a);boss.hp=1;const behindHp=behind.hp;w.player.x=w.player.px=652;advance(w,20,652);
 expect(w.ionSpearHits).toBe(1);expect(w.bossWins).toBe(1);expect(w.phase).toBe('recovery');expect(w.kills).toBe(1);expect(behind.hp).toBe(behindHp);expect(w.growth.energy).toBe(C.killCharge.boss);expect(w.ionSpears).toHaveLength(0);expect(w.ionOrbs).toHaveLength(0);expect(new World().build.ionAugment).toBeUndefined();
});
it('derived projectiles cannot damage above the combat strip and clear when combat ends',()=>{
 const w=setup('ion-spear'),a=enemy(w,360,C.playerShotTop+50);charge(w,a);const hidden=enemy(w,260,C.playerShotTop-60);advance(w,20);expect(hidden.hp).toBe(1000);
 const o=setup('ion-orb');charge(o,enemy(o));o.phase='recovery';advance(o,1);expect(o.ionOrbs).toHaveLength(0);expect(o.ionOrbHits).toBe(0);
});

it('solo fallback sends just one spear into the original target, without recursive charge or double dipping',()=>{
 const w=setup('ion-spear'),a=enemy(w);charge(w,a);const hp=a.hp;advance(w,15);
 expect(a.hp).toBeCloseTo(hp-10*ION_SPEAR.damage);expect(w.ionSpearHits).toBe(1);expect(w.ionCharge).toBe(0);expect(w.ionBursts).toBe(1);
});
