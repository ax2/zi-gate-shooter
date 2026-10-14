import { CanvasRuntime } from '../../src/game/canvas-runtime.ts';
import { defaults } from '../../src/ui/storage.ts';
import { World } from '../../src/core/world.ts';
import { GameAudio } from '../../src/game/audio.ts';
const canvas = document.querySelector('canvas'), audio = new GameAudio();
let frameEvidence=[], previousCallback=0, previousWork=0;
function measuredFrame(fn){return requestAnimationFrame(time=>{
 const started=performance.now(), gap=previousCallback?started-previousCallback:0;
 previousCallback=started;const mode=runtime.mode, simulated=runtime.world.time;
 fn(time);const work=performance.now()-started;
 if(mode==='playing') {frameEvidence.push({simulated,gap,work,previousWork,modeAfter:runtime.mode,hidden:document.hidden});if(frameEvidence.length>120)frameEvidence.shift();}
 previousWork=work;
});}
const runtime = new CanvasRuntime({canvas,width:innerWidth,height:innerHeight-68,dpr:devicePixelRatio,menuBottom:0,
 image:src=>new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=reject;image.src=`/${src}`;}),
 read:defaults,write:()=>{},sound:(type,tier,weapon)=>audio.event(type,tier,weapon),silence:()=>audio.stop(),now:()=>performance.now(),requestFrame:measuredFrame});
function start(){
 frameEvidence=[];previousCallback=0;previousWork=0;void audio.unlock();runtime.start();runtime.world=new World(1337,Number(document.querySelector('#sector').value));
 runtime.save.settings.effects=document.querySelector('#effects').value;
 if(document.querySelector('#scenario').value==='sniper') {
   const sniper=runtime.world.spawn('sniper',220,320);sniper.timer=0;
   runtime.world.spawn('drone',500,100);return;
 }
 if(document.querySelector('#scenario').value==='defeat') {
   runtime.world.player.hp=1; runtime.world.spawn('crate',360,1024);
   return;
 }
 if(['blockade','flanker'].includes(document.querySelector('#scenario').value)) {
   runtime.world.phase='boss';
   const boss=runtime.world.spawn('boss',360,260);boss.bossVariant=document.querySelector('#scenario').value==='flanker'?1:2;boss.attackCycle=boss.bossVariant===1?2:3;boss.timer=0;
   return;
 }
 if(['gates','gate-danger'].includes(document.querySelector('#scenario').value)) {
   runtime.world.spawnGates(360,true);
   if(document.querySelector('#scenario').value==='gate-danger') runtime.world.bullets.push({id:9999,x:222,y:508,px:222,py:508,vx:0,vy:0,damage:1,age:0,active:true,hostile:true});
   for(const gate of runtime.world.bodies){gate.y=500;gate.speed=0;}
   return;
 }
 if(document.querySelector('#scenario').value==='opening') return;
 runtime.world.growth.stage=Number(document.querySelector('#tier').value);runtime.world.weaponKind=document.querySelector('#weapon').value;
 if(document.querySelector('#scenario').value.startsWith('choices')) {
   const weapons=[runtime.world.weaponKind,runtime.world.weaponKind==='pierce'?'scatter':'pierce'];
   for(let i=0;i<2;i++){const box=runtime.world.spawn('crate',[222,498][i],document.querySelector('#scenario').value==='choices-entry'?180:580,3);box.weaponKind=weapons[i];box.row=100;box.speed=0;}
   return;
 }
 const first=runtime.world.spawn('armor',360,600);first.speed=0;
 const second=runtime.world.spawn('armor',360,430);second.speed=0;
 const left=runtime.world.spawn('drone',180,320);left.pattern='weave';
 const right=runtime.world.spawn('elite',540,300);right.pattern='fan';right.timer=1;
 const charge=runtime.world.spawn('charger',140,100);charge.pattern='flank';charge.lane=480;charge.age=1.75;
}
document.querySelector('#start').onclick=start;
document.querySelector('#pause').onclick=()=>runtime.pause('机制对比已暂停');
document.querySelector('#weapon').onchange=start;
 document.querySelector('#tier').onchange=start;
document.querySelector('#sector').onchange=start;
document.querySelector('#scenario').onchange=start;
window.addEventListener('resize',()=>runtime.resize(innerWidth,innerHeight-68,devicePixelRatio));
Object.defineProperty(window,'__gateDiagnostics',{value:()=>({...runtime.diagnostics(),frameEvidence,fixture:document.querySelector('#scenario').value==='sniper'?'T1 + seeded sniper and drone, no immunity':document.querySelector('#scenario').value==='defeat'?'1HP + seeded crate collision, result layout only':['gates','gate-danger'].includes(document.querySelector('#scenario').value)?'stationary pair from production gate factory, layout only':['blockade','flanker'].includes(document.querySelector('#scenario').value)?'T1 + seeded chapter boss, no immunity':document.querySelector('#scenario').value==='opening'?'selected chapter, default T1, no seeded bodies or immunity':document.querySelector('#scenario').value.startsWith('choices')?'selected tier + two stationary T3 choice crates, no damage immunity':'selected tier + five seeded bodies, no damage immunity'})});
await runtime.load();

