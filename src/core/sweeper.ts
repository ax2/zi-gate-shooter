import type {Body} from './world';
export const SWEEPER={speed:240,upperY:400,lowerY:560,centerY:800,opening:.1} as const;
/** The destination belongs to the authored spawn; there is no player tracking. */
export function sweeperDirection(b:Pick<Body,'kind'|'pattern'|'x'|'lane'>){
 return (b.kind==='drone'||b.kind==='armor'||b.kind==='elite')&&b.pattern==='sweep'?Math.sign(b.lane-b.x):0;
}
