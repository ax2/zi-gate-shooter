import {CanvasRuntime} from '/src/game/canvas-runtime.ts';
import {World} from '/src/core/world.ts';
import {defaults} from '/src/ui/storage.ts';
import {C} from '/src/core/config.ts';
const canvas=document.querySelector('canvas'),save=defaults();save.settings.sound=false;save.settings.shake=false;
const r=canvas.getBoundingClientRect();
const runtime=new CanvasRuntime({canvas,width:r.width,height:r.height,dpr:devicePixelRatio,menuBottom:0,
 image:src=>new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src='/'+src;}),
 read:()=>save,write(){},sound(){},silence(){},now:()=>10000,requestFrame(){}});
await runtime.load();let scene='bulwark';
function simulate(w){w.step(C.step,360);for(const e of w.drainEffects())runtime.effect(e);runtime.render(C.step);}
function show(id){
 scene=id;runtime.start();const round=id==='pincer'?5:id==='crossfire'?6:4;
 runtime.world=new World(1337,round);const w=runtime.world;w.phase='boss';const b=w.spawn('boss',360,C.bossY);b.bossVariant=(round-1)%3;b.attackCycle=[0,2,3][b.bossVariant];
 runtime.save.settings.effects=document.querySelector('#quality').value;
 for(let i=0;i<200;i++)simulate(w);
 if(id==='break'){
  for(const guard of [...w.activeEscorts]){
   const y=guard.y+guard.height/2+6;
   w.bullets.push({id:99000+guard.id,x:guard.x,y,px:guard.x,py:y,vx:0,vy:-C.bulletSpeed,damage:10000,age:0,active:true,hostile:false});simulate(w);
  }
  for(let i=0;i<10;i++)simulate(w);
 }
 runtime.render(0);
 document.querySelector('#status').textContent=`R${round} · ${w.phaseTime.toFixed(2)}秒 · 编队入场${w.escortSpawns}/击破${w.escortKills} · 屏障${w.bossShieldActive()?'生效':'无'}`;
}
for(const id of ['bulwark','break','pincer','crossfire'])document.getElementById(id).onclick=()=>show(id);
document.querySelector('#quality').onchange=()=>show(scene);
window.addEventListener('resize',()=>{const r=canvas.getBoundingClientRect();runtime.resize(r.width,r.height,devicePixelRatio);});
Object.defineProperty(window,'__formationEvidence',{value:()=>({fixture:true,scene,...runtime.diagnostics()})});show('bulwark');
