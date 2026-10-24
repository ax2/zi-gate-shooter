import{Assembly,techById,parts,type Part}from'./technology';
/** A dependency-ordered bill of actual missing parts, including a repeated goal's calibration. */
export function assemblyRecipe(a:Assembly,id:string){
 if(id==='chassis'||!techById.has(id))return undefined;const nodes:string[]=[],seen=new Set<string>(),cost:Partial<Record<Part,number>>={};
 const visit=(key:string)=>{if(a.has(key)||seen.has(key))return;seen.add(key);for(const p of techById.get(key)!.parents)visit(p);nodes.push(key);};
 if(a.has(id))nodes.push(id);else visit(id);for(const key of nodes)for(const p of parts){const n=a.cost(key)[p];if(n)cost[p]=(cost[p]??0)+n;}
 const lockedBy=a.lockedBy(id)??nodes.map(key=>a.lockedBy(key)).find(Boolean),missing=parts.flatMap(part=>{const n=Math.max(0,(cost[part]??0)-a.inventory[part]);return n?[{part,amount:n}]:[];});
 return{id,nodes,cost,lockedBy,missing,ready:!lockedBy&&!missing.length&&nodes.length>0};
}
/** Prepare and validate on a private copy; a failed recipe cannot partly spend the live wallet. */
export function applyAssemblyRecipe(a:Assembly,id:string){const plan=assemblyRecipe(a,id);if(!plan?.ready)return false;const draft=new Assembly();draft.salvage=a.salvage;for(const key of a.installed)draft.installed.add(key);Object.assign(draft.inventory,a.inventory);Object.assign(draft.calibrated,a.calibrated);
 for(const key of plan.nodes)if(!draft.install(key))return false;
 Object.assign(a.inventory,draft.inventory);for(const key of draft.installed)a.installed.add(key);Object.assign(a.calibrated,draft.calibrated);return plan;
}
