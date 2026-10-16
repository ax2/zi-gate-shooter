import type {Body} from '../core/world';
/** Stable per-body speed makes age*speed the travel distance. A braced pose
 * follows the authoritative warning; no recoil or projectile is invented. */
export function eliteFrame(b: Pick<Body,'warning'|'age'|'speed'|'interceptCoreRemaining'>): number {
 if(b.warning>0||(b.interceptCoreRemaining??0)>0)return 1;
 const distance=Math.max(0,b.age*b.speed);
 return Number.isFinite(distance)&&Math.floor(distance/48)%2 ? 2 : 0;
}
