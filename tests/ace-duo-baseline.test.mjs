import {it,expect} from 'vitest';import{createHash}from'node:crypto';import{writeFileSync,existsSync}from'node:fs';import{execFileSync}from'node:child_process';
import{World}from'../src/core/world';import{C}from'../src/core/config';import{timeline}from'../src/core/director';import{progressionTarget}from'./helpers/progression-driver';import{huntAim}from'./helpers/hunter-driver';
if(!existsSync('build/qa/Stage-213/baseline.mjs'))execFileSync(process.execPath,['tools/capture-stage213-baseline.mjs']);const old=await import('../build/qa/Stage-213/baseline.mjs');
function run(Runtime,hunt){const w=new Runtime(1337,1,'scatter'),hash=createHash('sha256'),effects=createHash('sha256');let aim=360,accepted=false;for(let f=0;f<600*60&&w.player.hp>0;f++){
 if(w.bossRewardRound!==null&&w.phase==='recovery'&&w.phaseTime>=C.bossLootReveal)w.claimBossReward('research');
 if(hunt&&!accepted&&w.canAcceptContract('hunter')){w.acceptContract('hunter');accepted=true;}
 if(w.contractReward)w.claimContractReward('energy');
 const a=w.build.available(w.buildPoints),r=a.includes('optical')?'optical':a[0];if(r)w.chooseBuild(r);
 if(f%6===0)aim=w.contract?.status==='active'?huntAim(w):progressionTarget(w);w.step(C.step,aim);effects.update(JSON.stringify(w.drainEffects()));hash.update(JSON.stringify(w,(_k,v)=>v instanceof Map?[...v]:v instanceof Set?[...v]:v));
 }return{time:w.time,hp:w.player.hp,score:w.score,status:w.contract?.status,hash:hash.digest('hex'),effects:effects.digest('hex')};}
it.each([false,true])('preserves complete state and effects for a normal 600-second run with default staggered hunt %s',hunt=>{const baseline=run(old.World,hunt),current=run(World,hunt);writeFileSync(`build/qa/Stage-213/baseline-${hunt?'staggered':'default'}.json`,JSON.stringify({baseline,current},null,2));expect(current).toEqual(baseline);expect(current.time).toBeCloseTo(600,4);},120000);
it('keeps all 108 chapter schedules exactly unchanged',()=>{for(let r=1;r<=12;r++)for(const s of[1,29,1337])for(const p of[0,1,2])expect(timeline(r,s,p)).toEqual(old.timeline(r,s,p));});
