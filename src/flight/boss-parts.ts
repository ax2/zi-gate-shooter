import type {Part} from './technology';
export type BossPartKind='gun'|'lens'|'minepod';
export interface BossPart {parent:number;side:number;kind:BossPartKind}
export interface BossAssembly {parent:number;sector:number;deployed:boolean;nodes:number[];broken:number[];shots:number[];earlyDisarm:boolean;ended:boolean;approach?:'disarm'|'core'}
export interface BossSalvage {node:number;x:number;y:number;part:Part;amount:number}
export const bossPartRules={hp:260,radius:32,score:80,reward:2,priorityBonus:1,deployTime:.6,sideOffset:150,forwardOffset:60,swing:140,gunInterval:2.1,lensInterval:3.4,lensLock:.85,lensLife:.22,mineInterval:2.6}as const;
export const bossPartReward=(state?:BossAssembly)=>bossPartRules.reward+(state?.approach==='disarm'?bossPartRules.priorityBonus:0);
export const bossPartFrames={gun:1,lens:2,minepod:3}as const;
export function bossPartSpec(sector:number){const i=sector%3;return{kind:(['gun','lens','minepod']as const)[i],name:['火炮舱','激光舱','布雷舱'][i],frame:[1,2,3][i],part:(['alloy','coil','lens']as const)[i],icon:[3,1,2][i]};}
export function bossPartPosition(parent:{x:number;y:number},side:number,age:number){const extension=Math.min(1,Math.max(0,age)/bossPartRules.deployTime);return{x:Math.max(60,Math.min(660,parent.x+side*(100+(bossPartRules.sideOffset-100)*extension))),y:parent.y+bossPartRules.forwardOffset};}
export function bossPartMuzzles(e:{x:number;y:number;bossPart?:BossPart}){if(e.bossPart?.kind==='gun')return[-1,0,1].map(side=>({x:e.x+side*14,y:e.y+(side?20:34)}));return[{x:e.x,y:e.y+(e.bossPart?.kind==='lens'?46:50)}];}
