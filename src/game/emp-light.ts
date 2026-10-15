/** Earned discharge only: no predicted shot line or opaque screen flash. */
export function empWave(c:CanvasRenderingContext2D,x:number,y:number,radius:number,age:number,weak:boolean){
 const p=Math.min(1,Math.max(0,age));c.save();c.translate(x,y);c.globalCompositeOperation='lighter';
 for(let i=0;i<(weak?1:3);i++){const r=radius*Math.max(0,p-i*.13);if(r<1)continue;c.globalAlpha=(1-p)**1.5*(weak?.45:.65);c.strokeStyle=i%2?'#c5fff0':'#70e5ff';c.lineWidth=weak?2:3;
  for(let j=0;j<6;j++){const a=j*Math.PI/3+p*.3;c.beginPath();c.arc(0,0,r,a,a+.72);c.stroke();}}
 c.restore();
}
export function offlineLight(c:CanvasRenderingContext2D,x:number,y:number,width:number,remaining:number){
 if(remaining<=0)return;c.save();c.translate(x,y);c.globalCompositeOperation='lighter';c.strokeStyle='#a8f4ff';c.globalAlpha=.5+.2*Math.sin(remaining*24);c.lineWidth=2;
 for(const side of [-1,1]){c.beginPath();c.moveTo(side*width*.4,-17);c.lineTo(side*(width*.4+7),-7);c.lineTo(side*(width*.4-3),2);c.lineTo(side*(width*.4+5),15);c.stroke();}c.restore();
}
