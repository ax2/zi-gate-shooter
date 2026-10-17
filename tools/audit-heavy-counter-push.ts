import {World} from '../src/core/world';
import {runDefaultPressure} from '../tests/helpers/default-pressure-driver';
import {observedNoFireRoute} from '../tests/helpers/observed-route-driver';
import {writeFileSync,readFileSync} from 'node:fs';
import{safeRoute}from'../src/core/reachability';
const path='./baseline.mjs',Old=(await import(path)).World;
const plan=Number(process.env.COUNTER_PUSH_PLAN??0)as 0|1|2;
const mode=process.env.COUNTER_PUSH_MODE??'normal',seconds=Number(process.env.COUNTER_PUSH_SECONDS??300);
if(mode==='refine'){
 const failed=JSON.parse(readFileSync('build/qa/Stage-241/routes.json','utf8')).filter((r:any)=>r.failureTime!==null),pairs=[];
 for(const c of failed){const before=observedNoFireRoute(c.round,c.plan,c.start,c.seed,undefined,Old),after=observedNoFireRoute(c.round,c.plan,c.start,c.seed,undefined,World,97);pairs.push({coarse:c,before,after});console.log(JSON.stringify({before,after}));}
 writeFileSync('build/qa/Stage-241/routes-refined.json',JSON.stringify({pairs},null,2));
}
else if(mode==='gaps'){
 const measurements=[];
 for(const [name,Runtime]of [['before',Old],['after',World]] as const){
  const intervals:any[]=[],byRound=new Map<number,any>(),middle=new Map<number,any>();let empty:any=null;
  class Observe extends Runtime{step(dt:number,target:number){super.step(dt,target);if(this.phase!=='running'){if(empty){intervals.push({...empty,end:this.roundTime,duration:this.roundTime-empty.start});empty=null;}return;}
   const n=this.bodies.filter(b=>b.active&&b.kind in {drone:1,charger:1,armor:1,sniper:1,guard:1,elite:1,conduit:1}&&b.y>=0&&b.y<=1280).length;
   if(empty&&empty.round!==this.round)empty=null;
   if(!n&&!empty)empty={round:this.round,start:this.roundTime};if(n&&empty){intervals.push({...empty,end:this.roundTime,duration:this.roundTime-empty.start});empty=null;}
   if(this.round%3===0&&this.roundTime>=27&&this.roundTime<=33){const r=middle.get(this.round)??{frames:0,sum:0,empty:0,peak:0};r.frames++;r.sum+=n;r.empty+=Number(n===0);r.peak=Math.max(r.peak,n);middle.set(this.round,r);}
   if(this.roundTime<=10){const r=byRound.get(this.round)??{frames:0,sum:0,empty:0,first:null};r.frames++;r.sum+=n;r.empty+=Number(n===0);if(n&&r.first===null)r.first=this.roundTime;byRound.set(this.round,r);}
  }}
  const run=runDefaultPressure(Observe as any,'electric','safe',300,'auto',plan);measurements.push({name,summary:{hp:run.hp,time:run.time},middle:[...middle].map(([round,r])=>({round,seconds:r.frames/60,mean:r.sum/r.frames,empty:r.empty/r.frames,peak:r.peak})),opening:[...byRound].map(([round,r])=>({round,mean:r.sum/r.frames,empty:r.empty/r.frames,first:r.first})),longest:intervals.sort((a,b)=>b.duration-a.duration).slice(0,12)});
 }
 writeFileSync('build/qa/Stage-241/gaps.json',JSON.stringify(measurements,null,2));console.log(JSON.stringify(measurements));
}else if(mode==='routes'){
 const routes=[];for(const r of [1,2,3,4,5,6,7,8,9,12])for(const plan of [0,1,2] as const)for(const x of [68,360,652]){
  const a=observedNoFireRoute(r,plan,x,r%2?1337:9001,(w,known)=>writeFileSync('build/qa/Stage-241/failed-'+r+'-'+plan+'-'+x+'.json',JSON.stringify({time:w.time,player:w.player,known:[...known],bodies:w.bodies,bullets:w.bullets.filter(b=>b.hostile),routes:[2,4,8].map(h=>({h,route:safeRoute(w.player.x,w.bodies.filter(b=>known.has(b.id)),w.bullets,h,{phase:w.phase,phaseTime:w.phaseTime,gridPoints:97})}))},null,2)));routes.push(a);if(a.failureTime!==null||a.hp!==3||a.phase!=='boss-entry')console.log(JSON.stringify(a));
 }
 writeFileSync('build/qa/Stage-241/routes.json',JSON.stringify(routes,null,2));console.log(JSON.stringify({routes:routes.length,failed:routes.filter(a=>a.failureTime!==null||a.hp!==3||a.phase!=='boss-entry').length}));
}else{
 const runs=[];for(const route of ['ballistic','electric','optical'] as const)for(const policy of (seconds>300?['safe']:['safe','safe-then-aim']) as ('safe'|'safe-then-aim')[]){
  const before=runDefaultPressure(Old,route,policy,seconds,'auto',plan),after=runDefaultPressure(World,route,policy,seconds,'auto',plan);runs.push({before,after});
  console.log(JSON.stringify({route,policy,before:{hp:before.hp,time:before.time,round:before.round},after:{hp:after.hp,time:after.time,round:after.round,damage:after.damage},density:after.chapters.slice(0,3).map((c,i)=>({round:c.round,before:before.chapters[i]?.meanVisible,after:c.meanVisible,emptyBefore:before.chapters[i]?.emptyFraction,emptyAfter:c.emptyFraction}))}));
 }
 writeFileSync('build/qa/Stage-241/normal-'+seconds+(plan?'-plan'+plan:'')+'.json',JSON.stringify({seconds,plan,seed:1337,method:'Normally earned progression and actual contacts; same input policy but state-dependent inputs. Safe is omniscient zero-reaction. Safe-then-aim earns the same first chapter then ignores dangers when aiming at targets from chapter two. Virtual60Hz, not human or device performance.',runs},null,2));
}
