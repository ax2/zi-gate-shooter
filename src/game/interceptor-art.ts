import type {Body} from '../core/world';

export const INTERCEPTOR_ART='interceptor-v2.png';
/** The generated middle cell lights all three ports, which would misrepresent
 * the alternating attacks. Use dark cells; real per-port light stays authoritative. */
export function interceptorArtFrame(b:Pick<Body,'age'|'interceptFiredAt'|'empRemaining'>):0|2{
 const since=b.age-(b.interceptFiredAt??-10);
 return (b.empRemaining??0)<=0&&since>=0&&since<.16?2:0;
}
