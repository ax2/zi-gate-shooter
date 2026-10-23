import{componentPairs}from'./early-parts';
export type Part='alloy'|'coil'|'lens';
export const parts:Part[]=['alloy','coil','lens'];
export const partInfo={alloy:{name:'弹芯',icon:3,color:'#ffc46a'},coil:{name:'线圈',icon:1,color:'#c3a2ff'},lens:{name:'透镜',icon:2,color:'#7ce8ff'}};
export interface Technology{id:string;name:string;icon:number;column:number;tier:number;parents:string[];cost:Partial<Record<Part,number>>;effect:string;future:string;component?:boolean}
/** Every node changes an attack; no filler percentage nodes between these inventions. */
export const technologies:Technology[]=[
 {id:'split',name:'双翼炮',icon:0,column:0,tier:0,parents:[],cost:{alloy:2},effect:'双翼追加 2 发斜射',future:'跳弹 / 轨道炮 / 雷暴机炮'},
 {id:'coil',name:'电弧发生器',icon:1,column:1,tier:0,parents:[],cost:{coil:2},effect:'每 0.9 秒自动电击附近敌机',future:'连锁 / 猎隼 / 磁暴'},
 {id:'laser',name:'聚焦激光',icon:2,column:2,tier:0,parents:[],cost:{lens:2},effect:'每 1.4 秒贯穿前方 3 敌',future:'分光 / 灼烧 / 棱镜'},
 {id:'bounce',name:'反弹弹芯',icon:5,column:0,tier:1,parents:['split'],cost:{alloy:3},effect:'弹丸碰到边墙反弹 · 命中跳向下一敌',future:'反弹弹丸保留 · 可组合棱镜'},
 {id:'chain',name:'连锁电桥',icon:6,column:1,tier:1,parents:['coil'],cost:{coil:3},effect:'电弧可串联 4 敌 · 跳距 280',future:'雷暴机炮 / 超导风暴'},
 {id:'twin',name:'双路分光',icon:10,column:2,tier:1,parents:['laser'],cost:{lens:3},effect:'主束之外追加左右两束激光',future:'棱镜折返 / 日冕阵列'},
 {id:'rail',name:'轨道炮',icon:3,column:0,tier:2,parents:['split'],cost:{alloy:3,lens:1},effect:'每 1.1 秒发射高伤贯穿弹',future:'爆裂弹仓 / 深穿光束'},
 {id:'seeker',name:'猎隼线圈',icon:8,column:1,tier:2,parents:['chain'],cost:{coil:3,alloy:1},effect:'索敌距离 470 · 优先正在蓄能的敌机',future:'磁暴核心 / 超导风暴'},
 {id:'burn',name:'灼热透镜',icon:9,column:2,tier:2,parents:['laser'],cost:{lens:3,coil:1},effect:'激光命中附加 3 次持续灼烧',future:'深穿光束 / 日冕阵列'},
 {id:'flak',name:'爆裂弹仓',icon:4,column:0,tier:3,parents:['bounce','rail'],cost:{alloy:4,coil:2},effect:'每第 4 发主炮爆炸 · 半径 130',future:'终极：蜂群武库'},
 {id:'stormgun',name:'雷暴机炮',icon:12,column:1,tier:3,parents:['split','chain'],cost:{coil:4,alloy:2},effect:'每第 3 次弹丸命中追加连锁电击',future:'终极：蜂群武库 / 超导风暴'},
 {id:'prism',name:'棱镜折返',icon:11,column:2,tier:3,parents:['twin','bounce'],cost:{lens:4,alloy:2},effect:'追加两束斜光 · 触壁反射继续贯穿',future:'终极：日冕阵列'},
 {id:'barrage',name:'蜂群弹幕',icon:0,column:0,tier:4,parents:['flak'],cost:{alloy:5,lens:2},effect:'翼炮 2→6 发 · 弹墙反弹继续生效',future:'终极：蜂群武库'},
 {id:'emp',name:'磁暴核心',icon:15,column:1,tier:4,parents:['seeker','stormgun'],cost:{coil:5,lens:2},effect:'每 5 秒展开磁暴 · 伤敌并清除近弹',future:'终极：超导风暴'},
 {id:'drill',name:'深穿光束',icon:14,column:2,tier:4,parents:['burn','rail'],cost:{lens:5,alloy:2},effect:'光束最多贯穿 8 敌 · 间隔 1.4→0.8 秒',future:'终极：日冕阵列'},
 {id:'arsenal',name:'蜂群武库',icon:4,column:0,tier:5,parents:['barrage','stormgun'],cost:{alloy:6,coil:3},effect:'主炮速率 ×1.6 · 翼炮追击弱敌',future:'组合突破：磁轨齐射 / 棱镜卫星'},
 {id:'tempest',name:'超导风暴',icon:13,column:1,tier:5,parents:['emp','twin'],cost:{coil:6,lens:3},effect:'电弧双源同时放电 · 跳链伤害不衰减',future:'组合突破：雷霆棱镜 / 反相护场'},
 {id:'sun',name:'日冕阵列',icon:14,column:2,tier:5,parents:['prism','drill'],cost:{lens:6,coil:3},effect:'每 4 秒追加 8 束扇形日冕光束',future:'组合突破：电浆焚星 / 重力光井'},
 {id:'railburst',name:'磁轨齐射',icon:16,column:0,tier:6,parents:['arsenal','drill'],cost:{alloy:12,lens:8},effect:'机炮12次命中 → 三轨齐射 · 原火力保留',future:'与棱镜卫星二选一 · 可持续精校'},
 {id:'stormlens',name:'雷霆棱镜',icon:17,column:1,tier:6,parents:['tempest','prism'],cost:{coil:12,lens:8},effect:'光束6次命中 → 强电链 · 最短0.6秒',future:'与反相护场二选一 · 可持续精校'},
 {id:'novaecho',name:'电浆焚星',icon:18,column:2,tier:6,parents:['sun','stormgun'],cost:{lens:12,coil:8},effect:'灼烧目标击破 → 四束追击 · 最短1.2秒',future:'与重力光井二选一 · 可持续精校'},
 {id:'satellites',name:'棱镜卫星',icon:19,column:0,tier:7,parents:['arsenal','prism'],cost:{alloy:12,lens:8},effect:'双卫星环绕开火 · 弹墙反弹继续生效',future:'与磁轨齐射二选一 · 可持续精校'},
 {id:'reversefield',name:'反相护场',icon:20,column:1,tier:7,parents:['tempest','flak'],cost:{coil:12,lens:8},effect:'主电击5次 → 1.4秒护场 · 反射3发实弹',future:'与雷霆棱镜二选一 · 可持续精校'},
 {id:'lightwell',name:'重力光井',icon:21,column:2,tier:7,parents:['sun','emp'],cost:{lens:12,coil:8},effect:'主激光8次命中 → 旋转交叉光区',future:'与电浆焚星二选一 · 可持续精校'},
 {id:'hive',name:'蜂巢副炮',icon:0,column:0,tier:8,component:true,parents:['split'],cost:{alloy:3},effect:'每1.1秒追加六发扇射 · 原炮保留',future:'可搭配：反弹 / 爆裂 / 雷暴机炮'},
 {id:'needles',name:'磁钉阵列',icon:3,column:0,tier:8,component:true,parents:['split'],cost:{alloy:3},effect:'每1.5秒追加三路贯穿 · 每路最多4敌',future:'可搭配：雷暴机炮 / 同系精校'},
 {id:'seekorb',name:'巡航雷球',icon:13,column:1,tier:8,component:true,parents:['coil'],cost:{coil:3},effect:'每1.6秒双雷球 · 命中再跳电',future:'可搭配：反弹 / 雷暴机炮'},
 {id:'electrodes',name:'护航电极',icon:8,column:1,tier:8,component:true,parents:['coil'],cost:{coil:3},effect:'每1.1秒放电 · 每极可拦1近弹',future:'可搭配：近身机动 / 电磁精校'},
 {id:'tracker',name:'追光镜',icon:10,column:2,tier:8,component:true,parents:['laser'],cost:{lens:3},effect:'每1.2秒追加索敌光束 · 不限正前方',future:'可搭配：灼烧 / 深穿光束'},
 {id:'blades',name:'回旋光刃',icon:14,column:2,tier:8,component:true,parents:['laser'],cost:{lens:3},effect:'每0.5秒旋刃切割 · 半径230',future:'可搭配：灼烧 / 近身穿行'},
];
export const chassis:Technology={id:'chassis',name:'飞船核心',icon:3,column:1,tier:-1,parents:[],cost:{},effect:'基础机炮与机动',future:'三系组件'};
for(const n of technologies)if(!n.parents.length)n.parents=['chassis'];
export const techById=new Map([chassis,...technologies].map(t=>[t.id,t]));
export const keystones=['arsenal','tempest','sun'];
export const breakthroughPairs=[['railburst','satellites'],['stormlens','reversefield'],['novaecho','lightwell']];
export const breakthroughIds=breakthroughPairs.flat();
const requiredKeystone=new Map<string,string|undefined>();
function terminalFor(id:string):string|undefined{if(requiredKeystone.has(id))return requiredKeystone.get(id);const key=keystones.includes(id)?id:techById.get(id)?.parents.map(terminalFor).find(Boolean);requiredKeystone.set(id,key);return key;}
for(const t of technologies)terminalFor(t.id);
export class Assembly{
 readonly installed=new Set<string>();
 readonly inventory:Record<Part,number>={alloy:0,coil:0,lens:0};
 readonly calibrated:Record<string,number>={};
 has(id:string){return id==='chassis'||this.installed.has(id);}
 get keystone(){return keystones.find(id=>this.has(id));}
 get breakthrough(){return breakthroughIds.find(id=>this.has(id));}
 lockedBy(id:string){const key=requiredKeystone.get(id);if(this.keystone&&key&&this.keystone!==key)return this.keystone;return [...breakthroughPairs,...componentPairs].find(pair=>pair.includes(id))?.find(key=>key!==id&&this.has(key));}
 cost(id:string):Partial<Record<Part,number>>{const n=techById.get(id);if(!n)return{};return this.has(id)?{[parts[n.column]]:4+2*(this.calibrated[id]??0)}:n.cost;}
 missing(id:string){return techById.get(id)?.parents.filter(p=>!this.has(p))??[];}
 can(id:string){const n=techById.get(id);return id!=='chassis'&&!!n&&!this.lockedBy(id)&&!this.missing(id).length&&Object.entries(this.cost(id)).every(([p,c])=>this.inventory[p as Part]>=c);}
 install(id:string){if(!this.can(id))return false;for(const [p,c]of Object.entries(this.cost(id)))this.inventory[p as Part]-=c; if(this.has(id))this.calibrated[id]=(this.calibrated[id]??0)+1;else this.installed.add(id);return true;}
 power(id:string){const column=techById.get(id)?.column;return 1+Object.entries(this.calibrated).reduce((sum,[key,n])=>sum+(techById.get(key)?.column===column?n*.2:0),0);}
 get ready(){return technologies.filter(t=>!this.has(t.id)&&this.can(t.id));}
}
