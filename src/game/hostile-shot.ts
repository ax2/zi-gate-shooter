import{dangerDart}from'./danger-dart';
/** Current physical ammunition only; no future path or targeting forecast. */
export function hostileShot(c:CanvasRenderingContext2D,b:{x:number;y:number;vx:number;vy:number;bankRemaining?:number;boostAfter?:number;boostFactor?:number;age?:number},weak=false){
 if(b.boostFactor!==undefined){
  const fast=b.boostAfter===undefined;
  c.save();c.translate(b.x,b.y);c.rotate(-Math.atan2(b.vx,b.vy));
  c.fillStyle=fast?'#ff9b53':'#bc7050';c.beginPath();c.moveTo(-4,-13);c.lineTo(0,fast?-37:-23);c.lineTo(4,-13);c.fill();
  c.fillStyle='#202b34';c.strokeStyle='#ff7551';c.lineWidth=2;c.beginPath();c.moveTo(-6,-13);c.lineTo(-6,6);c.lineTo(0,16);c.lineTo(6,6);c.lineTo(6,-13);c.closePath();c.fill();c.stroke();
  c.fillStyle='#a7b6b9';c.fillRect(-4,-10,3,14);c.fillStyle='#a67b47';c.fillRect(-5,0,10,4);
  c.fillStyle='#677b84';for(const side of[-1,1]){c.beginPath();c.moveTo(side*5,-10);c.lineTo(side*11,-16);c.lineTo(side*9,-3);c.lineTo(side*5,1);c.closePath();c.fill();}
  c.fillStyle='#fff0c7';c.fillRect(-2,6,4,5);c.restore();return;
 }
 if(b.bankRemaining!==undefined){
  c.save();c.translate(b.x,b.y);c.rotate((b.age??0)*12);c.fillStyle='#331b22';c.strokeStyle='#ff7853';c.lineWidth=3;c.beginPath();c.arc(0,0,10,0,Math.PI*2);c.fill();c.stroke();
  c.strokeStyle='#b2b6ae';c.lineWidth=2;for(const a of [0,Math.PI]){c.beginPath();c.moveTo(Math.cos(a)*6,Math.sin(a)*6);c.lineTo(Math.cos(a)*12,Math.sin(a)*12);c.stroke();}
  c.fillStyle='#ffe9bf';c.beginPath();c.arc(0,0,3,0,Math.PI*2);c.fill();c.restore();return;
 }
 dangerDart(c,b,weak);
}
