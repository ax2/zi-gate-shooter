import {C} from '../core/config';
import type {Body} from '../core/world';

/** A display window only. Actual collection remains the World's swept circle. */
export function pickupSignal(b:Body){
 if(!b.active||b.kind!=='pickup')return null;
 return {collectible:b.y<=C.playerY+C.pickupRadius,urgent:b.y>=C.playerY-180};
}
/** Small hardware-like brackets around the existing original module sprite. */
export function pickupBeacon(c:CanvasRenderingContext2D,b:Body,time:number,weak:boolean){
 const signal=pickupSignal(b);if(!signal?.collectible)return;
 const pulse=.5+.5*Math.sin(time*8),r=signal.urgent?43:39;
 c.save();c.globalAlpha=weak?.7:signal.urgent?.8+pulse*.2:.65;
 c.strokeStyle=signal.urgent?'#ffd186':'#bba67d';c.lineWidth=signal.urgent?2.5:2;
 c.beginPath();for(const sx of[-1,1])for(const sy of[-1,1]){
  c.moveTo(b.x+sx*(r-11),b.y+sy*r);c.lineTo(b.x+sx*r,b.y+sy*r);c.lineTo(b.x+sx*r,b.y+sy*(r-11));
 }c.stroke();
 c.strokeStyle='#ffe1a2';c.lineWidth=1;c.globalAlpha=weak?.45:.45+pulse*.2;
 c.beginPath();c.arc(b.x,b.y,34,time*.8,time*.8+.65);c.arc(b.x,b.y,34,time*.8+Math.PI,time*.8+Math.PI+.65);c.stroke();c.restore();
}
