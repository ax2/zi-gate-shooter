import{C,clamp}from'./config';import type{Body}from'./world';
export const PICKUP_RECOVERY={range:112,speed:210,lead:240,gap:12}as const;
/** Move only the broken module. Collection still requires the original swept
 * circle, and alternatives keep disjoint approach spaces. Never changes y. */
export function pullPickup(b:Body,playerX:number,dt:number,others:readonly Body[]){
 if(!b.active||b.kind!=='pickup'||dt<=0||b.y<C.playerY-PICKUP_RECOVERY.lead||b.y>C.playerY+C.pickupRadius)return false;
 const dx=playerX-b.x;if(Math.abs(dx)>PICKUP_RECOVERY.range||Math.abs(dx)<1e-8)return false;
 let x=b.x+clamp(dx,-PICKUP_RECOVERY.speed*dt,PICKUP_RECOVERY.speed*dt);
 if(b.row)for(const other of others){
  if(other===b||!other.active||other.row!==b.row||!['pickup','crate'].includes(other.kind))continue;
  const clearance=C.pickupRadius+(other.kind==='pickup'?C.pickupRadius:other.width/2+C.playerRadius)+PICKUP_RECOVERY.gap;
  if(other.x>b.x)x=Math.min(x,Math.max(b.x,other.x-clearance));
  else if(other.x<b.x)x=Math.max(x,Math.min(b.x,other.x+clearance));
  else return false;
 }
 const moved=Math.abs(x-b.x)>1e-8;b.x=x;return moved;
}
