import{CanvasRuntime as Current}from'../../src/game/canvas-runtime.ts';import{CanvasRuntime as Before}from'../../build/qa/Stage-250/baseline.mjs';import{createBrowserControls}from'../../src/game/browser-controls.ts';import{browserImage}from'../../src/game/browser-image.ts';import{defaults}from'../../src/ui/storage.ts';import{progressionTarget}from'../../tests/helpers/progression-driver.ts';
const query=new URL(location.href).searchParams,old=query.get('version')==='old',Runtime=old?Before:Current,canvas=document.querySelector('canvas'),advance=document.querySelector('#advance'),smallStep=document.querySelector('#step'),quality=document.querySelector('#quality'),status=document.querySelector('#status');
let stored=defaults(),clock=0,next=()=>{},frame=0,running=false,stage='menu',checkpoint=0,accepted=false;const history=[],seenGuns=new Set();stored.openingWeapon='scatter';stored.settings.sound=false;stored.settings.shake=false;stored.nextBattlePlan=Number(query.get('plan')??0);
const controls=createBrowserControls(canvas,name=>{action(name);if(name==='start')freeze('正常开局');else if(name.startsWith('contract-claim:'))freeze('契约已领奖');else report();});
const runtime=new Runtime({canvas,width:canvas.clientWidth,height:canvas.clientHeight,dpr:devicePixelRatio,menuBottom:0,image:src=>browserImage('/'+src),read:()=>stored,write:s=>stored=structuredClone(s),sound(){},silence(){},controls:controls.update,now:()=>clock,requestFrame:f=>next=f});
function action(name){if(!runtime.activateControl(name))throw Error('Rejected '+name);}
function snapshot(){return{stage,old,fixture:true,virtualClock:true,omniscientPointer:true,worldInjection:false,isolatedMemorySave:true,viewport:{width:innerWidth,height:innerHeight,canvasWidth:canvas.clientWidth,canvasHeight:canvas.clientHeight},...runtime.diagnostics(),escorts:runtime.world.bodies.filter(b=>b.active&&b.heavyReserve).map(b=>({id:b.id,kind:b.kind,x:b.x,y:b.y,hp:b.hp,age:b.age,burst:b.burst,warning:b.warning,pattern:b.pattern}))};}
function report(){const playing=runtime.mode==='playing';advance.disabled=running||!playing||checkpoint>4;smallStep.disabled=running||!playing;quality.disabled=running;status.textContent=runtime.world.time.toFixed(4)+'秒 / '+stage+' / '+runtime.mode;}
function freeze(label){running=false;stage=label;history.push(snapshot());report();}
function aim(x){const s=Math.min(canvas.clientWidth/720,canvas.clientHeight/1280),px=(canvas.clientWidth-720*s)/2,py=(canvas.clientHeight-1280*s)/2;if(runtime.pointer!==739)runtime.touchStart(739,px+runtime.world.player.x*s,py+900*s);runtime.touchMove(739,px+x*s,py+900*s);}
function tick(){const w=runtime.world;
 if(frame===1&&!accepted){action('contracts-live');action('contract:precision');action('resume');accepted=true;}
 if(runtime.mode==='choice'){const a=w.build.available(w.buildPoints),preferred=checkpoint===0?'ballistic':'electric';action('build:'+(a.includes(preferred)?preferred:a[0]));}
 if(runtime.mode==='branch')action('branch:'+(runtime.branchRoute==='ballistic'?(w.canFuseAmmo()?'fuse-fragment':w.canRefineFracture()?'fracture-line':w.canRefineStorm()?'storm-relay':'ricochet'):runtime.branchRoute==='electric'?(w.canRefineMagnetic()?'field-link':w.canRefineIon()?'ion-orb':'seeker'):w.canRefinePhoton()?'photon-reach':w.canFuseOptics()?'optic-mirror':'burn'));
 if(runtime.mode==='boss-reward'&&checkpoint<4)action('boss-claim:research');
 if(frame%6===0&&runtime.mode==='playing')aim(progressionTarget(w));clock+=1000/60;next(clock);frame++;
 for(const b of w.bodies)if(b.heavyReserve&&b.kind==='armor')seenGuns.add(b.id);
}
function step(){tick();const w=runtime.world;
 if(checkpoint===0&&runtime.mode==='contract-reward'){checkpoint++;freeze('正常无伤契约完成');return;}
 if(checkpoint===0&&w.time>31){checkpoint++;freeze('契约未完成观察');return;}
 if(checkpoint===1&&w.round===3&&w.roundTime>=14.9){checkpoint++;freeze('重装护炮初现');return;}
 if(checkpoint===2&&w.round===3&&(w.bullets.some(b=>b.active&&b.hostile&&seenGuns.has(b.sourceId)&&b.y>650)||w.roundTime>=22)){checkpoint++;freeze(w.roundTime>=22?'未观察到护炮实弹':'护炮实弹接近');return;}
 if(checkpoint===3&&w.round===3&&w.roundTime>=38.9){checkpoint++;freeze('第二护炮组');return;}
 if(checkpoint===4&&w.round===3&&runtime.mode==='boss-reward'){checkpoint++;freeze('第三首领战利品');return;}
 if(w.time>=360||['result','error'].includes(runtime.mode)){freeze('流程结束');return;}report();
}
function pump(){if(!running)return;for(let i=0;i<120&&running;i++)step();if(running)requestAnimationFrame(pump);}
advance.onclick=()=>{running=true;report();requestAnimationFrame(pump);};smallStep.onclick=()=>{for(let i=0;i<6&&runtime.mode==='playing';i++)tick();freeze('正常推进0.1秒');};quality.onclick=()=>{runtime.save.settings.effects=runtime.save.settings.effects==='weak'?'standard':'weak';runtime.resize(canvas.clientWidth,canvas.clientHeight,devicePixelRatio);report();};
window.addEventListener('resize',()=>{if(canvas.clientWidth>0&&canvas.clientHeight>0)runtime.resize(canvas.clientWidth,canvas.clientHeight,devicePixelRatio);});Object.defineProperty(window,'__escortDeckEvidence',{value:()=>({history,current:snapshot(),physical:JSON.parse(JSON.stringify(runtime.world,(_k,v)=>v instanceof Map?[...v]:v instanceof Set?[...v]:v))})});await runtime.load();report();
