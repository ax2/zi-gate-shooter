import{observedNoFireRoute}from'../tests/helpers/observed-route-driver';import{safeRoute,dangerTimeline}from'../src/core/reachability';import{C}from'../src/core/config';import{writeFileSync}from'node:fs';
const results=[];for(const[round,plan]of[[8,0],[9,0],[15,1]]as const){
 const result=observedNoFireRoute(round,plan,68,round%2?1337:9001,(w,known)=>{
  const timeline=dangerTimeline(w.bodies.filter(b=>known.has(b.id)),w.bullets,8);
  const grids=[25,49,97].map(size=>{const positions=[w.player.x,...Array.from({length:size},(_,i)=>C.minX+(C.maxX-C.minX)*i/(size-1))];let reached=[w.player.x],failedAt:number|null=null;for(let slab=0;slab<timeline.length;slab++){reached=positions.filter(x=>reached.some(previous=>Math.abs(previous-x)<=C.moveSpeed*.1+1e-8&&!timeline[slab].some(([lo,hi])=>Math.max(previous,x)>=lo&&Math.min(previous,x)<=hi)));if(!reached.length){failedAt=(slab+1)*.1;break;}}return{size,failedAt,found:reached.length>0};});
  const details={round,plan,time:w.time,x:w.player.x,known:[...known],bodies:w.bodies,bullets:w.bullets,grids,allBodiesRoute:!!safeRoute(w.player.x,w.bodies,w.bullets,8,{reaction:0})};
  writeFileSync(`build/qa/Stage-222/failure-${round}-${plan}.json`,JSON.stringify(details,null,2));console.log(JSON.stringify({round,plan,time:w.time,x:w.player.x,grids,all:details.allBodiesRoute,bodies:w.bodies.map(b=>({k:b.kind,p:b.pattern,x:b.x,y:b.y,age:b.age,known:known.has(b.id)})),bullets:w.bullets.filter(b=>b.hostile).map(b=>({x:b.x,y:b.y,vx:b.vx,vy:b.vy,src:b.sourceId}))}));
 });results.push(result);
}writeFileSync('build/qa/Stage-222/route-diagnosis.json',JSON.stringify(results,null,2));
