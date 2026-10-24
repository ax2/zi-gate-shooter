import{assemblyRecipe}from'./assembly-recipe';
import{salvageChoices}from'./salvage-view';
import{parts,techById,type Assembly}from'./technology';
import type{PickupReceipt}from'./defense';

/** Late recipes compress to six cells. A full row must still mean fully funded. */
export function materialCells(have:number,need:number){const slots=Math.min(6,need);return Array.from({length:slots},(_,i)=>(i+1)*need<=Math.min(have,need)*slots);}

/** One source for pickup -> recipe -> paid picture. Never spends or installs.
 * A tracked future node resolves to the next real prerequisite, not a free preview. */
export function assemblyGuide(a:Assembly,target?:string,receipt?:PickupReceipt){
 const offers=salvageChoices(a,target,receipt),next=target?a.nextStep(target):undefined;
 const bundle=target&&!a.has(target)?assemblyRecipe(a,target):undefined,focus=bundle?.ready&&bundle.nodes.length>1&&offers.includes(bundle.id)?bundle.id:next&&offers.includes(next)?next:offers[0],plan=focus?assemblyRecipe(a,focus):undefined;
 const recipe=focus?{id:focus,ready:!!plan?.ready,path:plan?.nodes??[],cost:parts.flatMap(part=>{
  const need=plan?.cost[part]??0;
  return need?[{part,need,have:a.inventory[part],filled:Math.min(need,a.inventory[part]),missing:Math.max(0,need-a.inventory[part])}]:[];
 })}:undefined;
 const installed=parts.map((_,column)=>[...a.installed].filter(id=>techById.get(id)?.column===column));
 return{offers,recipe,installed,total:a.installed.size};
}
