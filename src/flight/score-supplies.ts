import type{Part}from'./technology';
import type{MainGunChange}from'./pickup-growth';
export type ScoreSupplyPart=Part|'repair';
export const scoreSupplyParts=['alloy','coil','lens','repair']as const;
export const scoreSupplyRules={maxGap:1800,amount:2,life:30,receiptLife:3.5}as const;
export const scoreAwardGap=(awards:number)=>Math.min(scoreSupplyRules.maxGap,300+awards*150);
/** Local space around the kill, not a fixed screen lane or a teleporting item. */
export function scoreSupplyPosition(at:{x:number;y:number},occupied:readonly{x:number;y:number}[]){
 let best={x:Math.max(70,Math.min(650,at.x)),y:Math.max(260,Math.min(1125,at.y))},cost=Infinity;
 for(const dx of[0,-130,130,-260,260])for(const dy of[0,-140,140,-280,280]){const p={x:Math.max(70,Math.min(650,at.x+dx)),y:Math.max(260,Math.min(1125,at.y+dy))},overlap=occupied.reduce((n,l)=>n+Math.max(0,125-Math.abs(l.x-p.x))*Math.max(0,135-Math.abs(l.y-p.y)),0),value=overlap*1000+Math.hypot(p.x-at.x,p.y-at.y);if(value<cost){cost=value;best=p;}}
 return best;
}
export interface ScoreCargo{part:ScoreSupplyPart;amount:number;awards:number;firstScore:number;lastScore:number;x:number;y:number}
export interface ScoreCargoTag{amount:number;awards:number;firstScore:number;lastScore:number;claimed:boolean}
export interface ScoreSupplyReceipt{until:number;contents:Record<ScoreSupplyPart,number>;main?:MainGunChange;healed:number}
const totals=()=>({alloy:0,coil:0,lens:0,repair:0});
/** Four existing contents, at most four waiting records. No wallet or upgrade here. */
export class ScoreSupplyLedger{
 readonly pending=new Map<ScoreSupplyPart,ScoreCargo>();
 readonly earned=totals();readonly issued=totals();readonly collected=totals();readonly expired=totals();
 receipt?:ScoreSupplyReceipt;
 get active(){return scoreSupplyParts.some(p=>this.earned[p]>0); }
 queue(part:ScoreSupplyPart,amount:number,at:{x:number;y:number},score:number){const old=this.pending.get(part);this.earned[part]+=amount;this.pending.set(part,{part,amount:amount+(old?.amount??0),awards:1+(old?.awards??0),firstScore:old?.firstScore??score,lastScore:score,x:at.x,y:at.y});}
 flush(deliver:(cargo:Readonly<ScoreCargo>)=>boolean){let count=0;for(const part of scoreSupplyParts){const cargo=this.pending.get(part);if(!cargo||!deliver({...cargo}))continue;this.issued[part]+=cargo.amount;this.pending.delete(part);count++;}return count;}
 collect(part:ScoreSupplyPart,scoreAmount:number,amount:number,now:number,main?:MainGunChange,healed=0){this.collected[part]+=scoreAmount;const old=this.receipt&&this.receipt.until>now?this.receipt:undefined,contents={...(old?.contents??totals())};contents[part]+=amount;this.receipt={until:now+scoreSupplyRules.receiptLife,contents,healed:(old?.healed??0)+healed,main:main&&old?.main?{...main,beforeCount:old.main.beforeCount,beforeDamage:old.main.beforeDamage,beforeRank:old.main.beforeRank}:main??old?.main};}
 expire(part:ScoreSupplyPart,amount:number){this.expired[part]+=amount;}
 snapshot(){return{earned:{...this.earned},issued:{...this.issued},collected:{...this.collected},expired:{...this.expired},pending:[...this.pending.values()].map(c=>({...c})),receipt:this.receipt?{...this.receipt,contents:{...this.receipt.contents},main:this.receipt.main?{...this.receipt.main}:undefined}:undefined};}
}
