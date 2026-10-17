import type{Body}from'../core/world';
import{wingShearVolley}from'../core/wing-shear';
/** Local machined barrels and accepted-shot recoil; never draw a future path. */
export function wingShearRig(c:CanvasRenderingContext2D,b:Body,weak:boolean){
 if(b.bossVariant!==1||b.attack!==2)return;
 const flash=Math.max(0,1-(b.age-(b.wingFiredAt??-99))/.12),charge=b.warning>0?Math.max(0,1-b.timer/1.35):0;
 const beat=flash>0?(b.wingFiredBeat??0):(b.wingBeat??0);
 for(const m of wingShearVolley(b,beat)){
  c.save();c.translate(m.x,m.y);c.rotate(-Math.atan2(m.vx,m.vy));
  const steel=c.createLinearGradient(-10,0,10,0);for(const[t,color]of[[0,'#101e29'],[.25,'#718c98'],[.45,'#bdd3d5'],[.65,'#435f6f'],[1,'#102332']]as const)steel.addColorStop(t,color);
  c.fillStyle=steel;c.strokeStyle='#0c1a24';c.lineWidth=2;c.fillRect(-9,-38-flash*4,18,38);c.strokeRect(-9,-38-flash*4,18,38);
  c.fillStyle='#142c3c';for(const y of[-31,-23,-15])c.fillRect(-7,y-flash*4,14,4);
  c.fillStyle='#9bb6bf';c.fillRect(-10,-10,20,6);c.fillStyle='#123446';c.fillRect(-6,-3,12,5);
  c.strokeStyle='#92def0';c.lineWidth=1.5;c.beginPath();c.ellipse(0,0,8,3,0,0,Math.PI*2);c.stroke();
  if(charge>0){c.strokeStyle='#88edff';c.globalAlpha=.4+charge*.5;c.beginPath();c.arc(0,-10,10+charge*4,-b.age*3,Math.PI*1.4-b.age*3);c.stroke();}
  if(flash>0){c.globalAlpha=flash;c.fillStyle='#80ddff';c.beginPath();c.moveTo(-7,0);c.lineTo(-3,10);c.lineTo(0,weak?19:28);c.lineTo(3,10);c.lineTo(7,0);c.closePath();c.fill();c.fillStyle='#f1fcff';c.fillRect(-2,0,4,12);}
  c.restore();
 }
}
