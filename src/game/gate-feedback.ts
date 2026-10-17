import {BOSS_VISUAL} from './boss-destruction';
import type { Body,Bullet } from '../core/world';
import { gateValue } from '../core/rewards';

export const GATE_RECEIPT={reading:1.4,lifetime:6,limit:2,fade:.25} as const;
export interface GateReceipt {x:number;y:number;width:number;lines:string[];age:number;elapsed:number;visible:boolean}
export function gateReceiptBounds(r:GateReceipt){const y=r.y-r.age*18,height=r.lines.length>1?116:84;return {left:r.x-r.width/2+8,right:r.x+r.width/2-8,top:y-height/2,bottom:y+height/2,y,height};}
/** Actual occupied envelopes only: no forecasts, combat mutation or hidden grants. */
export function gateReceiptReadable(r:GateReceipt,bodies:readonly Body[],bullets:readonly Bullet[],blocker?:{top:number;bottom:number}){
 const box=gateReceiptBounds(r);
 if(blocker&&box.top<blocker.bottom&&box.bottom>blocker.top)return false;
 if(bodies.some(b=>b.active&&Math.abs(r.x-b.x)<(r.width+b.width*1.4+40)/2&&Math.abs(box.y-b.y-(b.kind==='boss'?BOSS_VISUAL.offsetY:0))<(box.height+b.height*1.55+140)/2))return false;
 return !bullets.some(b=>b.active&&b.hostile&&b.x+14>=box.left&&b.x-14<=box.right&&b.y+18>=box.top&&b.y-18<=box.bottom);
}

/** Read-only presentation snapshots; never grant rewards or retain World objects. */
export class GateFeedback {
  private live = new Map<number, { x: number; width: number; tier: number; until: number }>();
  readonly receipts: GateReceipt[] = [];
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
    if (this.receipts.length >= GATE_RECEIPT.limit) this.receipts.shift();
    this.receipts.push({ x, y: y - 180, width: width ?? gate?.width ?? 240, lines: text.split(' · '), age: 0,elapsed:0,visible:false });
  }
  advance(dt:number,canRead:(receipt:GateReceipt)=>boolean=()=>true){
    const step=Math.max(0,dt);let showing=false;
    for(const r of this.receipts){
      r.elapsed+=step;
      // Test the same drifted geometry that will actually be painted this frame.
      r.visible=!showing&&canRead({...r,age:r.age+step});
      if(r.visible){r.age+=step;showing=true;}
    }
    for(let i=this.receipts.length-1;i>=0;i--)if(this.receipts[i].age>=GATE_RECEIPT.reading||this.receipts[i].elapsed>=GATE_RECEIPT.lifetime)this.receipts.splice(i,1);
  }
  clear() { this.live.clear(); this.receipts.length = 0; }
}
