import {CanvasRuntime} from '../../src/game/canvas-runtime.ts';import {browserImage} from '../../src/game/browser-image.ts';import {defaults} from '../../src/ui/storage.ts';import {progressionTarget} from '../../tests/helpers/progression-driver.ts';
const canvas=document.querySelector('canvas'),status=document.querySelector('#status'),start=document.querySelector('#start'),shot=document.querySelector('#shot'),weak=document.querySelector('#weak');
const save=defaults();save.settings.sound=false;save.settings.shake=false;let clock=0,next=()=>{},running=false,frame=0,stage='idle',tracked=null,entrySeen=null;
const rect=canvas.getBoundingClientRect(),runtime=new CanvasRuntime({canvas,width:rect.width,height:rect.height,dpr:devicePixelRatio,menuBottom:0,image:src=>browserImage('/'+src),read:()=>save,write(){},sound(){},silence(){},now:()=>clock,requestFrame:cb=>{next=cb;}});await runtime.load();start.disabled=runtime.mode!=='menu';
const point=(x,y)=>{const s=Math.min(canvas.clientWidth/720,canvas.clientHeight/1280);return [(canvas.clientWidth-720*s)/2+x*s,(canvas.clientHeight-1280*s)/2+y*s];};
function report(){status.textContent=`${runtime.world.time.toFixed(2)}秒 / HP${runtime.world.player.hp} / ${stage}`;}
function step(){const w=runtime.world;
 if(runtime.mode==='choice')runtime.activateControl('build:optical');
 if(runtime.mode==='branch')runtime.activateControl('branch:burn');
 if(runtime.mode==='boss-reward')runtime.activateControl('boss-claim:research');
 if(runtime.mode==='playing'&&frame%6===0){if(runtime.pointer!==731)runtime.touchStart(731,...point(w.player.x,900));runtime.touchMove(731,...point(tracked!==null?(w.bodies.find(b=>b.id===tracked)?.x<360?652:68):progressionTarget(w),900));}
 const before=new Set(w.bullets.filter(b=>b.hostile).map(b=>b.id));clock+=1000/60;next(clock);frame++;
 if(stage==='charge'){if(tracked===null){const incoming=w.bodies.find(b=>b.active&&b.deploying);if(incoming){tracked=incoming.id;entrySeen={id:incoming.id,kind:incoming.kind,time:w.time,x:incoming.x,y:incoming.y};}}const b=w.bodies.find(b=>b.active&&b.id===tracked);if(b?.warning>0){running=false;stage='charge-frozen';shot.disabled=false;weak.disabled=false;}}
 else if(stage==='shot'&&w.bullets.some(b=>{const emitter=w.bodies.find(t=>t.id===tracked&&t.active);return emitter&&b.hostile&&!before.has(b.id)&&Math.abs(b.px-emitter.x)<1&&Math.abs(b.py-emitter.y-emitter.height/2)<1;})){running=false;stage='shot-frozen';weak.disabled=false;}
 if(w.time>=300||['result','error','paused'].includes(runtime.mode)){running=false;stage=w.time>=300?'limit-without-capture':runtime.mode;}report();
}
function pump(){if(!running)return;for(let i=0;i<240&&running;i++)step();if(running)requestAnimationFrame(pump);}
start.onclick=()=>{clock=0;runtime.start();frame=0;tracked=null,entrySeen=null;stage='charge';running=true;shot.disabled=weak.disabled=true;requestAnimationFrame(pump);};
shot.onclick=()=>{stage='shot';running=true;shot.disabled=weak.disabled=true;requestAnimationFrame(pump);};
weak.onclick=()=>{save.settings.effects=save.settings.effects==='weak'?'standard':'weak';runtime.resize(canvas.clientWidth,canvas.clientHeight,devicePixelRatio);report();};
window.addEventListener('resize',()=>runtime.resize(canvas.clientWidth,canvas.clientHeight,devicePixelRatio));
Object.defineProperty(window,'__shooterEntryEvidence',{value:()=>({fixture:true,virtualClock:true,stage,frame,quality:save.settings.effects,tracked,entrySeen,hostiles:runtime.world.bullets.filter(b=>b.hostile),targets:runtime.world.bodies.filter(b=>b.active).map(b=>({id:b.id,kind:b.kind,x:b.x,y:b.y,hp:b.hp,warning:b.warning,deploying:b.deploying})),...runtime.diagnostics()})});report();
