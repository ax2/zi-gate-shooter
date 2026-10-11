import { CanvasRuntime } from '/src/game/canvas-runtime.ts';
import { defaults } from '/src/ui/storage.ts';
let weak=false;
const runtimes=await Promise.all(['pulse','receipt','overlap'].map(async(id)=>{
  const save=defaults();save.settings.shake=false;
  const runtime=new CanvasRuntime({canvas:document.getElementById(id),width:720,height:1280,dpr:1,menuBottom:0,
    image:src=>new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=reject;image.src='/'+src;}),
    read:()=>save,write(){},sound(){},silence(){},now:()=>10000,requestFrame(){}});
  await runtime.load();runtime.start();
  if(id==='pulse'){
    const gate=runtime.world.spawn('gate',360,600);gate.energy=20;gate.width=264;gate.row=1;
    runtime.render(0);gate.energy=24;runtime.render(0);runtime.world.time=0.06;
  }else{
    runtime.world.growth.bonus=100;runtime.world.growth.energy=25;
    runtime.effect({type:'gate-taken',x:360,y:1024,text:'火力 +5% · 充能 +25',size:264});
    if(id==='overlap')runtime.world.spawn('armor',360,844);
    runtime.world.bullets.push({id:9999,x:425,y:846,px:425,py:846,vx:0,vy:0,damage:1,age:0,active:true,hostile:true});
  }
  return runtime;
}));
function draw(){for(const runtime of runtimes){runtime.save.settings.effects=weak?'weak':'standard';runtime.render(0);}}
document.getElementById('quality').onclick=()=>{weak=!weak;document.getElementById('quality').textContent=weak?'切换标准档':'切换弱档';draw();};draw();

