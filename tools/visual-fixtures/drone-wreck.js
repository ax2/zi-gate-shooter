import { CanvasRuntime } from '/src/game/canvas-runtime.ts';
import { defaults } from '/src/ui/storage.ts';
const canvas=document.querySelector('canvas');
const runtime=new CanvasRuntime({canvas,width:innerWidth,height:innerHeight,dpr:devicePixelRatio,menuBottom:0,
 image:src=>new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src=`/${src}`;}),
 read:defaults,write:()=>{},sound:()=>{},silence:()=>{},now:()=>performance.now(),requestFrame:fn=>requestAnimationFrame(fn)});
const resume=()=>{runtime.touchStart(1,360*innerWidth/720,(innerHeight-1280*Math.min(innerWidth/720,innerHeight/1280))/2+603*Math.min(innerWidth/720,innerHeight/1280));runtime.touchEnd(1,360*innerWidth/720,(innerHeight-1280*Math.min(innerWidth/720,innerHeight/1280))/2+603*Math.min(innerWidth/720,innerHeight/1280));};
function reset(){runtime.start();runtime.world.player.x=68;runtime.world.spawn('drone',360,460);runtime.world.spawn('gate',240,650);const armor=runtime.world.spawn('armor',500,420);armor.warning=.6;armor.timer=.6;runtime.pause();}
document.querySelector('#kill').onclick=()=>{const b=runtime.world.bodies.find(b=>b.kind==='drone');if(!b)return;b.hp=4;runtime.world.bullets.push({id:999,x:b.x,y:b.y,px:b.x,py:b.y,vx:0,vy:0,damage:4,age:0,active:true,hostile:false});if(runtime.mode==='paused')resume();};
document.querySelector('#pause').onclick=()=>runtime.mode==='playing'?runtime.pause():resume();
document.querySelector('#weak').onclick=()=>{runtime.save.settings.effects=runtime.save.settings.effects==='standard'?'weak':'standard';};
document.querySelector('#reset').onclick=reset;
window.addEventListener('resize',()=>runtime.resize(innerWidth,innerHeight,devicePixelRatio));
Object.defineProperty(window,'__gateDiagnostics',{value:()=>runtime.diagnostics()});
await runtime.load();reset();
