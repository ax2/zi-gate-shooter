import type {World,Body} from './world';
import {magneticAugments,type Route} from './build-tree';
import type {WeaponKind} from './weapons';
import {weaponNames} from './weapons';
import {FRACTURE,fractureProfile,fractureAugments} from './combos';import {ION_STORM} from './ion-storm';import {LASER_CHAIN} from './laser-chain';
import {MAGNETIC} from './magnetic-field';

export const recipes={
 storm:{name:'雷暴霰射',effect:'霰弹命中后追加一次跳电',hint:'近距聚弹与密集敌群',color:'#b4ffb5'},
 prism:{name:'棱镜激光',effect:'主束保留 · 两侧各追加45%伤害',hint:'横移对齐侧束，扩大清场覆盖',color:'#d7b1ff'},
 photon:{name:'电光连锁',effect:'全武器直击 · 群敌跳链 / 单体聚能',hint:`${LASER_CHAIN.hops}跳${LASER_CHAIN.range}范围 · 跳伤80%/64% · 聚能80%`,color:'#a7e7ff'},
 fracture:{name:'裂甲爆破',effect:`同敌${FRACTURE.hits}次穿甲命中：额外${FRACTURE.direct*100}%爆破`,hint:`邻敌${FRACTURE.splash*100}% · 范围${FRACTURE.radius} · 冷却${FRACTURE.cooldown}秒`,color:'#ffca8b'},
 ion:{name:'离子风暴',effect:`${ION_STORM.hits}次有效电击引发范围放电`,hint:`范围${ION_STORM.radius} · ${ION_STORM.damage*100}%伤害 · 雷电第三节点`,color:'#96eaff'},
 magnetic:{name:'磁暴榴弹',effect:'爆裂命中留下三拍电场，伤害后续来敌',hint:`${MAGNETIC.life}秒 · 范围${MAGNETIC.radius} · 每拍${MAGNETIC.damage*100}% · 最多3场`,color:'#b3f3ff'},
} as const;
export type RecipeGoal=keyof typeof recipes;
export const recipeIds=Object.keys(recipes) as RecipeGoal[];
export function parseRecipeGoal(value:unknown):RecipeGoal|null{return typeof value==='string'&&Object.hasOwn(recipes,value)?value as RecipeGoal:null;}
interface Requirement {kind:'route'|'refinement'|'weapon';current:number;target:number;label:string;route?:Route;weapon?:WeaponKind}
const routeNames={ballistic:'弹道',electric:'雷电',optical:'光学'} as const;
/** Pure, current prerequisites; a marked box is never treated as collected. */
export function recipeStatus(w:Pick<World,'build'|'activeWeapons'|'weaponStage'>,id:RecipeGoal){
 const requirements:Requirement[]=[];
 const route=(r:Route,target:number)=>requirements.push({kind:'route',route:r,current:w.build.ranks[r],target,label:`${routeNames[r]}路线`});
 const weapon=(kind:WeaponKind)=>requirements.push({kind:'weapon',weapon:kind,current:w.activeWeapons.includes(kind)?w.weaponStage(kind):0,target:2,label:weaponNames[kind]});
 if(id==='storm'){route('ballistic',3);route('electric',1);}
 else if(id==='prism'){route('optical',3);route('ballistic',1);}
 else if(id==='photon'){route('optical',3);requirements.push({kind:'refinement',route:'optical',current:w.build.refinements.optical,target:1,label:'光学精调'});weapon('arc');}
 else if(id==='fracture'){weapon('pierce');weapon('blast');}
 else if(id==='magnetic'){weapon('blast');route('electric',2);}
 else route('electric',3);
 const missing=requirements.filter(r=>r.current<r.target);
 const need=missing.map(r=>r.kind==='weapon'?r.current?`${r.label}T${r.current}→T${r.target}`:`获得${r.label}T${r.target}`:r.kind==='refinement'?`${r.label}${r.target-r.current}次`:`${routeNames[r.route!]}还需${r.target-r.current}点`).join(' ＋ ');
 const progress=requirements.map(r=>r.kind==='weapon'?`${r.label} ${r.current?'T'+r.current:'未持有'}/T${r.target}`:`${r.label} ${Math.min(r.current,r.target)}/${r.target}`).join(' ＋ ');
 return {id,...recipes[id],...(id==='fracture'&&w.build.fractureAugment?{effect:`同敌${fractureProfile(w.build.fractureAugment).hits}次穿甲命中：额外200%爆破`,hint:fractureAugments[w.build.fractureAugment].name+(w.build.fractureAugment==='fracture-line'?' · 击破也穿震320/宽240/2敌75%':' · 原溅射与0.35秒冷却保留')}:{}),...(id==='magnetic'&&w.build.magneticAugment?{hint:magneticAugments[w.build.magneticAugment].detail}:{}),requirements,missing,ready:missing.length===0,need,progress};
}
export function recipeSupplyMatch(w:World,id:RecipeGoal|null|undefined,b:Body){
 if(!id||!b.active||!['crate','pickup'].includes(b.kind)||!b.weaponKind)return false;
 const requirement=recipeStatus(w,id).missing.find(r=>r.kind==='weapon'&&r.weapon===b.weaponKind);
 if(!requirement)return false;
 // Refit upgrades an owned component; a duplicate ordinary box only helps if
 // its actual tier exceeds the owned tier. Empty refits cannot install a gun.
 return b.refit?requirement.current>0:b.stage>requirement.current;
}
export function recipeRouteHint(w:World,id:RecipeGoal|null|undefined,route:Route){
 if(!id||!w.build.available(w.buildPoints).includes(route))return null;
 const status=recipeStatus(w,id);
 if(status.ready)return {text:`目标·${status.name}已成形 · 继续强化`,advances:false};
 const affected=status.missing.find(r=>r.route===route&&(r.kind==='route'?w.build.ranks[route]<3:r.kind==='refinement'&&w.build.ranks[route]>=3));
 if(!affected)return {text:`目标还需：${status.need}`,advances:false};
 const completes=status.requirements.every(r=>r.current+(r===affected?1:0)>=r.target);
 return {text:completes?`目标·${status.name}：本次完成构筑`:`目标·${status.name}：${affected.label} ${affected.current}/${affected.target}→${affected.current+1}/${affected.target}`,advances:true};
}


/** Actual simulation counters, not particle counts or projected damage. */
export function recipePerformance(w:World,id:RecipeGoal){
 const ready=recipeStatus(w,id).ready;
 const count=id==='storm'?w.stormLinks:id==='prism'?w.prismHits:id==='photon'?w.laserArcHits+w.laserFocusHits:id==='fracture'?w.fractureBursts+w.fractureWaveHits:id==='magnetic'?w.magneticHits+w.magneticLinkHits:w.ionBursts;
 const n=(v:number)=>v>=1e8?`${+(v/1e8).toFixed(1)}亿`:v>=1e4?`${+(v/1e4).toFixed(1)}万`:`${v}`;
 const measured=id==='storm'?`跳伤${n(w.stormLinks)}次`:id==='prism'?`侧束命中${n(w.prismHits)}`:id==='photon'?`链${n(w.laserArcHits)}/聚${n(w.laserFocusHits)}`:id==='fracture'?w.build.fractureAugment==='fracture-line'?`爆${n(w.fractureBursts)}/穿${n(w.fractureWaveHits)}`:`引爆${n(w.fractureBursts)}次`:id==='magnetic'?`场${n(w.magneticHits)}/${w.build.magneticAugment==='field-wide'?'扩'+n(w.magneticWideHits):'桥'+n(w.magneticLinkHits)}`:`放电${n(w.ionBursts)}次`;
 return {ready,count,label:!ready?'未成形':count===0?'已就绪 · 未触发':measured};
}
