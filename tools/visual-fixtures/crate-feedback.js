import { CanvasRuntime } from '/src/game/canvas-runtime.ts';
import { defaults } from '/src/ui/storage.ts';
async function create(id,width,height){
  const runtime=new CanvasRuntime({canvas:document.getElementById(id),width,height,dpr:1,menuBottom:0,
    image:src=>new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=reject;image.src='/'+src;}),
    read:defaults,write(){},sound(){},silence(){},now:()=>10000,requestFrame(){}});
  await runtime.load();return runtime;
}
const states=await create('states',900,260),scene=await create('scene',720,1280);
const c=document.getElementById('states').getContext('2d');c.fillStyle='#182631';c.fillRect(0,0,900,260);
for(let frame=0;frame<3;frame++)states.frameSprite('crate-v1.png',frame,3,150+frame*300,130,220,228,3);
let age=0.15,weak=false;
function draw(){scene.start();scene.save.settings.effects=weak?'weak':'standard';scene.world.spawn('pickup',360,650,2);
  const gate=scene.world.spawn('gate',540,850);gate.energy=60;
  scene.world.bullets.push({id:9999,x:360,y:700,px:360,py:700,vx:0,vy:0,damage:1,age:0,active:true,hostile:true});
  scene.effect({type:'crate-break',x:360,y:650,text:'靠近领取',size:110});scene.render(age);
}
for(const button of document.querySelectorAll('[data-age]'))button.onclick=()=>{age=Number(button.dataset.age);draw();};
document.getElementById('quality').onclick=()=>{weak=!weak;document.getElementById('quality').textContent=weak?'切换标准档':'切换弱档';draw();};draw();
