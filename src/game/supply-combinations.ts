import type {World,Body} from '../core/world';
import {grantEquipment} from '../core/rewards';
import {recipeIds,recipeStatus,type RecipeGoal} from '../core/recipe-goal';
/** Predict only this real supply's equipment change; never spend future research or grant it. */
export function supplyCombinations(w:World,b:Body,goal?:RecipeGoal|null){
 if(!b.active||(b.kind!=='crate'&&b.kind!=='pickup'))return [];
 const kind=b.weaponKind??w.weaponKind,owned=w.activeWeapons.includes(kind),stage=owned?w.weaponStage(kind):1;
 const local={...w.growth,stage};
 if(b.refit&&owned)local.stage=Math.min(3,stage+1);else grantEquipment(local,b.stage);
 const view={build:w.build,activeWeapons:owned?w.activeWeapons:[...w.activeWeapons,kind],weaponStage:(k:typeof kind)=>k===kind?local.stage:w.weaponStage(k)};
 const ids=recipeIds.filter(id=>!recipeStatus(w,id).ready&&recipeStatus(view,id).ready);
 return [...ids.filter(id=>id===goal),...ids.filter(id=>id!==goal)].map(id=>({id,name:recipeStatus(view,id).name}));
}
export const supplyCombinationLabel=(combinations:ReturnType<typeof supplyCombinations>)=>combinations.length?`拾取成形·${combinations[0].name}${combinations.length>1?'+'+(combinations.length-1):''}`:null;
/** Optional second pickup line yields to actual enemies and actual hostile projectiles. */
export function supplyCombinationClear(w:World,x:number,y:number,width:number,blocker?:{top:number;bottom:number}){
 if(blocker&&y-74<blocker.bottom&&y-4>blocker.top)return false;
 return !w.bodies.some(b=>b.active&&b.kind!=='crate'&&b.kind!=='pickup'&&b.kind!=='gate'
  &&Math.abs(x-b.x)<width/2+Math.max(80,b.width*.85)&&Math.abs(y-42-b.y)<35+Math.max(84,b.height*.8)+40)
  &&!w.bullets.some(p=>p.active&&p.hostile&&p.x+14>=x-width/2&&p.x-14<=x+width/2&&p.y+18>=y-78&&p.y-18<=y-6);
}
