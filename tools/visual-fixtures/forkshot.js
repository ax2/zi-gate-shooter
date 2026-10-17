import {CanvasRuntime} from '../../src/game/canvas-runtime.ts';import {createBrowserControls} from '../../src/game/browser-controls.ts';import {browserImage} from '../../src/game/browser-image.ts';import {defaults} from '../../src/ui/storage.ts';import {progressionTarget} from '../../tests/helpers/progression-driver.ts';import {safeRoute} from '../../src/core/reachability.ts';
const policy=new URL(location.href).searchParams.get('policy')==='preempt'?'preempt':'bait',canvas=document.querySelector('canvas'),advance=document.querySelector('#advance'),status=document.querySelector('#status');let stored=defaults(),clock=0,next=()=>{},frame=0,running=false,stage='menu',tracked;const history=[];stored.nextBattlePlan=1;stored.settings.sound=false;stored.settings.shake=false;
const controls=createBrowserControls(canvas,name=>{action(name);if(name==='start')freeze('run-started');else report();});
const runtime=new CanvasRuntime({canvas,width:canvas.clientWidth,height:canvas.clientHeight,dpr:devicePixelRatio,menuBottom:0,image:src=>browserImage('/'+src),read:()=>stored,write:s=>stored=JSON.parse(JSON.stringify(s)),sound(){},silence(){},controls:controls.update,now:()=>clock,requestFrame:cb=>next=cb});
function action(a){if(!runtime.activateControl(a))throw Error('Visible action rejected '+a);}
function snapshot(){return {stage,policy,fixture:true,isolatedMemorySave:true,virtualClock:true,worldInjection:false,...runtime.diagnostics(),tracked:tracked?{id:tracked.id,active:tracked.active,hp:tracked.hp,x:tracked.x,y:tracked.y,warning:tracked.warning,age:tracked.age,lockX:tracked.lockX,shots:tracked.lockAcceptedShots??0,passed:tracked.lockPassed??0}:null};}
function report(){status.textContent=runtime.world.time.toFixed(4)+'秒 / '+stage+' / '+runtime.mode;advance.disabled=running||!['playing','choice','branch','boss-reward'].includes(runtime.mode);}
function freeze(s){running=false;stage=s;history.push(JSON.parse(JSON.stringify(snapshot())));report();}
function aim(x){const s=Math.min(canvas.clientWidth/720,canvas.clientHeight/1280),px=(canvas.clientWidth-720*s)/2,py=(canvas.clientHeight-1280*s)/2,point=v=>[px+v*s,py+900*s];if(runtime.pointer!==739)runtime.touchStart(739,...point(runtime.world.player.x));runtime.touchMove(739,...point(x));}
function step(){const w=runtime.world;
 if(runtime.mode==='choice'){const a=w.build.available(w.buildPoints),r=a.includes('optical')&&w.build.ranks.optical<3?'optical':a.includes('electric')&&(w.build.ranks.electric<3||w.build.refinements.electric<2)?'electric':a.find(r=>w.build.ranks[r]<3)??a[0];if(r)action('build:'+r);}
 if(runtime.mode==='branch')action('branch:'+(runtime.branchRoute==='electric'?(w.canRefineMagnetic()?'field-link':w.canRefineIon()?'ion-orb':'seeker'):runtime.branchRoute==='ballistic'?(w.canRefineFracture()?'fracture-line':'ricochet'):w.canRefinePhoton()?'photon-reach':'relay'));
 if(runtime.mode==='boss-reward')action('boss-claim:research');
 const gun=w.bodies.find(b=>b.active&&b.forkshot);if(!tracked&&gun)tracked=gun;
 if(frame%6===0&&runtime.mode==='playing')aim(gun?(policy==='preempt'?gun.x:(gun.lockPassed??0)>=3?gun.x:safeRoute(w.player.x,w.bodies,w.bullets,4,{phase:w.phase,phaseTime:w.phaseTime,reaction:0})?.[0]??w.player.x):progressionTarget(w));clock+=1000/60;next(clock);frame++;
 if(tracked){const shots=tracked.lockAcceptedShots??0;
  if(stage==='run-started'&&tracked.active&&tracked.warning>0){freeze('first-charge');return;}
  if(stage==='first-charge'&&shots>=1){freeze('first-shot');return;}
  if(stage==='first-shot'&&shots===1&&tracked.warning>0){freeze('second-charge');return;}
  if(stage==='second-charge'&&shots>=2){freeze('second-shot');return;}
  if(stage==='second-shot'&&shots>=3){freeze('third-shot');return;}
  if(stage==='third-shot'&&(tracked.lockPassed??0)>=3){freeze('all-passed');return;}
  if(!tracked.active&&tracked.hp<=0){freeze(shots===0?'preempted':'destroyed');return;}
 }
 if(w.time>=300||['result','error'].includes(runtime.mode)){freeze('finished');return;}report();}
function pump(){if(!running)return;for(let i=0;i<180&&running;i++)step();if(running)requestAnimationFrame(pump);}advance.onclick=()=>{running=true;report();requestAnimationFrame(pump);};window.addEventListener('resize',()=>runtime.resize(canvas.clientWidth,canvas.clientHeight,devicePixelRatio));Object.defineProperty(window,'__forkshotEvidence',{value:()=>({history,current:snapshot(),physical:JSON.parse(JSON.stringify(runtime.world,(_k,v)=>v instanceof Map?[...v.entries()]:v instanceof Set?[...v.values()]:v))})});await runtime.load();report();
