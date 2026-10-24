import type{Part}from'./technology';
import type{PrismSalvo}from'./prism-salvo';
export type RaiderKind='hunter'|'splitter'|'lattice';
export interface Raider{kind:RaiderKind;side:number;variant:number;attacks:number;shots:number;lastAim?:number;salvo?:PrismSalvo;lastPulse?:number;lastPulseTime?:number}
export const raiderRules={from:30,to:52,warmup:1.5,hp:180,radius:42,score:180,reward:2,hold:10,exitSpeed:180,hunterInterval:2.7,hunterSpeed:190,hunterTurn:1.1,hunterTracking:.9,hunterLife:3.6,splitterInterval:3,splitAfter:1.05,shellSpeed:155,fragmentSpeed:220,fragmentLife:2.7,fragmentCount:5,latticeInterval:3.2,latticeLife:.24,latticeWidth:10}as const;
export const raiderTypes:Record<RaiderKind,{name:string;brief:string;part:Part;icon:number}>={
 hunter:{name:'巡猎精英',brief:'追踪只持续短时 · 变向或击碎绿弹',part:'alloy',icon:5},
 splitter:{name:'裂弹精英',brief:'先击碎大绿壳 · 阻止五路裂弹',part:'coil',icon:6},
 lattice:{name:'棱光精英',brief:'交替斜射 · 绕侧打断发射',part:'lens',icon:10},
};
export const raiderPlan=(sector:number)=>({kind:(['hunter','splitter','lattice']as const)[sector%3],variant:Math.floor(sector/3)%3});
export function raiderDescription(r:Pick<Raider,'kind'|'variant'>){const info=raiderTypes[r.kind];return r.kind==='lattice'&&r.variant>0?{...info,name:'折光扫射精英',brief:'三拍锁向 · 移位或抢拆炮机'}:info;}
export function raiderPose(r:Raider,age:number){const anchorY=r.kind==='splitter'?320:270,entry=(anchorY+80)/155,t=Math.max(0,age-entry),exit=Math.max(0,t-raiderRules.hold)*raiderRules.exitSpeed;
 const x=r.kind==='hunter'?360+r.side*Math.cos(t*(.7+r.variant*.1))*160:r.kind==='splitter'?360+r.side*80+Math.sin(t*.8)*105:360+r.side*175+Math.sin(t*.6)*40;
 return{x:Math.max(60,Math.min(660,x)),y:age<entry?-80+155*age:anchorY+Math.sin(t*.5)*22+exit};
}
export const raiderAim=(r:Raider)=>Math.PI/2+r.side*(r.attacks%2===0?.48:-.48)+r.variant*.06;
