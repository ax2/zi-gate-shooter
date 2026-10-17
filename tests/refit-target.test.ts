import {it,expect} from 'vitest';
import {contextGuide} from '../src/game/context-guide';
import {World} from '../src/core/world';import {C} from '../src/core/config';
function setup(round=2){const w=new World(1337,round);w.growth.mastery=1;w.chooseBuild('ballistic');return w;}
function supply(w:World){w.roundTime=15.99;Object.assign(w,{scheduled:[{at:16,kind:'armory',x:360}],scheduleIndex:0});w.step(C.step,68);return w.bodies.filter(b=>b.active&&b.kind==='crate');}
it('accepts only owned targets, does not upgrade or spend anything, and can restore automatic',()=>{
 const w=setup(),before=w.activeWeapons.map(k=>w.profileFor(k));const growth={...w.growth};expect(w.setRefitTarget('pulse')).toBe(true);expect(w.setRefitTarget('arc')).toBe(false);expect(w.refitTarget).toBe('pulse');expect(w.activeWeapons.map(k=>w.profileFor(k))).toEqual(before);expect(w.growth).toEqual(growth);expect(w.refitsClaimed).toBe(0);expect(w.setRefitTarget()).toBe(true);expect(w.refitTarget).toBeUndefined();
});
it('changes only future depth offers while retaining discovery and first-chapter behavior',()=>{
 for(const round of [1,2]){const w=setup(round);w.setRefitTarget('pulse');const crates=supply(w);expect(crates).toHaveLength(2);if(round===1){expect(crates.every(b=>!b.refit&&!b.directedRefit)).toBe(true);}else{expect(crates.some(b=>b.refit&&b.weaponKind==='pulse'&&b.directedRefit)).toBe(true);expect(crates.some(b=>!b.refit&&!w.activeWeapons.includes(b.weaponKind!))).toBe(true);}}
 const w=setup();const initial=supply(w).map(b=>({id:b.id,kind:b.weaponKind,refit:b.refit,directed:b.directedRefit}));w.setRefitTarget('pulse');expect(w.bodies.filter(b=>b.kind==='crate').map(b=>({id:b.id,kind:b.weaponKind,refit:b.refit,directed:b.directedRefit}))).toEqual(initial);
});
it('directed crate still requires break then pickup; one selected upgrade keeps all other weapons',()=>{
 const w=setup();w.setRefitTarget('pulse');const boxes=supply(w),box=boxes.find(b=>b.directedRefit)!;const old=w.activeWeapons.map(k=>({kind:k,profile:w.profileFor(k)})),levels=w.activeWeapons.map(k=>w.weaponStage(k));
 box.x=box.px=360;box.y=box.py=800;box.speed=0;box.hp=1;w.bullets.push({id:99999,x:360,y:820,px:360,py:820,vx:0,vy:-1200,damage:10,age:0,active:true,hostile:false});w.step(C.step,360);w.drainEffects();expect(w.refitsClaimed).toBe(0);expect(w.activeWeapons.map(k=>w.weaponStage(k))).toEqual(levels);
 const pickup=w.bodies.find(b=>b.active&&b.kind==='pickup')!;expect(pickup.directedRefit).toBe(true);pickup.y=pickup.py=C.playerY;pickup.speed=0;w.step(C.step,360);expect(w.refitsClaimed).toBe(1);expect(w.weaponStage('pulse')).toBe(2);expect(w.profileFor('scatter')).toEqual(old.find(o=>o.kind==='scatter')!.profile);expect(w.bodies.some(b=>b.row===box.row)).toBe(false);w.step(C.step,360);expect(w.refitsClaimed).toBe(1);
});
it('restored automatic uses the existing route-derived focus and new runs carry no order',()=>{const w=setup();w.setRefitTarget('pulse');w.setRefitTarget();expect(supply(w).find(b=>b.refit)?.weaponKind).toBe('scatter');expect(new World().refitTarget).toBeUndefined();});

it('supply guidance makes optional planning discoverable without overriding an imminent attack',()=>{const w=setup();supply(w);expect(contextGuide(w).detail).toContain('暂停→当前火力');w.setRefitTarget('pulse');expect(contextGuide(w).detail).toContain('拾取');const sniper=w.spawn('sniper',360,500);sniper.warning=1;expect(contextGuide(w).kind).toBe('enemy');});
