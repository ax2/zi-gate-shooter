export type BattlePlan=0|1|2;
export const battlePlans=[0,1,2] as const;
export const isBattlePlan=(value:unknown):value is BattlePlan=>battlePlans.some(p=>p===value);
/** Preview the first cycle's existing authored encounters, not a difficulty rank. */
export const battlePlansInfo={
 0:{name:'突袭战线',tactic:'清掉近翼机群 · 转火拆炮打开通路',asset:'charger-v1.png'},
 1:{name:'哨阵战线',tactic:'抢拆换位哨机 · 对齐纵列重装',asset:'sniper-v1.png'},
 2:{name:'猎袭战线',tactic:'精英与冲锋交错 · 先拆一翼再转进',asset:'elite-v1.png'},
} as const;
export const parseBattlePlan=(value:unknown):BattlePlan=>value===1||value===2?value:0;
export const nextBattlePlan=(value:BattlePlan):BattlePlan=>((value+1)%3) as BattlePlan;
export const battleIndex=(round:number,plan:BattlePlan=0)=>round<=1?0:(Math.floor((Math.max(1,round)-1)/3)+plan)%3;
const names=[['集群突袭','哨机护航','双线夹击'],['双翼穿插','交错哨阵','猎袭纵深'],['重装混编','纵列推进','错位重甲']] as const;
export const battleBrief=(round:number,plan:BattlePlan=0)=>round<=1?'初始突围':names[(Math.max(1,Math.floor(round))-1)%3][battleIndex(round,plan)];
export const sideBattlePreview=(plan:BattlePlan)=>`${battleBrief(2,plan)} · ${['轻机与冲锋','双哨交替','精英与冲锋'][plan]}`;
