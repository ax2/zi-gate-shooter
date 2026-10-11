import { C } from '../core/config';
import type { Body } from '../core/world';
/** Actual warning and speed select a state pose; no separate animation clock. */
export function chargerFrame(b: Pick<Body,'warning'|'speed'>): number {
  if (b.warning > 0) return 1;
  return b.speed >= C.chargerBehavior.dashSpeed ? 2 : 0;
}
