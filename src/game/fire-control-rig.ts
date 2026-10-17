import {CONTROL_PATROL,FIRE_CONTROL} from '../core/fire-control';
/** Local metal hardware on the existing detailed machines; no projected shot paths. */
export function controlPatrolDrive(c:CanvasRenderingContext2D,age:number,weak:boolean,direction=1){
 c.save();c.lineJoin='round';const velocity=age<FIRE_CONTROL.hold?direction*Math.cos(Math.max(0,age-CONTROL_PATROL.entry)*Math.PI*2/CONTROL_PATROL.period):0;
 for(const side of [-1,1]){
  c.save();c.scale(side,1);c.fillStyle='#172c35';c.strokeStyle='#9bafaf';c.lineWidth=2;
  c.beginPath();c.moveTo(38,30);c.lineTo(60,23);c.lineTo(73,31);c.lineTo(68,45);c.lineTo(43,49);c.closePath();c.fill();c.stroke();
  c.strokeStyle='#c39761';c.lineWidth=2;c.beginPath();c.moveTo(44,33);c.lineTo(62,30);c.lineTo(66,34);c.stroke();
  c.fillStyle='#86cfdf';for(let i=0;i<(weak?2:4);i++)c.fillRect(46+i*(weak?8:4),39,2,4);
  if(side*velocity<-.05){c.strokeStyle='#87e7df';c.lineWidth=weak?1.3:2;c.globalAlpha=Math.abs(velocity)*.8;c.beginPath();c.moveTo(70,35);c.lineTo(79+Math.abs(velocity)*10,31);c.moveTo(70,40);c.lineTo(81+Math.abs(velocity)*7,43);c.stroke();}
  c.restore();
 }
 c.restore();
}
export function controlReceiver(c:CanvasRenderingContext2D,age:number,linked:boolean,offline:boolean,weak:boolean){
 c.save();c.lineJoin='round';
 for(const side of [-1,1]){c.save();c.scale(side,1);c.fillStyle='#182b35';c.strokeStyle='#7e9297';c.lineWidth=2;c.beginPath();c.moveTo(45,-16);c.lineTo(59,-23);c.lineTo(69,-12);c.lineTo(68,24);c.lineTo(55,32);c.lineTo(46,23);c.closePath();c.fill();c.stroke();
 c.fillStyle='#aa7043';c.fillRect(52,-9,9,24);c.strokeStyle='#e0b88c';c.lineWidth=1;for(let i=0;i<(weak?2:5);i++){const y=-6+i*(weak?14:5);c.beginPath();c.moveTo(52,y);c.lineTo(61,y-2);c.stroke();}
 c.strokeStyle='#7a8d91';c.lineWidth=3;c.beginPath();c.moveTo(56,-21);c.lineTo(56,-38);c.lineTo(64,-43);c.stroke();c.fillStyle=offline?'#87e6f1':linked?'#ffcc78':'#4b626e';c.globalAlpha=linked&&!offline?.7+.25*Math.sin(age*8)**2:1;c.fillRect(55,-19,7,5);c.restore();}
 c.restore();
}
export function controlTransmitter(c:CanvasRenderingContext2D,age:number,links:number,weak:boolean){
 c.save();c.lineJoin='round';
 for(const [i,side] of [-1,1].entries()){c.save();c.scale(side,1);c.strokeStyle='#758990';c.lineWidth=7;c.beginPath();c.moveTo(53,22);c.lineTo(73,13);c.lineTo(80,-9);c.stroke();c.strokeStyle='#344e5b';c.lineWidth=3;c.stroke();
 c.fillStyle='#172a36';c.strokeStyle='#9cacaa';c.lineWidth=2;c.beginPath();c.moveTo(61,-27);c.lineTo(77,-41);c.lineTo(92,-29);c.lineTo(91,-8);c.lineTo(77,4);c.lineTo(62,-9);c.closePath();c.fill();c.stroke();
 c.strokeStyle='#b78350';c.lineWidth=weak?2:3;c.beginPath();c.moveTo(67,-24);c.lineTo(77,-32);c.lineTo(86,-24);c.lineTo(84,-13);c.lineTo(77,-6);c.lineTo(68,-13);c.closePath();c.stroke();
 if(!weak){c.strokeStyle='#526f7f';c.lineWidth=1;for(const y of [-23,-17]){c.beginPath();c.moveTo(70,y);c.lineTo(84,y);c.stroke();}}
 c.fillStyle=links>i?'#ffd18b':'#4d6370';c.globalAlpha=links>i?.65+.3*Math.sin(age*7+i)**2:1;c.fillRect(74,-22,6,8);c.restore();}
 c.restore();
}
