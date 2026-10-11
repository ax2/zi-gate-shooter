import {CanvasRuntime} from '/src/game/canvas-runtime.ts';
import {defaults} from '/src/ui/storage.ts';
let playing=false,weak=false,last=0,clock=10000,next=()=>{},boss;
const runtime=new CanvasRuntime({canvas:document.getElementById('game'),width:720,height:1280,dpr:1,menuBottom:0,
 image:src=>new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=reject;i.src='/'+src;}),
 read:defaults,write(){},sound(){},silence(){},now:()=>clock,requestFrame:callback=>{next=callback;}});
await runtime.load();
function reset(){
 runtime.start();const w=runtime.world;w.time=w.roundTime=80;w.phase='boss';w.player.x=68;
 boss=w.spawn('boss',360,260);Object.assign(boss,{warning:1.35,timer:1.35,attack:1,attackCycle:1,lane:200});
 const gate=w.spawn('gate',240,770);gate.energy=60;
 runtime.touchStart(1,360,1100);runtime.touchMove(1,68,1100);
 playing=false;document.getElementById('animate').textContent='播放模拟';
}
reset();
const c=document.getElementById('comparison').getContext('2d');
const images=await Promise.all(['units.png','boss-v1.png'].map(name=>new Promise(resolve=>{const i=new Image();i.onload=()=>resolve(i);i.src='/assets/'+name;})));
function draw(ms){
 if(playing)clock+=Math.min(50,Math.max(0,ms-last));last=ms;
 runtime.save.settings.effects=weak?'weak':'standard';next(clock);
 const w=runtime.world;document.getElementById('status').textContent=`${w.phase} · 攻击${boss.attack?'B':'A'} · 第二拍${boss.burst} · 预警${boss.warning.toFixed(2)} · 分数${w.score} · HP${w.player.hp}`;
 c.fillStyle='#182631';c.fillRect(0,0,720,180);c.drawImage(images[0],576,256,192,256,0,0,180,140);
 for(let i=0;i<3;i++)c.drawImage(images[1],i*256,0,256,256,180+i*180,0,180,140);
 c.fillStyle='#e6f5ff';c.font='18px sans-serif';['旧版','巡航','准备','残骸'].forEach((s,i)=>c.fillText(s,70+i*180,163));requestAnimationFrame(draw);
}
document.getElementById('animate').onclick=()=>{playing=!playing;document.getElementById('animate').textContent=playing?'冻结模拟':'播放模拟';};
document.getElementById('kill').onclick=()=>{
 if(!runtime.world.bodies.includes(boss))return;
 boss.hp=4;runtime.world.bullets.push({id:99999,x:boss.x,y:boss.y,px:boss.x,py:boss.y,vx:0,vy:0,damage:4,age:0,active:true,hostile:false});
 playing=true;document.getElementById('animate').textContent='冻结模拟';
};
document.getElementById('reset').onclick=reset;
document.getElementById('quality').onclick=()=>{weak=!weak;document.getElementById('quality').textContent=weak?'切换标准档':'切换弱档';};requestAnimationFrame(draw);
