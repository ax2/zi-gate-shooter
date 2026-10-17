import{World}from'../src/core/world';import{C}from'../src/core/config';import{runDefaultPressure}from'../tests/helpers/default-pressure-driver';import{writeFileSync}from'node:fs';
const base='../Stage-235/baseline.mjs',current='./baseline.mjs',Old=(await import(base)).World,Stage235=(await import(current)).World;
function trace(Runtime:typeof World,route:'ballistic'|'electric'|'optical'){
 const crossings:any[]=[],admissions:any[]=[],consumed:any[]=[];
 class Traced extends Runtime{
  step(dt:number,targetX=this.player.x){
   const rows=new Map<number,any[]>();for(const b of this.bodies)if(b.active&&b.kind==='gate'){const a=rows.get(b.row)??[];a.push(b);rows.set(b.row,a);}
   const previous={round:this.round,index:this.scheduleIndex,taken:this.gatesTaken,player:this.player.x,growth:{...this.growth},time:this.time,roundTime:this.roundTime};
   const plans=this.scheduled.slice(previous.index);super.step(dt,targetX);
   for(const[row,units]of rows){if(units[0].y>=C.playerY&&units[0].py<C.playerY){const t=(C.playerY-units[0].py)/(units[0].y-units[0].py),x=this.player.px+(this.player.x-this.player.px)*t;
    crossings.push({round:previous.round,row,time:this.time,roundTime:this.roundTime,taken:this.gatesTaken>previous.taken,x,fromX:previous.player,targetX,growthBefore:previous.growth,growthAfter:{...this.growth},gates:units.map(g=>({x:g.x,width:g.width,energy:g.energy,kind:g.rewardKind})),hazards:this.bodies.filter(b=>b.active&&b.kind in C.enemies&&b.y>500).map(b=>({kind:b.kind,pattern:b.pattern,x:b.x,y:b.y})),hostile:this.bullets.filter(b=>b.hostile).map(b=>({x:b.x,y:b.y,vx:b.vx,vy:b.vy,source:b.sourceId}))});
   }}
   const oldRows=new Set(rows.keys());for(const b of this.bodies)if(b.active&&b.kind==='gate'&&!oldRows.has(b.row)){oldRows.add(b.row);admissions.push({round:this.round,row:b.row,time:this.time,roundTime:this.roundTime,energy:this.growth.energy,overload:this.growth.overload});}
   if(this.round===previous.round)for(const s of plans.slice(0,this.scheduleIndex-previous.index))if(s.kind==='gates')consumed.push({round:this.round,at:s.at,pair:s.pair??false,time:this.time,roundTime:this.roundTime,energy:previous.growth.energy,overload:previous.growth.overload});
  }
 }
 const result=runDefaultPressure(Traced,route,'safe',1200);return{result,crossings,admissions,consumed};
}
const out=[];for(const route of['ballistic','electric','optical']as const){const before=trace(Old,route),after=trace(Stage235,route);out.push({route,before,after});console.log(JSON.stringify({route,before:{gates:before.result.gates,rows:before.admissions.length,crossings:before.crossings.length,missed:before.crossings.filter(g=>!g.taken).length,consumed:before.consumed.length},after:{gates:after.result.gates,rows:after.admissions.length,crossings:after.crossings.length,missed:after.crossings.filter(g=>!g.taken).length,consumed:after.consumed.length},missed:after.crossings.filter(g=>!g.taken).map(g=>({round:g.round,at:g.roundTime,x:g.x,gates:g.gates}))}));}
writeFileSync('build/qa/Stage-236/gate-opportunities-recheck.json',JSON.stringify({method:'Normally earned safe progression, seed1337, virtual60Hz. Observational step wrapper; gates only count actual World crossing. Frozen Stage234 vs frozen Stage235, before the Stage236 contact change.',out}));
