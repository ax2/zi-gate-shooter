import type { World } from '../core/world';
import { BOSS_VISUAL } from './boss-destruction';

export type ReceiptPosition = 240 | 1180;
// These are rendered envelopes, including native labels, not collision boxes.
// No prediction or extra game state is involved in choosing a free reading area.
export function buildReceiptPosition(w: World, preferBottom = false): ReceiptPosition | null {
  const lockedBottom = w.bodies.some(b => b.active && (b.kind === 'boss' || b.bountyRound !== undefined));
  const candidates: ReceiptPosition[] = lockedBottom ? [1180] : preferBottom ? [1180, 240] : [240, 1180];
  for (const top of candidates) {
    const bottom = top + (top === 1180 ? 88 : 104);
    const blockedBody = w.bodies.some(b => {
      if (!b.active) return false;
      const boss = b.kind === 'boss';
      const y = b.y + (boss ? BOSS_VISUAL.offsetY : 0);
      const halfWidth = boss ? BOSS_VISUAL.width / 2 : Math.max(80, b.width * .84);
      const halfHeight = boss ? BOSS_VISUAL.height / 2 : Math.max(84, b.height * .8);
      return b.x + halfWidth + 20 >= 58 && b.x - halfWidth - 20 <= 662
        && y + halfHeight + 70 >= top && y - halfHeight - 70 <= bottom;
    });
    const blockedBullet = w.bullets.some(b => b.active && b.hostile
      && b.x + 14 >= 58 && b.x - 14 <= 662 && b.y + 18 >= top && b.y - 18 <= bottom);
    if (!blockedBody && !blockedBullet) return top;
  }
  return null;
}
