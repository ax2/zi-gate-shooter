import{CanvasRuntime}from'../../src/game/canvas-runtime.ts';import{createBrowserControls}from'../../src/game/browser-controls.ts';import{browserImage}from'../../src/game/browser-image.ts';import{defaults}from'../../src/ui/storage.ts';import{progressionTarget}from'../../tests/helpers/progression-driver.ts';
const canvas=document.querySelector('canvas'),advance=document.querySelector('#advance'),quality=document.querySelector('#quality'),status=document.querySelector('#status');let stored=defaults(),clock=0,next=()=>{},frame=0,running=false,stage='menu',baselineHits=0;stored.openingWeapon='scatter';stored.nextBattlePlan=0;stored.settings.sound=false;stored.settings.shake=false;const history=[],protocolEvents=[];let visible=[];
const controls=createBrowserControls(canvas,name=>{if(!runtime.activateControl(name))throw Error('Rejected '+name);if(name==='start'){observe();freeze('正常开局');}else if(name.startsWith('overdrive:')){baselineHits=runtime.world.overdriveHits;freeze('协议已选择');}else report();});
const runtime=new CanvasRuntime({canvas,width:canvas.clientWidth,height:canvas.clientHeight,dpr:devicePixelRatio,menuBottom:0,image:src=>browserImage('/'+src),read:()=>stored,write:s=>stored=structuredClone(s),sound(){},silence(){},controls:(list,placement)=>{visible=list;controls.update(list,placement);},now:()=>clock,requestFrame:cb=>next=cb});
function observe(){const w=runtime.world,drain=w.drainEffects.bind(w);w.drainEffects=()=>{const events=drain();for(const e of events)if(e.type.startsWith('overdrive'))protocolEvents.push({time:w.time,round:w.round,...e});return events;};}
function snapshot(){return{...runtime.diagnostics(),stage,fixture:true,normalEarnedFlow:true,worldInjection:false,virtual60Hz:true,omniscientPointer:true,isolatedMemorySave:true,protocolEvents:structuredClone(protocolEvents),physical:JSON.parse(JSON.stringify(runtime.world,(_k,v)=>v instanceof Map?[...v]:v instanceof Set?[...v]:v))};}
function report(){quality.disabled=running;status.textContent=runtime.world.time.toFixed(3)+'秒 / '+stage+' / '+runtime.mode;advance.disabled=running||!['playing','choice'].includes(runtime.mode);}
function freeze(s){running=false;stage=s;history.push(snapshot());report();}
function action(a){if(!runtime.activateControl(a))throw Error('Rejected '+a);}
function aim(x){const s=Math.min(canvas.clientWidth/720,canvas.clientHeight/1280),px=(canvas.clientWidth-720*s)/2,py=(canvas.clientHeight-1280*s)/2;if(runtime.pointer!==779)runtime.touchStart(779,px+runtime.world.player.x*s,py+900*s);runtime.touchMove(779,px+x*s,py+900*s);}
function step(){const w=runtime.world;
 if(runtime.mode==='choice'&&w.canChooseOverdrive()){freeze('第16次突破 · 协议可选');return;}
 if(runtime.mode==='choice'){const a=w.build.available(w.buildPoints),r=a.includes('optical')?'optical':a[0];if(r)action('build:'+r);}
 if(runtime.mode==='branch'){const choices=visible.filter(b=>b.action.startsWith('branch:')),choice=choices.find(b=>b.action==='branch:photon-reach')??choices.find(b=>b.action==='branch:burn')??choices[0];if(choice)action(choice.action);}
 if(runtime.mode==='boss-reward')action('boss-claim:research');
 if(frame%6===0&&runtime.mode==='playing')aim(progressionTarget(w));clock+=1000/60;next(clock);frame++;
 if(w.overdriveForm&&w.overdriveHits>baselineHits&&protocolEvents.some(e=>e.time===w.time&&(e.type==='overdrive-lance'||e.type==='overdrive-arc'))){baselineHits=w.overdriveHits;freeze('协议真实命中');return;}
 if(w.time>=1100||['result','error'].includes(runtime.mode)){freeze('流程结束');return;}report();
}
function pump(){if(!running)return;for(let i=0;i<360&&running;i++)step();if(running)requestAnimationFrame(pump);}
advance.onclick=()=>{running=true;report();requestAnimationFrame(pump);};quality.onclick=()=>{runtime.save.settings.effects=runtime.save.settings.effects==='weak'?'standard':'weak';runtime.resize(canvas.clientWidth,canvas.clientHeight,devicePixelRatio);report();};window.addEventListener('resize',()=>runtime.resize(canvas.clientWidth,canvas.clientHeight,devicePixelRatio));Object.defineProperty(window,'__overdriveEvidence',{value:()=>({history,current:snapshot()})});await runtime.load();report();
