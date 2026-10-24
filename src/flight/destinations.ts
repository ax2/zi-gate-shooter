import{airspacePlan}from'./airspace';
import{bossCoreSpec}from'./boss-core';
import{parts}from'./technology';
/** The run counter controls difficulty; this identity controls the encounter
 * family. Revisit a theme without resetting its HP, wave or projectile scaling. */
export const destinationSpecs=[
 {family:0,name:'舰炮走廊',part:parts[0],background:'runway.jpg',target:'interceptor-v2.png',boss:'boss-v1.png',brief:'夹击机群 · 追猎精英',action:'截击军火艇'},
 {family:1,name:'磁雷航区',part:parts[1],background:'cooling-corridor-v2.jpg',target:'minelayer-v1.png',boss:'boss-flanker-v1.png',brief:'纵列突击 · 裂弹精英',action:'拆除布雷艇'},
 {family:2,name:'棱盾枢纽',part:parts[2],background:'armored-corridor-v1.jpg',target:'conduit-v1.png',boss:'boss-bastion-v1.png',brief:'回旋火环 · 棱光精英',action:'拆盾破阵'},
]as const;
export const destinationOptions=(previous:number)=>destinationSpecs.filter(d=>d.family!==previous).map(d=>d.family);
export const patternIndex=(sector:number,family:number)=>Math.floor(sector/3)*3+family;
export function destinationView(sector:number,family:number){const d=destinationSpecs[family];return d?{...d,pattern:airspacePlan(patternIndex(sector,family)),core:bossCoreSpec(patternIndex(sector,family))}:undefined;}
