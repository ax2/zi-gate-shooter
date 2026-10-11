import { CanvasRuntime } from '/src/game/canvas-runtime.ts';
import { defaults } from '/src/ui/storage.ts';
const canvas=document.querySelector('canvas'),kind=document.querySelector('#kind');
const runtime=new CanvasRuntime({canvas,width:innerWidth,height:innerHeight,dpr:devicePixelRatio,menuBottom:0,
 image:src=>new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src=`/${src}`;}),
 read:defaults,write:()=>{},sound:()=>{},silence:()=>{},now:()=>performance.now(),requestFrame:fn=>requestAnimationFrame(fn)});
const resume=()=>{const s=Math.min(innerWidth/720,innerHeight/1280),x=innerWidth/2,y=(innerHeight-1280*s)/2+603*s;runtime.touchStart(1,x,y);runtime.touchEnd(1,x,y);};
function reset(){runtime.start();runtime.world.player.x=68;runtime.world.spawn(kind.value,360,460);runtime.world.spawn('gate',240,700);const armor=runtime.world.spawn('armor',550,420);armor.warning=.6;armor.timer=.6;runtime.pause('');}
kind.onchange=reset;
document.querySelector('#kill').onclick=()=>{const b=runtime.world.bodies.find(b=>b.kind===kind.value&&b.x===360);if(!b)return;b.hp=4;runtime.world.bullets.push({id:999,x:b.x,y:b.y,px:b.x,py:b.y,vx:0,vy:0,damage:4,age:0,active:true,hostile:false});if(runtime.mode==='paused')requestAnimationFrame(resume);};
document.querySelector('#weak').onclick=()=>{runtime.save.settings.effects=runtime.save.settings.effects==='standard'?'weak':'standard';};
document.querySelector('#reset').onclick=reset;
window.addEventListener('resize',()=>runtime.resize(innerWidth,innerHeight,devicePixelRatio));
Object.defineProperty(window,'__gateDiagnostics',{value:()=>({...runtime.diagnostics(),fixtureKind:kind.value,effects:runtime.save.settings.effects})});
await runtime.load();reset();
