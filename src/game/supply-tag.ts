import{C,clamp}from'../core/config';import type{Body,Bullet}from'../core/world';
export interface SupplyTag {mode:'side'|'stamp';x:number;y:number;width:number;height:number}
/** Last-resort equipment copy yields to current enemy art, status and real shots.
 * No forecast, simulation mutation or transparent text laid over another hull. */
export function supplyTag(b:Body,bodies:readonly Body[],bullets:readonly Bullet[],hudBottom:number,playerX:number):SupplyTag{
 const blocked=(x:number,y:number)=>bodies.some(o=>o.active&&o.id!==b.id&&(
  o.kind in C.enemies?Math.abs(x-o.x)<71+Math.max(80,o.width*.84)&&y<o.y+Math.max(84,o.height*.68)&&y+60>o.y-Math.max(84,o.height*.68)-48
  :o.kind==='gate'?Math.abs(x-o.x)<71+o.width/2&&Math.abs(y+30-o.y)<114
  :(o.kind==='crate'||o.kind==='pickup')&&Math.abs(x-o.x)<71+Math.max(50,o.width/2)&&Math.abs(y+30-o.y)<30+Math.max(60,o.height/2)))
  ||bullets.some(p=>p.active&&p.hostile&&Math.abs(x-p.x)<71+(p.mine?44:16)&&Math.abs(y+30-p.y)<30+(p.mine?44:22))
  ||Math.abs(x-playerX)<171&&Math.abs(y+30-C.playerY)<140;
 const outer=b.x<360?-1:1;
 for(const direction of[outer,-outer]){const x=clamp(b.x+direction*166,84,636),y=b.y-30;
  if(y>=hudBottom&&y+60<=1256&&!blocked(x,y))return{mode:'side',x,y,width:142,height:60};}
 return{mode:'stamp',x:b.x,y:b.y-8,width:96,height:24};
}
