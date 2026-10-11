import type {Body} from '../core/world';
/** Warning persists through the real B-pattern separation; wreck frame 2 is
 * drawn only by BossDestruction after an authoritative boss-kill event. */
export const bossFrame = (b: Pick<Body,'warning'>): number => b.warning > 0 ? 1 : 0;
