/** A real instantaneous pellet bounce, distinct from the green electric chain.
 * Shares the existing 16 support traces; no filled panels or future trajectories. */
export function ricochetLight(c:CanvasRenderingContext2D,x:number,y:number,tx:number,ty:number,life:number,weak:boolean){
 if(life<=0)return;const alpha=Math.min(1,life/.1),age=.2-life,dx=tx-x,dy=ty-y,length=Math.hypot(dx,dy);
 if(length<1)return;const nx=-dy/length,ny=dx/length;
 c.save();c.globalCompositeOperation='lighter';c.globalAlpha=alpha;c.lineCap='round';
 const segment=(width:number,color:string)=>{c.lineWidth=width;c.strokeStyle=color;c.beginPath();c.moveTo(x,y);c.lineTo(tx,ty);c.stroke();};
 if(!weak)segment(9,'#efad3244');segment(weak?2:3,'#ffc35b');segment(1,'#fff2c6');
 // The short incoming scar shows the change of direction only after contact.
 c.strokeStyle='#ffe3a4';c.lineWidth=2;c.beginPath();c.moveTo(x,y+18);c.lineTo(x,y);c.lineTo(x+dx/length*22,y+dy/length*22);c.stroke();
 for(const [px,py] of [[x,y],[tx,ty]]){
  const reach=7+age*48;c.strokeStyle='#ffe2a0';c.lineWidth=weak?1:1.5;
  for(const side of [-1,1]){c.beginPath();c.moveTo(px+nx*side*3,py+ny*side*3);c.lineTo(px+nx*side*reach-dx/length*reach*.5,py+ny*side*reach-dy/length*reach*.5);c.stroke();}
 }
 if(!weak){c.strokeStyle='#fff5d3';c.lineWidth=1.5;for(let i=0;i<2;i++){const t=Math.min(1,age*4+i*.3),px=x+dx*t,py=y+dy*t;c.beginPath();c.moveTo(px-nx*3,py-ny*3);c.lineTo(px+dx/length*9,py+dy/length*9);c.lineTo(px+nx*3,py+ny*3);c.stroke();}}
 c.restore();
}
