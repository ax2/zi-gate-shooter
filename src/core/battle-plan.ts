export type BattlePlan=0|1|2;
export const parseBattlePlan=(value:unknown):BattlePlan=>value===1||value===2?value:0;
export const nextBattlePlan=(value:BattlePlan):BattlePlan=>((value+1)%3) as BattlePlan;
export const battleIndex=(round:number,plan:BattlePlan=0)=>round<=1?0:(Math.floor((Math.max(1,round)-1)/3)+plan)%3;
const names=[['集群突袭','哨机护航','双线夹击'],['双翼穿插','交错哨阵','猎袭纵深'],['重装混编','纵列推进','错位重甲']] as const;
export const battleBrief=(round:number,plan:BattlePlan=0)=>round<=1?'初始突围':names[(Math.max(1,Math.floor(round))-1)%3][battleIndex(round,plan)];
export const sideBattlePreview=(plan:BattlePlan)=>`${battleBrief(2,plan)} · ${['轻机与冲锋','双哨交替','精英与冲锋'][plan]}`;
