import{assemblyRecipe}from'./assembly-recipe';
import{refitCounts,rankMark,refitRank}from'./refits';
import{technologies,techById,parts,type Assembly}from'./technology';
import type{PickupReceipt}from'./defense';
/** A real affordable choice, never an invented level or a free equipment grant. */
export function upgradeChoices(a:Assembly,target?:string,receipt?:PickupReceipt){const column=receipt?parts.indexOf(receipt.part as typeof parts[number]):-1,next=target?a.nextStep(target):undefined;
 const fresh=a.ready.slice().sort((x,y)=>Number(y.id===next)-Number(x.id===next)||Number(!!y.evolution)-Number(!!x.evolution)||Number(y.column===column)-Number(x.column===column)||Number(!!y.component)-Number(!!x.component)||x.tier-y.tier);
 const calibrations=technologies.filter(t=>a.has(t.id)&&a.can(t.id)).sort((x,y)=>Number(y.column===column)-Number(x.column===column)||x.tier-y.tier);
 const refit=calibrations.find(t=>refitCounts[t.id]&&(a.calibrated[t.id]??0)<2);
 const normal=(refit?[...fresh.slice(0,2),refit,...fresh.slice(2),...calibrations.filter(t=>t!==refit)]:[...fresh,...calibrations]).slice(0,3).map(t=>t.id);const recipe=target&&!a.has(target)?assemblyRecipe(a,target):undefined;return recipe?.ready&&recipe.nodes.length>1?[recipe.id,...normal.filter(id=>id!==recipe.id)].slice(0,3):normal;
}
export function upgradeTitle(a:Assembly,id:string){const t=techById.get(id);return t?(a.has(id)?refitCounts[id]&&(a.calibrated[id]??0)<2?'改装 '+rankMark(refitRank((a.calibrated[id]??0)+1))+' · ':'增强 · ':'追加 · ')+t.name:'';}
