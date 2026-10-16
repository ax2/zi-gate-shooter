import {C} from '../core/config';
import {ION_ORB,type IonOrb,type IonSpear} from '../core/ion-storm';
/** Actual moving cores and past trails only; labels and enemy projectiles render above. */
export function ionEvolutionLight(c:CanvasRenderingContext2D,orbs:readonly IonOrb[],spears:readonly IonSpear[],weak:boolean){
 if(!orbs.length&&!spears.length)return;
 c.save();c.beginPath();c.rect(0,C.playerShotTop,C.width,C.playerY-C.playerShotTop);c.clip();
 for(const p of orbs){
  if(!p.active)continue;
  c.save();c.translate(p.x,p.y);
  c.globalAlpha=.28;c.strokeStyle='#8df6e4';c.lineWidth=1.5;
  for(let i=0;i<3;i++){const a=p.age*3+i*Math.PI*2/3;c.beginPath();c.arc(0,0,ION_ORB.radius,a,a+1);c.stroke();}
  c.globalAlpha=1;c.fillStyle='#112832';c.strokeStyle='#92c8d5';c.lineWidth=2;
  c.beginPath();c.moveTo(0,-28);c.lineTo(22,-13);c.lineTo(22,13);c.lineTo(0,28);c.lineTo(-22,13);c.lineTo(-22,-13);c.closePath();c.fill();c.stroke();
  c.globalCompositeOperation='lighter';
  const beat=1-Math.min(1,Math.abs(p.age-[.1,.45,.8][Math.max(0,p.pulses-1)])*7);
  c.strokeStyle='#88ffe4';c.lineWidth=weak?2:3;
  c.beginPath();c.arc(0,0,12+beat*4,p.age*9,p.age*9+Math.PI*1.7);c.stroke();
  c.fillStyle='#e1fff6';c.fillRect(-2,-4,4,8);
  if(!weak)for(let i=0;i<4;i++){
   const a=p.age*5+i*Math.PI/2;c.strokeStyle=i%2?'#aaa3ff':'#83f5ff';c.lineWidth=1.5;c.beginPath();
   c.moveTo(Math.cos(a)*19,Math.sin(a)*19);c.lineTo(Math.cos(a+.12)*29,Math.sin(a+.12)*29);c.lineTo(Math.cos(a)*35,Math.sin(a)*35);c.stroke();
  }
  c.restore();
 }
 for(const p of spears){
  if(!p.active)continue;
  c.save();c.translate(p.x,p.y);c.rotate(Math.atan2(p.vx,-p.vy));
  c.globalCompositeOperation='lighter';
  const trail=c.createLinearGradient(0,0,0,48);trail.addColorStop(0,'#a4bfff');trail.addColorStop(1,'#667cff00');
  c.strokeStyle=trail;c.lineWidth=weak?3:6;c.beginPath();c.moveTo(0,2);c.lineTo(0,48);c.stroke();
  c.fillStyle='#e3fcff';c.beginPath();c.moveTo(0,-17);c.lineTo(5,3);c.lineTo(0,10);c.lineTo(-5,3);c.closePath();c.fill();
  c.strokeStyle='#91c8ff';c.lineWidth=1.5;c.beginPath();c.moveTo(-8,10);c.lineTo(-5,-5);c.moveTo(8,10);c.lineTo(5,-5);c.stroke();c.restore();
 }
 c.restore();
}
