import{FlightWorld,F,segmentDistance,type Enemy}from'../../src/flight/world';
import{bossPartRules,bossPartPosition,bossPartMuzzles}from'../../src/flight/boss-parts';
import{maneuverPose}from'../../src/flight/airspace';
import{technologies,keystones}from'../../src/flight/technology';
export type FlightRoute='ballistic'|'electric'|'optical';
export const flightOrders:Record<FlightRoute,string[]>={
 ballistic:['split','bounce','rail','coil','chain','flak','stormgun','barrage','arsenal','laser','twin','burn','seeker','emp','drill','prism','tempest','sun'],
 electric:['coil','chain','seeker','split','stormgun','laser','twin','emp','tempest','bounce','rail','burn','flak','barrage','arsenal','prism','drill','sun'],
 optical:['laser','twin','burn','split','bounce','prism','rail','drill','sun','coil','chain','seeker','stormgun','emp','flak','barrage','tempest','arsenal'],
};
const desiredKeystone={ballistic:'arsenal',electric:'tempest',optical:'sun'};
export const advancedOrders:Record<FlightRoute,string[]>={ballistic:['railburst','satellites'],electric:['stormlens','reversefield'],optical:['novaecho','lightwell']};
export function flightChoice(w:FlightWorld,route:FlightRoute,variant=0){const order=[...flightOrders[route],...advancedOrders[route].slice().sort((a,b)=>a===advancedOrders[route][variant]?-1:b===advancedOrders[route][variant]?1:0)];return order.find(id=>(!keystones.includes(id)||id===desiredKeystone[route])&&!w.assembly.has(id)&&w.assembly.can(id));}
export function flightGoal(w:FlightWorld,route:FlightRoute){return [...flightOrders[route],...advancedOrders[route]].find(id=>(!keystones.includes(id)||id===desiredKeystone[route])&&!w.assembly.has(id)&&!w.assembly.missing(id).length&&!w.assembly.lockedBy(id));}
function flightEnemyPose(w:FlightWorld,e:Enemy,t:number):{x:number;y:number}{
 if(e.kind==='boss')return{x:360+Math.sin((e.age+t)*.5)*(w.bossAssembly?.parent===e.id?bossPartRules.swing:190),y:Math.min(285,e.y+130*t)};
 if(e.bossPart){const parent=w.enemies.find(p=>p.id===e.bossPart!.parent);if(parent)return bossPartPosition(flightEnemyPose(w,parent,t),e.bossPart.side,e.age+t);}
 if(e.maneuver)return maneuverPose(e.maneuver,e.age+t);
 const speed=e.kind==='mine'?45:e.kind==='diver'?300:e.kind==='drone'?130:e.age>8?105:12;return{x:e.x,y:e.y+speed*t};
}
/** Test-only omniscient operator. Samples physical paths, never changes HP, loot,
 * enemies or damage. It is not a proof of human difficulty or device FPS. */
export function flightTarget(w:FlightWorld,preferred?:{x:number;y:number}){
 const p=w.player,items=w.loot.filter(l=>l.age<(l.trialReward?27:15)).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y));
 const front=w.enemies.filter(e=>e.hp>0&&e.y>140&&e.y<950).sort((a,b)=>b.y-a.y)[0];
 const goal=preferred??(items[0]?{x:items[0].x,y:items[0].y+45}:front?{x:front.x,y:Math.min(1060,Math.max(580,front.y+250))}:{x:360,y:900});
 const candidates=[goal,{x:p.x,y:p.y}];for(const dx of[-220,-110,0,110,220])for(const dy of[-180,-90,0,90,180])candidates.push({x:Math.max(45,Math.min(675,p.x+dx)),y:Math.max(210,Math.min(1160,p.y+dy))});
 let best=candidates[0],score=Infinity;
 for(const q of candidates){const dist=Math.hypot(q.x-p.x,q.y-p.y),travel=dist/F.speed;let risk=0;
  for(let i=1;i<=8;i++){const t=i*.09,f=Math.min(1,t/(travel||1)),x=p.x+(q.x-p.x)*f,y=p.y+(q.y-p.y)*f;
   for(const b of w.bullets)if(b.hostile){const d=Math.hypot(b.x+b.vx*t-x,b.y+b.vy*t-y)-(b.r+F.playerRadius+10);if(d<0)risk+=10000;else if(d<50)risk+=(50-d)*3;}
   for(const e of w.enemies){const at=flightEnemyPose(w,e,t),d=Math.hypot(at.x-x,at.y-y)-e.r*.7-F.playerRadius-10;if(d<0)risk+=12000;else if(d<70)risk+=(70-d)*5;
    if((e.kind==='lancer'||e.bossPart?.kind==='lens')&&e.aimX!==undefined&&e.timer<t){const atFire=flightEnemyPose(w,e,Math.max(0,e.timer)),origin=e.bossPart?bossPartMuzzles({...e,x:atFire.x,y:atFire.y})[0]:atFire,a=Math.atan2((e.aimY??p.y)-origin.y,e.aimX-origin.x),d=segmentDistance(x,y,origin.x,origin.y,origin.x+Math.cos(a)*1600,origin.y+Math.sin(a)*1600);if(d<35)risk+=15000;}
   }
   for(const e of w.effects)if(e.hostile&&e.points){const[a,b]=e.points;if(segmentDistance(x,y,a.x,a.y,b.x,b.y)<32)risk+=15000;}
  }
  const s=risk+Math.hypot(q.x-goal.x,q.y-goal.y)*.5+dist*.05;if(s<score){score=s;best=q;}
 }
 return best;
}
export function flightRun(route:FlightRoute,seed=1337,seconds=300){const w=new FlightWorld(seed);w.start(flightOrders[route][0]);let target={x:360,y:1040};const upgrades:unknown[]=[],milestones:unknown[]=[],seen=new Set<number>();let peakEnemies=0,peakHostile=0,peakFriendly=0,peakLoot=0;
 for(let frame=0;frame<seconds*60&&w.phase!=='dead';frame++){
  if(frame%6===0){target=flightTarget(w);const id=flightChoice(w,route);if(id){const before={...w.assembly.inventory};w.install(id);upgrades.push({time:w.time,id,before,after:{...w.assembly.inventory},kills:w.kills});}w.target=flightGoal(w,route);}
  w.step(F.step,target.x,target.y);w.drainEvents();peakEnemies=Math.max(peakEnemies,w.enemies.length);peakHostile=Math.max(peakHostile,w.bullets.filter(b=>b.hostile).length);peakFriendly=Math.max(peakFriendly,w.bullets.filter(b=>!b.hostile).length);peakLoot=Math.max(peakLoot,w.loot.length);
  const minute=Math.floor(w.time/30);if(!seen.has(minute)){seen.add(minute);milestones.push({time:w.time,score:w.score,hp:w.player.hp,parts:w.partsCollected,installed:[...w.assembly.installed],sector:w.sector});}
 }
 return{route,seed,requested:seconds,world:w.diagnostics(),upgrades,milestones,budgets:{peakEnemies,peakHostile,peakFriendly,peakLoot},missing:technologies.filter(t=>!w.assembly.has(t.id)).map(t=>t.id),method:'Normal start and earned components; deterministic virtual60Hz; test-only omniscient2D operator; no rewards, HP or enemies injected'};
}
