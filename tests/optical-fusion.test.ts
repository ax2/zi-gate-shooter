import{it,expect}from'vitest';import{World}from'../src/core/world';import{BuildTree,OPTICAL_FUSION,type OpticalBranch,type OpticalFusion,hasOptical}from'../src/core/build-tree';import{C}from'../src/core/config';import{buildPreview}from'../src/game/build-preview';import{runReport}from'../src/game/run-report';
const pairs=([['burn','relay'],['burn','mirror'],['relay','burn'],['relay','mirror'],['mirror','burn'],['mirror','relay']]as const);
function ready(base:OpticalBranch){const w=new World();w.growth.mastery=30;w.chooseBuild('optical');w.chooseBuild('optical',base);w.chooseBuild('optical');for(let i=0;i<OPTICAL_FUSION.refinements;i++)w.chooseBuild('optical');w.drainEffects();return w;}
function target(w:World,x:number,y:number){const b=w.spawn('armor',x,y);b.hp=b.maxHp=100000;b.speed=0;b.timer=999;return b;}
function step(w:World,n=1){let effects:ReturnType<World['drainEffects']>=[];for(let i=0;i<n;i++){w.bullets=[];w.step(C.step,360);effects.push(...w.drainEffects());}return effects;}
it.each(pairs)('%s + %s retains the first lens and weapons, gains ordinary refinement once and produces both real optical effects',(base,extra)=>{
 const w=ready(base),before=w.supportProfile(),owned=[...w.activeWeapons],spent=w.build.spent;
 expect(w.chooseBuild('optical',('optic-'+extra)as OpticalFusion)).toBe(true);expect(w.build.opticalBranch).toBe(base);expect(w.build.opticalFusion).toBe(extra);expect(w.build.spent).toBe(spent+1);expect(w.build.refinements.optical).toBe(7);expect(w.activeWeapons).toEqual(owned);
 const after=w.supportProfile();expect(after.laserInterval).toBe(before.laserInterval);expect(after.laserTargets).toBe(before.laserTargets);expect(after.laserDamage).toBeCloseTo(before.laserDamage*1.7/1.6);
 target(w,360,600);target(w,460,600);target(w,540,744);const effects=step(w,55);
 if(hasOptical(w.build,'burn'))expect(w.burnHits).toBe(3);if(hasOptical(w.build,'relay'))expect(w.relayHits).toBe(1);if(hasOptical(w.build,'mirror')){expect(w.mirrorShots).toBe(1);expect(w.mirrorHits).toBeGreaterThan(0);expect(effects.some(e=>e.type==='mirror-laser')).toBe(true);}expect(w.bodies.filter(b=>b.active).every(b=>b.hp>0)).toBe(true);
 const report=runReport(w,[],[]).mechanics.join(' · ');for(const kind of[base,extra])expect(report).toContain(({burn:'灼烧',relay:'分光',mirror:'折返'})[kind]);
 const state=JSON.stringify(w);expect(w.chooseBuild('optical',('optic-'+base)as OpticalFusion)).toBe(false);expect(JSON.stringify(w)).toBe(state);
});
it('rejects wrong route, repeated lens, missing points or early fusion without mutation',()=>{
 for(const mode of['early','no-points','same','wrong-route']as const){const w=ready('burn');if(mode==='early')w.build.refinements.optical--;if(mode==='no-points')w.growth.mastery=w.build.spent;const state=JSON.stringify(w);expect(w.chooseBuild(mode==='wrong-route'?'electric':'optical',mode==='same'?'optic-burn':'optic-relay')).toBe(false);expect(JSON.stringify(w)).toBe(state);}
 const tree=new BuildTree();expect(tree.choose('optical',30,'optic-relay')).toBe(false);expect(new World().build.opticalFusion).toBeUndefined();
});
it('preserves photon priority and permits regular refinement while fusion is deferred',()=>{
 const w=ready('burn');w.chooseBuild('electric');
 const pickup=w.spawn('pickup',360,C.playerY,2);pickup.weaponKind='arc';w.step(C.step,360);w.drainEffects();expect(w.canRefinePhoton()).toBe(true);expect(w.canFuseOptics()).toBe(false);const before=JSON.stringify(w);expect(w.chooseBuild('optical','optic-relay')).toBe(false);expect(JSON.stringify(w)).toBe(before);
 expect(w.chooseBuild('optical','photon-reach')).toBe(true);expect(w.canFuseOptics()).toBe(true);const spent=w.build.spent;expect(w.chooseBuild('optical')).toBe(true);expect(w.build.spent).toBe(spent+1);expect(w.canFuseOptics()).toBe(true);expect(w.chooseBuild('optical','optic-relay')).toBe(true);expect(w.build.photonAugment).toBe('photon-reach');
});
it('preview remains read-only and reports the actual retained pair and ordinary damage gain',()=>{
 const w=ready('mirror'),state=JSON.stringify(w),p=buildPreview(w,'optical','optic-burn');expect(p.valid).toBe(true);expect(p.plan).toContain('折返＋灼热');expect(p.gain).toContain('追加灼热');expect(p.laserAfter.laserDamage).toBeGreaterThan(p.laserBefore.laserDamage);expect(JSON.stringify(w)).toBe(state);expect(buildPreview(w,'optical').plan).toContain('二选一');
});
it('a fused burn/relay keeps primary reward blockers, closed shields and off-strip enemies safe from burn',()=>{
 for(const kind of['crate','gate','guard']as const){const w=ready('relay');w.chooseBuild('optical','optic-burn');const b=w.spawn(kind,360,700);b.speed=0;b.timer=999;const rear=target(w,360,400),hidden=target(w,360,200);step(w,55);expect(w.burnHits).toBe(0);expect(rear.hp).toBe(100000);expect(hidden.hp).toBe(100000);expect(w.pickups).toBe(0);expect(w.gatesTaken).toBe(0);}
});
