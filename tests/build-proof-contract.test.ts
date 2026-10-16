import {it,expect} from 'vitest';
import {World,type Body} from '../src/core/world';import {Contract} from '../src/core/contracts';
import {C} from '../src/core/config';import {emptyAchievements,awardAchievements,parseAchievements} from '../src/core/achievements';
function unitStorm(){const w=new World();w.growth.mastery=4;w.chooseBuild('ballistic');w.chooseBuild('ballistic');w.chooseBuild('electric');w.chooseBuild('ballistic');w.player.x=w.player.px=68;return w;}
function target(w:World,x=360){const b=w.spawn('armor',x,600);b.hp=b.maxHp=10000;b.speed=0;b.timer=999;return b;}
function shot(w:World,b:Body,kind:'scatter'|'arc'|'pierce'='scatter',hops=1){w.bullets=[{id:99999,x:b.x,y:b.y,px:b.x,py:b.y,vx:0,vy:0,damage:10,age:0,active:true,hostile:false,weaponKind:kind,chainHops:hops}];w.step(C.step,68);return w.drainEffects();}
it('only offers earned combinations, rejects invalid or changed targets, and ignores all prior hits',()=>{
 const fresh=new World();expect(fresh.canAcceptContract('research')).toBe(false);expect(fresh.acceptContract('research','storm')).toBe(false);
 const w=unitStorm();w.stormLinks=17;expect(w.availableProofs()).toEqual(['storm']);expect(w.canAcceptContract('research','ion')).toBe(false);
 expect(w.acceptContract('precision','storm')).toBe(false);expect(w.acceptContract('research','storm')).toBe(true);
 expect(w.contract!.proof).toEqual({kind:'storm',start:17});expect(w.acceptContract('research','prism')).toBe(false);
 w.phase='boss';const a=target(w);target(w,460);for(let i=0;i<17;i++)shot(w,a);
 expect(w.contract!.proofProgress).toBe(17);expect(w.contractReward).toBeUndefined();expect(w.proofWins).toBe(0);
 shot(w,a);expect(w.contract!.status).toBe('won');expect(w.contract!.elapsed).toBeLessThan(1);expect(w.proofWins).toBe(1);
 const pulse=w.profileFor('pulse'),scatter=w.profileFor('scatter');expect(w.claimContractReward('arc')).toBe(true);
 expect(w.profileFor('pulse')).toEqual(pulse);expect(w.profileFor('scatter')).toEqual(scatter);expect(w.claimContractReward('energy')).toBe(false);expect(w.contractStats.claimed).toBe(1);
});
it('uses actual side beams and ignores main beam hits and unrelated kill totals',()=>{
 const w=new World();w.growth.mastery=4;for(let i=0;i<3;i++)w.chooseBuild('optical');w.chooseBuild('ballistic');
 expect(w.acceptContract('research','prism')).toBe(true);w.phase='boss';target(w,253);target(w,467);target(w,360);
 for(let i=0;i<6*60&&w.contract!.status==='active';i++){w.step(C.step,360);w.drainEffects();}
 expect(w.prismHits).toBeGreaterThanOrEqual(6);expect(w.contract!.status).toBe('won');expect(w.kills).toBe(0);
});
it('only actual ion area damage counts and the existing charge reward is delivered once',()=>{
 const w=new World();w.growth.mastery=3;for(let i=0;i<3;i++)w.chooseBuild('electric');w.player.x=w.player.px=68;w.acceptContract('research','ion');w.phase='boss';const a=target(w);target(w,460);
 for(let group=0;group<3;group++){
  for(let i=0;i<6;i++)shot(w,a,'arc',0);
  if(group<2)for(let i=0;i<50;i++){w.step(C.step,68);w.drainEffects();}
 }
 expect(w.ionHits).toBe(6);expect(w.contract!.status).toBe('won');expect(w.proofWins).toBe(1);
 const mastery=w.growth.mastery;expect(w.claimContractReward('energy')).toBe(true);expect(w.growth.mastery).toBe(mastery!+1);expect(w.claimContractReward('energy')).toBe(false);
});
it('fracture proof requires four real bursts rather than collecting the recipe',()=>{
 const w=new World();for(const kind of ['pierce','blast'] as const){const p=w.spawn('pickup',360,C.playerY,2);p.weaponKind=kind;}
 w.step(C.step,360);w.drainEffects();expect(w.fractureUnlocked()).toBe(true);expect(w.acceptContract('research','fracture')).toBe(true);w.phase='boss';w.player.x=w.player.px=68;const a=target(w);
 for(let group=0;group<4;group++){for(let i=0;i<3;i++)shot(w,a,'pierce',0);if(group<3)for(let i=0;i<24;i++){w.step(C.step,68);w.drainEffects();}}
 expect(w.fractureBursts).toBe(4);expect(w.contract!.status).toBe('won');expect(w.proofWins).toBe(1);
});
it('fails on death or expiry even with kills, freezes through recovery, and awards no badge on acceptance',()=>{
 for(const dead of [false,true]){const c=new Contract('research',1,0,5,0,{kind:'storm',start:100});c.update(30.01,500,5,0,!dead,118);expect(c.status).toBe('failed');}
 const w=unitStorm();w.acceptContract('research','storm');w.phase='recovery';w.step(C.step);expect(w.contract!.elapsed).toBe(0);
 const s=emptyAchievements();expect(awardAchievements(s,w.build.ranks,2,0,0,0,w.proofWins).map(a=>a.id)).not.toContain('proof');
 expect(awardAchievements(s,w.build.ranks,2,0,0,0,1).map(a=>a.id)).toContain('proof');expect(awardAchievements(s,w.build.ranks,2,0,0,0,1)).toEqual([]);expect(parseAchievements(s).unlocked).toContain('proof');
});
