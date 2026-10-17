import{CanvasRuntime as CurrentRuntime}from'../../src/game/canvas-runtime.ts';import{CanvasRuntime as OldRuntime}from'../../build/qa/Stage-244/baseline.mjs';import{createBrowserControls}from'../../src/game/browser-controls.ts';import{browserImage}from'../../src/game/browser-image.ts';import{defaults}from'../../src/ui/storage.ts';import{progressionTarget}from'../../tests/helpers/progression-driver.ts';
const paired=new URL(location.href).searchParams.get('focus')==='paired',baseline=new URL(location.href).searchParams.get('version')==='old',Runtime=baseline?OldRuntime:CurrentRuntime;
const canvas=document.querySelector('canvas'),advance=document.querySelector('#advance'),status=document.querySelector('#status');let stored=defaults(),clock=0,next=()=>{},frame=0,running=false,stage='menu',checkpoint=0,pickupRef=null,hold=null,originX=null,claimedAt=null;const history=[];
stored.openingWeapon='scatter';stored.settings.sound=false;stored.settings.shake=false;
const controls=createBrowserControls(canvas,name=>{if(!runtime.activateControl(name))throw Error('Rejected '+name);if(name==='start')freeze('run-started');else report();});
const runtime=new Runtime({canvas,width:canvas.clientWidth,height:canvas.clientHeight,dpr:devicePixelRatio,menuBottom:0,image:src=>browserImage('/'+src),read:()=>stored,write:s=>stored=structuredClone(s),sound(){},silence(){},controls:controls.update,now:()=>clock,requestFrame:cb=>next=cb});
function snapshot(){return{stage,paired,baseline,pickup:pickupRef?structuredClone(pickupRef):null,hold,originX,fixture:true,virtualClock:true,isolatedMemorySave:true,worldInjection:false,inputPolicy:'From tracked broken module y700 hold90px to its right',...runtime.diagnostics()};}
function freeze(s){running=false;stage=s;history.push(snapshot());report();}
function report(){document.querySelector('#quality').disabled=running;status.textContent=runtime.world.time.toFixed(4)+'秒 / '+stage+' / '+runtime.mode;advance.disabled=running||runtime.mode!=='playing'||checkpoint>=5;}
function action(a){if(!runtime.activateControl(a))throw Error('Rejected '+a);}
function aim(x){const s=Math.min(canvas.clientWidth/720,canvas.clientHeight/1280),px=(canvas.clientWidth-720*s)/2,py=(canvas.clientHeight-1280*s)/2;if(runtime.pointer!==739)runtime.touchStart(739,px+runtime.world.player.x*s,py+900*s);runtime.touchMove(739,px+x*s,py+900*s);}
function step(){const w=runtime.world;
 if(runtime.mode==='choice'){const a=w.build.available(w.buildPoints),r=a.includes('electric')?'electric':a[0];if(r)action('build:'+r);}
 if(runtime.mode==='branch')action('branch:'+(runtime.branchRoute==='electric'?'seeker':runtime.branchRoute==='ballistic'?'penetrator':'burn'));
 if(!pickupRef)pickupRef=w.bodies.find(b=>b.active&&b.kind==='pickup'&&(paired?b.row>0:b.weaponKind==='scatter')&&b.y>=700)??null;
 if(pickupRef&&hold===null){originX=pickupRef.x;hold=Math.min(652,originX+90);}
 if(frame%6===0&&runtime.mode==='playing')aim(hold??progressionTarget(w));clock+=1000/60;next(clock);frame++;
 const p=pickupRef;
 if(p){
  if(w.lastEquipmentPickup?.id===p.id&&claimedAt===null)claimedAt=w.time;
  const ready=checkpoint===0?p.y>=704:checkpoint===1?p.y>=800:checkpoint===2?p.y>=960:checkpoint===3?claimedAt!==null||p.y>1079:claimedAt!==null?w.time>=claimedAt+.6:p.y>1169;
  if(ready){const label=checkpoint===3?(claimedAt!==null?'真实接触并强化':'旧版偏位未拾取'):['同前态与偏位','近距横移','接触前仍未强化','','继续开火'][checkpoint];checkpoint++;freeze(label);return;}
 }
 if(w.time>=24||['result','error'].includes(runtime.mode)){freeze('finished');return;}report();
}
function pump(){if(!running)return;for(let i=0;i<180&&running;i++)step();if(running)requestAnimationFrame(pump);}
advance.onclick=()=>{running=true;report();requestAnimationFrame(pump);};document.querySelector('#quality').onclick=()=>{runtime.save.settings.effects=runtime.save.settings.effects==='weak'?'standard':'weak';runtime.resize(canvas.clientWidth,canvas.clientHeight,devicePixelRatio);report();};
window.addEventListener('resize',()=>{if(canvas.clientWidth>0&&canvas.clientHeight>0)runtime.resize(canvas.clientWidth,canvas.clientHeight,devicePixelRatio);});Object.defineProperty(window,'__pickupRecoveryEvidence',{value:()=>({history,current:snapshot(),physical:JSON.parse(JSON.stringify(runtime.world,(_k,v)=>v instanceof Map?[...v]:v instanceof Set?[...v]:v))})});await runtime.load();report();
