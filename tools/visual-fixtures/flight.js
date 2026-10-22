import{FlightRuntime}from'../../src/flight/runtime.ts';
import{browserImage}from'../../src/game/browser-image.ts';
import{createBrowserControls}from'../../src/game/browser-controls.ts';
import{flightTarget,flightChoice,flightGoal,flightOrders}from'../../tests/helpers/flight-driver.ts';
const query=new URLSearchParams(location.search),route=['ballistic','electric','optical'].includes(query.get('route'))?query.get('route'):'ballistic',goal=query.get('goal')??({ballistic:'arsenal',electric:'tempest',optical:'sun'})[route];
const canvas=document.querySelector('canvas');let clock=0,next=()=>{},running=false,automatic=false,frame=0,stop='ready',until=0,wide=false,effectStart=0;
const controls=createBrowserControls(canvas,a=>{if(!runtime.activate(a))throw Error('Rejected '+a);report();});
const runtime=new FlightRuntime({canvas,image:src=>browserImage('/'+src),controls:controls.update,sound(){},now:()=>clock,frame:cb=>next=cb,readBest:()=>0,writeBest(){},readCareer:()=>{try{return JSON.parse(sessionStorage.getItem('firebreak-fixture-career-v1')??'null');}catch{return null;}},writeCareer:v=>sessionStorage.setItem('firebreak-fixture-career-v1',JSON.stringify(v)),seed:()=>1337});runtime.muted=true;
const snapshot=()=>({...runtime.diagnostics(),fixture:true,normalEarned:true,virtual60Hz:true,omniscient2DPointer:true,worldInjection:false,isolatedSessionCareer:true,route,goal});
function report(){document.querySelector('#status').textContent=`${runtime.world.time.toFixed(2)}秒 · ${runtime.mode} · 击破${runtime.world.kills} · ${runtime.world.assembly.installed.size}组件 · ${route}/${goal}`;if(!running)document.querySelector('#evidence').textContent=JSON.stringify(snapshot());}
function act(a){if(!runtime.activate(a))throw Error('Rejected '+a);}
function aim(q){const b=canvas.getBoundingClientRect(),s=Math.min(b.width/720,b.height/1280);runtime.touchStart(789,0,0);runtime.touchMove(789,(q.x-runtime.world.player.x)*s,(q.y-runtime.world.player.y)*s);}
function step(){const w=runtime.world;if(runtime.mode==='menu')act('start:'+flightOrders[route][0]);
 if(runtime.mode==='tree'&&automatic)act('close-tree');if(runtime.mode!=='playing'){running=false;report();return;}
 if(automatic&&frame%6===0){const id=flightChoice(w,route);if(id){act('tree');act('select:'+id);act('assemble');if(w.assembly.has(goal)){running=false;report();return;}act('close-tree');}const target=flightGoal(w,route);if(target&&target!==w.target){act('tree');act('select:'+target);act('target');act('close-tree');}}
 if(frame%6===0)aim(flightTarget(w));clock+=1000/60;next(clock);frame++;
 if(stop==='trial'&&w.trial?.completed||stop==='ready'&&w.assembly.ready.length||stop==='loot'&&w.loot.length||stop==='effect'&&(w.contribution[goal==='tempest'?'tempest':goal==='sun'?'sun':'bounce']??0)>effectStart||stop==='fight'&&w.time>=until||w.time>400||runtime.mode==='result'){running=false;if(stop==='ready'&&runtime.mode==='playing')act('tree');report();}
}
function pump(){if(!running)return;for(let i=0;i<120&&running;i++)step();report();if(running)setTimeout(pump,0);}
function begin(mode,auto=false){if(runtime.mode==='tree')act('close-tree');if(runtime.mode==='paused')act('resume');stop=mode;automatic=auto;running=true;until=runtime.world.time+3;effectStart=runtime.world.contribution[goal==='tempest'?'tempest':goal==='sun'?'sun':'bounce']??0;pump();}
document.querySelector('#advance').onclick=()=>begin('ready');document.querySelector('#trial').onclick=()=>begin('trial',true);document.querySelector('#records').onclick=()=>{running=false;if(runtime.mode==='tree')act('close-tree');if(runtime.mode==='playing')act('pause');if(runtime.mode!=='records')act('records');report();};document.querySelector('#reload').onclick=()=>{runtime.hide();location.reload();};document.querySelector('#auto').onclick=()=>begin('goal',true);document.querySelector('#fight').onclick=()=>begin('fight');document.querySelector('#effect').onclick=()=>begin('effect');document.querySelector('#loot').onclick=()=>begin('loot');
document.querySelector('#wide').onclick=()=>{wide=!wide;canvas.style.width=wide?'100vw':'390px';canvas.style.height=wide?'calc(100vh - 92px)':'693px';runtime.resize(canvas.clientWidth,canvas.clientHeight,devicePixelRatio);report();};document.querySelector('#weak').onclick=()=>{runtime.activate('weak');report();};window.addEventListener('resize',()=>{runtime.resize(canvas.clientWidth,canvas.clientHeight,devicePixelRatio);report();});
runtime.resize(canvas.clientWidth,canvas.clientHeight,devicePixelRatio);await runtime.load();runtime.draw();report();
