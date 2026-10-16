/** The original danger marker follows its current velocity, without a future line. */
export function hostileShot(c:CanvasRenderingContext2D,b:{x:number;y:number;vx:number;vy:number}){
 c.save();c.translate(b.x,b.y);c.rotate(-Math.atan2(b.vx,b.vy));
 c.fillStyle='#ff7756';c.strokeStyle='#1a171d';c.lineWidth=3;c.beginPath();c.moveTo(-8,-7);c.lineTo(8,-7);c.lineTo(0,12);c.closePath();c.fill();c.stroke();
 c.fillStyle='#ffead7';c.fillRect(-2,-5,4,8);c.restore();
}
