import{supplyEscortRules,type SupplyEscortState}from'./supply-escort';
import{salvageRules,type SalvageState}from'./salvage-operation';
import{citadelRules,type CitadelState}from'./prism-citadel';
import type {Part} from './technology';
export type EncounterKind='arms'|'mines'|'shield'|'convoy'|'reactor'|'citadel'|'salvage'|'escort';
export const encounterTypes:Record<EncounterKind,{name:string;brief:string;part:Part;icon:number;duration:number;reward:number}>={
 escort:{name:'补给护航',brief:'保护友艇穿越战区 → 金币48',part:'alloy',icon:23,duration:supplyEscortRules.duration,reward:6},
 salvage:{name:'残骸抢收',brief:'靠近连接回收舱 · 可选择顺序',part:'alloy',icon:24,duration:salvageRules.duration,reward:6},
 arms:{name:'截击军火艇',brief:'击破军火艇 → 弹芯×4',part:'alloy',icon:3,duration:26,reward:4},
 mines:{name:'拆除布雷艇',brief:'击破布雷艇 → 线圈×4',part:'coil',icon:1,duration:26,reward:4},
 shield:{name:'拆盾破阵',brief:'击破中枢 → 透镜×4',part:'lens',icon:2,duration:26,reward:4},
 convoy:{name:'双艇追缉',brief:'先破一艇 · 追缉另一艇 → 弹芯×6',part:'alloy',icon:3,duration:18,reward:6},
 citadel:{name:'三棱巡航堡垒',brief:'拆镜削盾 / 集火中枢 → 透镜×6',part:'lens',icon:10,duration:26,reward:6},
 reactor:{name:'连锁雷库',brief:'拆雷削盾 / 集火强攻 → 线圈×6',part:'coil',icon:1,duration:26,reward:6},
};
export interface FlightEncounter{id:number;sector:number;kind:EncounterKind;target:number;started:number;outcome:'active'|'won'|'escaped';ended?:number;rewardId?:number;claimed:boolean;escort?:SupplyEscortState;salvage?:SalvageState;pending?:{x:number;y:number};convoy?:{nodes:number[];broken:number[];rush?:number};citadel?:CitadelState;reactor?:{nodes:number[];broken:number[];shieldStart:number;shieldRemoved:number}}
export interface EncounterRecord{claimedAt?:number;id:number;sector:number;kind:EncounterKind;outcome:'won'|'escaped';started:number;time:number;claimed:boolean}
export const convoyRules={rushTime:6.5,rushSpeed:95,entrySpeed:160}as const;
export const encounterPlan=(sector:number,family:number,economy=false):EncounterKind=>economy&&family===0&&sector>0&&Math.floor(sector/3)%3===0?'escort':economy&&family===0&&Math.floor(sector/3)%3===2?'salvage':Math.floor(sector/3)%2===1?(['convoy','reactor','citadel']as const)[family]:(['arms','mines','shield']as const)[family];
export const encounterTargets=(e:FlightEncounter)=>e.salvage||e.escort?[]:e.convoy?.nodes??[e.target];
export const encounterRemaining=(e:FlightEncounter,time:number)=>Math.max(0,Math.min(e.started+encounterTypes[e.kind].duration-time,e.convoy?.rush===undefined?Infinity:e.convoy.rush+convoyRules.rushTime-time));
/** Two real crossing routes; urgency adds travel, never a predicted firing line. */
export function convoyPose(side:number,age:number,rushElapsed=0){const start=-80-(side<0?70:0),entry=(260-start)/convoyRules.entrySpeed,t=Math.max(0,age-entry);return{x:360+side*220*Math.cos(Math.min(1,t/7)*Math.PI),y:(age<entry?start+age*convoyRules.entrySpeed:260+t*60)+Math.max(0,rushElapsed)*convoyRules.rushSpeed};}
export const reactorRules={count:3,hp:44,radius:24,shield:600,spacing:105,forward:75,rear:-60,chainRadius:175,blastRadius:105,chainDamage:52,warmup:3.4,score:10}as const;
/** A clear forward lane permits direct fire; linked capacitors wrap around the core. */
export const reactorPodPosition=(at:{x:number;y:number},index:number)=>({x:Math.max(40,Math.min(680,at.x+(index-1)*reactorRules.spacing)),y:at.y+(index===1?reactorRules.rear:reactorRules.forward)});

/** Economy cargo is not the obsolete material recipe. Only the new citadel promises an exact coin bounty. */
export const encounterBrief=(kind:EncounterKind,economy:boolean)=>!economy?encounterTypes[kind].brief:({escort:'保护友艇16秒 · 护送成功掉落48金币',salvage:'靠近连接：每舱8币 · 全收另加48币',arms:'击破军火艇 → 战利货舱',mines:'拆除布雷艇 → 战利货舱',shield:'击破中枢 → 战利货舱',convoy:'两艇全歼 → 战利货舱',reactor:'拆雷削盾 / 集火强攻 → 战利货舱',citadel:'拆镜削盾 / 集火中枢 → 金币'+citadelRules.coins}as const)[kind];
