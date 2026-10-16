import {C,clamp} from '../../src/core/config';import type {World} from '../../src/core/world';import type {BuildProof} from '../../src/core/build-proof';
import {dangerTimeline,safeRoute} from '../../src/core/reachability';import {progressionTarget} from './progression-driver';
/** Test-only aiming policy: expose each mechanism without editing combat or rewards. */
export function proofTarget(w:World,proof:BuildProof){
 // Deliberately acquire the combination's missing component. The nearest-box
 // policy can repeatedly choose refits instead of ever taking a blast cannon.
 if(proof==='fracture'&&!w.fractureUnlocked()){
  const missing=(['pierce','blast'] as const).filter(kind=>!w.activeWeapons.includes(kind)||w.weaponStage(kind)<2);
  const offered=missing.find(kind=>w.bodies.some(b=>b.active&&(b.kind==='crate'||b.kind==='pickup')&&b.weaponKind===kind));
  if(offered)return progressionTarget(w,offered);
 }
 const targets=w.bodies.filter(b=>b.active&&b.proofTarget&&b.y>=C.playerShotTop&&b.y<C.playerY);
 if(w.contract?.status!=='active'||!targets.length)return progressionTarget(w);
 const aim=proof==='prism'?(targets.find(b=>b.kind==='armor')??targets[0]):(targets.find(b=>b.kind==='elite')??targets[0]);
 const offset=42+138*(C.playerY-100-aim.y)/(C.playerY-100-C.playerShotTop);
 const goal=proof==='prism'?aim.x+(aim.x<360?offset:-offset):aim.x;
 const opts={phase:w.phase,phaseTime:w.phaseTime,reaction:0},next=clamp(w.player.x+clamp(goal-w.player.x,-68,68),C.minX,C.maxX);
 const blocked=dangerTimeline(w.bodies,w.bullets,1.5,opts).some(rows=>rows.some(([lo,hi])=>Math.max(w.player.x,next)>=lo&&Math.min(w.player.x,next)<=hi));
 return blocked?(safeRoute(w.player.x,w.bodies,w.bullets,4,opts)?.[0]??w.player.x):next;
}
