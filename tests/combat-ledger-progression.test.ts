import{it,expect}from'vitest';import{writeFileSync}from'node:fs';import{World,type Body}from'../src/core/world';import{C}from'../src/core/config';import{progressionTarget}from'./helpers/progression-driver';import{combatContribution}from'../src/game/combat-contribution';import type{WeaponKind}from'../src/core/weapons';import type{Route,BuildBranch}from'../src/core/build-tree';
it('normal earned builds expose actual weapon and combo roles, conserving every removed enemy HP and kill',()=>{
 const records=[];
 for(const opening of ['scatter','arc','pierce','blast','pulse']as const){const w=new World(1337,1,opening==='pulse'?undefined:opening);let aim=360,removed=0,finishes=0;
  // Independent live-health observer, not the ledger implementation or declared damage.
  const hit=(w as any).hit.bind(w);(w as any).hit=(body:Body,...args:unknown[])=>{const active=body.active,before=body.hp,enemy=body.kind in C.enemies;hit(body,...args);if(active&&enemy){removed+=Math.max(0,before-body.hp);if(before>0&&body.hp<=0)finishes++;}};
  for(let f=0;f<600*60&&w.player.hp>0;f++){
   if(w.bossRewardRound!==null&&w.phase==='recovery'&&w.phaseTime>=C.bossLootReveal){let reward:WeaponKind|'research'='research';if(opening==='pierce'&&w.activeWeapons.includes('blast')&&w.weaponStage('blast')<2)reward='blast';if(opening==='pulse'&&w.activeWeapons.includes('arc')&&w.weaponStage('arc')<2)reward='arc';w.claimBossReward(reward);}
   const available=w.build.available(w.buildPoints);let route:Route=opening==='arc'||opening==='blast'?'electric':opening==='pulse'?'optical':'ballistic';
   if(!available.includes(route))route=available.includes('electric')?'electric':available[0];
   if(route){let branch:BuildBranch|undefined;
    if(route==='ballistic')branch=w.canRefineFracture()?'fracture-line':w.canRefineStorm()?'storm-relay':undefined;
    if(route==='electric')branch=w.canRefineMagnetic()?'field-link':w.canRefineIon()?'ion-spear':undefined;
    if(route==='optical')branch=w.canRefinePhoton()?'photon-reach':undefined;
    w.chooseBuild(route,branch);
   }
   if(f%6===0)aim=progressionTarget(w,opening==='pierce'&&w.weaponStage('blast')<2?'blast':opening==='pulse'&&!w.laserChainUnlocked()?'arc':opening);w.step(C.step,aim);w.drainEffects();
  }
  const report=combatContribution(w);records.push({opening,time:w.time,hp:w.player.hp,round:w.round,kills:w.kills,removed,finishes,...report});
  expect(report.total).toBeCloseTo(removed,5);expect(report.rows.reduce((s,r)=>s+r.kills,0)).toBe(finishes);expect(finishes).toBe(w.kills);expect(report.total).toBeGreaterThan(0);expect(w.time).toBeCloseTo(600,4);
 }
 writeFileSync('build/qa/Stage-206/normal-contributions.json',JSON.stringify(records,null,2));
 for(const source of ['scatter','arc','pierce','blast','pulse','laser','storm','ion','fracture','magnetic','photon'])expect(records.some(r=>r.rows.some(row=>row.source===source&&row.damage>0)),source).toBe(true);
},120000);
