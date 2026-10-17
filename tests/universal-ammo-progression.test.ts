import{it,expect}from'vitest';import{writeFileSync}from'node:fs';import{World}from'../src/core/world';import{C}from'../src/core/config';import{buildPreview}from'../src/game/build-preview';import{progressionTarget}from'./helpers/progression-driver';import{ballisticWeapons}from'../src/core/weapons';
it('normal earned openings use each immutable ammo choice on current and later ballistic guns with real reactions',()=>{
 const runs=[];for(const opening of ['arc','pierce','blast','scatter']as const)for(const branch of ['penetrator','fragment','ricochet']as const){const w=new World(1337,1,opening);let aim=360,selected:unknown=null;
  for(let f=0;f<600*60&&w.player.hp>0;f++){
   if(w.bossRewardRound!==null&&w.phase==='recovery'&&w.phaseTime>=C.bossLootReveal)w.claimBossReward('research');const a=w.build.available(w.buildPoints),r=a.includes('ballistic')?'ballistic':a.includes('electric')?'electric':a[0];
   if(r){const fork=r==='ballistic'&&w.build.ranks.ballistic===1,choice=fork?branch:r==='ballistic'&&w.canRefineFracture()?'fracture-line':r==='ballistic'&&w.canRefineStorm()?'storm-relay':undefined;const preview=fork?buildPreview(w,r,choice):null,spent=w.build.spent,owned=[...w.activeWeapons];expect(w.chooseBuild(r,choice)).toBe(true);if(fork){selected={time:w.time,points:w.buildPoints,spentBefore:spent,spentAfter:w.build.spent,owned,gain:preview!.gain,profiles:preview!.weaponGains.map(g=>({kind:g.kind,before:g.dpsBefore,after:g.dpsAfter}))};expect(w.build.spent).toBe(spent+1);expect(w.activeWeapons).toEqual(owned);for(const gain of preview!.weaponGains)expect(w.profileFor(gain.kind)).toEqual(gain.after);}}
   if(f%6===0)aim=progressionTarget(w,opening);w.step(C.step,aim);w.drainEffects();
  }
  const row={opening,branch,selected,time:w.time,hp:w.player.hp,round:w.round,score:w.score,weapons:[...w.activeWeapons],reactions:w.ballisticReactions(),totals:w.ballisticTotals(),contributions:w.combatContributions(),bankShots:w.bankShots??0,peakBullets:w.peakBullets,peakBodies:w.peakBodies};runs.push(row);expect(selected).not.toBeNull();expect(w.time).toBeCloseTo(600,4);expect(w.activeWeapons).toContain('pulse');expect(w.peakBullets).toBeLessThanOrEqual(128);expect(w.peakBodies).toBeLessThanOrEqual(32);
  const metric=branch==='penetrator'?'pierces':branch==='ricochet'?'ricochets':'splashHits';expect(row.totals[metric]).toBeGreaterThan(0);
 }
 writeFileSync('build/qa/Stage-208/normal-ammo.json',JSON.stringify(runs,null,2));
 for(const kind of ballisticWeapons.filter(k=>k!=='scatter'))for(const branch of ['penetrator','fragment','ricochet']as const){const metric=branch==='penetrator'?'pierces':branch==='ricochet'?'ricochets':'splashHits';expect(runs.some(r=>r.branch===branch&&r.reactions.some(a=>a.kind===kind&&a[metric]>0)),kind+'/'+branch).toBe(true);}
},120000);
