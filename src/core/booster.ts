import type{Bullet}from'./world';import type{FlightSegment}from'./bankshot';
export const BOOSTER={opening:.5,warning:.9,spacing:.22,hold:2.5,delay:.75,factor:4,vx:50,vy:180,muzzle:20}as const;
/** Fixed launch course. Acceleration changes speed, never follows the player. */
export function advanceBooster(b:Pick<Bullet,'x'|'y'|'vx'|'vy'|'age'|'boostAfter'|'boostFactor'>,dt:number):FlightSegment[]|undefined{
 const x=b.x,y=b.y,delay=Math.max(0,(b.boostAfter??Infinity)-b.age);
 if(dt>0&&delay<=dt){
  const t=delay/dt,hx=x+b.vx*delay,hy=y+b.vy*delay;
  b.vx*=b.boostFactor??BOOSTER.factor;b.vy*=b.boostFactor??BOOSTER.factor;b.boostAfter=undefined;
  b.x=hx+b.vx*(dt-delay);b.y=hy+b.vy*(dt-delay);b.age+=dt;
  return[{x0:x,y0:y,x1:hx,y1:hy,from:0,to:t},{x0:hx,y0:hy,x1:b.x,y1:b.y,from:t,to:1}];
 }
 b.x+=b.vx*dt;b.y+=b.vy*dt;b.age+=dt;return undefined;
}
