import{it,expect}from'vitest';import{World,type Body}from'../src/core/world';import{C}from'../src/core/config';import{type OverdriveForm}from'../src/core/overdrive';import{OVERLOAD}from'../src/core/overload';
function setup(form?:OverdriveForm){const w=new World(1337);Object.assign(w,{scheduled:[],secondChance:true,shoot(){}});w.growth.mastery=16;w.growth.overload=6;if(form)expect(w.chooseOverdrive(form)).toBe(true);w.drainEffects();return w;}
function enemy(w:World,x:number,y:number,kind:'armor'|'guard'='armor'){const b=w.spawn(kind,x,y);b.hp=b.maxHp=3000;b.speed=0;b.timer=1000;return b;}
function step(w:World,n=1){for(let i=0;i<n;i++)w.step(C.step,360);}
const scale=2.6*OVERLOAD.damage;
it('is a free run-only mastery16 choice, cannot be forged, repeated or changed and preserves old weapons and points',()=>{
 const w=setup(),weapons=[...w.activeWeapons],points=w.buildPoints,energy=w.growth.energy;w.growth.mastery=15;expect(w.chooseOverdrive('lance')).toBe(false);w.growth.mastery=16;expect(w.chooseOverdrive('other')).toBe(false);expect(w.chooseOverdrive('lance')).toBe(true);expect(w.chooseOverdrive('circuit')).toBe(false);expect(w.chooseOverdrive('lance')).toBe(false);expect(w.activeWeapons).toEqual(weapons);expect(w.buildPoints).toBe(points);expect(w.growth.energy).toBe(energy);expect(new World(1337).overdriveForm).toBeUndefined();
 w.player.hp=0;expect(w.canChooseOverdrive()).toBe(false);
});
it('lance damages at most3 aligned targets with exact inherited power, no recursive optical combo and honest ledger',()=>{
 const w=setup('lance'),a=[740,600,460,320].map(y=>enemy(w,360,y));const side=enemy(w,500,700);step(w);for(const b of a.slice(0,3))expect(b.hp).toBeCloseTo(3000-90*scale);expect(a[3].hp).toBe(3000);expect(side.hp).toBe(3000);expect(w.overdriveHits).toBe(3);expect(w.overdriveShots).toBe(1);expect(w.combatContributions()).toEqual([{source:'overdrive',damage:expect.closeTo(90*scale*3),contacts:3,kills:0}]);expect(w.drainEffects().filter(e=>e.type==='overdrive-lance')).toHaveLength(1);
});
it.each(['gate','crate','guard','entry']as const)('lance respects the actual %s obstruction rather than damaging through rewards or shields',kind=>{
 const w=setup('lance'),behind=enemy(w,360,500);let front:Body;if(kind==='gate'||kind==='crate')front=w.spawn(kind,360,740,2);else front=enemy(w,360,740,kind==='guard'?'guard':'armor');if(kind==='entry')front.dropGrace=.45;const hp=front.hp;step(w);expect(behind.hp).toBe(3000);if(kind==='gate')expect(front.energy).toBe(144);else if(kind==='entry')expect(front.hp).toBe(hp);else expect(front.hp).toBeLessThan(hp);
});
it('circuit reaches3 spatially separated enemies once with80percent falloff and never charges nearby rewards',()=>{
 const w=setup('circuit'),a=[enemy(w,360,740),enemy(w,500,600),enemy(w,500,450)];const fourth=enemy(w,600,350),gate=w.spawn('gate',360,800);gate.speed=0;step(w);for(const[i,b]of a.entries())expect(b.hp).toBeCloseTo(3000-60*scale*.8**i);expect(fourth.hp).toBe(3000);expect(gate.energy).toBe(0);expect(w.overdriveHits).toBe(3);const events=w.drainEffects().filter(e=>e.type==='overdrive-arc');expect(events).toHaveLength(3);expect(new Set(events.map(e=>e.targetX+','+e.targetY)).size).toBe(3);
});
it('circuit cannot jump through a closed guard or hit a protected/offscreen enemy and uses deterministic nearest targeting',()=>{
 const w=setup('circuit'),g=enemy(w,360,740,'guard'),a=enemy(w,500,600),outside=enemy(w,100,200);step(w);expect(g.hp).toBeCloseTo(3000-60*scale*.5);expect(a.hp).toBe(3000);expect(outside.hp).toBe(3000);expect(w.overdriveHits).toBe(1);
 const u=setup('circuit'),entry=enemy(u,360,740);entry.dropGrace=.45;step(u);expect(entry.hp).toBe(3000);expect(u.overdriveHits).toBe(0);
});
it.each(['lance','circuit']as const)('%s only fires during overload every1.5seconds, preserves remaining timing on refresh and stops in entry/recovery/death',form=>{
 const w=setup(form);enemy(w,360,740);step(w,90);expect(w.overdriveShots).toBe(1);step(w);expect(w.overdriveShots).toBe(2);w.growth.overload=6;step(w,30);expect(w.overdriveShots).toBe(2);step(w,60);expect(w.overdriveShots).toBe(3);
 w.growth.overload=0;step(w,120);expect(w.overdriveShots).toBe(3);w.growth.overload=6;step(w);expect(w.overdriveShots).toBe(4);
 for(const phase of['boss-entry','recovery']as const){w.phase=phase;w.phaseTime=0;step(w,40);expect(w.overdriveShots).toBe(4);}w.phase='dead';step(w,100);expect(w.overdriveShots).toBe(4);
});
it('lethal surplus and blocked damage are excluded from contribution while normal weapons and laser still fire alongside protocol',()=>{
 const w=new World(1337);Object.assign(w,{scheduled:[],secondChance:true});w.growth.mastery=16;w.growth.overload=6;w.chooseOverdrive('lance');const b=enemy(w,360,740);b.hp=10;step(w);expect(w.shots).toBeGreaterThan(0);const events=w.drainEffects();expect(events.some(e=>e.type==='laser')).toBe(true);expect(events.some(e=>e.type==='overdrive-lance')).toBe(true);expect(w.combatContributions().reduce((n,r)=>n+r.damage,0)).toBeCloseTo(10);expect(w.activeWeapons).toContain('pulse');
});
it('circuit can reach an isolated boss from the fixed bottom cockpit, instead of an accidental560px dead zone',()=>{const w=setup('circuit');w.phase='boss';Object.assign(w,{escortGroup:99});const boss=w.spawn('boss',360,360);boss.hp=boss.maxHp=3000;boss.timer=1000;step(w);expect(boss.hp).toBeCloseTo(3000-60*scale);expect(w.overdriveHits).toBe(1);});
it.each(['lance','circuit']as const)('%s stops its current hit sequence on the lethal boss contact, without post-victory escort damage or extra kills',form=>{const w=setup(form);w.phase='boss';Object.assign(w,{escortGroup:99});const boss=w.spawn('boss',360,360);boss.hp=1;boss.timer=1000;const behind=enemy(w,360,300);step(w);expect(w.bossWins).toBe(1);expect(w.overdriveHits).toBe(1);expect(behind.hp).toBe(3000);expect(w.kills).toBe(1);expect(w.phase).toBe('recovery');});
