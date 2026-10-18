import type{Body}from'../core/world';import{SCISSOR,scissorProfile}from'../core/scissor-gun';
/** Articulated twin gun banks on the original elite hull, only local charge. */
export function scissorMount(c:CanvasRenderingContext2D,b:Body,weak:boolean){
 c.save();c.translate(b.x,b.y);
 c.fillStyle='#253943';c.strokeStyle='#9eacac';c.lineWidth=2;
 c.fillRect(-57,7,114,23);c.strokeRect(-57,7,114,23);
 for(const bank of[0,1]){
  const side=bank===0?-1:1,p=scissorProfile(b,bank),recoil=b.scissorFiredBank===bank?Math.max(0,1-(b.age-(b.scissorFiredAt??-99))/.16):0;
  const charging=(b.empRemaining??0)<=0&&(b.warning>0&&bank===0||b.scissorFiring&&bank===1),charge=charging?(bank===0?1-b.timer/SCISSOR.warning:1-b.timer/SCISSOR.spacing):0;
  c.save();c.translate(side*SCISSOR.portX,SCISSOR.pivot);c.fillStyle='#5b737c';c.beginPath();c.arc(0,0,17,0,Math.PI*2);c.fill();c.stroke();c.rotate(-Math.atan2(p.ux,p.uy));c.translate(0,-recoil*7);
  c.fillStyle='#182b35';c.fillRect(-11,-5,22,46);c.strokeRect(-11,-5,22,46);c.fillStyle='#9aafb0';c.fillRect(-8,0,4,31);c.fillStyle='#3f5765';c.fillRect(3,0,5,31);
  for(const y of[9,16,23]){c.fillStyle='#b3986c';c.fillRect(-12,y,24,3);}
  c.fillStyle='#0c1821';c.fillRect(-12,34,24,9);c.fillStyle=charging?'#ffad6d':'#706958';c.fillRect(-8,35,16,3);
  if(charge>0){c.fillStyle='rgba(255,150,85,'+(.35+charge*.6)+')';c.fillRect(-6,39,12,4);}
  if(recoil>0){c.globalCompositeOperation='lighter';c.globalAlpha=recoil;c.fillStyle='#ffab61';c.beginPath();c.moveTo(-10,43);c.lineTo(0,weak?58:67);c.lineTo(10,43);c.fill();c.fillStyle='#fff3d5';c.fillRect(-3,43,6,10);}
  c.restore();
 }
 c.restore();
}
