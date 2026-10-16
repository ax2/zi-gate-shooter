import type {Body} from './world';
/** Fixed authored pressure phrase, independent of player DPS and equipment. */
export const FIRE_CONTROL={at:55.5,hold:4.5,opening:.15,warning:1,boostedRecovery:1.1,recovery:3.2,durability:6,relayDurability:3,radius:320,gunX:440,gunYs:[550,350],relayX:210,relayY:450,screenX:620} as const;
export const fireControlHolding=(b:Pick<Body,'pattern'|'age'>)=>b.pattern==='fire-control'&&b.age<FIRE_CONTROL.hold;
export function fireControlSource(b:Body,bodies:readonly Body[]){
 if(!b.active||b.kind!=='armor'||b.pattern!=='fire-control'||b.controlGroup===undefined)return undefined;
 return bodies.find(s=>s.active&&s.hp>0&&s.kind==='conduit'&&s.pattern==='fire-control'&&s.controlGroup===b.controlGroup&&!(s.empRemaining??0)&&Math.hypot(s.x-b.x,s.y-b.y)<=FIRE_CONTROL.radius);
}
