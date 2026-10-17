import {it,expect} from 'vitest';
import {writeFileSync} from 'node:fs';
import {World} from '../src/core/world';
import {C} from '../src/core/config';
import {progressionTarget} from './helpers/progression-driver';
import {aceAim} from './helpers/ace-driver';
it('normal tier-three preparation supports either kill order with a real survivor phase and one earned reward',()=>{
 const rows=[];
 for(const seed of [1337,77])for(const first of ['fan','needle'] as const)for(const reward of ['energy','equipment']){
  const w=new World(seed,1,'scatter');let aim=360,accepted:any=null,claim:any=null;const guns=new Map<number,any>(),events:any[]=[];
  for(let f=0;f<210*60&&w.player.hp>0;f++){
   if(w.bossRewardRound!==null&&w.phase==='recovery'&&w.phaseTime>=C.bossLootReveal)w.claimBossReward('research');
   const a=w.build.available(w.buildPoints);if(a.includes('optical'))w.chooseBuild('optical',w.canRefinePhoton()?'photon-reach':w.build.ranks.optical===1?'burn':undefined);
   if(!accepted&&w.round>=2&&w.activeWeapons.some(k=>w.weaponStage(k)>=3)&&w.canAcceptContract('hunter',undefined,'crossfire')){expect(w.acceptContract('hunter',undefined,'crossfire')).toBe(true);accepted={time:w.time,round:w.round,damage:w.damageTaken};}
   if(w.contractReward){const before=w.researchPoints,owned=[...w.activeWeapons],selected=reward==='energy'?'energy':w.weaponKind;expect(w.claimContractReward(selected)).toBe(true);expect(w.researchPoints).toBe(before+1);expect(w.activeWeapons).toEqual(owned);expect(w.claimContractReward(selected)).toBe(false);claim={time:w.time,selected,researchBefore:before,researchAfter:w.researchPoints};break;}
   if(f%6===0)aim=w.contract?.status==='active'?aceAim(w,first):progressionTarget(w);
   w.step(C.step,aim);
   for(const b of w.bodies)if(b.aceRole)guns.set(b.id,b);
   for(const e of w.drainEffects())if(e.type==='bounty-progress'||e.text?.includes('王牌'))events.push({time:w.time,...e});
   if(w.contract?.status==='failed')break;
  }
  rows.push({seed,first,reward,accepted,claim,time:w.time,hp:w.player.hp,status:w.contract?.status,reason:w.contract?.reason,bountyShots:w.bountyShots,guns:[...guns.values()].map(b=>({id:b.id,role:b.aceRole,active:b.active,hp:b.hp,maxHp:b.maxHp,age:b.age,warning:b.warning,shots:b.bountyShots??0,rage:b.aceEnraged??false,rageShots:b.aceRageShots??0})),events});
 }
 writeFileSync('build/qa/Stage-213/normal-duo.json',JSON.stringify(rows,null,2));
 for(const row of rows){expect(row.status,`${row.first}/${row.reward}`).toBe('won');expect(row.claim).not.toBeNull();expect(row.hp).toBeGreaterThan(0);expect([...row.guns].sort((a,b)=>a.age-b.age)[0].role).toBe(row.first);
  const survivor=row.guns.find(b=>b.role!==row.first)!;expect(survivor.rage).toBe(true);
  // A strong build can interrupt revenge during its visible charge. Do not grant immunity just to force a demonstration.
  if(!survivor.rageShots){expect(survivor.hp).toBe(0);expect(survivor.warning).toBe(1);}
 }
 for(const first of ['fan','needle'])expect(rows.filter(r=>r.first===first).some(r=>r.guns.some(b=>b.rage&&b.rageShots===5))).toBe(true);
},120000);
