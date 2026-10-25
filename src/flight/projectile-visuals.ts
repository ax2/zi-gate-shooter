import type{Bullet}from'./world';
import{magrailRules}from'./magrail';
// Measured visible body centers in the original512 cells. Atlas whole-cell
// resize224+padding16 is preserved; these are pivots, not erased/cropped pixels.
export const projectileArt=[
 {x:300.5,y:292},{x:255.5,y:296},{x:209,y:298.5},
 {x:297,y:233},{x:255,y:230},{x:210.5,y:233},
]as const;
export function projectilePose(b:Bullet){
 if(b.hostile||b.returning||b.life<=0||![b.x,b.y,b.vx,b.vy,b.age].every(Number.isFinite))return undefined;
 const speed=Math.hypot(b.vx,b.vy);if(!speed)return undefined;
 const frame=b.damageSource==='starhive'?4:b.damageSource==='plasmacore'?5:b.guidance?3:b.style==='rail'?2:b.style==='wing'?1:0;
 const railLevel=b.railLevel&&b.style==='rail'?Math.max(1,Math.min(5,b.railLevel)):0,burst=railLevel>0&&b.damageSource==='railburst';const size=railLevel?(burst?112:68+railLevel*6):[34,40,72,54,68,72][frame],color=frame===2?'#93eaff':frame===3||frame===5?'#c2a0ff':b.damageSource==='reversefield'?'#d5b0ff':'#ffc36f';
 return{frame,size,color,railLevel,burst,angle:Math.atan2(b.vy,b.vx)+Math.PI/2,
  // The streak is entirely BEHIND a real shot. It is never a future trajectory.
  tail:Math.min(railLevel?magrailRules.maxTrail:frame>=3?42:frame===2?52:29,speed*(railLevel?.06:.05)),
  pivotX:(16+projectileArt[frame].x*224/512)/256,
  pivotY:(16+projectileArt[frame].y*224/512)/256,
  pulse:Math.sin(b.age*30+b.id)*.5+.5};
}
