import {CanvasRuntime} from '../../src/game/canvas-runtime.ts';import {createBrowserControls} from '../../src/game/browser-controls.ts';import {browserImage} from '../../src/game/browser-image.ts';import {defaults} from '../../src/ui/storage.ts';import {progressionTarget} from '../../tests/helpers/progression-driver.ts';
const canvas=document.querySelector('canvas'),advance=document.querySelector('#advance'),status=document.querySelector('#status');let stored=defaults(),clock=0,next=()=>{},frame=0,running=false,stage='menu';stored.openingWeapon='scatter';stored.settings.sound=false;stored.settings.shake=false;const history=[];
const controls=createBrowserControls(canvas,name=>{if(!runtime.activateControl(name))throw Error('Rejected '+name);if(name==='start')freeze('run-started');else if(name==='branch:storm-focus'||name==='branch:storm-relay')freeze('refinement-selected');else report();});
const runtime=new CanvasRuntime({canvas,width:canvas.clientWidth,height:canvas.clientHeight,dpr:devicePixelRatio,menuBottom:0,image:src=>browserImage('/'+src),read:()=>stored,write:s=>stored=structuredClone(s),sound(){},silence(){},controls:controls.update,now:()=>clock,requestFrame:cb=>next=cb});
function snapshot(){return {stage,fixture:true,virtualClock:true,isolatedMemorySave:true,worldInjection:false,quality:runtime.save.settings.effects,...runtime.diagnostics()};}
function report(){status.textContent=runtime.world.time.toFixed(4)+'秒 / '+stage+' / '+runtime.mode;advance.disabled=running||runtime.mode==='menu';}
function freeze(s){running=false;stage=s;history.push(snapshot());report();}
function action(a){if(!runtime.activateControl(a))throw Error('Rejected '+a);}
function aim(x){const s=Math.min(canvas.clientWidth/720,canvas.clientHeight/1280),px=(canvas.clientWidth-720*s)/2,py=(canvas.clientHeight-1280*s)/2;if(runtime.pointer!==739)runtime.touchStart(739,px+runtime.world.player.x*s,py+900*s);runtime.touchMove(739,px+x*s,py+900*s);}
function step(){const w=runtime.world;
 if(runtime.mode==='choice'){
  if(w.canRefineStorm()&&stage==='run-started'){action('build:ballistic');freeze('refinement-choice');return;}
  const a=w.build.available(w.buildPoints),r=a.includes('ballistic')?'ballistic':a.includes('electric')?'electric':a[0];if(r)action('build:'+r);
 }
 if(runtime.mode==='branch'){if(stage==='refinement-choice'){freeze(stage);return;}action('branch:'+(runtime.branchRoute==='ballistic'?(w.canRefineFracture()?'fracture-line':'penetrator'):runtime.branchRoute==='electric'?'spread':'burn'));}
 if(runtime.mode==='boss-reward')action('boss-claim:research');
 if(frame%6===0&&runtime.mode==='playing')aim(progressionTarget(w,'scatter'));clock+=1000/60;next(clock);frame++;
 if(stage==='refinement-selected'&&w.build.stormAugment==='storm-focus'&&w.bodies.some(b=>b.active&&(b.stormHits??0)>=2)){freeze('focus-charge');return;}
 if(stage==='focus-charge'&&w.stormFocusBursts>0){freeze('focus-discharge');return;}
 if(stage==='refinement-selected'&&w.build.stormAugment==='storm-relay'&&w.stormRelayLinks>0){freeze('relay-chain');return;}
 if(w.time>=600||['result','error'].includes(runtime.mode)){freeze('finished');return;}report();
}
function pump(){if(!running)return;for(let i=0;i<180&&running;i++)step();if(running)requestAnimationFrame(pump);}
advance.onclick=()=>{running=true;report();requestAnimationFrame(pump);};document.querySelector('#quality').onclick=()=>{runtime.save.settings.effects=runtime.save.settings.effects==='weak'?'standard':'weak';runtime.resize(canvas.clientWidth,canvas.clientHeight,devicePixelRatio);report();};
window.addEventListener('resize',()=>{if(canvas.clientWidth>0&&canvas.clientHeight>0)runtime.resize(canvas.clientWidth,canvas.clientHeight,devicePixelRatio);});Object.defineProperty(window,'__stormEvidence',{value:()=>({history,current:snapshot(),physical:JSON.parse(JSON.stringify(runtime.world,(_k,v)=>v instanceof Map?[...v]:v instanceof Set?[...v]:v))})});await runtime.load();report();
