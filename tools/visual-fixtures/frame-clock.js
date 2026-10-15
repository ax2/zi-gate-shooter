const modeSelect=document.querySelector('#mode'),canvas=document.querySelector('#control'),ctx=canvas.getContext('2d');
const button=document.querySelector('#start'),status=document.querySelector('#status'),report=document.querySelector('#report');
const evidenceKey='gate-clock-last-ended-v1';
let state={status:'not-started'},raf=0,interval=0,deadline=0;
try{state=JSON.parse(sessionStorage.getItem(evidenceKey)??'null')??state;}catch{}
function summary(values){const sorted=[...values].sort((a,b)=>a-b);return {samples:values.length,p95:sorted[Math.max(0,Math.ceil(sorted.length*.95)-1)]??0,max:sorted.at(-1)??0};}
function render(){report.textContent=JSON.stringify(state,null,2);}
render();if(state.status!=='not-started')status.textContent=`上次：${state.status}`;
button.onclick=()=>{
 if(state.status==='running')return;
 const mode=modeSelect.value;
 const began=performance.now(),gaps=[],work=[],timerGaps=[],lifecycle=[];let previous=began,timerPrevious=began;
 state={status:'running',mode,width:innerWidth,height:innerHeight,dpr:devicePixelRatio,beganAt:new Date().toISOString(),hidden:document.hidden,focused:document.hasFocus()};button.disabled=true;modeSelect.disabled=true;status.textContent='测量进行中';render();
 const record=event=>{if(lifecycle.length<50)lifecycle.push({event,seconds:(performance.now()-began)/1000,hidden:document.hidden,focused:document.hasFocus()});};
 const visibility=()=>record('visibilitychange'),blur=()=>record('blur'),focus=()=>record('focus');
 document.addEventListener('visibilitychange',visibility);window.addEventListener('blur',blur);window.addEventListener('focus',focus);
 function frame(){const started=performance.now();if(gaps.length<10000)gaps.push(started-previous);previous=started;if(mode==='dom')status.textContent=`测量中 ${(started-began)/1000|0}秒 · ${gaps.length}次动画回调`;
 if(mode==='canvas'){ctx.fillStyle='#102330';ctx.fillRect(0,0,240,120);ctx.fillStyle='#7fdcff';ctx.fillRect((gaps.length*2)%220,40,20,20);}if(work.length<10000)work.push(performance.now()-started);raf=requestAnimationFrame(frame);}
 raf=requestAnimationFrame(frame);
 interval=setInterval(()=>{const now=performance.now();if(timerGaps.length<1000)timerGaps.push(now-timerPrevious);timerPrevious=now;},100);
 deadline=setTimeout(()=>{
  cancelAnimationFrame(raf);clearInterval(interval);document.removeEventListener('visibilitychange',visibility);window.removeEventListener('blur',blur);window.removeEventListener('focus',focus);
  state={...state,status:'completed',wallSeconds:(performance.now()-began)/1000,hidden:document.hidden,focused:document.hasFocus(),rafGapMs:summary(gaps),callbackWorkMs:summary(work),timerGapMs:summary(timerGaps),lifecycle};button.disabled=false;modeSelect.disabled=false;status.textContent='测量完成';try{sessionStorage.setItem(evidenceKey,JSON.stringify(state));}catch{}render();
 },12000);
};
Object.defineProperty(window,'__gateClockEvidence',{value:()=>structuredClone(state)});
