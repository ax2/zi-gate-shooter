import type {Bullet} from './world';
/** Authored corridor phrase; no player-damage-based tuning. */
export const BANKSHOT={at:35,xs:[210,510],y:380,hold:3.2,opening:.1,warning:.65,recovery:1.4,durability:4,vx:220,vy:260,left:36,right:684} as const;
export const hasBankshot=(round:number)=>round>=4&&round%3===1;
export interface FlightSegment {x0:number;y0:number;x1:number;y1:number;from:number;to:number}

/** One physical reflection. Returned segments retain the original step's time. */
export function advanceProjectile(b:Pick<Bullet,'x'|'y'|'vx'|'vy'|'age'|'hostile'|'bankRemaining'>,dt:number):FlightSegment[]|undefined {
 const x=b.x,y=b.y;
 if(b.hostile&&b.bankRemaining&&b.vx!==0&&dt>0){
  const wall=b.vx<0?BANKSHOT.left:BANKSHOT.right,end=x+b.vx*dt;
  if(b.vx<0?end<=wall:end>=wall){
   const elapsed=Math.max(0,Math.min(dt,(wall-x)/b.vx)),t=elapsed/dt,hitY=y+b.vy*elapsed;
   b.vx=-b.vx;b.bankRemaining--;b.x=wall+b.vx*(dt-elapsed);b.y+=b.vy*dt;b.age+=dt;
   return [{x0:x,y0:y,x1:wall,y1:hitY,from:0,to:t},{x0:wall,y0:hitY,x1:b.x,y1:b.y,from:t,to:1}];
  }
 }
 b.x+=b.vx*dt;b.y+=b.vy*dt;b.age+=dt;return undefined;
}
