import{Random,type Spawn}from'../../src/core/director';import{chapterAssaults}from'../../src/core/chapter-assaults';import{battleIndex,type BattlePlan}from'../../src/core/battle-plan';
const path='../../build/qa/Stage-228/baseline.mjs',old=await import(path);
/** Only historical whole-roster assertions. Stage228 independently compares
 * every excluded object and every remaining slot against this pinned baseline. */
export function restoreChapterLayers(spawns:Spawn[],round:number,seed:number,plan:BattlePlan){
 const rest=[...spawns],mirror=round>1&&new Random(seed).next()>.5,variation=battleIndex(round,plan),current=chapterAssaults(round,mirror,variation),prior=old.chapterAssaults(round,mirror,variation);
 for(const [i,item]of current.entries()){const at=rest.findIndex(s=>JSON.stringify(s)===JSON.stringify(item));if(at<0)throw Error('Missing chapter layer slot');rest[at]=prior[i];}return rest;
}
