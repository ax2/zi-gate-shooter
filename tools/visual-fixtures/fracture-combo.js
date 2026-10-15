import {CanvasRuntime} from '/src/game/canvas-runtime.ts';
import {defaults} from '/src/ui/storage.ts';
import {C} from '/src/core/config.ts';
const save=defaults();save.settings.sound=false;save.settings.shake=false;
const runtime=new CanvasRuntime({canvas:document.querySelector('canvas'),width:720,height:1280,dpr:1,menuBottom:0,
 image:src=>new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=reject;image.src='/'+src;}),
 read:()=>save,write(){},sound(){},silence(){},now:()=>10000,requestFrame(){}});
await runtime.load();let last='burst';
function show(scene){
 last=scene;runtime.start();runtime.save.settings.effects=document.querySelector('#quality').value;
 const w=runtime.world;
 for(const kind of ['blast','pierce']){const p=w.spawn('pickup',360,C.playerY,2);p.weaponKind=kind;w.step(C.step,360);}
 w.bullets=[];w.drainEffects();w.bodies=[];
 const armor=w.spawn('armor',360,660);armor.hp=armor.maxHp=600;armor.speed=0;armor.timer=999;
 const near=w.spawn('armor',465,660);near.hp=near.maxHp=600;near.speed=0;near.timer=999;
 const guard=w.spawn('guard',580,790);guard.timer=999;guard.speed=0;
 const gate=w.spawn('gate',165,440);gate.speed=0;gate.energy=72;gate.row=100;gate.rewardKind='energy';
 let frames=0,found=false;
 for(;frames<240;frames++){
   w.step(C.step,360);const events=w.drainEffects();for(const e of events)runtime.effect(e);
   found=scene==='marks'?(armor.fractureHits??0)>0:events.some(e=>e.type==='fracture');if(found)break;
 }
 // A visible, already-fired enemy bullet tests effect/hostile draw order.
 w.bullets.push({id:999999,x:420,y:720,px:420,py:720,vx:0,vy:280,damage:1,age:0,active:true,hostile:true});
 if(scene==='recipes'){runtime.mode='combos';runtime.render(0);}else runtime.render(scene==='burst'?.09:0);
 document.querySelector('#status').textContent=`实弹推进${frames+1}帧 · 裂口${armor.fractureHits??0} · 已爆破${w.fractureBursts}次 · 主目标HP ${armor.hp.toFixed(1)}`;
}
for(const [id,scene] of [['marks','marks'],['burst','burst'],['recipes','recipes']])document.getElementById(id).onclick=()=>show(scene);
document.querySelector('#quality').onchange=()=>show(last);
Object.defineProperty(window,'__fractureEvidence',{value:()=>({fixture:true,scene:last,...runtime.diagnostics()})});
show('burst');
