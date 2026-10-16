import {it,expect} from 'vitest';
import {World,type Body} from '../src/core/world';import {C} from '../src/core/config';import {MAGNETIC} from '../src/core/magnetic-field';import {recipeStatus,recipePerformance,recipeSupplyMatch,recipeRouteHint} from '../src/core/recipe-goal';import {runReport} from '../src/game/run-report';
function collect(w:World,stage=2){const b=w.spawn('pickup',68,C.playerY,stage);b.weaponKind='blast';w.step(C.step,68);return w.drainEffects();}
function setup(){const w=new World();w.player.x=w.player.px=68;w.phase='boss';w.growth.mastery=3;collect(w);w.chooseBuild('electric');w.chooseBuild('electric','seeker');w.drainEffects();return w;}
function enemy(w:World,x=360,y=600,kind:'armor'|'guard'|'elite'='armor'){const b=w.spawn(kind,x,y);b.hp=b.maxHp=1000;b.speed=0;b.timer=999;return b;}
function shot(w:World,b:Body,damage=10,kind:'blast'|'scatter'='blast'){w.bullets=[{id:99999,x:b.x,y:b.y,px:b.x,py:b.y,vx:0,vy:0,damage,age:0,active:true,hostile:false,weaponKind:kind,splashRadius:110}];w.step(C.step,68);return w.drainEffects();}
function frames(w:World,n:number){const effects=[];for(let i=0;i<n;i++){w.bullets=[];w.step(C.step,68);effects.push(...w.drainEffects());}return effects;}
it('requires collected T2 blast and two real electric nodes, announces once in either acquisition order and keeps old guns',()=>{
 for(const gearFirst of [false,true]){const w=new World();w.phase='boss';w.player.x=w.player.px=68;w.growth.mastery=4;const before=w.activeWeapons.slice();let events=[];if(gearFirst)events.push(...collect(w));w.chooseBuild('electric');expect(w.magneticUnlocked()).toBe(false);w.chooseBuild('electric','spread');events.push(...w.drainEffects());if(!gearFirst){collect(w,1);expect(w.magneticUnlocked()).toBe(false);const box=w.spawn('crate',360,500,2);box.weaponKind='blast';expect(recipeSupplyMatch(w,'magnetic',box)).toBe(true);expect(w.magneticUnlocked()).toBe(false);events.push(...collect(w));}expect(w.magneticUnlocked()).toBe(true);expect(recipeStatus(w,'magnetic').ready).toBe(true);expect(before.every(k=>w.activeWeapons.includes(k))).toBe(true);w.chooseBuild('electric');events.push(...w.drainEffects());expect(events.filter(e=>e.text==='组合完成 · 磁暴榴弹').length).toBe(1);}
 const w=new World();w.player.x=w.player.px=68;w.growth.mastery=5;collect(w);w.chooseBuild('electric');expect(recipeRouteHint(w,'magnetic','electric')?.text).toContain('本次完成');
});
it('a real blast hit leaves a moving field; later entrants take delayed pulses without another shot',()=>{
 const w=setup(),a=enemy(w),late=enemy(w,540,640);shot(w,a);expect(w.magneticFields).toHaveLength(1);expect(a.hp).toBe(990);expect(late.hp).toBe(1000);frames(w,7);expect(a.hp).toBe(986.5);expect(w.magneticHits).toBe(1);
 late.x=400;late.px=400;const events=frames(w,25);expect(late.hp).toBe(996.5);expect(events.some(e=>e.type==='magnetic-hit'&&e.targetId===late.id)).toBe(true);frames(w,42);expect(w.magneticFields).toHaveLength(0);expect(w.magneticBursts).toBe(1);expect(w.ionCharge).toBe(0);expect(w.laserArcHits).toBe(0);expect(recipePerformance(w,'magnetic').count).toBe(w.magneticHits);expect(runReport(w,[],[]).mechanics.join(' ')).toContain('磁暴');
});
it('cannot seed from crates, gates, shields, protected entry, scatter splash or derived hits',()=>{
 for(const kind of ['crate','gate','guard','armor','scatter'] as const){const w=setup();const b=kind==='crate'||kind==='gate'?w.spawn(kind,360,600):enemy(w,360,600,kind==='guard'?'guard':'armor');b.hp=b.maxHp=1000;b.speed=0;if(kind==='armor')b.dropGrace=1;shot(w,b,10,kind==='scatter'?'scatter':'blast');expect(w.magneticBursts).toBe(0);}
});
it('pulses skip rewards, closed shields, protected and offstrip targets but can hit an opened shield later',()=>{
 const w=setup(),a=enemy(w),shield=enemy(w,400,620,'guard'),protectedBody=enemy(w,420,620),crate=w.spawn('crate',380,620),gate=w.spawn('gate',390,620);protectedBody.dropGrace=2;shot(w,a);frames(w,8);expect(shield.hp).toBe(997.5);expect(protectedBody.hp).toBe(1000);expect(crate.hp).toBe(crate.maxHp);expect(gate.energy).toBe(0);shield.burst=2;shield.timer=999;frames(w,24);expect(shield.hp).toBeLessThan(997.5);expect(w.magneticHits).toBeGreaterThan(1);
});
it('global seeding cooldown bounds multiple contacts and fields expire on real time, not rendering',()=>{
 const w=setup(),a=enemy(w);for(let i=0;i<8;i++)shot(w,a);expect(w.magneticBursts).toBe(1);for(let i=0;i<100;i++){shot(w,a);expect(w.magneticFields.length).toBeLessThanOrEqual(MAGNETIC.limit);}expect(w.magneticBursts).toBeGreaterThan(1);frames(w,80);expect(w.magneticFields).toHaveLength(0);
});
it('field kills grant normal rewards once, cannot recurse, and are cleared by boss victory or death',()=>{
 const w=setup(),a=enemy(w),elite=enemy(w,400,620,'elite');shot(w,a);elite.hp=3;frames(w,8);expect(w.kills).toBe(1);expect(w.magneticBursts).toBe(1);expect(w.growth.energy).toBe(C.killCharge.elite);frames(w,30);expect(w.kills).toBe(1);
 const boss=w.spawn('boss',390,650);boss.hp=3;boss.timer=999;const protectedEscort=enemy(w,400,650);protectedEscort.hp=3;frames(w,25);expect(w.bossWins).toBe(1);expect(protectedEscort.hp).toBe(3);expect(w.magneticFields).toHaveLength(0);expect(new World().magneticBursts).toBe(0);
 const d=setup(),t=enemy(d);shot(d,t);d.player.hp=0;d.step(C.step,68);expect(d.phase).toBe('dead');expect(d.magneticFields).toHaveLength(0);
});
it('pulses cannot damage above the shot strip or below the player, and boss entry clears the floor',()=>{
 for(const [sourceY,targetY]of [[260,220],[1000,1040]]){const w=setup(),a=enemy(w,360,sourceY),outside=enemy(w,400,targetY);shot(w,a);frames(w,9);expect(w.magneticHits).toBeGreaterThan(0);expect(outside.hp).toBe(1000);w.phase='boss-entry';w.step(C.step,68);expect(w.magneticFields).toHaveLength(0);}
});
