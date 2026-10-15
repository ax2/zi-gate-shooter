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
function report(){status.textContent=`${runtime.mode} · 已用${runtime.world.build.spent}/2点 · 分支${runtime.world.build.ballisticBranch??'未选'} · 贯穿${runtime.world.scatterPierces}次/爆破${runtime.world.scatterBursts}次`;}
function setup(branch){
 runtime.start();runtime.save.settings.effects=document.querySelector('#quality').value;const w=runtime.world;w.growth.mastery=2;w.chooseBuild('ballistic');
 if(!branch){runtime.mode='choice';runtime.render(0);report();return;}
 w.chooseBuild('ballistic',branch);
 // Preset targets; actual projectile collision supplies events. Automatic shots are
 // removed after each step to isolate the one explicit fixture projectile.
 for(const [x,y] of [[360,620],[360,440],[480,620]]){const b=w.spawn('armor',x,y);b.hp=b.maxHp=1000;b.speed=0;b.timer=999;}
 const p=w.profileFor('scatter');
 w.bullets=[{id:99990,x:360,y:760,px:360,py:760,vx:0,vy:-1200,damage:10,age:0,active:true,hostile:false,weaponKind:'scatter',remainingTargets:p.targets,hitBodies:[],splashRadius:p.splashRadius}];
 for(let i=0;i<25;i++){
  w.step(C.step,360);w.bullets=w.bullets.filter(b=>b.id===99990);for(const e of w.drainEffects())runtime.effect(e);runtime.render(C.step);
  if(branch==='fragment'?w.scatterBursts>0:w.scatterPierces>0)break;
 }
 if(branch==='fragment')for(let i=0;i<5;i++)runtime.render(C.step);
 w.bullets.push({id:999999,x:430,y:720,px:430,py:720,vx:0,vy:280,damage:1,age:0,active:true,hostile:true});runtime.render(0);report();
}
document.querySelector('#choice').onclick=()=>{scene='choice';setup();};
for(const branch of ['fragment','penetrator'])document.getElementById(branch).onclick=()=>{scene=branch;setup(branch);};
document.querySelector('#tree').onclick=()=>{scene='tree';runtime.mode='tree';runtime.render(0);report();};
document.querySelector('#quality').onchange=()=>setup(scene==='fragment'||scene==='penetrator'?scene:undefined);
window.addEventListener('resize',()=>{const r=canvas.getBoundingClientRect();runtime.resize(r.width,r.height,devicePixelRatio);});
Object.defineProperty(window,'__ballisticEvidence',{value:()=>({fixture:true,scene,...runtime.diagnostics()})});
setup();
