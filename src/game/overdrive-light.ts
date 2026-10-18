/** Gold rails and traveling induction collars mark an already-fired rail pulse. */
export function overdriveLance(c:CanvasRenderingContext2D,x:number,y:number,tx:number,ty:number,life:number,weak:boolean){
 if(life<=0)return;const dx=tx-x,dy=ty-y,length=Math.hypot(dx,dy);if(length<1)return;const nx=-dy/length,ny=dx/length,age=Math.max(0,.28-life),alpha=Math.min(1,life/.12);
 c.save();c.globalCompositeOperation='lighter';c.lineCap='round';
 const stroke=(width:number,color:string,opacity:number,offset=0)=>{c.globalAlpha=alpha*opacity;c.lineWidth=width;c.strokeStyle=color;c.beginPath();c.moveTo(x+nx*offset,y+ny*offset);c.lineTo(tx+nx*offset,ty+ny*offset);c.stroke();};
 if(!weak)stroke(30,'#70cfff',.12);stroke(weak?7:12,'#6bcdff',weak?.35:.5);stroke(weak?2:3,'#fff5ce',.95);stroke(1.5,'#ffc777',.8,8);stroke(1.5,'#ffc777',.8,-8);
 for(let i=0;i<(weak?2:4);i++){const t=(age*3+i/4)%1,px=x+dx*t,py=y+dy*t;c.globalAlpha=alpha*(weak?.35:.7);c.strokeStyle='#ffe3ac';c.lineWidth=1.6;c.beginPath();c.moveTo(px+nx*13,py+ny*13);c.lineTo(px+nx*6+dx/length*6,py+ny*6+dy/length*6);c.lineTo(px-nx*6+dx/length*6,py-ny*6+dy/length*6);c.lineTo(px-nx*13,py-ny*13);c.stroke();}
 c.globalAlpha=alpha*.7;c.strokeStyle='#a5e8ff';c.lineWidth=2;for(const r of[15,23]){c.beginPath();c.ellipse(x,y,r,r*.45,0,.2,Math.PI-.2);c.stroke();}c.restore();
}
