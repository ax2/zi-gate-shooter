import type{Spawn}from'./director';import type{Body}from'./world';
export const MINELAYER={fromRound:4,durability:3,opening:.1,warning:.8,hold:3.2,muzzleX:40,muzzleY:24,vx:55,vy:180,radius:36}as const;
export function minelayerMuzzles(b:Pick<Body,'x'|'y'>){return[-1,1].map(side=>({x:b.x+side*MINELAYER.muzzleX,y:b.y+MINELAYER.muzzleY,vx:side*MINELAYER.vx,vy:MINELAYER.vy}));}
/** Replace one existing gun, never add a growing wave or follow player DPS. */
export function applyMinelayer(out:Spawn[],round:number){
 if(round<MINELAYER.fromRound)return;
 const sector=(round-1)%3,at=sector===0?44.5:35,kind=sector===0?'sniper':'armor';
 const slot=out.find(s=>s.at===at&&s.kind===kind&&!s.pattern);
 if(slot)Object.assign(slot,{kind:'armor',pattern:'minelayer',drop:true,dropY:sector===0?300:350,opening:MINELAYER.opening,dropLabel:sector===0?'布雷护航':'磁雷布设',dropDetail:'慢速宽体磁雷 · 提前拆炮或预留侧路 · 已发雷仍危险'});
}
