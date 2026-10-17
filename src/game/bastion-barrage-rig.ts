import type{Body}from'../core/world';import{BASTION_BARRAGE,barrageVolley}from'../core/bastion-barrage';
/** Six machined cells on the original fortress hull, not a screen-space wall. */
export function bastionBarrageRig(c:CanvasRenderingContext2D,b:Body,weak:boolean){
 if(b.bossVariant!==2||b.attack!==3)return;
 const flash=Math.max(0,1-(b.age-(b.barrageFiredAt??-99))/.14),beat=flash>0||!b.warning&&!b.burst?(b.barrageFiredBeat??0):(b.barrageBeat??0);
 const remaining=(b.barrageBeat??0)===1?b.timer+BASTION_BARRAGE.spacing-BASTION_BARRAGE.echo:b.timer;
 const charge=b.warning>0?Math.max(0,Math.min(1,1-remaining/((b.barrageBeat??0)>0?BASTION_BARRAGE.spacing:1.35))):0;
 c.save();c.translate(b.x,b.y+56);c.fillStyle='#172733';c.strokeStyle='#8e9d9e';c.lineWidth=2;
 c.beginPath();c.moveTo(-170,-10);c.lineTo(170,-10);c.lineTo(178,0);c.lineTo(168,12);c.lineTo(-168,12);c.lineTo(-178,0);c.closePath();c.fill();c.stroke();
 c.strokeStyle='#405866';c.beginPath();c.moveTo(-163,-5);c.lineTo(163,-5);c.stroke();c.fillStyle='#baab86';for(const x of[-164,-116,-58,0,58,116,164])c.fillRect(x-1,-3,3,3);c.restore();
 for(const m of barrageVolley(b,beat)){
  const recoil=((b.barrageFiredPorts??0)&(1<<m.port))?flash:0;c.save();c.translate(m.x,m.y);c.rotate(-Math.atan2(m.vx,m.vy));
  const steel=c.createLinearGradient(-11,0,11,0);for(const[t,color]of[[0,'#0b1b26'],[.2,'#798d90'],[.42,'#bac5bc'],[.6,'#536b77'],[1,'#152937']]as const)steel.addColorStop(t,color);
  c.fillStyle=steel;c.strokeStyle='#0b1821';c.lineWidth=2;c.fillRect(-10,-39-recoil*5,20,39);c.strokeRect(-10,-39-recoil*5,20,39);
  c.fillStyle='#192f3c';for(const y of[-32,-24,-16])c.fillRect(-8,y-recoil*5,16,4);c.fillStyle='#b49464';c.fillRect(-12,-10,24,7);
  c.fillStyle='#10232e';c.fillRect(-7,-3,14,5);c.strokeStyle='#d8bd8a';c.lineWidth=1.5;c.beginPath();c.ellipse(0,0,9,3,0,0,Math.PI*2);c.stroke();
  if(charge){c.globalAlpha=.3+charge*.55;c.strokeStyle='#ffbe80';c.beginPath();c.arc(0,-10,10+charge*3,-b.age*3,Math.PI*1.45-b.age*3);c.stroke();}
  if(recoil){c.globalAlpha=recoil;c.fillStyle='#ffab64';c.beginPath();c.moveTo(-8,0);c.lineTo(-4,12);c.lineTo(0,weak?20:32);c.lineTo(4,12);c.lineTo(8,0);c.closePath();c.fill();c.fillStyle='#fff3cf';c.fillRect(-2,0,4,13);}
  c.restore();
 }
}
