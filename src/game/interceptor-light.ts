import type {Body} from '../core/world';
import {INTERCEPTOR,interceptorMuzzles} from '../core/interceptor';
/** Energy stays on the real gun mounts; no forecast lines or pooled particles. */
export function interceptorLight(c:CanvasRenderingContext2D,b:Body,weak:boolean){
 if((b.empRemaining??0)>0)return;
 const elapsed=b.age-(b.interceptFiredAt??-10),flash=elapsed>=0&&elapsed<.16;
 const charging=b.warning>0;
 if(!charging&&!flash)return;
 const beat=flash?(b.interceptFireBeat??0):b.burst;
 const mounts=interceptorMuzzles({...b,burst:beat});
 const progress=flash?1-elapsed/.16:1-Math.max(0,b.timer)/(beat?INTERCEPTOR.coreWarning:INTERCEPTOR.wingWarning);
 c.save();c.globalCompositeOperation='lighter';
 for(const m of mounts){
  const radius=flash?12+progress*10:7+progress*6;
  if(!weak){c.globalAlpha=flash?.4*progress:.12+progress*.15;c.fillStyle=beat?'#ff705d':'#ffc56c';c.beginPath();c.arc(m.x,m.y,radius+7,0,Math.PI*2);c.fill();}
  c.globalAlpha=flash?progress:.6+progress*.3;c.strokeStyle=beat?'#ff947b':'#ffe1a7';c.lineWidth=2;c.beginPath();c.arc(m.x,m.y,radius,0,Math.PI*2);c.stroke();
  c.fillStyle='#fff3d3';c.beginPath();c.arc(m.x,m.y,flash?4:2+progress*2,0,Math.PI*2);c.fill();
 }
 c.restore();
}
