import{World}from'../src/core/world';import{C}from'../src/core/config';import{progressionTarget}from'../tests/helpers/progression-driver';import{writeFileSync}from'node:fs';
const path='./baseline.mjs',Old=(await import(path)).World;
type Branch='burn'|'relay'|'mirror';
function upgrade(w:World,branch:Branch){if(w.bossRewardRound!==null&&w.phase==='recovery'&&w.phaseTime>=C.bossLootReveal)w.claimBossReward('research');const a=w.build.available(w.buildPoints),r=a.includes('optical')?'optical':a[0];if(r)w.chooseBuild(r,r==='optical'?(w.canRefinePhoton()?'photon-reach':w.build.ranks.optical===1?branch:undefined):r==='ballistic'&&w.build.ranks.ballistic===1?'ricochet':undefined);}
function clean(w:World){return JSON.stringify(w,(k,v)=>k.startsWith('mirror')?undefined:v instanceof Map?[...v]:v instanceof Set?[...v]:v);}
function legacy(branch:'burn'|'relay'){
 const a=new Old(1337,1,'scatter'),b=new World(1337,1,'scatter');let aim=360;
 for(let f=0;f<300*60;f++){upgrade(a,branch);upgrade(b,branch);if(f%6===0)aim=progressionTarget(a);a.step(C.step,aim);b.step(C.step,aim);const ae=a.drainEffects(),be=b.drainEffects();if(clean(a)!==clean(b)||JSON.stringify(ae)!==JSON.stringify(be))throw Error('Legacy divergence '+branch+' at '+f);}
 return{branch,frames:18000,time:b.time,hp:b.player.hp,physicalAndEffectsEqual:true};
}
function normal(seed:number,seconds:number){
 const w=new World(seed,1,'scatter');let aim=360,selectedAt:number|null=null,firstHit:number|null=null,firstDouble:number|null=null;const samples:any[]=[];
 for(let f=0;f<seconds*60&&w.player.hp>0;f++){
  upgrade(w,'mirror');if(w.build.opticalBranch==='mirror')selectedAt??=w.time;if(f%6===0)aim=progressionTarget(w);const doubles=w.mirrorDoubleHits;w.step(C.step,aim);const events=w.drainEffects();if(w.mirrorHits>0)firstHit??=w.time;if(w.mirrorDoubleHits>doubles){firstDouble??=w.time;if(samples.length<3)samples.push({time:w.time,round:w.round,playerX:w.player.x,effects:events.filter(e=>e.type==='mirror-laser')});}
 }
 return{seed,seconds,time:w.time,hp:w.player.hp,selectedAt,firstHit,firstDouble,shots:w.mirrorShots,hits:w.mirrorHits,bounces:w.mirrorBounces,doubles:w.mirrorDoubleHits,gateClaims:w.gatesTaken,pickups:w.pickups,bossWins:w.bossWins,peakBodies:w.peakBodies,peakBullets:w.peakBullets,contributions:w.combatContributions(),samples};
}
const equality=[legacy('burn'),legacy('relay')];console.log(JSON.stringify({equality}));const runs=[];for(const[seed,seconds]of[[1337,600],[9001,600],[1337,1200]]){const r=normal(seed,seconds);runs.push(r);console.log(JSON.stringify({seed,seconds,hp:r.hp,choice:r.selectedAt,hits:r.hits,doubles:r.doubles,firstDouble:r.firstDouble,wins:r.bossWins,peak:r.peakBullets}));}
writeFileSync('build/qa/Stage-224/normal-audit.json',JSON.stringify({method:'Normal earned controls and upgrades; two seeds, long run extends seed1337. Legacy whole World and effects compared frame by frame after excluding new zero counters. Safe operator has future hazard knowledge, virtual60Hz, not human or device performance.',equality,runs},null,2));
