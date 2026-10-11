
import { CanvasRuntime } from '/src/game/canvas-runtime.ts';
import { defaults } from '/src/ui/storage.ts';
let weak = false;
const runtimes = await Promise.all(['before','after'].map(async (id,index) => {
  const save=defaults(); save.settings.shake=false;
  const runtime = new CanvasRuntime({canvas:document.getElementById(id),width:720,height:1280,dpr:1,menuBottom:0,
    image:src=>new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src='/'+src;}),
    read:()=>save,write(){},sound(){},silence(){},now:()=>10000,requestFrame(){}});
  await runtime.load();runtime.start();runtime.world.growth.stage=3;
  for(const [kind,x,y] of [['drone',140,360],['charger',360,360],['armor',580,360],['elite',140,590],['crate',360,590],['gate',530,800]]){
    const body=runtime.world.spawn(kind,x,y);body.hit=index ? 0.07 : 0;
    if(kind==='gate'){body.energy=60;body.width=240;}
  }
  runtime.world.player.invulnerable=index ? 1 : 0;
  runtime.world.bullets.push({id:9999,x:360,y:820,px:360,py:820,vx:0,vy:300,damage:1,age:0,active:true,hostile:true});
  return runtime;
}));
function draw(){for(const runtime of runtimes){runtime.save.settings.effects=weak?'weak':'standard';runtime.render(0);}}
document.getElementById('quality').onclick=()=>{weak=!weak;document.getElementById('quality').textContent=weak?'切换为标准档':'切换为弱档';draw();};draw();
