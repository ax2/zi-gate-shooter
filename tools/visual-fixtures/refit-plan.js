import {CanvasRuntime} from '../../src/game/canvas-runtime.ts';import {createBrowserControls} from '../../src/game/browser-controls.ts';import {browserImage} from '../../src/game/browser-image.ts';import {defaults} from '../../src/ui/storage.ts';import {progressionTarget} from '../../tests/helpers/progression-driver.ts';
const params=new URL(location.href).searchParams,focus=['pulse','scatter','pierce','blast','arc'].includes(params.get('focus'))?params.get('focus'):'pulse';
const canvas=document.querySelector('canvas'),advance=document.querySelector('#advance'),status=document.querySelector('#status');let stored=defaults(),clock=0,next=()=>{},frame=0,running=false,stage='menu';const history=[];stored.settings.sound=false;stored.settings.shake=false;
const controls=createBrowserControls(canvas,name=>{action(name);if(name==='start')freeze('run-started');else if(name.startsWith('refit-focus:'))freeze('plan-selected');else if(name==='refit-auto')freeze('automatic-selected');else if(name==='resume')freeze('plan-resumed');else report();});
const runtime=new CanvasRuntime({canvas,width:canvas.clientWidth,height:canvas.clientHeight,dpr:devicePixelRatio,menuBottom:0,image:src=>browserImage('/'+src),read:()=>stored,write:s=>stored=JSON.parse(JSON.stringify(s)),sound(){},silence(){},controls:controls.update,now:()=>clock,requestFrame:cb=>next=cb});
function action(name){if(!runtime.activateControl(name))throw Error('Visible action rejected '+name);}
function snapshot(){return {stage,focus,fixture:true,isolatedMemorySave:true,virtualClock:true,worldInjection:false,...runtime.diagnostics()};}
function report(){status.textContent=runtime.world.time.toFixed(4)+'秒 / '+stage+' / '+runtime.mode;advance.disabled=running||!['playing','choice','branch','boss-reward'].includes(runtime.mode);}
function freeze(s){running=false;stage=s;history.push(JSON.parse(JSON.stringify(snapshot())));report();}
function aim(x){const s=Math.min(canvas.clientWidth/720,canvas.clientHeight/1280),px=(canvas.clientWidth-720*s)/2,py=(canvas.clientHeight-1280*s)/2,point=v=>[px+v*s,py+900*s];if(runtime.pointer!==739)runtime.touchStart(739,...point(runtime.world.player.x));runtime.touchMove(739,...point(x));}
function step(){const w=runtime.world;
 if(runtime.mode==='choice'){const a=w.build.available(w.buildPoints),r=a.includes('optical')&&w.build.ranks.optical<3?'optical':a.includes('electric')&&(w.build.ranks.electric<3||w.build.refinements.electric<2)?'electric':a.find(r=>w.build.ranks[r]<3)??a[0];if(r)action('build:'+r);}
 if(runtime.mode==='branch')action('branch:'+(runtime.branchRoute==='electric'?(w.canRefineMagnetic()?'field-link':w.canRefineIon()?'ion-orb':'seeker'):runtime.branchRoute==='ballistic'?(w.canRefineFracture()?'fracture-line':'ricochet'):w.canRefinePhoton()?'photon-reach':'relay'));
 if(runtime.mode==='boss-reward')action('boss-claim:research');
 if(frame%6===0&&runtime.mode==='playing')aim(progressionTarget(w,w.refitTarget));clock+=1000/60;next(clock);frame++;
 if(stage==='run-started'&&w.time>=20&&w.activeWeapons.length>=Math.min(5,Math.max(1,Number(params.get('arsenal'))||2))&&w.activeWeapons.includes(focus)&&runtime.mode==='playing'){for(const a of ['pause','loadout','refit-plan'])action(a);freeze('ready-to-plan');return;}
 if(stage==='plan-resumed'&&w.bodies.some(b=>b.active&&b.kind==='crate'&&b.directedRefit&&b.y>=200)){freeze('directed-crate');return;}
 if(stage==='directed-crate'&&w.lastEquipmentPickup?.refit&&w.lastEquipmentPickup.kind===w.refitTarget&&runtime.mode==='playing'){freeze('refit-earned');return;}
 if(w.time>=300||['result','error'].includes(runtime.mode)){freeze('finished');return;}report();}
function pump(){if(!running)return;for(let i=0;i<180&&running;i++)step();if(running)requestAnimationFrame(pump);}
advance.onclick=()=>{running=true;report();requestAnimationFrame(pump);};window.addEventListener('resize',()=>runtime.resize(canvas.clientWidth,canvas.clientHeight,devicePixelRatio));
Object.defineProperty(window,'__refitPlanEvidence',{value:()=>({history,current:snapshot(),physical:JSON.parse(JSON.stringify(runtime.world,(_k,v)=>v instanceof Map?[...v.entries()]:v instanceof Set?[...v.values()]:v))})});await runtime.load();report();
