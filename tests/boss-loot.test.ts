import {it,expect} from 'vitest';import {World} from '../src/core/world';import {C} from '../src/core/config';import {CanvasRuntime} from '../src/game/canvas-runtime';import {defaults} from '../src/ui/storage';
function prepare(w:World,fatal=false){w.phase='boss';w.player.x=w.player.px=68;if(fatal)w.player.hp=1;const b=w.spawn('boss',360,C.bossY);b.hp=1;
 w.bullets.push({id:99999,x:360,y:C.bossY,px:360,py:C.bossY,vx:0,vy:0,damage:10,age:0,active:true,hostile:false});
 if(fatal)w.bullets.push({id:99998,x:68,y:C.playerY,px:68,py:C.playerY,vx:0,vy:0,damage:1,age:0,active:true,hostile:true});}
function win(w:World){prepare(w);w.step(C.step,68);w.drainEffects();}
it('creates loot only on actual living victory and a blueprint grants exactly one independent research point',()=>{
 const w=new World();expect(w.claimBossReward('research')).toBe(false);win(w);expect(w.bossWins).toBe(1);expect(w.bossRewardRound).toBe(1);expect(w.researchPoints).toBe(0);expect(w.growth.energy).toBe(50);
 expect(w.claimBossReward('research')).toBe(true);expect(w.researchPoints).toBe(1);expect(w.buildPoints).toBe(1);expect(w.growth.energy).toBe(50);expect(w.growth.mastery??0).toBe(0);
 expect(w.bossLootStats).toEqual({claimed:1,research:1,equipment:0});expect(w.bossRewardRound).toBeNull();expect(w.claimBossReward('research')).toBe(false);expect(w.researchPoints).toBe(1);
 expect(w.chooseBuild('electric')).toBe(true);expect(w.activeWeapons).toContain('arc');
});
it('rejects unowned upgrades without consuming loot and upgrades only the chosen owned component',()=>{
 const w=new World();w.growth.mastery=1;w.chooseBuild('electric');win(w);const pulse=w.weaponStage('pulse'),arc=w.weaponStage('arc'),points=w.researchPoints;
 expect(w.claimBossReward('blast')).toBe(false);expect(w.bossRewardRound).toBe(1);expect(w.claimBossReward('arc')).toBe(true);expect(w.weaponStage('arc')).toBe(arc+1);expect(w.weaponStage('pulse')).toBe(pulse);expect(w.researchPoints).toBe(points);expect(w.bossLootStats.equipment).toBe(1);
});
it('calibrates a tier-three weapon without replacing its firepower or granting blueprint points',()=>{
 const w=new World();w.growth.stage=3;const before=w.profileFor('pulse').damage;win(w);expect(w.claimBossReward('pulse')).toBe(true);
 expect(w.weaponStage('pulse')).toBe(3);expect(w.weaponCalibration('pulse')).toBe(1);expect(w.profileFor('pulse').damage).toEqual(before.map(n=>n*1.5));expect(w.researchPoints).toBe(0);
});
it('keeps multiple unclaimed victories in order, and each can be claimed only once',()=>{
 const w=new World();win(w);w.round=2;win(w);expect(w.bossRewardRound).toBe(1);expect(w.bossWins).toBe(2);
 expect(w.claimBossReward('research')).toBe(true);expect(w.bossRewardRound).toBe(2);expect(w.claimBossReward('research')).toBe(true);expect(w.bossRewardRound).toBeNull();expect(w.claimBossReward('research')).toBe(false);expect(w.researchPoints).toBe(2);
});
it('does not offer a dead player loot, including a simultaneous boss kill, and restart clears per-run loot',()=>{
 const fatal=new World();prepare(fatal,true);fatal.step(C.step,68);expect(fatal.phase).toBe('dead');expect(fatal.bossRewardRound).toBeNull();expect(fatal.claimBossReward('research')).toBe(false);
 const w=new World();win(w);w.player.hp=0;w.phase='dead';expect(w.claimBossReward('pulse')).toBe(false);expect(w.bossRewardRound).toBe(1);expect(new World().bossRewardRound).toBeNull();expect(new World().bossLootStats.claimed).toBe(0);
});
async function screen(){let time=1000,next=(_t:number)=>{};const labels:string[]=[];const ctx=new Proxy({}, {get:(_o,key)=>key==='fillText'?(s:string)=>labels.push(s):()=>{}}) as CanvasRenderingContext2D;
 const r=new CanvasRuntime({canvas:{getContext:()=>ctx} as unknown as HTMLCanvasElement,width:720,height:1280,dpr:1,menuBottom:0,image:async()=>({width:768,height:512}) as HTMLImageElement,read:defaults,write(){},sound(){},silence(){},now:()=>time,requestFrame:f=>{next=f;}});
 await r.load();r.start();const tick=(n=1)=>{for(let i=0;i<n;i++){time+=17;next(time);}};tick();return {r,tick,labels};}
it('lets the real explosion finish before freezing for native reward selection and rejects stale repeated clicks',async()=>{
 const {r,tick}=await screen();prepare(r.world);tick();expect(r.mode).toBe('playing');expect(r.world.phase).toBe('recovery');tick(115);expect(r.mode).toBe('playing');tick(25);expect(r.mode).toBe('boss-reward');
 const time=r.world.time;tick(60);expect(r.world.time).toBe(time);expect(r.back()).toBe('stay');expect(r.mode).toBe('boss-reward');
 expect(r.activateControl('boss-claim:research')).toBe(true);expect(r.mode).toBe('choice');expect(r.activateControl('boss-claim:research')).toBe(false);expect(r.world.bossLootStats.claimed).toBe(1);
 expect(r.activateControl('build:optical')).toBe(true);expect(r.mode).toBe('playing');expect(r.world.supportProfile().laserUnlocked).toBe(true);
});
it('settles boss loot, a pending contract and skill choices without losing or duplicating either reward',async()=>{
 const {r,tick}=await screen();prepare(r.world);tick();r.world.contractReward={charge:100,round:1};tick(140);expect(r.mode).toBe('boss-reward');
 expect(r.activateControl('boss-claim:research')).toBe(true);expect(r.mode).toBe('contract-reward');expect(r.activateControl('contract-claim:energy')).toBe(true);expect(r.mode).toBe('choice');expect(r.world.bossLootStats.claimed).toBe(1);expect(r.world.contractStats.claimed).toBe(1);
});
it('prioritizes actual same-frame player death over every reward panel',async()=>{
 const {r,tick}=await screen();prepare(r.world,true);tick();expect(r.mode).toBe('result');expect(r.world.bossRewardRound).toBeNull();expect(r.activateControl('boss-claim:research')).toBe(false);
});
