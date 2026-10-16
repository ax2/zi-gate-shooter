import type {Body} from '../core/world';
import {counterMuzzles,counterCharge} from '../core/boss-counter';
/** Heat follows the original cannon housings; no future lanes or screen wash. */
export function bossHeatLight(c:CanvasRenderingContext2D,b:Body,weak:boolean){
 c.save();c.globalCompositeOperation='lighter';
 const heat=.65+.15*Math.sin(b.age*13),charging=b.attack===4&&b.warning>0;
 const charge=counterCharge(b);
 const flash=b.counterShotAge===undefined?0:Math.max(0,1-(b.age-b.counterShotAge)/.16);
 const color=b.bossVariant===1?'#9aefff':'#ffc284',coreY=b.y+(b.bossVariant===1?-14:b.bossVariant===2?-52:-2);
 c.globalAlpha=weak?.55:.8;c.strokeStyle=color;c.lineWidth=2;
 c.beginPath();c.arc(b.x,coreY,17,0,Math.PI*2);c.stroke();
 for(const muzzle of counterMuzzles(b)){
  // Four narrow vent ribs give the cannon a heated mechanical silhouette.
  c.strokeStyle=color;c.lineWidth=2;c.globalAlpha=heat*(weak?.45:.75);
  for(let i=0;i<4;i++){c.beginPath();c.moveTo(muzzle.x-9,muzzle.y-37+i*6);c.lineTo(muzzle.x+9,muzzle.y-39+i*6);c.stroke();}
  if(charging||flash>0){
   c.globalAlpha=Math.min(1,.3+charge*.65+flash);c.strokeStyle=color;c.lineWidth=2;
   c.beginPath();c.arc(muzzle.x,muzzle.y,8+charge*8+flash*9,-b.age*4,Math.PI*1.6-b.age*4);c.stroke();
   c.fillStyle='#fff4d8';c.beginPath();c.arc(muzzle.x,muzzle.y,2+charge*2+flash*3,0,Math.PI*2);c.fill();
  }
  if(!weak){
   c.globalAlpha=.25+charge*.2+flash*.3;c.strokeStyle=color;c.lineWidth=1.5;
   for(let i=0;i<3;i++){
    const t=(b.age*2+i/3)%1,side=i%2?1:-1;
    c.beginPath();c.moveTo(muzzle.x+side*12,muzzle.y-28-t*8);c.lineTo(muzzle.x+side*(15+t*12),muzzle.y-36-t*23);c.stroke();
   }
  }
 }
 c.restore();
}
