/** Compact metal fragments on an actual impact; no opaque blast or preview ring. */
export function ammoFragmentLight(c:CanvasRenderingContext2D,x:number,y:number,age:number,weak:boolean){
 if(age<0||age>=1)return;
 const r=10+age*55;c.save();c.globalCompositeOperation='source-over';c.translate(x,y);c.globalAlpha=(1-age)*.8;c.lineWidth=weak?1.5:2;c.strokeStyle='#ca9c6c';
 c.beginPath();c.arc(0,0,r,-.8,.35);c.arc(0,0,r,1.2,2.3);c.arc(0,0,r,3.4,4.2);c.stroke();
 for(let i=0;i<(weak?3:6);i++){const a=i*Math.PI*2/(weak?3:6)+.3,d=r*.85,px=Math.cos(a)*d,py=Math.sin(a)*d;c.save();c.translate(px,py);c.rotate(a);c.fillStyle=i%2?'#5e727b':'#d2ac7b';c.strokeStyle='#16242e';c.lineWidth=1;c.beginPath();c.moveTo(-4,-2);c.lineTo(6,0);c.lineTo(-2,3);c.closePath();c.fill();c.stroke();c.restore();}
 c.restore();
}
