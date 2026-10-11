import { CanvasRuntime } from '/src/game/canvas-runtime.ts';
import { defaults } from '/src/ui/storage.ts';
await Promise.all(['crate','pickup','pair'].map(async(id)=>{
  const save=defaults();save.settings.shake=false;
  const runtime=new CanvasRuntime({canvas:document.getElementById(id),width:720,height:1280,dpr:1,menuBottom:0,
    image:src=>new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=reject;image.src='/'+src;}),
    read:()=>save,write(){},sound(){},silence(){},now:()=>10000,requestFrame(){}});
  await runtime.load();runtime.start();
  if(id==='crate'){runtime.world.spawn('crate',240,500);runtime.world.spawn('drone',480,1210);}
  if(id==='pickup'){runtime.world.spawn('pickup',240,650);runtime.world.bullets.push({id:9999,x:610,y:1180,px:610,py:1180,vx:0,vy:0,damage:1,age:0,active:true,hostile:true});}
  if(id==='pair'){runtime.world.pickups=1;for(const x of [222,498]){const gate=runtime.world.spawn('gate',x,600);gate.row=1;gate.energy=60;}}
  runtime.render(0);
}));
