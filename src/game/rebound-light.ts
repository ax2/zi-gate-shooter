import type {Body} from '../core/world';import {reboundState} from '../core/rebound-charger';
/** Local intent and thrust only, never a projected movement corridor. */
export function reboundLight(c:CanvasRenderingContext2D,b:Body,weak:boolean){
 if(!b.active)return;const state=reboundState(b),turn=state.phase==='turn';
 c.save();c.translate(b.x,b.y);c.globalCompositeOperation='lighter';c.strokeStyle=turn?'#ffb59b':'#a7edff';c.lineWidth=weak?1:2;c.globalAlpha=.65;
 if(b.warning>0){for(let i=0;i<(turn?2:1);i++){c.beginPath();c.ellipse(0,0,43+i*8,49+i*7,0,0,Math.PI*2);c.stroke();}}
 const d=state.direction;if(d){c.beginPath();c.moveTo(d*34,-8);c.lineTo(d*44,0);c.lineTo(d*34,8);c.stroke();}
 if(state.dashing){c.strokeStyle='#a7edff';c.lineWidth=weak?2:4;for(const x of [-18,18]){c.beginPath();c.moveTo(x,35);c.lineTo(x-d*8,weak?52:65);c.stroke();}}
 c.restore();
}
