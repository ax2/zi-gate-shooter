import type {Part} from './technology';
export type EncounterKind='arms'|'mines'|'shield';
export const encounterTypes:Record<EncounterKind,{name:string;brief:string;part:Part;icon:number;duration:number}>={
 arms:{name:'截击军火艇',brief:'击破军火艇 → 弹芯×4',part:'alloy',icon:3,duration:26},
 mines:{name:'拆除布雷艇',brief:'击破布雷艇 → 线圈×4',part:'coil',icon:1,duration:26},
 shield:{name:'拆盾破阵',brief:'击破中枢 → 透镜×4',part:'lens',icon:2,duration:26},
};
export interface FlightEncounter{id:number;sector:number;kind:EncounterKind;target:number;started:number;outcome:'active'|'won'|'escaped';ended?:number;rewardId?:number;claimed:boolean;pending?:{x:number;y:number}}
export interface EncounterRecord{id:number;sector:number;kind:EncounterKind;outcome:'won'|'escaped';started:number;time:number;claimed:boolean}
