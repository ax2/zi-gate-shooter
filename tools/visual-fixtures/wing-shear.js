import{CanvasRuntime as CurrentRuntime}from'../../src/game/canvas-runtime.ts';import{CanvasRuntime as OldRuntime}from'../../build/qa/Stage-243/baseline.mjs';import{createBrowserControls}from'../../src/game/browser-controls.ts';import{browserImage}from'../../src/game/browser-image.ts';import{defaults}from'../../src/ui/storage.ts';import{progressionTarget}from'../../tests/helpers/progression-driver.ts';
const baseline=new URL(location.href).searchParams.get('version')==='old',Runtime=baseline?OldRuntime:CurrentRuntime;
const canvas=document.querySelector('canvas'),advance=document.querySelector('#advance'),status=document.querySelector('#status');let stored=defaults(),clock=0,next=()=>{},frame=0,running=false,stage='menu',checkpoint=new URL(location.href).searchParams.get('focus')==='reward'?4:new URL(location.href).searchParams.get('focus')==='cross'?3:0,bossRef=null,firstPhase=null;const history=[];
stored.openingWeapon='scatter';stored.settings.sound=false;stored.settings.shake=false;stored.nextBattlePlan=Number(new URL(location.href).searchParams.get('plan')??0);
const controls=createBrowserControls(canvas,name=>{if(!runtime.activateControl(name))throw Error('Rejected '+name);if(name==='start')freeze('run-started');else report();});
const runtime=new Runtime({canvas,width:canvas.clientWidth,height:canvas.clientHeight,dpr:devicePixelRatio,menuBottom:0,image:src=>browserImage('/'+src),read:()=>stored,write:s=>stored=structuredClone(s),sound(){},silence(){},controls:controls.update,now:()=>clock,requestFrame:cb=>next=cb});
function snapshot(){return{stage,baseline,boss:bossRef?structuredClone(bossRef):null,fixture:true,virtualClock:true,isolatedMemorySave:true,worldInjection:false,...runtime.diagnostics()};}
function freeze(s){running=false;stage=s;history.push(snapshot());report();}
function report(){document.querySelector('#quality').disabled=running;status.textContent=runtime.world.time.toFixed(4)+'秒 / '+stage+' / '+runtime.mode;advance.disabled=running||runtime.mode!=='playing'||checkpoint>=5;}
function action(a){if(!runtime.activateControl(a))throw Error('Rejected '+a);}
function aim(x){const s=Math.min(canvas.clientWidth/720,canvas.clientHeight/1280),px=(canvas.clientWidth-720*s)/2,py=(canvas.clientHeight-1280*s)/2;if(runtime.pointer!==739)runtime.touchStart(739,px+runtime.world.player.x*s,py+900*s);runtime.touchMove(739,px+x*s,py+900*s);}
function step(){const w=runtime.world;
 if(runtime.mode==='choice'){const a=w.build.available(w.buildPoints),r=a.includes('electric')?'electric':a[0];if(r)action('build:'+r);}
 if(runtime.mode==='branch')action('branch:'+(runtime.branchRoute==='ballistic'?(w.canFuseAmmo()?'fuse-fragment':w.canRefineFracture()?'fracture-line':w.canRefineStorm()?'storm-relay':'penetrator'):runtime.branchRoute==='electric'?(w.canRefineMagnetic()?'field-link':w.canRefineIon()?'ion-orb':'seeker'):w.canRefinePhoton()?'photon-reach':w.canFuseOptics()?'optic-mirror':'burn'));
 if(runtime.mode==='boss-reward')action('boss-claim:research');
 if(frame%6===0&&runtime.mode==='playing')aim(progressionTarget(w));clock+=1000/60;next(clock);frame++;
 if(w.round===2){bossRef??=w.bodies.find(b=>b.kind==='boss')??null;const b=bossRef;
  if(b&&w.phase==='boss'){
   if(firstPhase===null&&(baseline?w.bullets.some(p=>p.hostile&&p.sourceId===b.id):(b.wingShots??0)>=2))firstPhase=w.phaseTime;
   const ready=checkpoint===0?b.attack===2&&b.warning>0:checkpoint===1?firstPhase!==null:checkpoint===2?baseline?w.phaseTime>=firstPhase+.45:(b.wingShots??0)>=8:checkpoint===3?firstPhase!==null&&w.phaseTime>=firstPhase+1.65:false;
   if(ready){freeze(['双翼蓄能','第一拍实弹','第四拍实弹','斜切弹穿中'][checkpoint++]);return;}
  }
  if(checkpoint===4&&runtime.mode==='boss-reward'){checkpoint++;freeze('真实击破与原奖励');return;}
 }
 if(w.time>=350||['result','error'].includes(runtime.mode)){freeze('finished');return;}report();
}
function pump(){if(!running)return;for(let i=0;i<180&&running;i++)step();if(running)requestAnimationFrame(pump);}
advance.onclick=()=>{running=true;report();requestAnimationFrame(pump);};document.querySelector('#quality').onclick=()=>{runtime.save.settings.effects=runtime.save.settings.effects==='weak'?'standard':'weak';runtime.resize(canvas.clientWidth,canvas.clientHeight,devicePixelRatio);report();};
window.addEventListener('resize',()=>{if(canvas.clientWidth>0&&canvas.clientHeight>0)runtime.resize(canvas.clientWidth,canvas.clientHeight,devicePixelRatio);});Object.defineProperty(window,'__wingShearEvidence',{value:()=>({history,current:snapshot(),physical:JSON.parse(JSON.stringify(runtime.world,(_k,v)=>v instanceof Map?[...v]:v instanceof Set?[...v]:v))})});await runtime.load();report();
