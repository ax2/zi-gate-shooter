import{Random,type Spawn}from'../../src/core/director';import{battleIndex,type BattlePlan}from'../../src/core/battle-plan';import{pursuitWaves}from'../../src/core/pursuit-waves';
/** For historical roster checks only. Stage219 independently checks every extra
 * object against the immediately preceding version; do not normalize other spawns. */
export function withoutPursuit(spawns:Spawn[],round:number,seed:number,plan:BattlePlan){
 const rest=[...spawns],extra=pursuitWaves(round,round>1&&new Random(seed).next()>.5,battleIndex(round,plan));
 for(const item of extra){const index=rest.findIndex(s=>JSON.stringify(s)===JSON.stringify(item));if(index<0)throw Error('Missing authored pursuit body');rest.splice(index,1);}return rest;
}
