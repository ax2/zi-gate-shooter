/** A single run-local tactical resource. No permanent save fields or idle charge. */
export const overloadRules={goal:24,cannonRounds:18,cannonDamage:24,coilTargets:6,coilDamage:80,coilRange:900,clearRadius:260,laserDamage:100,railDamage:160,railRounds:3}as const;
export const overloadSpecs=[{id:'cannon',name:'弹幕超载',icon:4,color:'#ffd18d'},{id:'coil',name:'雷暴超载',icon:13,color:'#ccb4ff'},{id:'laser',name:'光束超载',icon:14,color:'#a9f6ff'},{id:'rail',name:'重轨超载',icon:3,color:'#d3eaff'}]as const;
export type OverloadKind=typeof overloadSpecs[number]['id'];
export interface OverloadState{charge:number;uses:number;rounds:number;cleared:number;last?:{kind:OverloadKind;time:number}}
export const overloadSpec=(id:string)=>overloadSpecs.find(s=>s.id===id);
