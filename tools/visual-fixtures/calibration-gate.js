import{CanvasRuntime}from'../../src/game/canvas-runtime.ts';import{createBrowserControls}from'../../src/game/browser-controls.ts';import{browserImage}from'../../src/game/browser-image.ts';import{defaults}from'../../src/ui/storage.ts';import{progressionTarget}from'../../tests/helpers/progression-driver.ts';import{calibrationGateReward}from'../../src/core/calibration-gate.ts';
const canvas=document.querySelector('canvas'),advance=document.querySelector('#advance'),quality=document.querySelector('#quality'),status=document.querySelector('#status');let stored=defaults(),clock=0,next=()=>{},frame=0,running=false,stage='menu',beat=0,visible=[],targetGate,targetKind,beforeCalibration,claimedAt;const history=[];stored.openingWeapon='scatter';stored.settings.sound=false;stored.settings.shake=false;
const controls=createBrowserControls(canvas,name=>{if(!runtime.activateControl(name))throw Error('Rejected '+name);if(name==='start')stage='正常开局';report();});
const runtime=new CanvasRuntime({canvas,width:canvas.clientWidth,height:canvas.clientHeight,dpr:devicePixelRatio,menuBottom:0,image:src=>browserImage('/'+src),read:()=>stored,write:s=>stored=structuredClone(s),sound(){},silence(){},controls:(list,placement)=>{visible=list;controls.update(list,placement);},now:()=>clock,requestFrame:cb=>next=cb});
function snapshot(){const w=runtime.world;return{...runtime.diagnostics(),stage,beat,targetGate,targetKind,beforeCalibration,claimedAt,fixture:true,worldInjection:false,virtual60Hz:true,omniscientPointer:true,isolatedMemorySave:true,gates:w.bodies.filter(b=>b.active&&b.kind==='gate').map(b=>({id:b.id,row:b.row,x:b.x,y:b.y,energy:b.energy,target:b.calibrationTarget,preview:calibrationGateReward(b)})),physical:JSON.parse(JSON.stringify(w,(_k,v)=>v instanceof Set?[...v]:v instanceof Map?[...v]:v))};}
function report(){advance.disabled=running||runtime.mode!=='playing'||beat>=3;quality.disabled=running;status.textContent=`${runtime.world.time.toFixed(3)}秒 / ${runtime.world.round}章 / ${stage} / ${runtime.mode}`;}
function freeze(s){running=false;stage=s;history.push(snapshot());report();}
function action(a){if(!runtime.activateControl(a))throw Error('Rejected '+a);}
function aim(x){const s=Math.min(canvas.clientWidth/720,canvas.clientHeight/1280),ox=(canvas.clientWidth-720*s)/2,oy=(canvas.clientHeight-1280*s)/2;if(runtime.pointer!==789)runtime.touchStart(789,ox+runtime.world.player.x*s,oy+900*s);runtime.touchMove(789,ox+x*s,oy+900*s);}
function step(){const w=runtime.world;
 if(runtime.mode==='choice'){const a=w.build.available(w.buildPoints),r=a.includes('ballistic')?'ballistic':a[0];if(r)action('build:'+r);}
 if(runtime.mode==='branch'){const choices=visible.filter(b=>b.action.startsWith('branch:')),names=['fuse-fragment','storm-relay','fracture-line','ricochet','field-link','ion-orb','seeker','photon-reach','burn'],preferred=names.map(n=>choices.find(b=>b.action==='branch:'+n)).find(Boolean)??choices[0];if(preferred)action(preferred.action);}
 if(runtime.mode==='boss-reward')action('boss-claim:research');
 const gate=w.bodies.find(b=>b.active&&b.kind==='gate'&&b.calibrationTarget);
 if(gate&&targetGate===undefined){targetGate=gate.id;targetKind=gate.calibrationTarget;beforeCalibration=w.weaponCalibration(targetKind);}
 const target=w.bodies.find(b=>b.active&&b.id===targetGate);
 if(frame%6===0&&runtime.mode==='playing')aim(progressionTarget(w,undefined,target?.x));clock+=1000/60;next(clock);frame++;
 const current=w.bodies.find(b=>b.active&&b.id===targetGate);
 if(beat===0&&current&&current.y>=540){beat=1;freeze('真实精校门：射击提高奖励');return;}
 if(beat===1&&w.weaponCalibration(targetKind)>beforeCalibration){beat=2;claimedAt=w.time;freeze('已穿门：目标武器精校+1');return;}
 if(beat===1&&!current){freeze('本次未领取精校门');return;}
 const receipt=runtime.diagnostics().equipmentHud;
 if(beat===2&&receipt?.text.includes('精校+1')){beat=3;freeze('即时精校回执');return;}
 if(w.time>=600||['error','result'].includes(runtime.mode)){freeze('流程结束');return;}report();
}
function pump(){if(!running)return;for(let i=0;i<120&&running;i++)step();if(running)setTimeout(pump,0);}
advance.onclick=()=>{running=true;report();setTimeout(pump,0);};quality.onclick=()=>{runtime.save.settings.effects=runtime.save.settings.effects==='weak'?'standard':'weak';runtime.resize(canvas.clientWidth,canvas.clientHeight,devicePixelRatio);report();};window.addEventListener('resize',()=>runtime.resize(canvas.clientWidth,canvas.clientHeight,devicePixelRatio));Object.defineProperty(window,'__calibrationGateEvidence',{value:()=>({history,current:snapshot()})});await runtime.load();report();
