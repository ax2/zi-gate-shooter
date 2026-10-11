import {CanvasRuntime} from '/src/game/canvas-runtime.ts';
import {defaults} from '/src/ui/storage.ts';
let playing=false,weak=false,age=0,last=0;
const runtime=new CanvasRuntime({canvas:document.getElementById('game'),width:720,height:1280,dpr:1,menuBottom:0,
 image:src=>new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=reject;i.src='/'+src;}),
 read:defaults,write(){},sound(){},silence(){},now:()=>10000,requestFrame(){}});
await runtime.load();runtime.start();
const drones=[140,360,580].map(x=>runtime.world.spawn('drone',x,420));
runtime.world.spawn('armor',580,660);const gate=runtime.world.spawn('gate',240,770);gate.energy=60;
runtime.world.bullets.push({id:9999,x:360,y:950,px:360,py:950,vx:0,vy:300,damage:1,age:0,active:true,hostile:true});
const c=document.getElementById('comparison').getContext('2d');
const old=await new Promise(resolve=>{const i=new Image();i.onload=()=>resolve(i);i.src='/assets/units.png';});
const strip=await new Promise(resolve=>{const i=new Image();i.onload=()=>resolve(i);i.src='/assets/drone-v1.png';});
function draw(ms){if(playing)age+=Math.min(.05,(ms-last)/1000);last=ms;
 for(let j=0;j<3;j++){drones[j].age=playing?age+j*.125:[.375,0,.125][j];drones[j].hit=j===2?.07:0;}
 runtime.save.settings.effects=weak?'weak':'standard';runtime.render(0);
 c.fillStyle='#182631';c.fillRect(0,0,720,150);c.drawImage(old,576,0,192,256,60.8,28.5,78.4,93);
 for(let i=0;i<3;i++)c.drawImage(strip,i*256,0,256,256,234+i*160,29,92.4,92.4);
 c.fillStyle='#e6f5ff';c.font='16px sans-serif';['原版','左翼上','中立','右翼上'].forEach((s,i)=>c.fillText(s,78+i*160,140));
 requestAnimationFrame(draw);}
document.getElementById('animate').onclick=()=>{playing=!playing;document.getElementById('animate').textContent=playing?'冻结动作':'播放动作';};
document.getElementById('quality').onclick=()=>{weak=!weak;document.getElementById('quality').textContent=weak?'切换标准档':'切换弱档';};requestAnimationFrame(draw);
