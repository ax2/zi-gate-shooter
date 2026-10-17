import type {World} from '../../src/core/world';
import type {AceRole} from '../../src/core/ace-duo';
import {clamp} from '../../src/core/config';
import {dangerTimeline,safeRoute} from '../../src/core/reachability';
import {progressionTarget} from './progression-driver';
/** Test-only normal aim and dodge inputs. Never injects bodies or damage. */
export function aceAim(w:World,first:AceRole){
 const target=w.bodies.filter(b=>b.active&&b.aceRole&&b.bountyRound===w.contract?.round).sort((a,b)=>Number(b.aceRole===first)-Number(a.aceRole===first))[0];
 if(!target)return progressionTarget(w);
 const x=w.player.x,next=x+clamp(target.x-x,-68,68),opts={phase:w.phase,phaseTime:w.phaseTime,reaction:0};
 return dangerTimeline(w.bodies,w.bullets,1.5,opts).some(rows=>rows.some(([lo,hi])=>Math.max(x,next)>=lo&&Math.min(x,next)<=hi))?(safeRoute(x,w.bodies,w.bullets,4,opts)?.[0]??x):next;
}
