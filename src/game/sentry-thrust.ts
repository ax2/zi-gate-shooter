/** Short local exhaust from the existing rotor pods, not an aiming indicator. */
export function sentryThrust(c:CanvasRenderingContext2D,direction:number,age:number,weak:boolean){
  if(!direction)return;c.save();c.globalCompositeOperation='lighter';
  const x=-direction*56,tail=x-direction*(20+Math.sin(age*45)*4);
  c.globalAlpha=.5;c.fillStyle='#83dcff';c.beginPath();c.moveTo(x,-12);c.quadraticCurveTo(tail,-4,tail-direction*8,0);c.quadraticCurveTo(tail,4,x,12);c.closePath();c.fill();
  c.globalAlpha=.85;c.strokeStyle='#e0f9ff';c.lineWidth=2;
  for(let i=0;i<(weak?1:3);i++){const y=(i-1)*6;c.beginPath();c.moveTo(x,y);c.lineTo(tail,y+Math.sin(age*32+i)*2);c.stroke();}
  c.restore();
}
