import type{Bullet,Body}from'../core/world';import{MINELAYER,minelayerMuzzles}from'../core/minelayer';
/** Brackets delimit the mine's current solid footprint, never its future path. */
export function mineLight(c:CanvasRenderingContext2D,b:Pick<Bullet,'x'|'y'|'age'>,image:CanvasImageSource,weak:boolean){
 const frame=3+Math.min(2,Math.floor(b.age/.6)%3),r=MINELAYER.radius;
 c.save();c.fillStyle='#0007';c.beginPath();c.ellipse(b.x+4,b.y+8,r,r*.46,0,0,Math.PI*2);c.fill();
 c.drawImage(image,frame%3*256,256,256,256,b.x-48,b.y-48,96,96);
 c.translate(b.x,b.y);c.strokeStyle='#ff5f4d';c.lineWidth=weak?1.5:2;c.globalAlpha=weak?.7:.95;
 for(const sx of[-1,1])for(const sy of[-1,1]){c.beginPath();c.moveTo(sx*(r-11),sy*r);c.lineTo(sx*r,sy*r);c.lineTo(sx*r,sy*(r-11));c.stroke();}
 if(!weak){c.globalCompositeOperation='lighter';c.globalAlpha=.25+.15*Math.sin(b.age*7)**2;c.strokeStyle='#ff885b';c.lineWidth=2;c.beginPath();c.arc(0,0,17+3*Math.sin(b.age*6),0,Math.PI*2);c.stroke();}c.restore();
}
export function minelayerFlash(c:CanvasRenderingContext2D,b:Body,weak:boolean){
 const age=b.mineFiredAt===undefined?Infinity:b.age-b.mineFiredAt;if(age<0||age>.18)return;
 c.save();c.globalCompositeOperation='lighter';c.globalAlpha=(1-age/.18)*(weak?.4:.8);c.strokeStyle='#ffe0a1';c.lineWidth=weak?2:3;for(const p of minelayerMuzzles(b)){c.beginPath();c.ellipse(p.x,p.y,8+age*30,6+age*15,0,0,Math.PI*2);c.stroke();}c.restore();
}
