import{World}from'../src/core/world';import{RAKE}from'../src/core/rake-gun';import{safeRoute}from'../src/core/reachability';import{writeFileSync}from'node:fs';
const results=[];for(const spread of[55,40,30])for(const delay of[.1,.35]){
 Object.assign(RAKE,{warning:.9,spread});const cases=[];
 for(const round of[3,6,9,12,15])for(const start of[68,360,652]){
  const w=new World(1337,round);w.player.x=w.player.px=start;
  for(const x of[240,480]){const b=w.spawn('armor',x,350);b.pattern=round===3&&x===480?'fan':'rake';b.timer=x===480?delay:.1;b.dropGrace=.45;}
  const guard=w.spawn('guard',360,500);guard.timer=1.5;guard.dropGrace=.45;
  const okay=!!safeRoute(start,w.bodies,[],8,{reaction:.55,phase:'running'});cases.push({round,start,okay});
 }
 const r={warning:.9,firstSingleGun:240,spread,delay,passed:cases.filter(c=>c.okay).length,cases};results.push(r);console.log(JSON.stringify(r));
}writeFileSync('build/qa/Stage-226/formation-diagnosis.json',JSON.stringify(results,null,2));
