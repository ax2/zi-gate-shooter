import{World}from'../src/core/world';import{runDefaultPressure}from'../tests/helpers/default-pressure-driver';import{C}from'../src/core/config';import{writeFileSync}from'node:fs';
const frames:any[]=[],crossings:any[]=[];
class Observe extends World{step(dt:number,target=this.player.x){
 const active=this.round===10&&this.roundTime>=18&&this.roundTime<=47;
 const gates=active?this.bodies.filter(b=>b.active&&b.kind==='gate').map(b=>({id:b.id,row:b.row,x:b.x,y:b.y,width:b.width,energy:b.energy})):[];
 const pickupsBefore=this.pickups,taken=this.gatesTaken;super.step(dt,target);
 if(active){for(const g of gates){const now=this.bodies.find(b=>b.id===g.id);if(g.y<C.playerY&&(!now||now.y>=C.playerY))crossings.push({time:this.time,roundTime:this.roundTime,gate:g,playerX:this.player.x,previousPlayerX:this.player.px,taken:this.gatesTaken>taken,pickupTaken:this.pickups>pickupsBefore});}
  if(Math.round(this.time*60)%6===0)frames.push({time:this.time,roundTime:this.roundTime,playerX:this.player.x,target,energy:this.growth.energy,mastery:this.growth.mastery,gates:this.bodies.filter(b=>b.active&&b.kind==='gate').map(b=>({id:b.id,x:b.x,y:b.y,energy:b.energy})),supplies:this.bodies.filter(b=>b.active&&['crate','pickup'].includes(b.kind)).map(b=>({kind:b.kind,x:b.x,y:b.y})),hostiles:this.bullets.filter(b=>b.active&&b.hostile).map(b=>({x:b.x,y:b.y,vx:b.vx,vy:b.vy}))});
 }
}}
const result=runDefaultPressure(Observe,'electric','safe',850,'auto',0);writeFileSync('build/qa/Stage-251/electric-gap-trace.json',JSON.stringify({method:'Read-only observations of normal earned, omniscient inputs. No World injection.',crossings,frames,resultSummary:{hp:result.hp,round:result.round,maxGrowthGap:result.maxGrowthGap}},null,2));console.log(JSON.stringify(crossings));
