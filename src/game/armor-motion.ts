import type {Body} from '../core/world';
/** Preparing is driven by the actual warning. Travel phase follows simulated
 * distance; the third frame is tread B, not recoil or a claimed projectile. */
export function armorFrame(b: Pick<Body,'warning'|'age'|'speed'>,braced=false): number {
 if(b.warning>0)return 1;
 if(braced)return 0;
 const distance=Math.max(0,b.age*b.speed);
 return Number.isFinite(distance)&&Math.floor(distance/14)%2 ? 2 : 0;
}
