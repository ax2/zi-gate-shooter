import type{Enemy}from'./world';
export const repairRules={hp:110,radius:36,size:128,range:300,count:2,first:3.2,gap:2,pulses:3,until:8.2,amount:18,fraction:.12,entrySpeed:150,hold:10,exitSpeed:180,effectLife:.46}as const;
export interface RepairReceipt{target:number;before:number;after:number;amount:number;from:{x:number;y:number};to:{x:number;y:number};time:number}
export interface RepairState{anchor:number;used:number;healed:number;targets:RepairReceipt[]}
export const repairWave=(sector:number,family:number,wave:number)=>sector>0&&family===2&&wave%10===5;
export function repairPose(age:number,s:RepairState){const entry=420/repairRules.entrySpeed,t=Math.max(0,age-entry);return{x:Math.max(88,Math.min(632,s.anchor+Math.sin(t*.65)*65)),y:age<entry?-100+age*repairRules.entrySpeed:320+Math.sin(t*.6)*10+Math.max(0,age-repairRules.hold)*repairRules.exitSpeed};}
/** Actual source-image repair nozzle centers on the unchanged 1254-square original. */
export const repairPorts=(at:{x:number;y:number})=>[{x:384,y:1000},{x:856,y:986}].map(p=>({x:at.x+(p.x/1254-.5)*repairRules.size,y:at.y+(p.y/1254-.5)*repairRules.size}));
export function repairTargets(source:Enemy,enemies:Enemy[]){return enemies.filter(e=>e.id!==source.id&&['drone','diver','sentry','spinner','lancer'].includes(e.kind)&&!e.installation&&!e.bossPart&&!e.citadel&&!e.reactorPod&&!e.squad&&!e.carrier&&!e.repair&&!e.retreat&&e.hp>0&&e.hp<e.maxHp&&e.y>155&&e.y<1180&&Math.hypot(e.x-source.x,e.y-source.y)<=repairRules.range).sort((a,b)=>(a.hp/a.maxHp-b.hp/b.maxHp)||a.id-b.id).slice(0,repairRules.count);}
/** Skip old slots after a large observation gap, never emit a catch-up burst. */
export const repairDue=(age:number,used:number)=>age<repairRules.first||age>=repairRules.until||used>=repairRules.pulses?-1:Math.min(repairRules.pulses-1,Math.floor((age-repairRules.first+1e-9)/repairRules.gap))>=used?Math.min(repairRules.pulses-1,Math.floor((age-repairRules.first+1e-9)/repairRules.gap)):-1;
