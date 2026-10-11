import {CanvasRuntime} from '/src/game/canvas-runtime.ts';
import {defaults} from '/src/ui/storage.ts';
import {advanceBody} from '/src/core/behavior.ts';
import {C} from '/src/core/config.ts';
let playing=false,weak=false,last=0,acc=0;
const runtime=new CanvasRuntime({canvas:document.getElementById('game'),width:720,height:1280,dpr:1,menuBottom:0,
 image:src=>new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=reject;i.src='/'+src;}),
 read:defaults,write(){},sound(){},silence(){},now:()=>10000,requestFrame(){}});
await runtime.load();runtime.start();
const bodies=[140,360,580].map(x=>runtime.world.spawn('charger',x,420));
Object.assign(bodies[1],{age:2,warning:.6});Object.assign(bodies[2],{age:2.8,speed:380,hit:.07});
const gate=runtime.world.spawn('gate',240,770);gate.energy=60;
runtime.world.bullets.push({id:9999,x:360,y:950,px:360,py:950,vx:0,vy:300,damage:1,age:0,active:true,hostile:true});
const c=document.getElementById('comparison').getContext('2d');
const images=await Promise.all(['units.png','charger-v1.png'].map(name=>new Promise(resolve=>{const i=new Image();i.onload=()=>resolve(i);i.src='/assets/'+name;})));
function draw(ms){
 if(playing){acc+=Math.min(.05,(ms-last)/1000);while(acc>=C.step){acc-=C.step;for(const b of bodies){advanceBody(b,C.step,'running',0,()=>{});b.y=420;/* fixed camera layout, not natural world movement */if(b.age>=3.3)Object.assign(b,{age:0,warning:0,speed:170});}}}last=ms;
 runtime.save.settings.effects=weak?'weak':'standard';runtime.render(0);
 c.fillStyle='#182631';c.fillRect(0,0,720,170);c.drawImage(images[0],0,256,192,256,56.6,19.55,86.8,120.9);
 for(let i=0;i<3;i++)c.drawImage(images[1],i*256,0,256,256,227+i*160,27,105.3,105.3);
 c.fillStyle='#e6f5ff';c.font='16px sans-serif';['原版','巡航','蓄势','冲锋'].forEach((s,i)=>c.fillText(s,78+i*160,156));requestAnimationFrame(draw);
}
document.getElementById('animate').onclick=()=>{playing=!playing;document.getElementById('animate').textContent=playing?'冻结行为':'播放真实行为';};
document.getElementById('quality').onclick=()=>{weak=!weak;document.getElementById('quality').textContent=weak?'切换标准档':'切换弱档';};requestAnimationFrame(draw);
