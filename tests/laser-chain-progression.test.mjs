import {it,expect} from 'vitest';import {mkdirSync,writeFileSync} from 'node:fs';import {World} from '../src/core/world';import {C} from '../src/core/config';import {progressionTarget} from './helpers/progression-driver';
it('earns the blueprint and arc through two real reward strategies, then deals actual linked damage',()=>{
 const records=[];
 for(const policy of ['blueprint','arc-upgrade']){
  const w=new World(1337);let target=360,unlock=null;const chain=[],announcements=[];
  const plan=policy==='blueprint'?['optical','optical','optical','optical']:['electric','optical','optical','optical','optical'];let index=0;
  for(let f=0;f<360*60&&w.phase!=='dead';f++){
   if(w.bossRewardRound!==null&&w.phase==='recovery'&&w.phaseTime>=C.bossLootReveal){const reward=policy==='arc-upgrade'&&w.activeWeapons.includes('arc')&&w.weaponStage('arc')===1?'arc':'research';w.claimBossReward(reward);}
   const available=w.build.available(w.buildPoints),want=plan[index]??'optical';if(available.includes(want)){w.chooseBuild(want);index++;}
   if(f%6===0)target=progressionTarget(w,policy==='blueprint'&&!w.laserChainUnlocked()&&w.bodies.some(b=>b.active&&b.weaponKind==='arc')?'arc':undefined);w.step(C.step,target);
   for(const e of w.drainEffects()){if(e.type==='laser-arc')chain.push({time:w.time,x:e.x,y:e.y,tx:e.targetX,ty:e.targetY});if(e.type==='combination'&&e.text?.includes('电光连锁'))announcements.push({time:w.time,text:e.text});}
   if(w.laserChainUnlocked()&&!unlock)unlock={time:w.time,round:w.round,optical:w.build.ranks.optical,refinements:w.build.refinements.optical,arc:w.weaponStage('arc'),weapons:w.activeWeapons};
  }
  records.push({policy,time:w.time,round:w.round,hp:w.player.hp,damageTaken:w.damageTaken,kills:w.kills,weapons:w.activeWeapons,levels:Object.fromEntries(w.activeWeapons.map(k=>[k,w.weaponStage(k)])),ranks:w.build.ranks,refinements:w.build.refinements,unlock,laserArcHits:w.laserArcHits,announcements,chain,peakBodies:w.peakBodies,peakBullets:w.peakBullets});
 }
 const dir=`build/qa/runs/${new Date().toISOString().replace(/[:.]/g,'-')}-laser-chain`;mkdirSync(dir,{recursive:true});writeFileSync(`${dir}/normal.json`,JSON.stringify(records,null,2));
 for(const r of records){expect(r.time,r.policy).toBeCloseTo(360);expect(r.unlock,r.policy).not.toBeNull();expect(r.laserArcHits,r.policy).toBeGreaterThan(0);expect(r.announcements,r.policy).toHaveLength(1);}
},120000);
