import{it,expect}from'vitest';import{writeFileSync}from'node:fs';import{World}from'../src/core/world';import{C}from'../src/core/config';import{progressionTarget}from'./helpers/progression-driver';import{clamp}from'../src/core/config';
it('normal earned storm builds meet real outward shots and wall returns, with a selectable gun-first tactic',()=>{
 const runs=[];for(const branch of ['storm-relay','storm-focus']as const)for(const tactic of ['ordinary','gun-first']){const w=new World(1337,1,'scatter');let aim=360;const guns=new Map<number,{round:number;hp:number;spawn:number;last:number;shots:number;killed:boolean}>();const reflections=[];
  for(let f=0;f<600*60&&w.player.hp>0;f++){
   if(w.bossRewardRound!==null&&w.phase==='recovery'&&w.phaseTime>=C.bossLootReveal)w.claimBossReward('research');const a=w.build.available(w.buildPoints),r=a.includes('ballistic')?'ballistic':a.includes('electric')?'electric':a[0];if(r)w.chooseBuild(r,r==='ballistic'&&w.canRefineStorm()?branch:r==='ballistic'&&w.canRefineFracture()?'fracture-line':undefined);
   if(f%6===0){aim=progressionTarget(w,'scatter');if(tactic==='gun-first'){const gun=w.bodies.filter(b=>b.active&&b.pattern==='bankshot').sort((a,b)=>a.hp-b.hp)[0];if(gun)aim=clamp(gun.x,C.minX,C.maxX);}}
   const watched=w.bodies.filter(b=>b.active&&b.pattern==='bankshot');w.step(C.step,aim);for(const e of w.drainEffects())if(e.type==='bank-bounce')reflections.push({time:w.time,x:e.x,y:e.y});
   for(const b of new Set([...watched,...w.bodies.filter(b=>b.pattern==='bankshot')])){let row=guns.get(b.id);if(!row){row={round:w.round,hp:b.maxHp,spawn:w.time,last:w.time,shots:0,killed:false};guns.set(b.id,row);}row.last=w.time;row.shots=Math.max(row.shots,b.bankShots??0);row.killed||=b.hp<=0;}
  }
  runs.push({branch,tactic,time:w.time,hp:w.player.hp,round:w.round,score:w.score,shots:w.bankShots??0,bounces:w.bankReflections??0,guns:[...guns.values()],reflections});
 }
 writeFileSync('build/qa/Stage-207/normal.json',JSON.stringify(runs,null,2));for(const run of runs){expect(run.time).toBeCloseTo(600,4);expect(run.guns.length).toBeGreaterThanOrEqual(2);}expect(runs.filter(r=>r.tactic==='ordinary').every(r=>r.shots>0&&r.bounces>0)).toBe(true);
},120000);
