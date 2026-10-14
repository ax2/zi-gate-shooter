import type { Body } from '../core/world';
import { gateValue } from '../core/rewards';

/** Read-only presentation snapshots; never grant rewards or retain World objects. */
export class GateFeedback {
  private live = new Map<number, { x: number; width: number; tier: number; until: number }>();
  readonly receipts: Array<{ x: number; y: number; width: number; lines: string[]; age: number }> = [];
  sync(bodies: readonly Body[], time: number) {
    const next = new Map<number, { x: number; width: number; tier: number; until: number }>();
    for (const b of bodies) if (b.kind === 'gate' && b.active) {
      const previous = this.live.get(b.id), tier = gateValue(b.energy, b.rewardKind);
      next.set(b.id, { x: b.x, width: b.width, tier, until: previous && tier > previous.tier ? time + 0.12 : previous?.until ?? 0 });
    }
    this.live = next;
  }
  pulse(id: number, time: number) { return Math.max(0, Math.min(1, ((this.live.get(id)?.until ?? 0) - time) / 0.12)); }
  claim(x: number, y: number, text: string, width?: number) {
    const gate = [...this.live.values()].find(g => Math.abs(g.x - x) < 1);
    if (this.receipts.length >= 2) this.receipts.shift();
    this.receipts.push({ x, y: y - 180, width: width ?? gate?.width ?? 240, lines: text.split(' · '), age: 0 });
  }
  advance(dt: number) {
    for (const r of this.receipts) r.age += dt;
    for (let i = this.receipts.length - 1; i >= 0; i--) if (this.receipts[i].age >= 0.8) this.receipts.splice(i, 1);
  }
  clear() { this.live.clear(); this.receipts.length = 0; }
}
