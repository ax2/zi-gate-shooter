import{CanvasRuntime}from'../../src/game/canvas-runtime.ts';import{createBrowserControls}from'../../src/game/browser-controls.ts';import{browserImage}from'../../src/game/browser-image.ts';import{defaults}from'../../src/ui/storage.ts';import{progressionTarget}from'../../tests/helpers/progression-driver.ts';
const canvas=document.querySelector('canvas'),advance=document.querySelector('#advance'),status=document.querySelector('#status');let stored=defaults(),clock=0,next=()=>{},frame=0,running=false,stage='menu';stored.openingWeapon='scatter';stored.settings.sound=false;stored.settings.shake=false;const history=[];let checkpoint=0;const stops=['先遣集群','门前追兵','先遣猎袭','先遣炮屏','炮屏击破'];
const controls=createBrowserControls(canvas,name=>{if(!runtime.activateControl(name))throw Error('Rejected '+name);if(name==='start')freeze('run-started');else report();});
const runtime=new CanvasRuntime({canvas,width:canvas.clientWidth,height:canvas.clientHeight,dpr:devicePixelRatio,menuBottom:0,image:src=>browserImage('/'+src),read:()=>stored,write:s=>stored=structuredClone(s),sound(){},silence(){},controls:controls.update,now:()=>clock,requestFrame:cb=>next=cb});
function snapshot(){return{stage,fixture:true,virtualClock:true,isolatedMemorySave:true,worldInjection:false,quality:runtime.save.settings.effects,round:runtime.world.round,roundTime:runtime.world.roundTime,visibleEnemies:runtime.world.bodies.filter(b=>b.active&&['drone','charger','armor','sniper','guard','elite','conduit'].includes(b.kind)&&b.y>=0&&b.y<=1280).map(b=>({kind:b.kind,x:b.x,y:b.y,hp:b.hp,pattern:b.pattern})),...runtime.diagnostics()};}
function report(){document.querySelector('#quality').disabled=running;status.textContent=runtime.world.time.toFixed(4)+'秒 / '+stage+' / '+runtime.mode;advance.disabled=running||runtime.mode!=='playing'||checkpoint>=stops.length;}
function freeze(s){running=false;stage=s;history.push(snapshot());report();}
function action(a){if(!runtime.activateControl(a))throw Error('Rejected '+a);}
function aim(x){const s=Math.min(canvas.clientWidth/720,canvas.clientHeight/1280),px=(canvas.clientWidth-720*s)/2,py=(canvas.clientHeight-1280*s)/2;if(runtime.pointer!==739)runtime.touchStart(739,px+runtime.world.player.x*s,py+900*s);runtime.touchMove(739,px+x*s,py+900*s);}
function step(){const w=runtime.world;
 if(runtime.mode==='choice'){const a=w.build.available(w.buildPoints),r=a.includes('electric')?'electric':a[0];if(r)action('build:'+r);}
 if(runtime.mode==='branch')action('branch:'+(runtime.branchRoute==='ballistic'?(w.canFuseAmmo()?'fuse-fragment':w.canRefineFracture()?'fracture-line':w.canRefineStorm()?'storm-relay':'penetrator'):runtime.branchRoute==='electric'?(w.canRefineMagnetic()?'field-link':w.canRefineIon()?'ion-orb':'seeker'):w.canRefinePhoton()?'photon-reach':w.canFuseOptics()?'optic-mirror':'burn'));
 if(runtime.mode==='boss-reward')action('boss-claim:research');
 if(frame%6===0&&runtime.mode==='playing')aim(progressionTarget(w));clock+=1000/60;next(clock);frame++;
 const target=[{round:1,time:2.0},{round:1,time:57.9},{round:2,time:1.8},{round:3,time:1.4},{round:3,time:1.8}][checkpoint];
 if(target&&w.round===target.round&&w.roundTime>=target.time){freeze(stops[checkpoint++]);return;}
 if(w.time>=360||['result','error'].includes(runtime.mode)){freeze('finished');return;}report();
}
function pump(){if(!running)return;for(let i=0;i<180&&running;i++)step();if(running)requestAnimationFrame(pump);}
advance.onclick=()=>{running=true;report();requestAnimationFrame(pump);};document.querySelector('#quality').onclick=()=>{runtime.save.settings.effects=runtime.save.settings.effects==='weak'?'standard':'weak';runtime.resize(canvas.clientWidth,canvas.clientHeight,devicePixelRatio);report();};
window.addEventListener('resize',()=>{if(canvas.clientWidth>0&&canvas.clientHeight>0)runtime.resize(canvas.clientWidth,canvas.clientHeight,devicePixelRatio);});Object.defineProperty(window,'__vanguardEvidence',{value:()=>({history,current:snapshot(),physical:JSON.parse(JSON.stringify(runtime.world,(_k,v)=>v instanceof Map?[...v]:v instanceof Set?[...v]:v))})});await runtime.load();report();
