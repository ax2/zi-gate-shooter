import {hasAmmo}from'../core/build-tree';
import type {World} from '../core/world';import type {BallisticWeapon} from '../core/weapons';
export function ballisticMechanics(w:World,kind:BallisticWeapon){
 const p=w.profileFor(kind),parts=[];
 if(p.targets>1)parts.push(`贯穿${p.targets}敌`);
 if(p.splashRadius)parts.push(`范围${p.splashRadius}`);
 if(hasAmmo(w.build,'ricochet'))parts.push('侧跳280');
 if(kind==='blast'&&w.magneticUnlocked())parts.push('磁场');
 if(kind==='pierce'&&w.fractureUnlocked())parts.push(`裂甲${w.fractureProfile().hits}击`);
 return parts.join('·')||(kind==='scatter'?'近距聚弹':'集中直射');
}
