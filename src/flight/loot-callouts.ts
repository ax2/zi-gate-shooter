import{lootLife,type Loot}from'./world';
import type{Supply}from'./defense';
export interface LootRect{x:number;y:number;w:number;h:number}
export interface LootCallout{
 id:number;ids:number[];points:{x:number;y:number}[];anchor:{x:number;y:number};
 contents:{part:Supply;amount:number}[];special:boolean;expiring:boolean;panel?:LootRect;
}
export interface LootLabelView{groups:LootCallout[];activeIds:Set<number>;clusteredIds:Set<number>;labelledIds:Set<number>}
export const lootCalloutRules={join:112,split:136,max:8,weakMax:4,height:58,cell:48,padding:16}as const;
export const lootRectOverlap=(a:LootRect,b:LootRect,gap=0)=>a.x<b.x+b.w+gap&&a.x+a.w+gap>b.x&&a.y<b.y+b.h+gap&&a.y+a.h+gap>b.y;
const close=(a:Loot,b:Loot,d:number)=>Math.hypot(a.x-b.x,a.y-b.y)<=d;
const bounds=(items:readonly Loot[],r:number):LootRect=>{const x=Math.min(...items.map(l=>l.x))-r,y=Math.min(...items.map(l=>l.y))-r;return{x,y,w:Math.max(...items.map(l=>l.x))+r-x,h:Math.max(...items.map(l=>l.y))+r-y};};
/** Only display IDs/history, at most the live32 objects. No merged physics,
 * wallet, entity mutation, random number, clock or remote collection. */
export class LootCallouts{
 private previous:number[][]=[];
 reset(){this.previous=[];}
 arrange(input:readonly Loot[],options:{player:{x:number;y:number};weak?:boolean;clear?:(r:LootRect)=>boolean}):LootLabelView{
  const loot=input.filter(l=>l.age<lootLife(l)&&l.y<1320&&!l.scoreSupply?.claimed).slice().sort((a,b)=>a.id-b.id),byId=new Map(loot.map(l=>[l.id,l])),used=new Set<number>(),sets:Loot[][]=[];
  // Retain only complete-link groups; a long chain cannot span the battlefield.
  for(const old of this.previous){const local:Loot[][]=[];for(const id of old){const item=byId.get(id);if(!item||used.has(id))continue;const group=local.find(g=>g.every(l=>close(l,item,lootCalloutRules.split)));if(group)group.push(item);else local.push([item]);used.add(id);}sets.push(...local);}
  for(const item of loot)if(!used.has(item.id)){const group=sets.find(g=>g.every(l=>close(l,item,lootCalloutRules.join)));if(group)group.push(item);else sets.push([item]);used.add(item.id);}
  for(let i=0;i<sets.length;i++)for(let j=i+1;j<sets.length;j++)if(sets[i].every(a=>sets[j].every(b=>close(a,b,lootCalloutRules.join)))){sets[i].push(...sets[j]);sets.splice(j--,1);}
  this.previous=sets.map(g=>g.map(l=>l.id).sort((a,b)=>a-b));
  const clusteredIds=new Set(sets.filter(g=>g.length>1).flatMap(g=>g.map(l=>l.id))),labelledIds=new Set<number>(),bodies=loot.map(l=>bounds([l],clusteredIds.has(l.id)?44:66)),placed:LootRect[]=[];
  const groups:LootCallout[]=sets.filter(g=>g.length>1).map(items=>{
   const anchor={x:items.reduce((n,l)=>n+l.x,0)/items.length,y:items.reduce((n,l)=>n+l.y,0)/items.length},parts:Supply[]=['alloy','coil','lens','repair','armor'];
   return{id:Math.min(...items.map(l=>l.id)),ids:items.map(l=>l.id).sort((a,b)=>a-b),points:items.map(l=>({x:l.x,y:l.y})),anchor,contents:parts.flatMap(part=>{const amount=items.filter(l=>l.part===part).reduce((n,l)=>n+l.amount,0);return amount?[{part,amount}]:[];}),special:items.some(l=>!!l.scoreSupply||!!l.raidReward||!!l.branchReward||!!l.trialReward||l.encounterReward!==undefined||!!l.squadRewards?.length||(l.bossPartReward??0)>0),expiring:items.some(l=>l.age>lootLife(l)-4)};
  }).sort((a,b)=>Math.hypot(a.anchor.x-options.player.x,a.anchor.y-options.player.y)-Math.hypot(b.anchor.x-options.player.x,b.anchor.y-options.player.y)||a.id-b.id);
  for(const group of groups){if(placed.length>=(options.weak?lootCalloutRules.weakMax:lootCalloutRules.max))break;const box=bounds(group.ids.map(id=>byId.get(id)!),44),w=lootCalloutRules.padding+group.contents.length*lootCalloutRules.cell,h=lootCalloutRules.height,x=group.anchor.x-w/2,y=group.anchor.y-h/2;
   const candidates=[{x,y:box.y-h-10},{x,y:box.y+box.h+10},{x:box.x-w-10,y},{x:box.x+box.w+10,y},{x:box.x-w-10,y:box.y-h-10},{x:box.x+box.w+10,y:box.y-h-10},{x:box.x-w-10,y:box.y+box.h+10},{x:box.x+box.w+10,y:box.y+box.h+10}];
   for(const p of candidates){const r={x:Math.max(12,Math.min(708-w,p.x)),y:Math.max(206,Math.min(1195-h,p.y)),w,h};if(bodies.some(b=>lootRectOverlap(r,b,5))||placed.some(b=>lootRectOverlap(r,b,8))||options.clear?.(r)===false)continue;group.panel=r;placed.push(r);for(const id of group.ids)labelledIds.add(id);break;}
  }
  return{groups,activeIds:new Set(loot.map(l=>l.id)),clusteredIds,labelledIds};
 }
}
