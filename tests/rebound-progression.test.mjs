import {it,expect} from 'vitest';import {mkdirSync,writeFileSync} from 'node:fs';import {World} from '../src/core/world';import {C} from '../src/core/config';import {reboundState} from '../src/core/rebound-charger';import {progressionTarget} from './helpers/progression-driver';
class Traced extends World{chargers=[];spawn(...args){const b=super.spawn(...args);if(b.kind==='charger')this.chargers.push({body:b,time:this.time,round:this.round,phases:new Set(),samples:[]});return b;}}
it('observes natural rebound actions with normal equipment and compares unmodified normal operators',()=>{
 const runs=[];
 for(const mode of ['ballistic','electric','optical','observe']){
  const w=new Traced(1337);let target=360,watched;
  for(let frame=0;frame<600*60&&w.phase!=='dead';frame++){
   if(w.bossRewardRound!==null&&w.phase==='recovery'&&w.phaseTime>=C.bossLootReveal)w.claimBossReward('research');
   const preferred=mode==='observe'?'electric':mode,a=w.build.available(w.buildPoints),r=a.includes(preferred)?preferred:a[0];if(r)w.chooseBuild(r);
   if(frame%6===0){const visible=w.bodies.find(b=>b.active&&b.pattern==='rebound');if(mode==='observe'&&visible){watched??=visible;target=visible.reboundOrigin??visible.x;target=target<360?652:68;}else target=progressionTarget(w);}
   w.step(C.step,target);w.drainEffects();
   for(const t of w.chargers)if(t.body.active&&t.body.pattern==='rebound'){const state=reboundState(t.body);t.phases.add(state.phase);if(t.samples.at(-1)?.phase!==state.phase)t.samples.push({time:w.time,age:t.body.age,x:t.body.x,y:t.body.y,hp:t.body.hp,phase:state.phase,warning:t.body.warning});}
   if(mode==='observe'&&watched?.active&&watched.age>=3.3)break;
  }
  const variants=w.chargers.filter(t=>t.body.pattern==='rebound').map(t=>({round:t.round,time:t.time,maxHp:t.body.maxHp,phases:[...t.phases],samples:t.samples}));runs.push({mode,time:w.time,hp:w.player.hp,round:w.round,kills:w.kills,weapons:w.activeWeapons,variants});
 }
 mkdirSync('build/qa/Stage-166',{recursive:true});writeFileSync('build/qa/Stage-166/rebound-normal.json',JSON.stringify(runs,null,2));
 for(const r of runs.filter(r=>r.mode!=='observe')){expect(r.time).toBeCloseTo(600);expect(r.hp).toBeGreaterThan(0);expect(r.variants.length).toBeGreaterThan(0);}
 const observed=runs.find(r=>r.mode==='observe');expect(observed.hp).toBeGreaterThan(0);expect(observed.variants.some(v=>['approach','charge','inward','turn','return'].every(p=>v.phases.includes(p)))).toBe(true);
},60000);
