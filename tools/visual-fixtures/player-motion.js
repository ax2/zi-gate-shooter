import { CanvasRuntime } from '/src/game/canvas-runtime.ts';
import { PlayerMotion } from '/src/game/player-motion.ts';
import { defaults } from '/src/ui/storage.ts';
let animated=false;
const rigs=await Promise.all([1,2,3].map(async stage=>{
  const canvas=document.getElementById('t'+stage);
  const runtime=new CanvasRuntime({canvas,width:800,height:250,dpr:1,menuBottom:0,
    image:src=>new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src='/'+src;}),
    read:defaults,write(){},sound(){},silence(){},now:()=>10000,requestFrame(){}});
  await runtime.load(); return {runtime,canvas,stage,motion:new PlayerMotion()};
}));
function draw(time=0){
  for(const {runtime,canvas,stage,motion} of rigs){
    const c=canvas.getContext('2d'); c.fillStyle='#182631';c.fillRect(0,0,800,250);
    const pose=animated?motion.sample(360+Math.sin(time*2)*200,time):{left:4,right:-4,bob:-1};
    runtime.frameSprite('units.png',stage-1,4,100,130,160,213);
    runtime.playerSprite(stage-1,300,130,{left:0,right:0,bob:0},0);
    runtime.playerSprite(stage-1,500,130,pose,0);
    runtime.playerSprite(stage-1,700,130,{left:-pose.left,right:-pose.right,bob:pose.bob},animated?Math.max(0,Math.sin(time*40))*2.5:2.5);
  }
}
document.getElementById('animate').onclick=()=>{animated=!animated;document.getElementById('animate').textContent=animated?'暂停分层动作':'播放分层动作';};
function frame(ms){draw(ms/1000);requestAnimationFrame(frame);}requestAnimationFrame(frame);
