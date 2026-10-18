/** Candidate combat reward: actual boss HP thresholds, once per physical body.
 * No clock grants, new currency, healing loop or player-DPS-based health. */
export const BOSS_SALVAGE={fromRound:4,ratios:[.8,.6,.4,.2],charge:20}as const;
type SalvageBody={kind:string;active:boolean;hp:number;maxHp:number;bossSalvageMask?:number};
export function claimBossSalvage(b:SalvageBody,before:number,round:number,liveCombat:boolean):number[]{
 if(!liveCombat||round<BOSS_SALVAGE.fromRound||b.kind!=='boss'||!b.active||!Number.isFinite(before)||!Number.isFinite(b.hp)||!Number.isFinite(b.maxHp)||b.maxHp<=0||before<=b.hp)return [];
 const gained:number[]=[];let mask=b.bossSalvageMask??0;
 for(const [i,ratio]of BOSS_SALVAGE.ratios.entries())if(!(mask&(1<<i))&&before>b.maxHp*ratio&&b.hp<=b.maxHp*ratio){mask|=1<<i;gained.push(i);}
 if(gained.length)b.bossSalvageMask=mask;
 return gained;
}
export function bossSalvageCount(b:Pick<SalvageBody,'bossSalvageMask'>){let count=0;for(let i=0;i<4;i++)count+=Number(!!((b.bossSalvageMask??0)&(1<<i)));return count;}
