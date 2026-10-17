import{it,expect}from'vitest';import{World,type Body}from'../src/core/world';import{C}from'../src/core/config';import{ballisticWeapons,weaponProfile,type BallisticWeapon}from'../src/core/weapons';import type{BallisticBranch}from'../src/core/build-tree';import{buildPreview}from'../src/game/build-preview';
function setup(kind:BallisticWeapon,branch:BallisticBranch){const w=new World();(w as any).scheduled=[];w.player.x=w.player.px=68;w.weaponKind=kind;w.growth.stage=3;w.growth.mastery=2;w.chooseBuild('ballistic');w.chooseBuild('ballistic',branch);return w;}
function target(w:World,x=360,y=600,kind:Body['kind']='armor'){const b=w.spawn(kind,x,y);b.hp=b.maxHp=1000;b.speed=0;b.timer=999;return b;}
let id=208000;
function fire(w:World,kind:BallisticWeapon,moving=false){const p=w.profileFor(kind);w.bullets=[{id:id++,x:360,y:moving?730:600,px:360,py:moving?730:600,vx:0,vy:moving?-1200:0,damage:10,age:0,active:true,hostile:false,weaponKind:kind,remainingTargets:p.targets,hitBodies:[],splashRadius:p.splashRadius,chainHops:p.chainHops}];const effects=[];for(let i=0;i<(moving?30:1);i++){w.step(C.step,68);effects.push(...w.drainEffects());}return effects;}
it('all four ballistic profiles gain the shared base multiplier while preserving native rate, fan, and higher target/radius limits',()=>{
 for(const kind of ballisticWeapons)for(const branch of ['penetrator','fragment','ricochet']as const){const w=setup(kind,branch),p=w.profileFor(kind),base=weaponProfile(kind,3);expect(p.damage).toEqual(base.damage.map(n=>n*1.3));expect(p.rate).toBe(base.rate);expect(p.offsets).toEqual(base.offsets);expect(p.targets).toBeGreaterThanOrEqual(base.targets);expect(p.splashRadius??0).toBeGreaterThanOrEqual(base.splashRadius??0);if(branch==='penetrator')expect(p.targets).toBeGreaterThanOrEqual(2);if(branch==='fragment')expect(p.splashRadius).toBe(140);const arc=w.profileFor('arc');expect(arc.damage).toEqual(weaponProfile('arc',w.weaponStage('arc')).damage);}
});
it.each(ballisticWeapons)('%s actually penetrates its preserved target count without repeat hits',kind=>{
 const w=setup(kind,'penetrator'),a=target(w),b=target(w,360,450),c=target(w,360,300);fire(w,kind,true);expect(a.hp).toBe(990);expect(b.hp).toBe(990);expect(c.hp).toBe(kind==='pierce'?990:1000);expect(w.ballisticTotals().pierces).toBe(kind==='pierce'?2:1);
});
it.each(ballisticWeapons)('%s has one nonrecursive enemy splash, no reward charging, and truthful source credit',kind=>{
 const w=setup(kind,'fragment'),a=target(w),near=target(w,420),far=target(w,540),gate=target(w,490,600,'gate');const effects=fire(w,kind);expect(a.hp).toBe(990);expect(near.hp).toBe(995);expect(far.hp).toBe(1000);expect(gate.energy).toBe(0);expect(w.ballisticTotals().splashHits).toBe(1);expect(w.combatContributions().find(r=>r.source===kind)?.damage).toBe(15);if(kind==='pulse'||kind==='pierce')expect(effects.some(e=>e.type==='ammo-fragment'&&e.weaponKind===kind)).toBe(true);
});
it.each(ballisticWeapons)('%s ricochets once to a separated target and credits its own weapon, never a second bounce',kind=>{
 const w=setup(kind,'ricochet'),a=target(w),side=target(w,560),third=target(w,680);fire(w,kind);expect(a.hp).toBe(990);expect(side.hp).toBe(994.5);expect(third.hp).toBe(1000);expect(w.ballisticTotals().ricochets).toBe(1);expect(w.combatContributions().find(r=>r.source===kind)?.damage).toBe(15.5);if(kind!=='scatter')expect(w.scatterRicochets).toBe(0);
});
it('new micro-explosions stop at closed shields; the original blast splash remains available',()=>{
 for(const kind of ballisticWeapons){const w=setup(kind,'fragment');const shield=target(w,360,600,'guard'),near=target(w,420);fire(w,kind);expect(shield.hp).toBe(995);expect(near.hp).toBe(kind==='blast'?995:1000);}
});
it.each(['crate','gate']as const)('%s still absorbs all kinds of penetrating ammo without upgrading or farming a rear target',reward=>{
 for(const kind of ballisticWeapons){const w=setup(kind,'penetrator'),b=target(w,360,600,reward),rear=target(w,360,450),owned=[...w.activeWeapons];fire(w,kind,true);expect(rear.hp).toBe(1000);expect(w.activeWeapons).toEqual(owned);expect(w.ballisticTotals().pierces).toBe(0);if(reward==='gate')expect(b.energy).toBe(10);}
});
it('preview exposes every owned ballistic gun, respects higher native piercing, and never spends points or installs an unchosen fork',()=>{
 const w=new World();w.growth.mastery=2;w.chooseBuild('ballistic');for(const kind of ['pierce','blast']as const){const p=w.spawn('pickup',w.player.x,C.playerY,3);p.weaponKind=kind;w.step(C.step,w.player.x);w.drainEffects();}const before=JSON.stringify(w,(_k,v)=>v instanceof Map?[...v]:v);const common=buildPreview(w,'ballistic');expect(common.weaponGains).toHaveLength(4);expect(common.after.targets).toBe(1);expect(common.gain).toContain('4配件');const p=buildPreview(w,'ballistic','penetrator');expect(p.weaponGains.find(r=>r.kind==='pierce')?.after.targets).toBe(3);expect(p.weaponGains.every(r=>r.dpsAfter>r.dpsBefore)).toBe(true);expect(JSON.stringify(w,(_k,v)=>v instanceof Map?[...v]:v)).toBe(before);expect(w.build.spent).toBe(1);
});
