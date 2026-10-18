import type {World} from '../core/world';
import {routes,tree,ballisticBranches,electricBranches,opticalBranches,type Route,type BuildBranch} from '../core/build-tree';
import {recipeIds,recipeStatus,type RecipeGoal} from '../core/recipe-goal';
import {stormAugments} from '../core/storm-refinement';
import {ionAugments} from '../core/ion-storm';
import {fractureAugments} from '../core/combos';
import {photonAugments} from '../core/laser-chain';
import {magneticAugments} from '../core/build-tree';
export const routeColors={ballistic:'#ffd28a',electric:'#c9a2ff',optical:'#83e8ff'};
export const routeIcons={ballistic:0,electric:1,optical:2};
export const weaponIcons={pulse:3,scatter:0,pierce:3,blast:4,arc:1};
export const recipeIcons:Record<RecipeGoal,number>={storm:12,prism:10,photon:6,fracture:4,ion:13,magnetic:15};
export const branchIcons:Partial<Record<BuildBranch,number>>={penetrator:3,fragment:4,ricochet:5,spread:6,capacitor:7,seeker:8,burn:9,relay:10,mirror:11,'fuse-penetrator':3,'fuse-fragment':4,'fuse-ricochet':5,'optic-burn':9,'optic-relay':10,'optic-mirror':11,'storm-relay':6,'storm-focus':7,'ion-orb':13,'ion-spear':14,'field-wide':15,'field-link':6,'fracture-quick':4,'fracture-line':3,'photon-reach':6,'photon-focus':14};
export interface TechRequirement{icon:number;label:string;ready:boolean;node?:string}
export interface Technology{id:string;name:string;icon:number;route:Route;owned:boolean;ready:boolean;requirements:TechRequirement[];effect:string;index?:number;recipe?:RecipeGoal;milestone?:boolean}
/** Read-only projection of the actual World. Seeing a box is never ownership. */
export function technologies(w:World):Technology[]{
 const nodes:Technology[]=[];
 for(const route of routes)for(let i=0;i<3;i++){
  const requirements:TechRequirement[]=i?[{icon:i===1?routeIcons[route]:route==='ballistic'?3:route==='electric'?6:10,label:tree[route][i-1].name.split(' · ')[0],ready:w.build.ranks[route]>=i,node:`${route}:${i-1}`}]:[];
  if(route==='ballistic'&&i===2)requirements.push({icon:1,label:'导电线圈',ready:w.build.ranks.electric>=1,node:'electric:0'});
  const owned=w.build.ranks[route]>i,branch=route==='ballistic'?w.build.ballisticBranch:route==='electric'?w.build.electricBranch:w.build.opticalBranch;
  nodes.push({id:`${route}:${i}`,route,index:i,name:i===1?({ballistic:'弹芯改造',electric:'电桥改造',optical:'透镜改造'})[route]:w.build.node(route,i).name,icon:i===0?routeIcons[route]:i===1?(branch?branchIcons[branch]!:route==='ballistic'?3:route==='electric'?6:10):route==='ballistic'?12:route==='electric'?13:14,owned,ready:!owned&&w.build.ranks[route]===i&&requirements.every(r=>r.ready),requirements,effect:w.build.node(route,i).detail,milestone:i===2});
 }
 for(const id of recipeIds){const s=recipeStatus(w,id),route:Route=id==='storm'||id==='fracture'?'ballistic':id==='magnetic'||id==='ion'?'electric':'optical';
  nodes.push({id:'recipe:'+id,recipe:id,name:s.name,icon:recipeIcons[id],route,owned:s.ready,ready:s.ready,milestone:true,effect:s.effect,requirements:s.requirements.map(r=>({icon:r.weapon?weaponIcons[r.weapon]:r.kind==='refinement'?14:r.target===3?(r.route==='electric'?13:r.route==='ballistic'?12:14):routeIcons[r.route!],label:r.weapon?`${r.label} T${r.target}`:r.kind==='refinement'?`精调 ${r.target}`:`${r.label} ${r.target}`,ready:r.current>=r.target,node:r.kind==='route'?`${r.route}:${r.target-1}`:undefined}))});
 }
 return nodes;
}
export interface TechOption{branch:BuildBranch;name:string;detail:string;icon:number;lines?:readonly string[]}
const effectCaptions:Partial<Record<BuildBranch,readonly string[]>>={penetrator:['直伤 ×1.3','贯穿 ≥2 敌'],fragment:['直伤 ×1.3','爆炸 140 · 50%'],ricochet:['直伤 ×1.3','跳弹 280 · 55%'],spread:['连锁 +1','跳距 220'],capacitor:['3格 → 爆发 ×2','击破接力'],seeker:['首跳 340','优先射手'],burn:['间隔 −25%','灼烧 3×25%'],relay:['间隔 −25%','侧束 65%'],mirror:['间隔 −25%','反射束 65%']};
export function technologyOptions(w:World,route:Route):TechOption[]{
 let entries:[string,{name:string;detail:string}][]=[];
 if(w.build.ranks[route]===1)entries=Object.entries(route==='ballistic'?ballisticBranches:route==='electric'?electricBranches:opticalBranches);
 else if(route==='ballistic')entries=w.canFuseAmmo()?Object.entries(ballisticBranches).filter(([b])=>b!==w.build.ballisticBranch).map(([b,v])=>['fuse-'+b,v]):w.canRefineStorm()?Object.entries(stormAugments):w.canRefineFracture()?Object.entries(fractureAugments):[];
 else if(route==='electric')entries=w.canRefineMagnetic()?Object.entries(magneticAugments):w.canRefineIon()?Object.entries(ionAugments):[];
 else entries=w.canFuseOptics()?Object.entries(opticalBranches).filter(([b])=>b!==w.build.opticalBranch).map(([b,v])=>['optic-'+b,v]):w.canRefinePhoton()?Object.entries(photonAugments):[];
 return entries.map(([branch,v])=>({...v,branch:branch as BuildBranch,icon:branchIcons[branch as BuildBranch]??routeIcons[route],lines:effectCaptions[branch as BuildBranch]}));
}
export function nextTechnology(w:World,route:Route){
 const rank=w.build.ranks[route],options=technologyOptions(w,route);
 if(rank<3)return technologies(w).find(n=>n.id===`${route}:${rank}`)!;
 return {id:`${route}:refine`,route,name:options.length?(route==='ballistic'?(w.canFuseAmmo()?'复合弹芯':w.canRefineStorm()?'雷暴精研':'裂甲精研'):route==='electric'?(w.canRefineMagnetic()?'磁暴精研':'离子精研'):w.canFuseOptics()?'双镜复合':'光链精研'):`精调 ${w.build.refinements[route]+1}`,icon:options[0]?.icon??(route==='ballistic'?12:route==='electric'?13:14),owned:false,ready:true,requirements:[{icon:route==='ballistic'?12:route==='electric'?13:14,label:'路线 3',ready:rank>=3,node:route+':2'}],effect:w.build.next(route).detail} satisfies Technology;
}
/** Cropped inset prevents neighbouring atlas cells bleeding at small sizes. */
export function technologyArt(c:CanvasRenderingContext2D,img:HTMLImageElement|undefined,icon:number,x:number,y:number,size:number,locked=false){
 if(!img)return;
 const sw=img.width/4,sh=img.height/4;c.save();c.globalAlpha*=locked?.65:1;
 c.drawImage(img,(icon%4)*sw+sw*.045,Math.floor(icon/4)*sh+sh*.045,sw*.91,sh*.91,x-size/2,y-size/2,size,size);c.restore();
}
