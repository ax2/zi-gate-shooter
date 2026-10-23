import{segmentDistance,type FlightWorld}from'./world';
/** Current physical danger/ships only; does not predict future firing paths. */
export function combatOverlayClear(w:FlightWorld,x:number,y:number,width:number,height:number){
 const overlaps=(px:number,py:number,r:number)=>px+r>=x&&px-r<=x+width&&py+r>=y&&py-r<=y+height;
 if(w.player.hp>0&&overlaps(w.player.x,w.player.y,55))return false;
 if(w.enemies.some(e=>e.hp>0&&overlaps(e.x,e.y,Math.max(52,e.r*1.8))))return false;
 if(w.bullets.some(b=>b.hostile&&b.life>0&&b.age<b.life&&overlaps(b.x,b.y,b.r+8)))return false;
 const cx=x+width/2,cy=y+height/2,radius=Math.hypot(width/2,height/2);
 return !w.effects.some(e=>e.hostile&&e.age<e.life&&e.points?.some((p,i,points)=>i>0&&segmentDistance(cx,cy,points[i-1].x,points[i-1].y,p.x,p.y)<=radius+e.size/2));
}
