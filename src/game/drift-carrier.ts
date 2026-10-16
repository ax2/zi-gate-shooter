import {driftVelocity} from '../core/drift-supply';
/** Local mechanical sled behind the original crate; no future route guide. */
export function driftCarrier(c:CanvasRenderingContext2D,x:number,y:number,age:number,weak:boolean){
 c.save();c.translate(x,y);c.strokeStyle='#a1becb';c.lineWidth=2;c.fillStyle='#314654';
 for(const side of [-1,1]){
  c.beginPath();c.moveTo(side*43,27);c.lineTo(side*66,40);c.lineTo(side*69,57);c.lineTo(side*39,54);c.closePath();c.fill();c.stroke();
  c.fillStyle='#b4c8d0';c.fillRect(side*55-2,43,4,7);c.fillStyle='#314654';
 }
 const velocity=driftVelocity(age),power=Math.min(1,Math.abs(velocity)/175);
 if(power>.02){const side=-Math.sign(velocity);c.fillStyle='#9defff';c.globalAlpha=weak?.5:.85;
  c.beginPath();c.moveTo(side*66,43);c.lineTo(side*(72+(weak?9:18)*power),48);c.lineTo(side*66,52);c.closePath();c.fill();
  if(!weak){c.strokeStyle='#dcfaff';c.lineWidth=2;c.beginPath();c.moveTo(side*66,47);c.lineTo(side*(74+10*power),48);c.stroke();}
 }
 c.restore();
}
