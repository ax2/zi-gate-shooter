import {C} from '../core/config';
import {MAGNETIC,type MagneticField} from '../core/magnetic-field';

/** Floor layer only: visible current field, never an enemy firing forecast. */
export function magneticLight(c:CanvasRenderingContext2D,f:MagneticField,weak:boolean){
 const fade=Math.min(1,f.age/.05,(MAGNETIC.life-f.age)/.25),r=f.radius??MAGNETIC.radius;
 const beat=Math.max(0,...MAGNETIC.pulses.map(t=>1-Math.abs(f.age-t)/.16));
 c.save();c.beginPath();c.rect(0,C.playerShotTop,C.width,C.playerY-C.playerShotTop);c.clip();c.translate(f.x,f.y);
 c.globalAlpha=fade*(weak?.42:.72);
 const glow=c.createRadialGradient(0,0,12,0,0,r);glow.addColorStop(0,'#74e5ff12');glow.addColorStop(.65,'#59bfff09');glow.addColorStop(1,'#59bfff00');c.fillStyle=glow;c.fillRect(-r,-r,r*2,r*2);
 c.lineWidth=weak?1.5:2;c.strokeStyle='#60b9cf';
 for(let i=0;i<6;i++){
  const a=i*Math.PI/3+.04*f.age;c.beginPath();c.arc(0,0,r-5,a+.06,a+.73);c.stroke();
  const x=Math.cos(a)*r,y=Math.sin(a)*r;c.save();c.translate(x,y);c.rotate(a);c.fillStyle='#d3c992';c.fillRect(-7,-2,10,4);c.restore();
 }
 c.strokeStyle='#b8f9ff';c.globalAlpha*=.45+.55*beat;
 const count=weak?3:6;
 for(let i=0;i<count;i++){
  const a=i*Math.PI*2/count+f.id*.7+f.age*.35;c.beginPath();
  for(let j=0;j<6;j++){const d=(25+j*21)*r/MAGNETIC.radius,angle=a+Math.sin(j*3+f.id+Math.floor(f.age*18))*.13;const x=Math.cos(angle)*d,y=Math.sin(angle)*d;j?c.lineTo(x,y):c.moveTo(x,y);}c.stroke();
 }
 c.beginPath();c.arc(0,0,22+beat*20,0,Math.PI*2);c.stroke();c.restore();
}
