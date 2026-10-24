/** Only actually collected material grows the cannon; the spendable wallet is separate. */
export const pickupGrowthRules={doubleAt:3,tripleAt:9,fourAt:24,fiveAt:60,powerEvery:60,powerStep:.12,damagePerDoubling:.05}as const;
const thresholds=[0,pickupGrowthRules.doubleAt,pickupGrowthRules.tripleAt,pickupGrowthRules.fourAt,pickupGrowthRules.fiveAt];
export function mainGunState(value:number){
 const collected=Number.isFinite(value)?Math.max(0,Math.min(Number.MAX_SAFE_INTEGER,Math.floor(value))):0,count=thresholds.filter(n=>collected>=n).length,refinements=count===5?Math.floor((collected-pickupGrowthRules.fiveAt)/pickupGrowthRules.powerEvery):0;
 const previous=count<5?thresholds[count-1]:pickupGrowthRules.fiveAt+refinements*pickupGrowthRules.powerEvery,next=count<5?thresholds[count]:previous+pickupGrowthRules.powerEvery;
 return{collected,count,rank:count+refinements,refinements,damageFactor:1+pickupGrowthRules.damagePerDoubling*Math.log2(1+collected)+refinements*pickupGrowthRules.powerStep,next,remaining:next-collected,nextKind:count<5?'barrel' as const:'power' as const,progress:Math.max(0,Math.min(1,(collected-previous)/(next-previous)))};
}
export const mainGunPorts=(count:number)=>count>=5?[-32,-16,0,16,32]:count===4?[-24,-8,8,24]:count===3?[-20,0,20]:count===2?[-11,11]:[0];
export function mainGunActivity(count:number,shots:readonly{hostile:boolean;style:string;age:number;life:number;port?:number}[]){return mainGunPorts(count).map((dx,port)=>({dx,port,firing:shots.some(b=>!b.hostile&&b.style==='pulse'&&b.port===port&&b.age<.08&&b.age<b.life)}));}
export interface MainGunChange{beforeCount:number;afterCount:number;beforeDamage:number;afterDamage:number;beforeRank?:number;afterRank?:number}
/** A positive real increment must not be rounded into an unchanged arrow. */
export function mainPickupLabel(r:MainGunChange){
 if(r.beforeCount!==r.afterCount)return'主炮 '+r.beforeCount+'→'+r.afterCount+'路';
 const before=r.beforeRank??r.beforeCount,after=r.afterRank??r.afterCount,delta=r.afterDamage-r.beforeDamage,gain=Number.isFinite(delta)&&delta>0?'每发 +'+Number(delta.toPrecision(2)):'回收已记录';
 return(before!==after?'主炮 Lv'+before+'→'+after:'主炮 '+r.afterCount+'路')+' · '+gain;
}
export const mainNextLabel=(g:ReturnType<typeof mainGunState>)=>'再拾 '+g.remaining+' 份 → '+(g.nextKind==='barrel'?g.count+1+'路':'Lv'+(g.rank+1));
