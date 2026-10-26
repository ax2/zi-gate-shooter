import{environmentSpecs}from'./environments';
import{airspacePlan}from'./airspace';
import{bossCoreSpec}from'./boss-core';
import{parts}from'./technology';
import{encounterPlan,encounterTypes}from'./encounters';
/** The run counter controls difficulty; this identity controls the encounter
 * family. Revisit a theme without resetting its HP, wave or projectile scaling. */
export const destinationSpecs=[
 {family:0,name:'舰炮走廊',part:parts[0],background:environmentSpecs[0].file,target:'interceptor-v2.png',boss:'boss-v1.png',brief:'夹击机群 · 追猎精英',action:'截击军火艇'},
 {family:1,name:'磁雷航区',part:parts[1],background:environmentSpecs[1].file,target:'minelayer-v1.png',boss:'boss-flanker-v1.png',brief:'纵列突击 · 裂弹精英',action:'拆除布雷艇'},
 {family:2,name:'棱盾枢纽',part:parts[2],background:environmentSpecs[2].file,target:'conduit-v1.png',boss:'boss-bastion-v1.png',brief:'回旋火环 · 棱光精英',action:'拆盾破阵'},
]as const;
export const destinationOptions=(previous:number)=>destinationSpecs.filter(d=>d.family!==previous).map(d=>d.family);
export const patternIndex=(sector:number,family:number)=>Math.floor(sector/3)*3+family;
export function destinationView(sector:number,family:number,economy=false){const d=destinationSpecs[family];if(!d)return;const encounter=encounterPlan(sector,family,economy),action=encounterTypes[encounter];return{...d,brief:encounter==='escort'?'保护补给艇 · 清除迎面实弹':economy&&family===1&&sector>0?'折返截击 · 增援载机':economy&&family===2&&sector>0?'修复护航 · 优先拆源':family===2&&Math.floor(sector/3)%3>0?'折光三拍 · 移位或抢拆':d.brief,encounter,action:action.name,reward:action.reward,pattern:airspacePlan(patternIndex(sector,family)),core:bossCoreSpec(patternIndex(sector,family))};}
