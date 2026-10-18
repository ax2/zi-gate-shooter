type Boss={bossReserveAt?:number;bossReserveSpent?:boolean;bossReserveSpawns?:number};
type Troop={active:boolean;bossReserve?:boolean};
/** Read the actual physical encounter; never predict a projectile or promise
 * a rejected admission. "Ended" gives no kill or reward credit. */
export function bossTacticalStatus(round:number,boss:Boss,troops:readonly Troop[]):string{
 if(round<4||boss.bossReserveAt===undefined)return '';
 if(!boss.bossReserveSpent)return '回援准备';
 if(!boss.bossReserveSpawns)return '';
 const remaining=troops.filter(b=>b.active&&b.bossReserve).length;
 return remaining?`${['冲锋回援','双哨回援','盾哨回援'][(round-1)%3]}×${remaining}`:'反扑结束';
}
