import type{Body}from'../core/world';import{BOOSTER}from'../core/booster';
/** Twin machined launch cells on the original detailed chassis. */
export function boosterMount(c:CanvasRenderingContext2D,b:Body,weak:boolean){
 const recoil=Math.max(0,1-(b.age-(b.boosterFiredAt??-99))/.18),charge=b.warning>0?Math.max(0,1-b.timer/BOOSTER.warning):0;
 c.save();c.translate(0,12);c.lineWidth=2;
 c.fillStyle='#25353c';c.strokeStyle='#87999d';c.beginPath();c.moveTo(-35,-17);c.lineTo(-25,-23);c.lineTo(25,-23);c.lineTo(35,-17);c.lineTo(35,18);c.lineTo(24,25);c.lineTo(-24,25);c.lineTo(-35,18);c.closePath();c.fill();c.stroke();
 c.fillStyle='#a98758';c.fillRect(-5,-17,10,35);c.fillStyle='#24333b';c.fillRect(-2,-12,4,25);
 for(const side of[-1,1]){
  const x=side*BOOSTER.muzzle,flash=side===b.boosterFiredSide?recoil:0;c.save();c.translate(x,-flash*5);
  const steel=c.createLinearGradient(-14,0,14,0);for(const[t,color]of[[0,'#101e27'],[.18,'#71838a'],[.36,'#b7c0b9'],[.49,'#667b80'],[.75,'#324953'],[1,'#111f27']]as const)steel.addColorStop(t,color);
  c.fillStyle=steel;c.strokeStyle='#101a22';c.beginPath();c.moveTo(-9,-29);c.lineTo(9,-29);c.lineTo(14,-23);c.lineTo(14,27);c.lineTo(10,37);c.lineTo(-10,37);c.lineTo(-14,27);c.lineTo(-14,-23);c.closePath();c.fill();c.stroke();
  c.strokeStyle='#c4c7b7';c.lineWidth=1;c.beginPath();c.moveTo(-9,-27);c.lineTo(-12,-21);c.lineTo(-12,24);c.stroke();
  c.fillStyle='#b29567';c.beginPath();c.ellipse(0,-23,12,5,0,0,Math.PI*2);c.fill();c.strokeStyle='#424b4b';c.stroke();
  c.fillStyle='#15242c';c.fillRect(-8,-17,16,4);c.fillStyle='#81918c';c.fillRect(-7,-17,13,1);
  for(const y of[-8,-1,6]){c.fillStyle='#101e26';c.fillRect(-8,y,16,3);c.fillStyle='#8b9b99';c.fillRect(-7,y+3,13,1);}
  c.fillStyle='#c49e60';c.fillRect(-13,16,26,7);c.fillStyle='#1b2a31';for(const v of[-10,0]){c.beginPath();c.moveTo(v,16);c.lineTo(v+5,16);c.lineTo(v+10,23);c.lineTo(v+5,23);c.closePath();c.fill();}
  c.fillStyle='#0b171e';c.strokeStyle='#c1b28e';c.lineWidth=2;c.beginPath();c.ellipse(0,34,13,7,0,0,Math.PI*2);c.fill();c.stroke();
  c.strokeStyle='#657b81';c.lineWidth=1;c.beginPath();c.ellipse(0,34,8,4,0,0,Math.PI*2);c.stroke();
  if(!b.boosterSpent){c.fillStyle='#aa7850';c.beginPath();c.ellipse(0,34,4,2,0,0,Math.PI*2);c.fill();}
  if(!weak){c.strokeStyle='#384d55';c.beginPath();c.moveTo(11,-15);c.quadraticCurveTo(17,-3,11,11);c.stroke();c.fillStyle='#d2cfb8';for(const y of[-21,12])c.fillRect(-10,y,2,2);}
  if(charge){c.fillStyle=`rgba(255,145,77,${.35+charge*.55})`;c.fillRect(-3,26,6,8);}
  if(flash){c.globalAlpha=flash;c.fillStyle='#ffac64';c.beginPath();c.moveTo(-7,37);c.lineTo(0,weak?50:62);c.lineTo(7,37);c.fill();c.fillStyle='#fff0c8';c.fillRect(-2,37,4,10);}
  c.restore();
 }
 c.fillStyle='#b6c2c0';for(const x of[-32,32])for(const y of[-17,17])c.fillRect(x-1,y-1,2,2);
 c.restore();
}
