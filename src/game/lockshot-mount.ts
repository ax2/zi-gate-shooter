import type {Body} from '../core/world';
import {LOCKSHOT,lockshotProfile,lockshotLeaving} from '../core/lockshot';
/** Local swivel hardware and actual accepted-shot recoil; never a trajectory preview. */
export function lockshotMount(c:CanvasRenderingContext2D,b:Body,weak:boolean){
 const p=lockshotProfile(b);
 const elapsed=b.age-(b.lockFiredAt??-Infinity),recoil=elapsed>=0&&elapsed<.09?5*(1-elapsed/.09):0;
 const stowed=lockshotLeaving(b)&&recoil===0;
 c.save();c.translate(b.x,b.y+LOCKSHOT.pivot);c.rotate(stowed?0:-Math.atan2(p.ux,p.uy));
 c.fillStyle='#253a45';c.strokeStyle='#0c171f';c.lineWidth=3;c.beginPath();c.arc(0,0,13,0,Math.PI*2);c.fill();c.stroke();
 c.strokeStyle='#78919b';c.lineWidth=1.5;c.beginPath();c.arc(0,0,10,.2,Math.PI-0.2);c.stroke();
 c.fillStyle='#3d5360';c.strokeStyle='#0c171f';c.lineWidth=3;c.beginPath();c.moveTo(-9,1);c.lineTo(-7,31-recoil);c.lineTo(-10,39-recoil);c.lineTo(-6,48-recoil);c.lineTo(6,48-recoil);c.lineTo(10,39-recoil);c.lineTo(7,31-recoil);c.lineTo(9,1);c.closePath();c.fill();c.stroke();
 c.fillStyle='#6a8490';c.beginPath();c.moveTo(-7,3);c.lineTo(-4,5);c.lineTo(-3,30-recoil);c.lineTo(-7,35-recoil);c.closePath();c.fill();
 c.fillStyle='#b79663';for(const y of [10,18,26])c.fillRect(-2,y-recoil*.4,8,2);
 c.strokeStyle='#20323c';c.lineWidth=2;for(const x of [-5,5]){c.fillStyle='#bac9cb';c.beginPath();c.arc(x,37-recoil,2,0,Math.PI*2);c.fill();}
 c.fillStyle='#14212a';c.beginPath();c.arc(0,43-recoil,4,0,Math.PI*2);c.fill();
 if(b.warning>0){c.strokeStyle='#ffca89';c.lineWidth=weak?2:3;c.globalAlpha=.7;c.beginPath();c.arc(0,48,9+Math.sin(b.age*22)*2,0,Math.PI*2);c.stroke();}
 if(recoil>0){c.strokeStyle='#fff0cf';c.lineWidth=2;c.globalAlpha=recoil/5;for(let i=0;i<(weak?3:6);i++){const a=i*Math.PI/3;c.beginPath();c.moveTo(Math.cos(a)*5,48+Math.sin(a)*5);c.lineTo(Math.cos(a)*13,48+Math.sin(a)*13);c.stroke();}}
 c.restore();
}
