import{it,expect}from'vitest';import{World,type BodyKind}from'../src/core/world';import{C}from'../src/core/config';import{mirrorPath,MIRROR_LASER}from'../src/core/mirror-laser';import{permanentPower}from'../src/core/rewards';import{buildPreview}from'../src/game/build-preview';
import{awardAchievements,emptyAchievements,parseAchievements,achievementGroup}from'../src/core/achievements';
function fixture(x=68){const w=new World();w.growth.mastery=2;w.chooseBuild('optical');w.chooseBuild('optical','mirror');Object.assign(w,{scheduled:[],secondChance:true});w.player.x=w.player.px=x;return w;}
function target(w:World,x=328,y=600,kind:BodyKind='armor'){const b=w.spawn(kind,x,y);b.hp=b.maxHp=1000;b.speed=0;b.timer=999;return b;}
function fire(w:World){w.step(C.step,w.player.x);return w.drainEffects();}
const damage=(w:World)=>w.supportProfile().laserDamage*(1+permanentPower(w.growth)/100);
it('offers a real third optical fork with additive main fire, cooldown gain, unchanged weapons and an honest preview',()=>{
 const w=new World();w.growth.mastery=4;expect(w.chooseBuild('optical','mirror')).toBe(false);w.chooseBuild('optical');const weapons=[...w.activeWeapons],before=w.supportProfile();
 const preview=buildPreview(w,'optical','mirror');expect(preview.valid).toBe(true);expect(preview.plan).toContain('反射1次');expect(w.build.opticalBranch).toBeUndefined();
 expect(w.chooseBuild('optical','mirror')).toBe(true);expect(w.supportProfile().laserDamage).toBe(before.laserDamage);expect(w.supportProfile().laserInterval).toBe(before.laserInterval*.75);expect(w.activeWeapons).toEqual(weapons);expect(w.build.spent).toBe(2);
 expect(w.chooseBuild('optical','burn')).toBe(false);w.chooseBuild('optical');w.chooseBuild('ballistic');expect(w.supportProfile().prism).toBe(true);expect(w.build.opticalBranch).toBe('mirror');
 const events=fire(w);expect(events.filter(e=>e.type==='laser')).toHaveLength(3);expect(events.filter(e=>e.type==='mirror-laser')).toHaveLength(1);
});
it('position changes the bounded one-bounce path with exact left/right symmetry',()=>{
 for(const x of[68,140,270]){const a=mirrorPath(x),b=mirrorPath(720-x);expect(a).toHaveLength(2);for(let i=0;i<2;i++){expect(a[i].x+b[i].x).toBeCloseTo(720);expect(a[i].tx+b[i].tx).toBeCloseTo(720);expect(a[i].y).toBe(b[i].y);expect(a[i].ty).toBe(b[i].ty);}}
 for(let x=68;x<=652;x+=8)for(const s of mirrorPath(x)){expect(s.x).toBeGreaterThanOrEqual(36);expect(s.tx).toBeGreaterThanOrEqual(36);expect(s.tx).toBeLessThanOrEqual(684);expect(s.ty).toBeGreaterThanOrEqual(C.playerShotTop);expect(s.ty).toBeLessThan(s.y);}
 expect(mirrorPath(68)[0].ty).toBeGreaterThan(mirrorPath(360)[0].ty);
});
it('retains the main laser and adds exactly two actual off-axis contacts, stopping before a third',()=>{
 const w=fixture(),main=target(w,68,650),a=target(w),b=target(w,468,460),c=target(w,568,360),d=damage(w);const events=fire(w);
 expect(main.hp).toBeCloseTo(1000-d);expect(a.hp).toBeCloseTo(1000-d*.65);expect(b.hp).toBeCloseTo(1000-d*.65);expect(c.hp).toBe(1000);expect(w.mirrorHits).toBe(2);expect(w.mirrorBounces).toBe(1);
 expect(events.filter(e=>e.type==='laser'&&!e.prism)).toHaveLength(1);const ray=events.find(e=>e.type==='mirror-laser')!;expect(ray.segments).toHaveLength(2);expect(ray.segments![1].ty).toBeGreaterThan(460);
 expect(w.combatContributions().find(r=>r.source==='laser')?.damage).toBeCloseTo(d*2.3);
});
it.each(['gate','crate','guard']as const)('a %s before the wall intercepts the extra ray without bounce, bypass or collection',kind=>{
 const w=fixture(360),blocker=target(w,500,784,kind),behind=target(w,484,400),weapons=[...w.activeWeapons];const d=damage(w);const events=fire(w);
 expect(behind.hp).toBe(1000);expect(w.mirrorBounces).toBe(0);expect(events.find(e=>e.type==='mirror-laser')?.segments).toHaveLength(1);expect(w.gatesTaken).toBe(0);expect(w.pickups).toBe(0);expect(w.activeWeapons).toEqual(weapons);
 if(kind==='gate')expect(blocker.energy).toBeCloseTo(d*.65);else expect(blocker.hp).toBeCloseTo(1000-d*.65*(kind==='guard'?.5:1));
 expect(w.fractureBursts+w.ionBursts+w.laserArcHits+w.laserFocusHits).toBe(0);
});
it('post-bounce reward blockers stop the ray; a broken box creates a pickup and never grants equipment automatically',()=>{
 const w=fixture(),crate=target(w,328,600,'crate'),behind=target(w,468,460);crate.hp=1;const weapons=[...w.activeWeapons];const events=fire(w);
 expect(crate.active).toBe(false);expect(w.cratesBroken).toBe(1);expect(w.pickups).toBe(0);expect(w.activeWeapons).toEqual(weapons);expect(w.bodies.some(b=>b.kind==='pickup'&&b.active)).toBe(true);expect(behind.hp).toBe(1000);
 expect(w.mirrorBounces).toBe(1);expect(events.find(e=>e.type==='mirror-laser')?.segments).toHaveLength(2);
});
it('a body straddling the reflection joint is hit only once',()=>{
 const w=fixture(360),a=target(w,660,620),b=target(w,500,416),d=damage(w);fire(w);expect(a.hp).toBeCloseTo(1000-d*.65);expect(b.hp).toBeCloseTo(1000-d*.65);expect(w.mirrorHits).toBe(2);expect(w.mirrorDoubleHits).toBe(0);
});
it('drop protection intercepts without damage; transition phases and restart never leak an extra shot',()=>{
 const w=fixture(360),b=target(w,500,784);b.dropGrace=.45;fire(w);expect(b.hp).toBe(1000);expect(w.mirrorHits).toBe(0);expect(w.mirrorBounces).toBe(0);
 for(const phase of['boss-entry','recovery','dead']as const){const other=fixture();other.phase=phase;fire(other);expect(other.mirrorShots).toBe(0);}expect(new World().mirrorShots).toBe(0);
});
it('follows actual laser cadence and overload damage, without recursive combination output',()=>{
 const a=fixture(),b=fixture();target(a);const hot=target(b);b.growth.overload=6;const hp=hot.hp;fire(b);expect(hp-hot.hp).toBeCloseTo(damage(b)*MIRROR_LASER.damage*1.35);
 let lasers=0;for(let f=0;f<4*60;f++){const events=fire(a);lasers+=events.filter(e=>e.type==='laser'&&!e.prism).length;}expect(a.mirrorShots).toBe(lasers);expect(a.fractureBursts+a.ionBursts+a.laserArcHits+a.laserFocusHits).toBe(0);
});
it('awards the geometry challenge once for a real same-ray double contact, never from accumulated single hits',()=>{
 const w=fixture(),state=emptyAchievements();target(w);target(w,468,460);fire(w);expect(w.mirrorDoubleHits).toBe(1);
 expect(awardAchievements(state,w.build.ranks,1,0,0,0,0,{mirrorDoubleHits:0}).some(a=>a.id==='wall-cutter')).toBe(false);
 expect(awardAchievements(state,w.build.ranks,1,0,0,0,0,{mirrorDoubleHits:w.mirrorDoubleHits}).map(a=>a.id)).toContain('wall-cutter');
 expect(awardAchievements(state,w.build.ranks,1,0,0,0,0,{mirrorDoubleHits:w.mirrorDoubleHits})).toHaveLength(0);expect(parseAchievements(state).unlocked).toContain('wall-cutter');expect(achievementGroup('wall-cutter')).toBe('tactics');expect(new World().mirrorDoubleHits).toBe(0);
});
it('repeated single hits do not become the double-hit challenge, and a primary boss kill cancels the extra ray',()=>{
 const w=fixture();target(w);for(let f=0;f<150;f++)fire(w);expect(w.mirrorHits).toBeGreaterThanOrEqual(2);expect(w.mirrorDoubleHits).toBe(0);
 const winner=fixture();winner.phase='boss';target(winner,68,600,'boss').hp=1;const other=target(winner);fire(winner);expect(winner.bossWins).toBe(1);expect(winner.mirrorShots).toBe(0);expect(other.hp).toBe(1000);
});
