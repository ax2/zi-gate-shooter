/** A solid current projectile with a short rear heat wake, never an aim line.
 * The lit shell is identical in weak mode; only the aft heat layers reduce. */
export function dangerDart(c:CanvasRenderingContext2D,b:{x:number;y:number;vx:number;vy:number;age?:number},weak:boolean){
 c.save();c.translate(b.x,b.y);c.rotate(-Math.atan2(b.vx,b.vy));c.globalCompositeOperation='source-over';c.globalAlpha=1;
 const tail=weak?8:14+Math.min(12,Math.hypot(b.vx,b.vy)*.015),heat=.55+.15*Math.sin((b.age??0)*31)**2;
 // Tail stays behind the rear cap. Never project a line in front of the tip.
 c.strokeStyle='#08131b';c.lineWidth=weak?4:6;c.beginPath();c.moveTo(0,-11);c.lineTo(0,-11-tail);c.stroke();
 c.globalAlpha=heat;c.strokeStyle='#f05c48';c.lineWidth=weak?1:2;c.beginPath();c.moveTo(0,-11);c.lineTo(0,-11-tail);c.stroke();
 if(!weak){c.globalAlpha=.45;c.strokeStyle='#ffb179';c.lineWidth=1;for(const side of[-1,1]){c.beginPath();c.moveTo(side*3,-13);c.lineTo(side*2,-21);c.stroke();}}
 c.globalAlpha=1;c.fillStyle='#24313b';c.strokeStyle='#070e16';c.lineWidth=3;
 c.beginPath();c.moveTo(0,11);c.lineTo(-5,5);c.lineTo(-7,-5);c.lineTo(-5,-11);c.lineTo(5,-11);c.lineTo(7,-5);c.lineTo(5,5);c.closePath();c.fill();c.stroke();
 // Hard metal facets stay opaque against both luminous effects and dark road.
 c.fillStyle='#9aacb2';c.beginPath();c.moveTo(-5,-9);c.lineTo(-1,-8);c.lineTo(-1,7);c.lineTo(-4,3);c.closePath();c.fill();
 c.fillStyle='#526570';c.beginPath();c.moveTo(2,-8);c.lineTo(5,-9);c.lineTo(5,-4);c.lineTo(3,4);c.closePath();c.fill();
 c.fillStyle='#c93f37';c.fillRect(-2,-8,4,14);c.fillStyle='#ff9e7f';c.fillRect(-1,-7,2,11);
 c.strokeStyle='#ff604e';c.lineWidth=1.5;c.beginPath();c.moveTo(-6,-5);c.lineTo(-4,5);c.lineTo(0,10);c.lineTo(4,5);c.lineTo(6,-5);c.stroke();
 c.strokeStyle='#192832';c.lineWidth=1.5;for(const y of[-5,-1]){c.beginPath();c.moveTo(-5,y);c.lineTo(-2,y);c.moveTo(2,y);c.lineTo(5,y);c.stroke();}
 c.fillStyle='#fff0d8';c.beginPath();c.moveTo(-2,4);c.lineTo(0,9);c.lineTo(2,4);c.closePath();c.fill();c.restore();
}
