/** Fixed-sector pressure, never scaled to player DPS. One bounded two-drone sortie. */
export const carrierRules={hp:130,radius:48,size:156,count:2,launchAt:5.2,launchUntil:8.5,entrySpeed:145,hold:11,exitSpeed:170,emerge:.65,sideSpeed:120,downSpeed:90}as const;
export interface CarrierState{anchor:number;released:boolean;deferred:boolean;children:number[];origins:{x:number;y:number;side:number}[];releasedAtAge?:number}
export interface CarrierChild{parent:number;side:number}
export const carrierWave=(sector:number,family:number,wave:number)=>sector>0&&family===1&&wave%10===5;
export function carrierPose(age:number,c:CarrierState){const entry=410/carrierRules.entrySpeed,t=Math.max(0,age-entry),exit=c.releasedAtAge===undefined?carrierRules.hold:c.releasedAtAge+1.2;return{x:Math.max(96,Math.min(624,c.anchor+Math.sin(t*.8)*80)),y:age<entry?-100+age*carrierRules.entrySpeed:310+Math.sin(t*.5)*14+Math.max(0,age-exit)*carrierRules.exitSpeed};}
/** Actual dark bay centers sampled on the unchanged 1254-square source image. */
export function carrierPorts(at:{x:number;y:number}){return[390,866].map((x,i)=>({x:at.x+(x/1254-.5)*carrierRules.size,y:at.y+(710/1254-.5)*carrierRules.size,side:i?1:-1}));}
export const carrierChildProgress=(age:number)=>Math.max(0,Math.min(1,age/carrierRules.emerge));
