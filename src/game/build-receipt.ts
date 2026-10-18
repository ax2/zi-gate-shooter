import type { World } from '../core/world';
import { BOSS_VISUAL } from './boss-destruction';
import {pickupSignal} from './pickup-signal';

export type ReceiptPosition = 240 | 1180;
export interface ReadingArea {left:number;right:number;top:number;bottom:number}
/** Rendered envelopes and actual live projectiles, never future trajectories. */
export function combatPanelClear(w:World,area:ReadingArea){
  const blockedBody=w.bodies.some(b=>{
    if(!b.active)return false;
    if(b.kind==='pickup'){
      const signal=pickupSignal(b),x=Math.max(128,Math.min(592,b.x));
      const sprite=b.x+43>=area.left&&b.x-43<=area.right&&b.y+43>=area.top&&b.y-43<=area.bottom;
      // Passed drops retain only their dim module. Do not reserve a phantom
      // label after its collection window or when its sprite is off-screen.
      const label=signal?.collectible&&x+148>=area.left&&x-148<=area.right&&b.y-4>=area.top&&b.y-74<=area.bottom;
      return sprite||!!label;
    }
    const boss=b.kind==='boss',y=b.y+(boss?BOSS_VISUAL.offsetY:0);
    const halfWidth=boss?BOSS_VISUAL.width/2:Math.max(80,b.width*.84);
    const halfHeight=boss?BOSS_VISUAL.height/2:Math.max(84,b.height*.8);
    return b.x+halfWidth+20>=area.left&&b.x-halfWidth-20<=area.right
      &&y+halfHeight+70>=area.top&&y-halfHeight-70<=area.bottom;
  });
  return !blockedBody&&!w.bullets.some(b=>b.active&&b.hostile
    &&b.x+(b.mine?48:14)>=area.left&&b.x-(b.mine?48:14)<=area.right&&b.y+(b.mine?48:18)>=area.top&&b.y-(b.mine?48:18)<=area.bottom);
}
// These are rendered envelopes, including native labels, not collision boxes.
// No prediction or extra game state is involved in choosing a free reading area.
export function buildReceiptPosition(w: World, preferBottom = false): ReceiptPosition | null {
  const lockedBottom = w.bodies.some(b => b.active && (b.kind === 'boss' || b.bountyRound !== undefined));
  const candidates: ReceiptPosition[] = lockedBottom ? [1180] : preferBottom ? [1180, 240] : [240, 1180];
  for (const top of candidates) {
    const bottom = top + (top === 1180 ? 88 : 104);
    if (combatPanelClear(w,{left:58,right:662,top,bottom})) return top;
  }
  return null;
}
