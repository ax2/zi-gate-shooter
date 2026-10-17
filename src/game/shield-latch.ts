import type {Body} from '../core/world';
import {guardClosed} from '../core/behavior';
/** Riveted hinge racks belong to the existing shield machine; never an aim line. */
export function shieldLatch(c:CanvasRenderingContext2D,b:Pick<Body,'kind'|'burst'|'empRemaining'|'shieldTurn'>){
 if(b.shieldTurn===undefined)return;
 const closed=guardClosed(b),travel=closed?0:10;c.save();
 for(const side of [-1,1]){
  c.fillStyle='#07121b';c.fillRect(side*69-6,15,12,38);c.fillStyle='#425766';c.fillRect(side*69-4,17,8,34);
  c.fillStyle='#c2d2d8';c.fillRect(side*69-2,19+travel,4,15);c.fillStyle='#20323f';c.fillRect(side*69-5,30+travel,10,7);
  c.fillStyle=closed?'#66b6ca':'#ffd18a';c.fillRect(side*69-3,32+travel,6,2);
  c.fillStyle='#d9e5e9';for(const y of [18,50])c.fillRect(side*69-1,y,2,2);
 }
 c.fillStyle='#182936';c.fillRect(-12,65,24,12);c.strokeStyle='#7d929c';c.lineWidth=1;c.strokeRect(-12,65,24,12);c.fillStyle='#d2e2e8';
 for(let i=0;i<=b.shieldTurn;i++)c.fillRect(i*6-b.shieldTurn*3-1,68,2,6);c.restore();
}
