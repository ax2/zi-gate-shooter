import type {EscortTroop} from './boss-formations';

export const BOSS_RESERVES={fromRound:4,ratio:.5,delay:1.2,deadline:3,eliteDurability:1.5,guardHold:6}as const;
/** One finite response to real half-health damage. No player-build scaling. */
export function bossReserveFor(round:number):{name:string;hint:string;troops:readonly EscortTroop[]}|undefined{
 if(round<BOSS_RESERVES.fromRound)return;
 switch((round-1)%3){
 case 0:return{name:'半血反扑 · 双翼突进',hint:'两翼冲锋回援 · 先清一侧，再转火首领',troops:[{kind:'charger',x:180,pattern:'flank',lane:260},{kind:'charger',x:540,pattern:'flank',lane:460}]};
 case 1:return{name:'半血反扑 · 锁位双哨',hint:'双哨锁定当前站位 · 抢拆一翼或避过三连再转火',troops:[{kind:'sniper',x:160,pattern:'lockshot'},{kind:'sniper',x:560,pattern:'lockshot'}]};
 default:return{name:'半血反扑 · 盾哨回援',hint:'前盾护后哨 · 击穿盾卫，或移到另一翼拆哨',troops:[{kind:'guard',x:480},{kind:'sniper',x:480,pattern:'lockshot'}]};
 }
}
