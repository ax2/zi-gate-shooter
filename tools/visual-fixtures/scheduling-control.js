const canvas = document.querySelector('canvas'), ctx = canvas.getContext('2d');
const status = document.querySelector('#status');
let active=false, began=0, lastFrame=0, lastTimer=0, lastPaint=0, frames=0, paints=0, maxGap=0, timerMaxGap=0, gaps=[], lifecycle=[], ended=0;
const record = (kind,gap,time) => { if(gap>(kind==='timer'?150:100)) { gaps.push({kind,gap,time:(time-began)/1000,hidden:document.hidden,focused:document.hasFocus()}); if(gaps.length>200)gaps.shift(); } };
function frame(now) {
 if(active) {
  const gap=now-lastFrame;maxGap=Math.max(maxGap,gap);record('raf',gap,now);lastFrame=now;frames++;
  if(now-lastPaint>=1000/60) {lastPaint=now;paints++;ctx.fillStyle='#101c28';ctx.fillRect(0,0,360,640);ctx.fillStyle='#72ddff';ctx.fillRect(160+Math.sin(now/700)*100,290,40,40);}
 }
 requestAnimationFrame(frame);
}
setInterval(()=>{if(!active)return;const now=performance.now(),gap=now-lastTimer;timerMaxGap=Math.max(timerMaxGap,gap);record('timer',gap,now);lastTimer=now;status.textContent=`运行 ${((now-began)/1000).toFixed(1)}秒 · 回调${frames} · 绘制${paints}`;},100);
for(const event of ['blur','focus','visibilitychange']) (event==='visibilitychange'?document:window).addEventListener(event,()=>{if(active&&lifecycle.length<100)lifecycle.push({event,time:(performance.now()-began)/1000,hidden:document.hidden,focused:document.hasFocus()});});
document.querySelector('#start').onclick=()=>{began=lastFrame=lastTimer=lastPaint=performance.now();frames=paints=maxGap=timerMaxGap=ended=0;gaps=[];lifecycle=[];active=true;};
document.querySelector('#stop').onclick=()=>{ended=performance.now();active=false;status.textContent=`已停止 · ${((ended-began)/1000).toFixed(1)}秒`;};
Object.defineProperty(window,'__schedulingControl',{value:()=>({active,seconds:((active?performance.now():ended)-began)/1000,frames,paints,maxGap,timerMaxGap,gaps:[...gaps],lifecycle:[...lifecycle],width:innerWidth,height:innerHeight,scope:'lightweight same-origin animation; no game code, assets, audio or diagnostic sorting'})});
requestAnimationFrame(frame);
