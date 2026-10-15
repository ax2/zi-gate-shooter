/** Local arrival shield and short wake around the actual machine, never a future shot line. */
export function dropLight(c:CanvasRenderingContext2D,x:number,y:number,remaining:number,weak:boolean){
 if(remaining<=0)return;const f=Math.min(1,remaining),r=32+(1-f)*16;
 c.save();c.translate(x,y);c.globalCompositeOperation='lighter';c.globalAlpha=Math.min(1,f*3)*(weak?.55:.8);
 for(let i=0;i<4;i++){const a=i*Math.PI/2+(1-f)*.5;c.strokeStyle=i%2?'#b6d2ff':'#8bffe3';c.lineWidth=weak?2:3;c.beginPath();c.arc(0,0,r,a,a+.9);c.stroke();}
 c.strokeStyle='#d8fbff';c.lineWidth=1.5;
 for(const side of [-1,1]){c.beginPath();c.moveTo(side*22,-55*f-20);c.lineTo(side*28,-28);c.lineTo(side*20,-12);c.stroke();}c.restore();
}
