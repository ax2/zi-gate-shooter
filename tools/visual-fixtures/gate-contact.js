import{CanvasRuntime as CurrentRuntime}from'../../src/game/canvas-runtime.ts';import{CanvasRuntime as OldRuntime}from'../../build/qa/Stage-236/baseline.mjs';import{createBrowserControls}from'../../src/game/browser-controls.ts';import{browserImage}from'../../src/game/browser-image.ts';import{defaults}from'../../src/ui/storage.ts';import{progressionTarget}from'../../tests/helpers/progression-driver.ts';
const canvas=document.querySelector('canvas'),advance=document.querySelector('#advance'),status=document.querySelector('#status');let stored=defaults(),clock=0,next=()=>{},frame=0,running=false,stage='menu';stored.openingWeapon='scatter';stored.settings.sound=false;stored.settings.shake=false;const history=[];let crossing=null,beforeImage=null,beforePhysical=null,beforeImageTime=null,lastRenderedTime=0;const version=new URL(location.href).searchParams.get('version')==='old'?'old':'new';const Runtime=version==='old'?OldRuntime:CurrentRuntime;
const controls=createBrowserControls(canvas,name=>{if(!runtime.activateControl(name))throw Error('Rejected '+name);if(name==='start'){observe();freeze('run-started');}else report();});
const runtime=new Runtime({canvas,width:canvas.clientWidth,height:canvas.clientHeight,dpr:devicePixelRatio,menuBottom:0,image:src=>browserImage('/'+src),read:()=>stored,write:s=>stored=structuredClone(s),sound(){},silence(){},controls:controls.update,now:()=>clock,requestFrame:cb=>next=cb});
function snapshot(){return{stage,version,crossing,beforeImageTime,stepObservation:true,arcStates:structuredClone(runtime.arcs),fixture:true,virtualClock:true,isolatedMemorySave:true,worldInjection:false,quality:runtime.save.settings.effects,round:runtime.world.round,roundTime:runtime.world.roundTime,visibleEnemies:runtime.world.bodies.filter(b=>b.active&&['drone','charger','armor','sniper','guard','elite','conduit'].includes(b.kind)&&b.y>=0&&b.y<=1280).map(b=>({kind:b.kind,x:b.x,y:b.y,hp:b.hp,pattern:b.pattern})),...runtime.diagnostics()};}
function report(){document.querySelector('#quality').disabled=running;status.textContent=runtime.world.time.toFixed(4)+'秒 / '+version+' / '+stage+' / '+runtime.mode;advance.disabled=running||runtime.mode!=='playing'||!!crossing;document.querySelector('#tick').disabled=running||runtime.mode!=='playing'||!crossing;}
function freeze(s){running=false;stage=s;history.push(snapshot());report();}
function action(a){if(!runtime.activateControl(a))throw Error('Rejected '+a);}
function aim(x){const s=Math.min(canvas.clientWidth/720,canvas.clientHeight/1280),px=(canvas.clientWidth-720*s)/2,py=(canvas.clientHeight-1280*s)/2;if(runtime.pointer!==739)runtime.touchStart(739,px+runtime.world.player.x*s,py+900*s);runtime.touchMove(739,px+x*s,py+900*s);}
function step(){const w=runtime.world;
 if(runtime.mode==='choice'){const a=w.build.available(w.buildPoints),r=a.includes('electric')?'electric':a[0];if(r)action('build:'+r);}
 if(runtime.mode==='branch')action('branch:'+(runtime.branchRoute==='ballistic'?(w.canFuseAmmo()?'fuse-fragment':w.canRefineFracture()?'fracture-line':w.canRefineStorm()?'storm-relay':'penetrator'):runtime.branchRoute==='electric'?(w.canRefineMagnetic()?'field-link':w.canRefineIon()?'ion-orb':'seeker'):w.canRefinePhoton()?'photon-reach':w.canFuseOptics()?'optic-mirror':'burn'));
 if(runtime.mode==='boss-reward')action('boss-claim:research');
 if(frame%6===0&&runtime.mode==='playing')aim(progressionTarget(w));clock+=1000/60;next(clock);lastRenderedTime=w.time;frame++;
 if(crossing){freeze('驾驶舱擦边穿门');return;}
 if(w.time>=750||['result','error'].includes(runtime.mode)){freeze('finished');return;}report();
}
function pump(){if(!running)return;for(let i=0;i<180&&running;i++)step();if(running)requestAnimationFrame(pump);}
advance.onclick=()=>{running=true;report();requestAnimationFrame(pump);};document.querySelector('#quality').onclick=()=>{runtime.save.settings.effects=runtime.save.settings.effects==='weak'?'standard':'weak';runtime.resize(canvas.clientWidth,canvas.clientHeight,devicePixelRatio);report();};
window.addEventListener('resize',()=>{if(canvas.clientWidth>0&&canvas.clientHeight>0)runtime.resize(canvas.clientWidth,canvas.clientHeight,devicePixelRatio);});Object.defineProperty(window,'__gateContactEvidence',{value:()=>({history,current:snapshot(),beforePhysical,physical:serialize(runtime.world)})});document.querySelector('#tick').onclick=()=>{for(let i=0;i<3;i++)step();freeze('领取后继续3帧');};
function serialize(w){return JSON.parse(JSON.stringify(w,(_k,v)=>v instanceof Map?[...v]:v instanceof Set?[...v]:v));}
function observe(){
 const w=runtime.world,step=w.step.bind(w);
 w.step=(dt,target)=>{
  const rows=new Map();for(const b of w.bodies)if(b.active&&b.kind==='gate'){const a=rows.get(b.row)||[];a.push(b);rows.set(b.row,a);}
  let pre=null,image=null,imageTime=null;const taken=w.gatesTaken,growth={...w.growth};
  if(!crossing&&[...rows.values()].some(a=>a[0].y<1024&&a[0].y>=1018)){pre=serialize(w);image=canvas.toDataURL('image/png');imageTime=lastRenderedTime;}
  step(dt,target);
  if(!crossing)for(const [row,gates]of rows)if(gates[0].py<1024&&gates[0].y>=1024){
   const t=(1024-gates[0].py)/(gates[0].y-gates[0].py),x=w.player.px+(w.player.x-w.player.px)*t;
   const centered=gates.some(g=>x>=g.x-g.width/2&&x<g.x+g.width/2),near=gates.filter(g=>x>=g.x-g.width/2-20&&x<g.x+g.width/2+20);
   if(!centered&&near.length&&pre&&image){beforePhysical=pre;beforeImage=image;beforeImageTime=imageTime;crossing={row,round:w.round,time:w.time,roundTime:w.roundTime,x,growthBefore:growth,growthAfter:{...w.growth},takenDelta:w.gatesTaken-taken,gates:gates.map(g=>({id:g.id,x:g.x,y:g.y,py:g.py,width:g.width,energy:g.energy,kind:g.rewardKind})),stepBeforeTime:pre.time,imageTime};}
  }
 };
}
Object.defineProperty(window,'__gateContactImages',{value:()=>({before:beforeImage,after:canvas.toDataURL('image/png')})});
await runtime.load();report();
