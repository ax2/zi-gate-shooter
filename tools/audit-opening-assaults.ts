import{World}from'../src/core/world';import{C}from'../src/core/config';import{progressionTarget}from'../tests/helpers/progression-driver';import{writeFileSync}from'node:fs';import{observedNoFireRoute}from'../tests/helpers/observed-route-driver';
const path='./baseline.mjs',Old=(await import(path)).World,seconds=Number(process.env.OPENING_SECONDS??300);
if(process.env.OPENING_ROUTES==='1'){
 const routes=[];for(const round of[1,2,3,4,5,6,8,9,12,15])for(const plan of[0,1,2]as const)for(const start of[68,360,652]){
  const r=observedNoFireRoute(round,plan,start,round%2?1337:9001);routes.push(r);if(r.failureTime!==null||r.hp!==3)console.log(JSON.stringify(r));
 }
 writeFileSync('build/qa/Stage-225/routes.json',JSON.stringify(routes,null,2));console.log(JSON.stringify({routes:routes.length,failed:routes.filter(r=>r.failureTime!==null||r.hp!==3||r.phase!=='boss-entry').length}));
}else{
 function run(Runtime:typeof World,route:'ballistic'|'electric'|'optical'){
  const w=new Runtime(1337,1,'scatter'),chapters=new Map<number,any>(),births=new Map<number,any>(),seen=new Set<number>();let aim=360;
  const spawn=w.spawn.bind(w);w.spawn=((...args:Parameters<World['spawn']>)=>{const b=spawn(...args);if(b.kind in C.enemies)births.set(b.id,{round:w.round,at:w.roundTime,kind:b.kind,x:b.x,y:b.y,b,shots:0});return b;})as World['spawn'];
  for(let f=0;f<seconds*60&&w.player.hp>0;f++){
   if(w.bossRewardRound!==null&&w.phase==='recovery'&&w.phaseTime>=C.bossLootReveal)w.claimBossReward('research');
   const a=w.build.available(w.buildPoints),r=a.includes(route)?route:a[0];if(r)w.chooseBuild(r,r==='ballistic'?(w.canFuseAmmo()?'fuse-fragment':w.canRefineStorm()?'storm-relay':w.canRefineFracture()?'fracture-line':w.build.ranks[r]===1?'ricochet':undefined):r==='electric'?(w.canRefineMagnetic()?'field-link':w.canRefineIon()?'ion-orb':w.build.ranks[r]===1?'seeker':undefined):w.canRefinePhoton()?'photon-reach':w.build.ranks[r]===1?'burn':undefined);
   if(f%6===0)aim=progressionTarget(w);w.step(C.step,aim);w.drainEffects();
   for(const b of w.bodies)if(b.active&&births.has(b.id))births.get(b.id).accepted=true;
   for(const b of w.bullets)if(b.hostile&&!seen.has(b.id)){seen.add(b.id);const s=births.get(b.sourceId!);if(s)s.shots++;}
   if(w.phase==='running'){
    let c=chapters.get(w.round);if(!c){c={round:w.round,earlySeconds:0,earlyEnemySeconds:0,earlyEmpty:0,earlyMax:0,firstPickup:null,gates:0,pickups:0};chapters.set(w.round,c);}
    c.gates=w.gatesTaken;c.pickups=w.pickups;if(w.pickups>0)c.firstPickup??=w.roundTime;
    if(w.roundTime>=6.5&&w.roundTime<10){const n=w.bodies.filter(b=>b.active&&b.kind in C.enemies&&b.y>=0&&b.y<=1280).length;c.earlySeconds+=C.step;c.earlyEnemySeconds+=n*C.step;c.earlyEmpty+=Number(n===0)*C.step;c.earlyMax=Math.max(c.earlyMax,n);}
   }
  }
  return{route,time:w.time,hp:w.player.hp,damage:w.damageTaken,round:w.round,gates:w.gatesTaken,pickups:w.pickups,kills:w.kills,bossWins:w.bossWins,peakBodies:w.peakBodies,peakBullets:w.peakBullets,chapters:[...chapters.values()].map(c=>({...c,earlyMean:c.earlyEnemySeconds/c.earlySeconds})),openingSources:[...births.values()].filter(s=>s.accepted&&s.at>=6.5&&s.at<8.7&&s.y>=300).map(({b,...s})=>({...s,pattern:b.pattern,maxHp:b.maxHp}))};
 }
 const runs=[];for(const route of['ballistic','electric','optical']as const){const before=run(Old,route),after=run(World,route);runs.push({before,after});console.log(JSON.stringify({route,before:{hp:before.hp,pickups:before.pickups,gates:before.gates,wins:before.bossWins},after:{hp:after.hp,pickups:after.pickups,gates:after.gates,wins:after.bossWins,chapters:after.chapters.slice(0,3)}}));}
 writeFileSync(`build/qa/Stage-225/normal-${seconds}.json`,JSON.stringify({seconds,seed:1337,method:'Normally earned progression, identical omniscient zero-reaction safe operator, virtual60Hz; no World injection. Early combat interval6.5..10 excludes later gate windows. Source slots require observed active admission, actual shots measured separately. Not human difficulty or device performance.',runs},null,2));
}
