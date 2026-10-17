import{observedNoFireRoute}from'../tests/helpers/observed-route-driver';import{safeRoute,dangerTimeline}from'../src/core/reachability';import{C}from'../src/core/config';import{writeFileSync}from'node:fs';
const result=observedNoFireRoute(5,0,68,9001,(w,known)=>{
 const bodies=w.bodies.filter(b=>known.has(b.id)),timeline=dangerTimeline(bodies,w.bullets,8);
 const grids=[25,49,97,193].map(size=>{
  const positions=[w.player.x,...Array.from({length:size},(_,i)=>C.minX+(C.maxX-C.minX)*i/(size-1))];let reached=[w.player.x],failedAt:number|null=null;
  for(let slab=0;slab<timeline.length;slab++){reached=positions.filter(x=>reached.some(previous=>Math.abs(previous-x)<=C.moveSpeed*.1+1e-8&&!timeline[slab].some(([lo,hi])=>Math.max(previous,x)>=lo&&Math.min(previous,x)<=hi)));if(!reached.length){failedAt=(slab+1)*.1;break;}}
  return{size,failedAt,found:reached.length>0};
 });
 writeFileSync('build/qa/Stage-218/mirror-failure.json',JSON.stringify({time:w.time,x:w.player.x,known:[...known],unseen:w.bodies.filter(b=>!known.has(b.id)),bodies:w.bodies,bullets:w.bullets,allBodiesRoute:!!safeRoute(w.player.x,w.bodies,w.bullets,8,{reaction:0}),grids},null,2));console.log(JSON.stringify({time:w.time,x:w.player.x,grids}));
});

writeFileSync('build/qa/Stage-218/mirror-current-result.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
