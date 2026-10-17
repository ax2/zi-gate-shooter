import{Random,type Spawn}from'../../src/core/director';import{chapterAssaults}from'../../src/core/chapter-assaults';import{battleIndex,type BattlePlan}from'../../src/core/battle-plan';
const path='../../build/qa/Stage-228/baseline.mjs',old=await import(path);
/** Historical whole-roster assertions only. Stage228/231/233 independently compare
 * every excluded object and every remaining slot. Cardinalities may now differ. */
export function restoreChapterLayers(spawns:Spawn[],round:number,seed:number,plan:BattlePlan){
 const rest=spawns.filter(s=>!s.earlyReserve),mirror=round>1&&new Random(seed).next()>.5,variation=battleIndex(round,plan),current=chapterAssaults(round,mirror,variation),prior=old.chapterAssaults(round,mirror,variation);
 for(const item of current){const at=rest.findIndex(s=>JSON.stringify(s)===JSON.stringify(item));if(at<0)throw Error('Missing chapter layer slot');rest.splice(at,1);}
 return [...rest,...prior].sort((a,b)=>a.at-b.at);
}
