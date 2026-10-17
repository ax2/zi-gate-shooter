import{it,expect}from'vitest';import{World}from'../src/core/world';import{C}from'../src/core/config';import{activateOverload}from'../src/core/rewards';import{OVERLOAD}from'../src/core/overload';
function fixture(){const w=new World();(w as any).scheduled=[];return w;}
function sample(w:World,frames:number){const fire:number[]=[],laser:number[]=[];for(let i=0;i<frames;i++){w.step(C.step,360);for(const e of w.drainEffects()){if(e.type==='fire'&&e.weaponKind==='pulse')fire.push(w.time);if(e.type==='laser'&&!e.prism)laser.push(w.time);}}return{fire,laser};}
it('changes actual pulse cadence from eight to ten volleys per second while leaving normal profiles intact',()=>{
 const normal=fixture(),hot=fixture();hot.growth.overload=6;const a=sample(normal,60),b=sample(hot,60);expect(a.fire.length-1).toBe(8);expect(b.fire.length-1).toBe(10);expect(hot.profileFor('pulse').rate).toBe(8);expect(hot.fireRateScale()).toBe(1.25);
});
it('speeds up actual support laser cadence and retains the original shot damage multiplier',()=>{
 const normal=fixture(),hot=fixture();normal.growth.mastery=hot.growth.mastery=3;hot.growth.overload=6;const a=sample(normal,300),b=sample(hot,300);expect(b.laser.length).toBeGreaterThan(a.laser.length);for(let i=1;i<b.laser.length;i++)expect(b.laser[i]-b.laser[i-1]).toBeCloseTo(hot.supportProfile().laserInterval/OVERLOAD.rate,1);
 const n=fixture(),h=fixture();h.growth.overload=6;n.step(C.step);h.step(C.step);expect(h.bullets[0].damage/n.bullets[0].damage).toBeCloseTo(1.35);
});
it('preserves cooldown progress at ignition and expiry, without a free salvo or a backlog',()=>{
 const w=fixture();sample(w,3);w.growth.overload=.5;const hot=sample(w,24);expect(hot.fire.length).toBe(4);const transition=sample(w,24);expect(w.fireRateScale()).toBe(1);const all=[...hot.fire,...transition.fire];for(let i=1;i<all.length;i++)expect(all[i]-all[i-1]).toBeGreaterThanOrEqual(.1-1e-8);const normal=sample(w,60);expect(normal.fire).toHaveLength(8);
});
it('recharging refreshes six seconds without multiplying the firing boost again',()=>{
 const a=fixture(),b=fixture();a.growth.overload=b.growth.overload=6;sample(a,30);sample(b,30);b.growth.energy=100;expect(activateOverload(b.growth)).toBe(true);expect(b.growth.overload).toBe(6);expect(b.growth.mastery).toBe(1);const aa=sample(a,60),bb=sample(b,60);expect(bb.fire.length).toBe(aa.fire.length);expect(b.fireRateScale()).toBe(1.25);
});
it('clears cooldowns during boss entry instead of storing amplified shots',()=>{
 const w=fixture();w.growth.overload=6;sample(w,30);w.phase='boss-entry';const a=sample(w,30);expect(a.fire).toHaveLength(0);w.phase='boss';const b=sample(w,1);expect(b.fire).toHaveLength(1);expect(b.laser.length).toBeLessThanOrEqual(1);
});
it('keeps the original projectile budget with an isolated maximal five-weapon build',()=>{
 const w=fixture();for(const kind of['pulse','scatter','pierce','blast','arc']){(w as any).acquiredWeapons.add(kind);(w as any).weaponStages.set(kind,3);}w.growth.mastery=20;w.growth.stage=3;w.growth.overload=6;Object.assign(w.build.ranks,{ballistic:3,electric:3,optical:3});sample(w,600);expect(w.peakBullets).toBeLessThanOrEqual(C.limits.bullets);expect(w.player.hp).toBe(3);expect(w.growth.overload).toBe(0);expect(w.activeWeapons).toHaveLength(5);
});
