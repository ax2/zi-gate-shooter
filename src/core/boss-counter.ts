import type {Body} from './world';
/** Fixed half-health evolution. It never scales with the player's firepower. */
export const BOSS_COUNTER={health:.5,lead:.15,warning:1.1,recovery:1.8,vy:480,vx:[-180,0,180]} as const;
export function counterCharge(b:Pick<Body,'attack'|'warning'|'timer'>){return b.attack===4&&b.warning>0?Math.max(0,Math.min(1,1-b.timer/BOSS_COUNTER.warning)):0;}
export function counterMuzzles(b:Pick<Body,'x'|'y'|'bossVariant'>){
 const [x,y]=b.bossVariant===1?[120,90]:b.bossVariant===2?[76,76]:[96,110];
 return [{x:b.x-x,y:b.y+y},{x:b.x+x,y:b.y+y}];
}
export function counterAttack(variant:number|undefined,cycle:number){
 const phrase=variant===1?[2,4,1,4]:variant===2?[3,4,3,0]:[4,0,4,1];
 return phrase[((cycle%4)+4)%4];
}
