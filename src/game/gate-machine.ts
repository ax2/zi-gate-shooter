import {C,clamp} from '../core/config';
import type {Body} from '../core/world';
import {BOSS_VISUAL} from './boss-destruction';

/** Visual-only sizing: keeps the real gate contact and reward geometry intact. */
export function pairedGate(gate:Body,bodies:readonly Body[]){return gate.row>0&&bodies.some(b=>b!==gate&&b.active&&b.kind==='gate'&&b.row===gate.row);}

export function gatePanelBlocked(gate:Body,bodies:readonly Body[],mixed:boolean){
 return bodies.some(b=>b.active&&b.kind in C.enemies
  &&Math.abs(b.x-gate.x)<gate.width/2+Math.max(80,b.kind==='boss'?BOSS_VISUAL.width/2:b.width*.84)
  &&Math.abs(b.y+(b.kind==='boss'?BOSS_VISUAL.offsetY:0)-gate.y)<(mixed?82:54)+Math.max(84,b.kind==='boss'?BOSS_VISUAL.height/2:b.height*.84)+40);
}

/** Eight border slices preserve the authored corners and empty number window.
 * Motion and the eight charge cells use actual impact/tier timers and energy. */
export function gateMachine(c:CanvasRenderingContext2D,image:HTMLImageElement,b:Body,mixed:boolean,pulse:number,weak:boolean,paired=false){
 const impact=clamp(b.hit/.07,0,1),kick=Math.sin(clamp(pulse,0,1)*Math.PI)*(weak?.6:1.7);
 const width=b.width+(paired?8:72)+kick*2,height=paired?(mixed?208:152):(mixed?224:168),left=b.x-width/2,top=b.y-height/2;
 const sx=[0,image.width*.17,image.width*.83,image.width],sy=[0,image.height*.18,image.height*.82,image.height];
 const capX=paired?32:42,capY=paired?18:24;
 const dx=[left,left+capX,left+width-capX,left+width],dy=[top,top+capY,top+height-capY,top+height];
 c.save();
 c.fillStyle='#0005';c.beginPath();c.ellipse(b.x+4,b.y+height*.32,width*.42,13,0,0,Math.PI*2);c.fill();
 for(let row=0;row<3;row++)for(let col=0;col<3;col++)if(row!==1||col!==1)c.drawImage(image,sx[col],sy[row],sx[col+1]-sx[col],sy[row+1]-sy[row],dx[col],dy[row],dx[col+1]-dx[col],dy[row+1]-dy[row]);
 const charge=clamp(b.energy/C.thresholds[C.thresholds.length-1],0,1),color=b.calibrationTarget?'#c8a0ff':b.rewardKind==='power'?'#68e8ff':'#ffd28a';
 for(const side of [-1,1]){
  const x=b.x+side*(width/2-(paired?15:20));c.fillStyle='#091820';c.fillRect(x-3.5,b.y-44,7,88);
  for(let cell=0;cell<8;cell++){
   c.fillStyle=charge>cell/8?color:'#34434a';c.fillRect(x-2,b.y+35-cell*10,4,7);
  }
  if(impact>0||pulse>0){c.save();c.globalCompositeOperation='lighter';c.globalAlpha=(weak?.35:.65)*Math.max(impact,pulse);c.strokeStyle=color;c.lineWidth=weak?1.5:2.5;c.beginPath();c.moveTo(x,b.y-48);c.lineTo(x,b.y+48);c.stroke();
   if(!weak&&pulse>0){c.lineWidth=1.5;for(const end of [-1,1]){const y=b.y+end*(height/2-14);c.beginPath();c.moveTo(x,y);c.lineTo(x-side*(8+kick*3),y-end*6);c.stroke();}}c.restore();}
 }
 c.restore();
}
