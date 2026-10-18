import{CanvasRuntime as Current}from'../../src/game/canvas-runtime.ts';import{CanvasRuntime as Before}from'../../build/qa/Stage-254/baseline-runtime.mjs';const CanvasRuntime=new URL(location.href).searchParams.get('version')==='old'?Before:Current;import{defaults}from'../../src/ui/storage.ts';import{createBrowserControls}from'../../src/game/browser-controls.ts';import{browserImage}from'../../src/game/browser-image.ts';import{progressionTarget}from'../../tests/helpers/progression-driver.ts';import{bossSalvageCount}from'../../src/core/boss-salvage.ts';
const canvas=document.querySelector('canvas'),advance=document.querySelector('#advance'),small=document.querySelector('#step'),quality=document.querySelector('#quality'),status=document.querySelector('#status');
let save=defaults(),clock=0,next=()=>{},frame=0,running=false,stage='menu',checkpoint=0,visible=[];const history=[];save.settings.sound=false;save.settings.shake=false;save.openingWeapon='scatter';save.nextBattlePlan=0;
const controls=createBrowserControls(canvas,action=>{if(!runtime.activateControl(action))throw Error('Rejected '+action);if(action==='start')freeze('正常开局');else if(action.startsWith('boss-claim:'))freeze('首领奖励已领取');else report();});
const runtime=new CanvasRuntime({canvas,width:canvas.clientWidth,height:canvas.clientHeight,dpr:devicePixelRatio,menuBottom:0,image:src=>browserImage('/'+src),read:()=>save,write:s=>save=structuredClone(s),sound(){},silence(){},controls:(list,placement)=>{visible=list;controls.update(list,placement);},now:()=>clock,requestFrame:f=>next=f});
function evidence(){return{stage,checkpoint,fixture:true,virtualClock:true,omniscientPointer:true,worldInjection:false,isolatedMemorySave:true,...runtime.diagnostics(),physical:JSON.parse(JSON.stringify(runtime.world,(_k,v)=>v instanceof Map?[...v]:v instanceof Set?[...v]:v))};}
function report(){const live=runtime.mode==='playing';advance.disabled=running||!live||checkpoint>=9;small.disabled=running||!live;quality.disabled=running;status.textContent=runtime.world.time.toFixed(4)+'秒 / '+stage+' / '+runtime.mode;}
function freeze(label){running=false;stage=label;history.push(evidence());report();}
function action(name){if(!runtime.activateControl(name))throw Error('Rejected '+name);}
function tick(){const w=runtime.world;
 if(runtime.mode==='choice'){const options=w.build.available(w.buildPoints);action('build:'+(options.includes('optical')?'optical':options[0]));}
 if(runtime.mode==='branch'){const options=visible.filter(b=>b.action.startsWith('branch:'));const preferred=options.find(b=>b.action==='branch:photon-reach')??options.find(b=>b.action==='branch:burn')??options[0];if(preferred)action(preferred.action);}
 if(runtime.mode==='boss-reward'&&w.round<3)action('boss-claim:research');
 if(frame%6===0&&runtime.mode==='playing'){const s=Math.min(canvas.clientWidth/720,canvas.clientHeight/1280),ox=(canvas.clientWidth-720*s)/2,oy=(canvas.clientHeight-1280*s)/2;if(runtime.pointer!==751)runtime.touchStart(751,ox+w.player.x*s,oy+900*s);runtime.touchMove(751,ox+progressionTarget(w)*s,oy+900*s);}
 clock+=1000/60;next(clock);frame++;
}
function step(){tick();const w=runtime.world,boss=w.bodies.find(b=>b.active&&b.kind==='boss');
 const target=1+Math.floor(checkpoint/3),beat=checkpoint%3,age=runtime.diagnostics().bossDestructionAge;
 if(beat===0&&w.round===target&&age!==null){checkpoint++;freeze('第'+target+'首领翼部解体');return;}
 if(beat===1&&age!==null&&age>=.92){checkpoint++;freeze('第'+target+'首领反应堆破裂');return;}
 if(beat===2&&runtime.mode==='boss-reward'&&w.round===target){checkpoint++;freeze('第'+target+'首领战利品');return;}
 if(w.time>=900||['result','error'].includes(runtime.mode)){freeze('流程结束');return;}report();
}
function pump(){if(!running)return;for(let i=0;i<360&&running;i++)step();if(running)requestAnimationFrame(pump);}
advance.onclick=()=>{running=true;report();requestAnimationFrame(pump);};small.onclick=()=>{for(let i=0;i<6;i++)tick();freeze('推进0.1秒');};quality.onclick=()=>{runtime.save.settings.effects=runtime.save.settings.effects==='weak'?'standard':'weak';save=structuredClone(runtime.save);runtime.resize(canvas.clientWidth,canvas.clientHeight,devicePixelRatio);report();};window.addEventListener('resize',()=>runtime.resize(canvas.clientWidth,canvas.clientHeight,devicePixelRatio));Object.defineProperty(window,'__bossRuptureEvidence',{value:()=>({history,current:evidence()})});await runtime.load();report();
