import {it,expect} from 'vitest';import {mkdirSync,writeFileSync} from 'node:fs';import {World} from '../src/core/world';import {C} from '../src/core/config';import {supplyTarget} from './helpers/supply-driver';
class Traced extends World{convoys=[];supply=[];spawn(...args){const b=super.spawn(...args);if(b.kind==='guard')this.convoys.push(b);if(b.kind==='crate'&&this.roundTime>=47&&this.roundTime<=50)this.supply.push(b);return b;}}
it('compares early commitment and an actual late crossing after normal equipment growth',()=>{
 const records=[];
 for(const mode of ['early','early-right','late','clear','forecast']){
  const w=new Traced(1337);let target=360;const shots=new Set(),contacts=[],claims=[],samples=[];let beforeWave=null;
  for(let frame=0;frame<420*60&&w.phase!=='dead';frame++){
   if(w.bossRewardRound!==null&&w.phase==='recovery'&&w.phaseTime>=C.bossLootReveal)w.claimBossReward('research');
   const a=w.build.available(w.buildPoints),r=a.includes('electric')?'electric':a[0];if(r)w.chooseBuild(r);
   if(frame%6===0)target=supplyTarget(w,mode);const prior=[...w.bullets],hp=w.player.hp,pickups=w.pickups;
   if(w.round===4&&w.roundTime>=47.5&&!beforeWave)beforeWave={time:w.time,hp,playerX:w.player.x,weapons:w.activeWeapons,mastery:w.growth.mastery};
   w.step(C.step,target);w.drainEffects();
   for(const b of w.convoys)if(b.active&&b.pattern==='convoy')for(const s of w.bullets)if(s.hostile&&s.age<=C.step+1e-8&&Math.abs(s.px-b.x)<1e-6&&Math.abs(s.py-b.y-b.height/2)<1e-6)shots.add(s.id);
   if(w.player.hp<hp){const hit=prior.filter(b=>b.hostile&&!b.active&&shots.has(b.id));contacts.push({time:w.time,round:w.round,roundTime:w.roundTime,x:w.player.x,cause:w.lastDamageCause,guardShotIds:hit.map(b=>b.id),hp:w.player.hp});}
   if(w.pickups>pickups&&w.round===4&&w.roundTime>=47)claims.push({time:w.time,roundTime:w.roundTime,x:w.player.x,pickups:w.pickups});
   if(w.round===4&&w.roundTime>=48&&w.roundTime<=54&&frame%6===0)samples.push({time:w.time,roundTime:w.roundTime,x:w.player.x,hp:w.player.hp,guardAlive:w.convoys.some(b=>b.active&&b.pattern==='convoy')});
  }
  records.push({mode,time:w.time,hp:w.player.hp,round:w.round,shots:shots.size,beforeWave,contacts,claims,samples});
 }
 mkdirSync('build/qa/Stage-167',{recursive:true});writeFileSync('build/qa/Stage-167/normal-choice.json',JSON.stringify(records,null,2));
 for(const r of records){expect(r.beforeWave.hp).toBe(3);expect(r.claims).toHaveLength(r.mode==='late'?0:1);expect(r.time).toBeCloseTo(420);if(r.mode==='clear')expect(r.shots).toBe(0);else expect(r.shots).toBeGreaterThan(0);}
 expect(records.find(r=>r.mode==='early').contacts.filter(c=>c.round===4&&c.roundTime>=48&&c.roundTime<=54)).toHaveLength(0);
 expect(records.find(r=>r.mode==='late').contacts.some(c=>c.round===4&&c.guardShotIds.length>0)).toBe(true);
},60000);
