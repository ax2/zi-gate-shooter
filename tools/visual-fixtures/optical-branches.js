import {CanvasRuntime} from '/src/game/canvas-runtime.ts';
import {createBrowserControls} from '/src/game/browser-controls.ts';
import {defaults} from '/src/ui/storage.ts';
import {C} from '/src/core/config.ts';
const canvas=document.querySelector('canvas'),status=document.querySelector('#status'),save=defaults();save.settings.sound=false;save.settings.shake=false;
const rect=canvas.getBoundingClientRect();
const bridge=createBrowserControls(canvas,action=>{runtime.activateControl(action);report();});
const runtime=new CanvasRuntime({canvas,width:rect.width,height:rect.height,dpr:devicePixelRatio,menuBottom:0,
 image:src=>new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=reject;image.src='/'+src;}),
 read:()=>save,write(){},sound(){},silence(){},controls:bridge.update,now:()=>10000,requestFrame(){}});
let scene='choice';
await runtime.load();
function report(){status.textContent=`${runtime.mode} · 已用${runtime.world.build.spent}/2点 · 分支${runtime.world.build.opticalBranch??'未选'} · 灼烧${runtime.world.burnHits}次/分光${runtime.world.relayHits}次`;}
function setup(branch){
 runtime.start();runtime.save.settings.effects=document.querySelector('#quality').value;const w=runtime.world;w.growth.mastery=2;w.chooseBuild('optical');
 if(!branch){runtime.mode='choice';runtime.render(0);report();return;}
 w.chooseBuild('optical',branch);
 for(const x of [360,480,600]){const b=w.spawn('armor',x,620);b.hp=b.maxHp=1000;b.speed=0;b.timer=999;}
 // Freeze each effect where it is visible: burn just after its first tick; relay at first contact.
 const frames=branch==='burn'?20:1;
 for(let i=0;i<frames;i++){w.bullets=[];w.step(C.step,360);for(const e of w.drainEffects())runtime.effect(e);runtime.render(C.step);}
 w.bullets.push({id:999999,x:430,y:720,px:430,py:720,vx:0,vy:280,damage:1,age:0,active:true,hostile:true});runtime.render(0);report();
}
document.querySelector('#choice').onclick=()=>{scene='choice';setup();};
for(const branch of ['burn','relay'])document.getElementById(branch).onclick=()=>{scene=branch;setup(branch);};
document.querySelector('#tree').onclick=()=>{scene='tree';runtime.mode='tree';runtime.render(0);report();};
document.querySelector('#quality').onchange=()=>setup(scene==='burn'||scene==='relay'?scene:undefined);
window.addEventListener('resize',()=>{const r=canvas.getBoundingClientRect();runtime.resize(r.width,r.height,devicePixelRatio);});
Object.defineProperty(window,'__opticalEvidence',{value:()=>({fixture:true,scene,...runtime.diagnostics()})});
setup();
