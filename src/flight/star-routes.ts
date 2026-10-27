/** Original finite, inspectable navigation graph. Every hop is an actual combat leg. */
export const starRegions=[
 {name:'曙光边境',color:'#9be1ed',art:0}, {name:'熔火边陲',color:'#ffa47e',art:1},
 {name:'寒晶回廊',color:'#abd7ff',art:2}, {name:'翡翠旋臂',color:'#9ce9b4',art:4},
 {name:'鎏金贸易圈',color:'#f5d58c',art:10}, {name:'永夜裂隙',color:'#ceb0ff',art:11},
]as const;
const names=[['曙光港','铁穹','金穗','双子堡','碧潮','铜环','远航门'],['烬湾','赤砧','流金','熔核堡','灰烬花园','红砂','炉心门'],['霜港','蓝砧','冰金','寒脊堡','极光','紫晶','凛冬门'],['翠湾','藤钢','雨金','荆棘堡','苍叶','绿晶','森罗门'],['玉港','鎏铸','丰饶','金冠堡','星彩','琥珀','商旅门'],['暮港','暗砧','星髓','夜幕堡','幽辉','玄晶','彼岸门']];
export type PlanetKind='port'|'forge'|'treasure'|'fort'|'sanctum'|'mine'|'gate';
const kinds:PlanetKind[]=['port','forge','treasure','fort','sanctum','mine','gate'];
export const planetKinds:Record<PlanetKind,{name:string;brief:string;coins:number;repeat:number}>={
 port:{name:'补给港',brief:'星域入口 · 常规护航星路',coins:100,repeat:20},
 forge:{name:'防御星',brief:'舰炮星路 · 固定炮台与工事',coins:120,repeat:25},
 treasure:{name:'富矿星',brief:'磁雷星路 · 高速段与高额金币',coins:320,repeat:50},
 fort:{name:'走廊要塞',brief:'棱盾星路 · 必经防御节点',coins:200,repeat:35},
 sanctum:{name:'休整星',brief:'舰炮星路 · 抵达维修2格与光甲6秒',coins:110,repeat:25},
 mine:{name:'星髓矿场',brief:'磁雷星路 · 高速穿越与丰厚金币',coins:250,repeat:45},
 gate:{name:'星域之门',brief:'棱盾星路 · 打通后解锁下一星域',coins:450,repeat:60},
};
export interface StarPlanet{id:string;name:string;region:number;node:number;kind:PlanetKind;family:number;art:number;x:number;y:number;rush:boolean}
const positions=[[360,1460],[170,1200],[550,1200],[360,930],[170,660],[550,660],[360,390]];
const planetArt=[[0,9,10,5,4,7,6],[1,1,3,9,4,1,1],[2,2,8,5,2,7,2],[4,5,4,5,0,4,4],[10,9,10,1,6,10,10],[11,8,7,9,11,8,11]];
export const starPlanets:StarPlanet[]=names.flatMap((row,region)=>row.map((name,node)=>({id:`s${region}p${node}`,name,region,node,kind:kinds[node],family:[0,0,1,2,0,1,2][node],art:planetArt[region][node],x:positions[node][0],y:positions[node][1],rush:node===2||node===5||region>=3&&node===6})));
export const planetById=new Map(starPlanets.map(p=>[p.id,p]));
export const starEdges:[string,string][]=starRegions.flatMap((_,r)=>[[0,1],[0,2],[1,3],[2,3],[3,4],[3,5],[4,6],[5,6]].map(([a,b])=>[`s${r}p${a}`,`s${r}p${b}`]as[string,string]));
for(let r=0;r<starRegions.length-1;r++)starEdges.push([`s${r}p6`,`s${r+1}p0`]);
export const adjacentPlanets=(id:string)=>starEdges.flatMap(([a,b])=>a===id?[b]:b===id?[a]:[]);
export interface NavigationSave{version:1;at:string;visited:string[]}
export const newNavigation=():NavigationSave=>({version:1,at:'s0p0',visited:['s0p0']});
export function unlockedRegion(n:NavigationSave){let r=0;while(r<5&&n.visited.includes(`s${r}p6`))r++;return r;}
export function validateNavigation(raw:unknown):NavigationSave{const result=newNavigation();if(!raw||typeof raw!=='object'||(raw as any).version!==1)return result;const r=raw as any,wanted=new Set<string>(Array.isArray(r.visited)?r.visited.filter((id:unknown)=>typeof id==='string'&&planetById.has(id)).slice(0,42):[]);
 for(let i=0;i<42;i++){let changed=false;for(const p of starPlanets)if(wanted.has(p.id)&&!result.visited.includes(p.id)&&p.region<=unlockedRegion(result)&&adjacentPlanets(p.id).some(id=>result.visited.includes(id))){result.visited.push(p.id);changed=true;}if(!changed)break;}
 result.visited=starPlanets.filter(p=>result.visited.includes(p.id)).map(p=>p.id);if(typeof r.at==='string'&&result.visited.includes(r.at))result.at=r.at;return result;
}
export function starPath(n:NavigationSave,to:string):string[]|undefined{const target=planetById.get(to);if(!target||target.region>unlockedRegion(n))return;const queue=[[n.at]],seen=new Set([n.at]);for(let i=0;i<queue.length;i++){const route=queue[i],at=route[route.length-1];if(at===to)return route;for(const next of adjacentPlanets(at)){if(seen.has(next)||planetById.get(next)!.region>unlockedRegion(n))continue;seen.add(next);queue.push([...route,next]);}}}
export function defaultStarTarget(n:NavigationSave){const at=planetById.get(n.at)!;return at.node===6?(at.region<5?`s${at.region+1}p0`:`s${at.region}p4`):at.node===0?`s${at.region}p1`:`s${at.region}p6`;}
export function planetReward(p:StarPlanet,first:boolean){const k=planetKinds[p.kind];return first?k.coins+p.region*(p.kind==='treasure'||p.kind==='gate'?80:35):k.repeat;}
export const flightMotionRules={lootSpeed:40,cargoLife:40,boostDuration:4,boostCooldown:14,boostMultiplier:2,rushWarning:3,rushDuration:8,rushMultiplier:2.6}as const;
/** Two bounded accelerations on fast legs, before the flagship. No bullet/weapon clock scaling. */
export function starRush(p:StarPlanet,time:number){if(!p.rush)return{state:'cruise' as const,multiplier:1,remaining:0,index:-1};for(const[index,start]of[21,44].entries()){if(time>=start-3&&time<start)return{state:'warning' as const,multiplier:1,remaining:start-time,index};if(time>=start&&time<start+8)return{state:'rush' as const,multiplier:2.6,remaining:start+8-time,index};}return{state:'cruise' as const,multiplier:1,remaining:0,index:-1};}
