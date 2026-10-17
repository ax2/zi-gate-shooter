import {World} from '../../src/core/world';import {C} from '../../src/core/config';import {progressionTarget} from './progression-driver';
/** Normal inputs and earned choices; spawn and projectile wrappers only observe. */
export function runDefaultPressure(Runtime:typeof World,route:'ballistic'|'electric'|'optical',policy:'safe'|'aim'|'hold',seconds=300,engagement:'auto'|'relay'|'guns'='auto'){
 const w=new Runtime(1337,1,'scatter'),sources=new Map<number,any>(),shots:any[]=[];let aim=360,lastGrowth=0,maxGrowthGap=0;const growth=[],damageEvents:{time:number;round:number;cause:unknown}[]=[];
 const spawn=w.spawn.bind(w);w.spawn=((...args:Parameters<World['spawn']>)=>{const b=spawn(...args);if(b.kind in C.enemies)sources.set(b.id,{body:b,round:w.round,at:w.time,roundTime:w.roundTime,seen:false,shots:[]});return b;}) as World['spawn'];
 const fire=(w as any).hostile.bind(w);(w as any).hostile=(...args:any[])=>{const before=w.bullets.length;fire(...args);if(w.bullets.length>before){const b=w.bullets.at(-1)!;shots.push({body:b,time:w.time,x:b.x,y:b.y,vx:b.vx,vy:b.vy});}};
 const chapters=new Map<number,{frames:number;bodyFrames:number;peak:number;emptyFrames:number;emptyStreak:number;longestEmpty:number}>();
 const state=()=>JSON.stringify([w.growth.bonus,w.growth.energy,w.growth.mastery,w.researchPoints,w.build.spent,w.activeWeapons.map(k=>[k,w.weaponStage(k),w.weaponCalibration(k)])]);
 for(let f=0;f<seconds*60&&w.player.hp>0;f++){
  const before=state(),damageBefore=w.damageTaken;if(w.bossRewardRound!==null&&w.phase==='recovery'&&w.phaseTime>=C.bossLootReveal)w.claimBossReward('research');
  const a=w.build.available(w.buildPoints),r=a.includes(route)?route:a[0];
  if(r)w.chooseBuild(r,r==='ballistic'?(w.canFuseAmmo()?'fuse-fragment':w.canRefineStorm()?'storm-relay':w.canRefineFracture()?'fracture-line':w.build.ranks[r]===1?'ricochet':undefined):r==='electric'?(w.canRefineMagnetic()?'field-link':w.canRefineIon()?'ion-orb':w.build.ranks[r]===1?'seeker':undefined):w.canRefinePhoton()?'photon-reach':w.build.ranks[r]===1?'burn':undefined);
  if(f%6===0){const breach=engagement==='auto'?undefined:w.bodies.filter(b=>b.active&&b.controlGroup===-w.round).sort((a,b)=>Number(b.kind===(engagement==='relay'?'conduit':'armor'))-Number(a.kind===(engagement==='relay'?'conduit':'armor'))||b.y-a.y)[0];if(breach)aim=progressionTarget(w,undefined,breach.x);else if(policy==='hold'&&w.time>=40)aim=360;else if(policy==='safe')aim=progressionTarget(w);else{const b=w.bodies.filter(b=>b.active&&['pickup','crate','gate'].includes(b.kind)).sort((a,b)=>b.y-a.y)[0]??w.bodies.filter(b=>b.active).sort((a,b)=>b.y-a.y)[0];if(b)aim=b.x;}}
  w.step(C.step,aim);w.drainEffects();if(w.damageTaken>damageBefore)damageEvents.push({time:w.time,round:w.round,cause:w.lastDamageCause});
  if(w.phase==='running'){
   const r=chapters.get(w.round)??{frames:0,bodyFrames:0,peak:0,emptyFrames:0,emptyStreak:0,longestEmpty:0};
   const n=w.bodies.filter(b=>b.active&&b.kind in C.enemies&&b.y>=0&&b.y<=1280).length;
   r.frames++;r.bodyFrames+=n;r.peak=Math.max(r.peak,n);r.emptyFrames+=Number(n===0);r.emptyStreak=n===0?r.emptyStreak+1:0;r.longestEmpty=Math.max(r.longestEmpty,r.emptyStreak);chapters.set(w.round,r);
  }
  for(const s of sources.values())if(s.body.active)s.seen=true;
  for(const s of shots.splice(0)){const source=sources.get(s.body.sourceId);if(source)source.shots.push({time:s.time,x:s.x,y:s.y,vx:s.vx,vy:s.vy});}
  if(state()!==before){maxGrowthGap=Math.max(maxGrowthGap,w.time-lastGrowth);lastGrowth=w.time;growth.push({time:w.time,round:w.round,pickups:w.pickups,gates:w.gatesTaken});}
 }
 const bodies=[...sources.entries()].filter(([,s])=>s.seen||s.body.hp===0||s.shots.length).map(([id,s])=>({id,kind:s.body.kind,pattern:s.body.pattern,controlGroup:s.body.controlGroup,round:s.round,at:s.at,roundTime:s.roundTime,age:s.body.age,hp:s.body.hp,maxHp:s.body.maxHp,active:s.body.active,x:s.body.x,y:s.body.y,shots:s.shots}));
 return {route,policy,time:w.time,round:w.round,hp:w.player.hp,damage:w.damageTaken,score:w.score,pickups:w.pickups,gates:w.gatesTaken,mastery:w.growth.mastery,damageEvents,maxGrowthGap:Math.max(maxGrowthGap,w.time-lastGrowth),growth,sources:bodies,chapters:[...chapters].map(([round,r])=>({round,seconds:r.frames/60,meanVisible:r.bodyFrames/r.frames,peakVisible:r.peak,emptyFraction:r.emptyFrames/r.frames,longestEmpty:r.longestEmpty/60})),peakBodies:w.peakBodies,peakBullets:w.peakBullets};
}
