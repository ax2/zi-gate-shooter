/** The original danger marker follows its current velocity, without a future line. */
export function hostileShot(c:CanvasRenderingContext2D,b:{x:number;y:number;vx:number;vy:number;bankRemaining?:number;age?:number}){
 if(b.bankRemaining!==undefined){
  c.save();c.translate(b.x,b.y);c.rotate((b.age??0)*12);c.fillStyle='#331b22';c.strokeStyle='#ff7853';c.lineWidth=3;c.beginPath();c.arc(0,0,10,0,Math.PI*2);c.fill();c.stroke();
  c.strokeStyle='#b2b6ae';c.lineWidth=2;for(const a of [0,Math.PI]){c.beginPath();c.moveTo(Math.cos(a)*6,Math.sin(a)*6);c.lineTo(Math.cos(a)*12,Math.sin(a)*12);c.stroke();}
  c.fillStyle='#ffe9bf';c.beginPath();c.arc(0,0,3,0,Math.PI*2);c.fill();c.restore();return;
 }
 c.save();c.translate(b.x,b.y);c.rotate(-Math.atan2(b.vx,b.vy));
 c.fillStyle='#ff7756';c.strokeStyle='#1a171d';c.lineWidth=3;c.beginPath();c.moveTo(-8,-7);c.lineTo(8,-7);c.lineTo(0,12);c.closePath();c.fill();c.stroke();
 c.fillStyle='#ffead7';c.fillRect(-2,-5,4,8);c.restore();
}
