import {it,expect} from 'vitest';import {World} from '../src/core/world';import {C} from '../src/core/config';import {permanentPower} from '../src/core/rewards';import {buildPreview} from '../src/game/build-preview';
function setup(arcStage=2,refine=true){const w=new World();w.growth.mastery=4;for(let i=0;i<(refine?4:3);i++)w.chooseBuild('optical');w.phase='recovery';const p=w.spawn('pickup',360,C.playerY,arcStage);p.weaponKind='arc';w.step(C.step,360);w.drainEffects();w.phase='boss';return w;}
function enemy(w:World,x:number,y:number,kind:'armor'|'guard'|'boss'|'elite'='armor'){const b=w.spawn(kind,x,y);b.hp=b.maxHp=10000;b.speed=0;b.timer=999;return b;}
const damage=(w:World)=>w.supportProfile().laserDamage*(1+permanentPower(w.growth)/100);
it('requires the earned first optical refinement and an actually owned tier2 arc',()=>{
 expect(setup(1).laserChainUnlocked()).toBe(false);expect(setup(2,false).laserChainUnlocked()).toBe(false);expect(setup().laserChainUnlocked()).toBe(true);
 const w=new World();w.growth.stage=3;w.growth.mastery=4;for(let i=0;i<4;i++)w.chooseBuild('optical');expect(w.laserChainUnlocked()).toBe(false);
});
it('retains full direct penetration and burns while adding exactly two nonrecursive, unvisited neighbors',()=>{
 const w=setup(),source=enemy(w,360,700),line=enemy(w,360,500),a=enemy(w,500,700),b=enemy(w,550,600),far=enemy(w,80,400);const d=damage(w);
 w.step(C.step,360);const events=w.drainEffects();expect(source.hp).toBeCloseTo(10000-d);expect(line.hp).toBeCloseTo(10000-d);
 expect(a.hp).toBeCloseTo(10000-d*.8);expect(b.hp).toBeCloseTo(10000-d*.64);expect(far.hp).toBe(10000);expect(w.laserArcHits).toBe(2);expect(events.filter(e=>e.type==='laser-arc')).toHaveLength(2);
 expect(source.burnTicks).toBe(3);expect(a.burnTicks).toBeUndefined();expect(a.capacitorHits).toBeUndefined();expect(w.ionCharge).toBe(0);expect(w.arcLinks).toBe(0);expect(w.fractureBursts).toBe(0);
});
it('announces once when the last optical point completes the recipe, with read-only accurate preview',()=>{
 const w=setup(2,false),before=JSON.stringify(w);expect(buildPreview(w,'optical').plan).toContain('本次组合：电光连锁');expect(JSON.stringify(w)).toBe(before);
 expect(w.chooseBuild('optical')).toBe(true);expect(w.drainEffects().filter(e=>e.type==='combination')).toHaveLength(1);
 w.growth.mastery=6;w.chooseBuild('optical');expect(w.drainEffects().filter(e=>e.type==='combination')).toHaveLength(0);
});
it('breaking an arc box never unlocks it until actual collection, then retains all old guns',()=>{
 const w=new World();w.growth.mastery=4;for(let i=0;i<4;i++)w.chooseBuild('optical');w.phase='boss';const box=w.spawn('crate',360,700,2);box.weaponKind='arc';box.hp=1;box.speed=0;
 w.step(C.step,360);expect(w.laserChainUnlocked()).toBe(false);expect(w.drainEffects().some(e=>e.type==='combination')).toBe(false);
 const pickup=w.bodies.find(b=>b.kind==='pickup')!;pickup.y=pickup.py=C.playerY;w.step(C.step,360);
 expect(w.laserChainUnlocked()).toBe(true);expect(w.activeWeapons).toEqual(['pulse','arc']);expect(w.drainEffects().filter(e=>e.type==='combination')).toHaveLength(1);
});
it.each(['crate','gate','guard','protected'] as const)('a blocked first hit (%s) never becomes a chain source',kind=>{
 const w=setup(),source=kind==='protected'?enemy(w,360,700):kind==='guard'?enemy(w,360,700,'guard'):w.spawn(kind,360,700);source.speed=0;source.hp=source.maxHp=10000;if(kind==='protected')source.dropGrace=1;
 const neighbor=enemy(w,510,700);w.step(C.step,360);w.drainEffects();expect(neighbor.hp).toBe(10000);expect(w.laserArcHits).toBe(0);expect(w.laserChainReady).toBe(false);
});
it('a nearby closed shield intercepts neighbor jumps, without charging rewards or farming behind it',()=>{
 const w=setup();enemy(w,360,700);const shield=enemy(w,450,700,'guard'),behind=enemy(w,550,700),gate=w.spawn('gate',600,800),crate=w.spawn('crate',600,750);
 w.step(C.step,360);w.drainEffects();expect(shield.hp).toBe(10000);expect(behind.hp).toBe(10000);expect(w.laserArcHits).toBe(0);expect(gate.energy).toBe(0);expect(crate.hp).toBe(crate.maxHp);
});
it('a laser boss victory produces no chain or extra deaths among cleared escorts',()=>{
 const w=setup(),boss=enemy(w,360,C.bossY,'boss'),side=enemy(w,500,430);boss.hp=1;w.step(C.step,360);w.drainEffects();expect(w.phase).toBe('recovery');expect(w.bossWins).toBe(1);expect(w.kills).toBe(1);expect(side.hp).toBe(10000);expect(w.laserArcHits).toBe(0);
});
it('empty beams retain only one payload, released by an actual arc impact after its original chain',()=>{
 const w=setup();for(let i=0;i<360;i++){w.step(C.step,68);w.drainEffects();}
 expect(w.laserChainReady).toBe(true);expect(w.laserArcHits).toBe(0);
 const a=enemy(w,360,600),b=enemy(w,460,600),c=enemy(w,560,600),d=damage(w);
 w.bullets=[{id:99999,x:a.x,y:a.y,px:a.x,py:a.y,vx:0,vy:0,damage:10,age:0,active:true,hostile:false,weaponKind:'arc',chainHops:1}];
 w.step(C.step,68);const events=w.drainEffects();expect(a.hp).toBe(9990);expect(b.hp).toBeCloseTo(10000-6.5-d*.8);expect(c.hp).toBeCloseTo(10000-d*.64);
 expect(w.arcLinks).toBe(1);expect(w.laserArcHits).toBe(2);expect(w.laserChainReady).toBe(false);
 expect(events.findIndex(e=>e.type==='arc')).toBeLessThan(events.findIndex(e=>e.type==='laser-arc'));
 w.bullets=[{id:100000,x:a.x,y:a.y,px:a.x,py:a.y,vx:0,vy:0,damage:10,age:0,active:true,hostile:false,weaponKind:'arc'}];w.step(C.step,68);w.drainEffects();expect(w.laserArcHits).toBe(2);expect(new World().laserChainReady).toBe(false);
});
it('stored payload waits through blocked or protected contacts, then focuses on the lone open target',()=>{
 const w=setup();w.step(C.step,68);w.drainEffects();const a=enemy(w,360,600,'guard'),b=enemy(w,510,600);
 const impact=()=>{w.bullets=[{id:99999,x:a.x,y:a.y,px:a.x,py:a.y,vx:0,vy:0,damage:10,age:0,active:true,hostile:false,weaponKind:'arc'}];w.step(C.step,68);return w.drainEffects();};
 expect(impact().some(e=>e.type==='laser-arc')).toBe(false);expect(b.hp).toBe(10000);expect(w.laserChainReady).toBe(true);
 a.burst=1;a.dropGrace=1;expect(impact().some(e=>e.type==='laser-arc')).toBe(false);expect(w.laserChainReady).toBe(true);
 b.active=false;a.dropGrace=0;const before=a.hp,events=impact();expect(w.laserArcHits).toBe(0);expect(w.laserFocusHits).toBe(1);expect(a.hp).toBeCloseTo(before-10-damage(w)*.8);expect(events.filter(e=>e.type==='laser-focus')).toHaveLength(1);expect(w.laserChainReady).toBe(false);
});
it.each(['pulse','scatter','pierce','blast','arc'] as const)('a real %s contact can spend one payload without replacing or recursively changing its original damage',kind=>{
 const w=setup();w.step(C.step,68);w.drainEffects();const a=enemy(w,360,600),b=enemy(w,510,600),c=enemy(w,600,600),d=damage(w);
 w.bullets=[{id:99999,x:a.x,y:a.y,px:a.x,py:a.y,vx:0,vy:0,damage:10,age:0,active:true,hostile:false,weaponKind:kind}];w.step(C.step,68);const effects=w.drainEffects();
 expect(a.hp).toBe(9990);expect(b.hp).toBeCloseTo(10000-d*.8);expect(c.hp).toBeCloseTo(10000-d*.64);expect(w.laserArcHits).toBe(2);expect(w.laserFocusHits).toBe(0);expect(w.laserChainReady).toBe(false);expect(effects.filter(e=>e.type==='laser-arc')).toHaveLength(2);expect(w.activeWeapons).toEqual(['pulse','arc']);
});
it('main laser adds one real solo discharge, keeps burn, and a lethal original hit cannot create phantom extra damage',()=>{
 const w=setup(),a=enemy(w,360,600),d=damage(w);w.step(C.step,360);w.drainEffects();expect(a.hp).toBeCloseTo(10000-d*1.8);expect(a.burnTicks).toBe(3);expect(w.laserFocusHits).toBe(1);expect(w.laserArcHits).toBe(0);expect(w.laserChainReady).toBe(false);
 const lethal=setup(),b=enemy(lethal,360,600);b.hp=1;lethal.step(C.step,360);expect(lethal.kills).toBe(1);expect(lethal.laserFocusHits).toBe(0);expect(lethal.laserChainReady).toBe(true);
});
it('an outside-strip source or a nearby blocked neighbor never releases focus around protection',()=>{
 for(const blocked of [true,false]){const w=setup();w.step(C.step,68);w.drainEffects();const a=enemy(w,360,blocked?600:220);if(blocked)enemy(w,510,600,'guard');
 w.bullets=[{id:99999,x:360,y:blocked?600:250,px:360,py:blocked?600:250,vx:0,vy:0,damage:10,age:0,active:true,hostile:false,weaponKind:'pulse'}];w.step(C.step,68);expect(a.hp).toBe(9990);expect(w.laserFocusHits).toBe(0);expect(w.laserArcHits).toBe(0);expect(w.laserChainReady).toBe(true);}
});
it('solo discharge does not fake the chain-only proof, and a focus kill gives exactly one ordinary reward',()=>{
 const w=setup();w.phase='running';expect(w.acceptContract('research','photon')).toBe(true);w.phase='boss';enemy(w,360,600);
 for(let i=0;i<8*60;i++){w.step(C.step,360);w.drainEffects();}
 expect(w.laserFocusHits).toBeGreaterThanOrEqual(4);expect(w.laserArcHits).toBe(0);expect(w.contract!.proofProgress).toBe(0);expect(w.proofWins).toBe(0);
 const lethal=setup(),a=enemy(lethal,360,600,'elite');a.hp=damage(lethal)*1.5;lethal.step(C.step,360);const effects=lethal.drainEffects();expect(lethal.kills).toBe(1);expect(lethal.laserFocusHits).toBe(1);expect(lethal.growth.energy).toBe(C.killCharge.elite);expect(effects.filter(e=>e.type==='kill')).toHaveLength(1);expect(lethal.laserChainReady).toBe(false);
});
