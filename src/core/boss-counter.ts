import type {Body} from './world';
/** Fixed half-health evolution. It never scales with the player's firepower. */
export const BOSS_COUNTER={health:.5,lead:.15,warning:1.1,recovery:1.8,vy:480,vx:[-180,0,180]} as const;
export function counterCharge(b:Pick<Body,'attack'|'warning'|'timer'>){return b.attack===4&&b.warning>0?Math.max(0,Math.min(1,1-b.timer/BOSS_COUNTER.warning)):0;}
export function counterMuzzles(b:Pick<Body,'x'|'y'|'bossVariant'>){
 const [x,y]=b.bossVariant===1?[120,90]:b.bossVariant===2?[76,76]:[96,110];
 return [{x:b.x-x,y:b.y+y},{x:b.x+x,y:b.y+y}];
}
export const COUNTER_SEQUENCE={wingSpacing:.25,shearSpacing:.2} as const;
export function counterSequence(variant:number|undefined){
 return variant===1?{beats:2,spacing:COUNTER_SEQUENCE.wingSpacing}:variant===2?{beats:3,spacing:COUNTER_SEQUENCE.shearSpacing}:{beats:1,spacing:0};
}
/** Same six projectiles per phrase; actual ports and directions vary by beat. */
export function counterVolley(b:Pick<Body,'x'|'y'|'bossVariant'>,beat:number){
 const muzzles=counterMuzzles(b);
 if(b.bossVariant===1)return BOSS_COUNTER.vx.map(vx=>({...muzzles[beat%2],vx,vy:BOSS_COUNTER.vy}));
 if(b.bossVariant===2)return muzzles.map((m,i)=>({...m,vx:BOSS_COUNTER.vx[2-beat]*(i===0?1:-1),vy:BOSS_COUNTER.vy}));
 return muzzles.flatMap(m=>BOSS_COUNTER.vx.map(vx=>({...m,vx,vy:BOSS_COUNTER.vy})));
}
export const counterTitle=(variant:number|undefined)=>variant===1?'双翼轮射':variant===2?'交剪三拍':'双炮反击';
export function counterAttack(variant:number|undefined,cycle:number){
 const phrase=variant===1?[2,4,1,4]:variant===2?[3,4,3,0]:[4,0,4,1];
 return phrase[((cycle%4)+4)%4];
}
