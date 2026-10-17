import {isIonAugment,type IonAugment} from './ion-storm';
import {isStormAugment,type StormAugment,STORM_REFINEMENT} from './storm-refinement';
import {MAGNETIC,MAGNETIC_REFINEMENT} from './magnetic-field';
import {isPhotonAugment,type PhotonAugment} from './laser-chain';
import {isFractureAugment,type FractureAugment} from './combos';
export type BallisticBranch='penetrator'|'fragment'|'ricochet';
export const ballisticBranches={
 penetrator:{name:'贯穿弹芯',detail:'霰射总伤害+30% · 每颗贯穿2敌',role:'瞄准纵向敌列，打穿前排'},
 fragment:{name:'爆破弹芯',detail:'霰射总伤害+30% · 140范围50%溅射',role:'瞄准紧凑敌群，扩散清场'},
 ricochet:{name:'跳弹弹芯',detail:'霰射总伤害+30% · 280范围55%跳弹',role:'借前排命中，打击分散侧翼'},
} as const;
export const BALLISTIC_FORK={targets:2,radius:140,splash:.5} as const;
export const RICOCHET={range:280,minSide:80,damage:.55} as const;
export type ElectricBranch='spread'|'capacitor'|'seeker';
export type MagneticAugment='field-wide'|'field-link';
export const magneticAugments={
 'field-wide':{name:'广域磁场',detail:`原三拍保留 · 半径${MAGNETIC.radius}→${MAGNETIC_REFINEMENT.wideRadius} · 每拍${MAGNETIC_REFINEMENT.wideDamage*100}%`,role:'扩大持续覆盖，迎接侧翼来敌'},
 'field-link':{name:'分流电桥',detail:'原三拍保留 · 每拍追加一次场外跳击',role:`${MAGNETIC.radius}外至${MAGNETIC_REFINEMENT.linkRange}内，优先当前蓄能射手`},
} as const;
export const isMagneticAugment=(value:unknown):value is MagneticAugment=>value==='field-wide'||value==='field-link';
export type BuildBranch=StormAugment|IonAugment|OpticalBranch|ElectricBranch|BallisticBranch|MagneticAugment|PhotonAugment|FractureAugment;
export const SEEKER_BRIDGE={range:340} as const;
export const electricBranches={
 seeker:{name:'猎隼电桥',detail:'首跳范围340 · 优先蓄能射手',role:'借前排目标，跳击后排火力点'},
 spread:{name:'连锁扩散',detail:'跳电范围220 · 额外多跳一次',role:'优先连通群敌，扩大清场范围'},
 capacitor:{name:'电容蓄爆',detail:'跳电范围220 · 同敌3次直击追加200%',role:'持续瞄准精英与首领，单体放电'},
} as const;
export const ELECTRIC_FORK={hits:3,damage:2} as const;
export type OpticalBranch='burn'|'relay';
export const opticalBranches={
 burn:{name:'灼热透镜',detail:'间隔-25% · 灼烧3×25% /0.3秒',role:'对重装与首领持续施压'},
 relay:{name:'分光镜组',detail:'间隔-25% · 侧束65%伤害 /横距180',role:'对侧翼敌人扩大覆盖'},
} as const;
export const OPTICAL_FORK={burnTicks:3,burnInterval:.3,burnDamage:.25,relayRange:180,relayDamage:.65} as const;
export type Route = 'ballistic' | 'electric' | 'optical';
export const routes: Route[] = ['ballistic','electric','optical'];
export const tree: Record<Route, {name:string; detail:string}[]> = {
  ballistic: [
    {name:'霰射机构',detail:'安装T1霰射 · 霰射伤害+10%'},
    {name:'重型弹芯 · 选择分支',detail:'总伤害+30% · 贯穿/爆破/跳弹'},
    {name:'雷暴霰射',detail:'霰射命中追加一次跳电 · 需雷电路线'},
  ],
  electric: [
    {name:'导电线圈',detail:'安装T1电弧 · 电弧多跳一次'},
    {name:'远距电桥 · 选择分支',detail:'范围160→220 · 扩散/蓄爆/猎隼'},
    {name:'离子风暴',detail:'保留80%跳伤 · 每6次有效电击范围放电'},
  ],
  optical: [
    {name:'聚焦镜组',detail:'立即解锁激光 · 激光伤害+15%'},
    {name:'循环冷却 · 选择分支',detail:'间隔-25% · 二选一：灼烧/分光'},
    {name:'深穿光束',detail:'贯穿+2 · 还可组合棱镜/电光连锁'},
  ],
};
export class BuildTree {
  stormAugment?:StormAugment;
  ionAugment?:IonAugment;
  fractureAugment?:FractureAugment;
  photonAugment?:PhotonAugment;
  magneticAugment?:MagneticAugment;
  ballisticBranch?:BallisticBranch;
  opticalBranch?:OpticalBranch;
  electricBranch?:ElectricBranch;
  node(route:Route,index:number,branch:BuildBranch|undefined=route==='ballistic'?this.ballisticBranch:route==='electric'?this.electricBranch:this.opticalBranch){
    if(route==='ballistic'&&index===1&&(branch==='penetrator'||branch==='fragment'||branch==='ricochet'))return ballisticBranches[branch];
    if(route==='electric'&&index===1&&(branch==='spread'||branch==='capacitor'||branch==='seeker'))return electricBranches[branch];
    return route==='optical'&&index===1&&(branch==='burn'||branch==='relay')?opticalBranches[branch]:tree[route][index];
  }
  readonly ranks: Record<Route,number> = {ballistic:0,electric:0,optical:0};
  readonly refinements: Record<Route,number> = {ballistic:0,electric:0,optical:0};
  get baseSpent(){return Object.values(this.ranks).reduce((a,b)=>a+b,0);}
  get spent(){return this.baseSpent+Object.values(this.refinements).reduce((a,b)=>a+b,0);}
  next(route:Route){
    if(this.ranks[route]<3)return this.node(route,this.ranks[route]);
    if(route==='optical'&&this.refinements.optical===0)return {name:'光学精调1 · 连锁蓝图',detail:'伤害系数100%→110% · 配T2电弧可组合'};
    const n=this.refinements[route],label={ballistic:'弹道武器',electric:'电弧炮',optical:'激光与棱镜'}[route];
    return {name:`${label}精调 ${n+1}`,detail:`伤害系数 ${100+n*10}% → ${110+n*10}%`};
  }
  available(earned:number){
    if(earned<=this.spent)return [];
    return routes.filter(r=>!(r==='ballistic'&&this.ranks[r]===2&&this.ranks.electric===0));
  }
  choose(route:Route,earned:number,branch?:BuildBranch){
    if(!this.available(earned).includes(route))return false;
    if(isStormAugment(branch)){
      if(route!=='ballistic'||this.ranks.ballistic<3||this.ranks.electric<1||this.refinements.ballistic<STORM_REFINEMENT.refinements||this.stormAugment)return false;
      this.stormAugment=branch;
    }else if(isIonAugment(branch)){
      if(route!=='electric'||this.ranks.electric<3||this.refinements.electric<2||this.ionAugment)return false;
      this.ionAugment=branch;
    }else if(isFractureAugment(branch)){
      if(route!=='ballistic'||this.ranks.ballistic<3||this.fractureAugment)return false;
      this.fractureAugment=branch;
    }else if(isPhotonAugment(branch)){
      if(route!=='optical'||this.ranks.optical<3||this.refinements.optical<1||this.photonAugment)return false;
      this.photonAugment=branch;
    }else if(isMagneticAugment(branch)){
      if(route!=='electric'||this.ranks.electric<3||this.magneticAugment)return false;
      this.magneticAugment=branch;
    }else if(branch!==undefined&&!(this.ranks[route]===1&&((route==='ballistic'&&(branch==='penetrator'||branch==='fragment'||branch==='ricochet'))||(route==='optical'&&(branch==='burn'||branch==='relay'))||(route==='electric'&&(branch==='spread'||branch==='capacitor'||branch==='seeker')))))return false;
    if(route==='ballistic'&&this.ranks.ballistic===1){
      if(this.ballisticBranch)return false;
      this.ballisticBranch=branch==='ricochet'?'ricochet':branch==='fragment'?'fragment':'penetrator';
    }
    if(route==='electric'&&this.ranks.electric===1){
      if(this.electricBranch)return false;
      this.electricBranch=branch==='seeker'?'seeker':branch==='capacitor'?'capacitor':'spread';
    }
    if(route==='optical'&&this.ranks.optical===1){
      if(this.opticalBranch)return false;
      this.opticalBranch=branch==='relay'?'relay':'burn';
    }
    if(this.ranks[route]<3)this.ranks[route]++;else this.refinements[route]++;return true;
  }
}
