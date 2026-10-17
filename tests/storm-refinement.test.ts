import {it,expect} from 'vitest';import {World,type Body} from '../src/core/world';import {C} from '../src/core/config';import {buildPreview} from '../src/game/build-preview';import {progressionTarget} from './helpers/progression-driver';import {writeFileSync} from 'node:fs';
function setup(){const w=new World();w.growth.mastery=10;w.chooseBuild('electric');w.chooseBuild('ballistic');w.chooseBuild('ballistic','penetrator');w.chooseBuild('ballistic');w.chooseBuild('ballistic');w.chooseBuild('ballistic');w.chooseBuild('ballistic');w.chooseBuild('ballistic');w.chooseBuild('ballistic');(w as any).weaponStages.set('scatter',3);(w as any).scheduled=[];w.player.x=w.player.px=68;return w;}
function target(w:World,x=360,kind:'armor'|'guard'|'crate'|'gate'='armor'){const b=w.spawn(kind,x,600);b.hp=b.maxHp=1000;b.speed=0;b.timer=999;return b;}
let id=900000;function fire(w:World,b:Body,kind:'scatter'|'pulse'='scatter',hops=0){w.bullets=[{id:id++,x:b.x,y:b.y,px:b.x,py:b.y,vx:0,vy:0,damage:10,age:0,active:true,hostile:false,weaponKind:kind,chainHops:hops}];w.step(C.step,68);return w.drainEffects();}
it.each(['storm-relay','storm-focus'] as const)('%s spends one earned point and keeps existing branches, weapons and normal damage growth',branch=>{
 const w=setup(),before=w.profileFor('scatter'),owned=[...w.activeWeapons],spent=w.build.spent;expect(w.canRefineStorm()).toBe(true);expect(w.chooseBuild('ballistic',branch)).toBe(true);expect(w.build.spent).toBe(spent+1);expect(w.build.stormAugment).toBe(branch);expect(w.activeWeapons).toEqual(owned);expect(w.build.ballisticBranch).toBe('penetrator');expect(w.profileFor('scatter').targets).toBe(before.targets);expect(w.profileFor('scatter').damage.every((v,i)=>v>before.damage[i])).toBe(true);expect(w.profileFor('scatter').chainHops).toBe(branch==='storm-relay'?2:1);w.growth.mastery=(w.growth.mastery??0)+1;expect(w.chooseBuild('ballistic',branch==='storm-relay'?'storm-focus':'storm-relay')).toBe(false);
});
it('rejects unearned, wrong-route, unowned-T3 and unfinished early refinements without spending',()=>{
 const w=setup();const spent=w.build.spent;(w as any).weaponStages.set('scatter',2);expect(w.chooseBuild('ballistic','storm-focus')).toBe(false);(w as any).weaponStages.set('scatter',3);expect(w.chooseBuild('electric','storm-focus')).toBe(false);w.growth.mastery=spent;expect(w.chooseBuild('ballistic','storm-focus')).toBe(false);w.growth.mastery=10;w.build.refinements.ballistic=4;expect(w.chooseBuild('ballistic','storm-focus')).toBe(false);expect(w.build.stormAugment).toBeUndefined();
});
it('focus needs six actual direct contacts on one surviving target and never recursively feeds itself',()=>{
 const w=setup();w.chooseBuild('ballistic','storm-focus');const a=target(w),b=target(w,600);for(let i=0;i<5;i++)fire(w,a);expect(a.stormHits).toBe(5);fire(w,b);expect(b.stormHits).toBe(1);const effects=fire(w,a);expect(a.hp).toBe(925);expect(a.stormHits).toBe(0);expect(w.stormFocusBursts).toBe(1);expect(w.stormFocusDamage).toBe(15);expect(effects.filter(e=>e.type==='capacitor')).toHaveLength(1);expect(w.ionBursts).toBe(0);expect(w.capacitorBursts).toBe(0);expect(w.fractureBursts).toBe(0);expect(b.hp).toBe(990);
});
it.each(['crate','gate','guard'] as const)('%s cannot charge or receive a derived focus discharge',kind=>{
 const w=setup();w.chooseBuild('ballistic','storm-focus');const b=target(w,360,kind);for(let i=0;i<6;i++)fire(w,b);expect(b.stormHits).toBeUndefined();expect(w.stormFocusBursts).toBe(0);if(kind==='gate')expect(b.energy).toBe(60);
});
it('protection, other guns, derived jumps and direct kills do not earn a focus hit',()=>{
 const w=setup();w.chooseBuild('ballistic','storm-focus');const a=target(w),b=target(w,450);a.dropGrace=2;fire(w,a);expect(a.stormHits).toBeUndefined();a.dropGrace=0;fire(w,a,'pulse');expect(a.stormHits).toBeUndefined();fire(w,a,'scatter',1);expect(a.stormHits).toBe(1);expect(b.stormHits).toBeUndefined();a.hp=1;fire(w,a);expect(a.active).toBe(false);expect(w.kills).toBe(1);expect(w.stormFocusBursts).toBe(0);
});
it('relay adds a third victim while focus retains the original jump, with no revisit or reward charging',()=>{
 for(const branch of ['storm-relay','storm-focus'] as const){const w=setup();w.chooseBuild('ballistic',branch);const a=target(w),b=target(w,450),c=target(w,650),gate=target(w,600,'gate');fire(w,a,'scatter',w.profileFor('scatter').chainHops);expect(a.hp).toBe(990);expect(b.hp).toBeCloseTo(993.5);expect(c.hp).toBeCloseTo(branch==='storm-relay'?995.775:1000);expect(w.stormLinks).toBe(branch==='storm-relay'?2:1);expect(gate.energy).toBe(0);}
});
it('read-only preview uses the same profile and exposes the late fork without advancing a run',()=>{
 const w=setup(),snapshot=JSON.stringify(w,(_k,v)=>v instanceof Map?[...v]:v);expect(buildPreview(w,'ballistic').plan).toContain('雷暴精研');const p=buildPreview(w,'ballistic','storm-relay');expect(p.after.chainHops).toBe(2);expect(p.plan).toContain('340');expect(JSON.stringify(w,(_k,v)=>v instanceof Map?[...v]:v)).toBe(snapshot);
});
it('a focus discharge can finish a live boss once, and boss-entry protection remains intact',()=>{
 for(const phase of ['boss-entry','boss'] as const){const w=setup();w.chooseBuild('ballistic','storm-focus');w.phase=phase;const boss=w.spawn('boss',360,600);boss.speed=0;boss.timer=999;boss.hp=boss.maxHp=20;boss.stormHits=5;fire(w,boss);if(phase==='boss-entry'){expect(w.stormFocusBursts).toBe(0);expect(w.bossWins).toBe(0);expect(boss.hp).toBe(20);}else{expect(w.stormFocusBursts).toBe(1);expect(w.stormFocusDamage).toBe(10);expect(w.bossWins).toBe(1);expect(w.kills).toBe(1);expect(w.phase).toBe('recovery');}}
});
it('both late forks can be earned and used through normal ten-minute runs',()=>{
 const rows=[];for(const branch of ['storm-relay','storm-focus'] as const){const w=new World(1337,1,'scatter');let x=360,chosenAt:number|undefined;
  for(let f=0;f<600*60&&w.player.hp>0;f++){
   if(w.bossRewardRound!==null&&w.phase==='recovery')w.claimBossReward('research');
   const available=w.build.available(w.buildPoints),route=available.includes('ballistic')?'ballistic':available.includes('electric')?'electric':available[0];
   if(route){const selected=route==='ballistic'&&w.canRefineStorm()?branch:route==='ballistic'&&w.canRefineFracture()?'fracture-line':undefined;expect(w.chooseBuild(route,selected)).toBe(true);if(w.build.stormAugment&&!chosenAt)chosenAt=w.time;}
   if(f%6===0)x=progressionTarget(w,'scatter');w.step(C.step,x);w.drainEffects();
  }
  rows.push({branch,chosenAt,time:w.time,round:w.round,hp:w.player.hp,stormLinks:w.stormLinks,relayLinks:w.stormRelayLinks,focusBursts:w.stormFocusBursts,focusDamage:w.stormFocusDamage,owned:w.activeWeapons,stage:w.weaponStage('scatter'),refinements:w.build.refinements.ballistic});
  expect(w.time).toBeCloseTo(600,4);expect(w.build.stormAugment).toBe(branch);expect(chosenAt).toBeGreaterThan(0);expect(chosenAt).toBeLessThan(360);if(branch==='storm-focus')expect(w.stormFocusBursts).toBeGreaterThan(0);else expect(w.stormRelayLinks).toBeGreaterThan(0);
 }
 writeFileSync('build/qa/Stage-203/storm-normal.json',JSON.stringify(rows,null,2));
},120000);
