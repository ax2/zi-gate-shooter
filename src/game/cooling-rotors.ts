export const COOLING_ROTORS={radius:43,edge:49,turnRate:.72,rows:[.112,.497,.884]}as const;
/** Machinery lives under the combat layer, in the outer49px only. World time
 * makes pause/choices freeze both rotation and scrolling without a new clock. */
export function coolingRotors(c:CanvasRenderingContext2D,height:number,time:number,weak:boolean){
 for(const side of[0,1]){
  c.save();c.beginPath();c.rect(side?720-COOLING_ROTORS.edge:0,0,COOLING_ROTORS.edge,height);c.clip();
  for(const row of COOLING_ROTORS.rows){
   c.save();c.translate(side?720:0,row*height);c.rotate((side?-1:1)*time*COOLING_ROTORS.turnRate);
   c.fillStyle='#101b25';c.beginPath();c.arc(0,0,COOLING_ROTORS.radius,0,Math.PI*2);c.fill();
   const metal=c.createLinearGradient(-40,-40,40,40);metal.addColorStop(0,'#182b39');metal.addColorStop(.48,'#697d88');metal.addColorStop(.65,'#354c5c');metal.addColorStop(1,'#111f2b');c.fillStyle=metal;c.strokeStyle='#91a2a7';c.lineWidth=.7;
   const blades=weak?8:12;
   for(let i=0;i<blades;i++){c.save();c.rotate(i*Math.PI*2/blades);c.beginPath();c.moveTo(7,-4);c.quadraticCurveTo(18,-18,39,-11);c.lineTo(40,0);c.quadraticCurveTo(20,-6,9,6);c.closePath();c.fill();c.stroke();c.restore();}
   c.fillStyle='#1b2a34';c.strokeStyle='#71848e';c.lineWidth=2;c.beginPath();c.arc(0,0,9,0,Math.PI*2);c.fill();c.stroke();c.fillStyle='#b8c3c2';c.fillRect(-2,-2,4,4);c.restore();
  }c.restore();
 }
}
