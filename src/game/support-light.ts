/** Local, short-lived support beams: no full-screen flash or threat occlusion. */
export function supportLight(c:CanvasRenderingContext2D,x:number,y:number,tx:number,ty:number,life:number,laser:boolean,weak:boolean,prism=false,powerBand=1){
  if(life<=0)return;
  const band=Math.max(1,Math.min(3,powerBand));
  const alpha=Math.min(1,life/.12);
  c.save();c.globalCompositeOperation='lighter';c.globalAlpha=alpha;
  c.lineCap='round';
  if(prism){c.strokeStyle='#cb9dff';c.lineWidth=2;c.beginPath();c.moveTo(x,y-12);c.lineTo(x+9,y);c.lineTo(x,y+12);c.lineTo(x-9,y);c.closePath();c.stroke();}
  if(!weak){c.strokeStyle=prism?'#a348e655':laser?'#178de655':'#6aeaff55';c.lineWidth=laser?(prism?20:20+band*5):12;c.beginPath();c.moveTo(x,y);c.lineTo(tx,ty);c.stroke();}
  c.strokeStyle=prism?'#cb9dff':laser?'#62dfff':'#a2f9ed';c.lineWidth=prism?4:laser?5+band*2:3;c.beginPath();c.moveTo(x,y);c.lineTo(tx,ty);c.stroke();
  c.strokeStyle=prism?'#ead2ff':'#efffff';c.lineWidth=prism?1:laser?1.5+band*.5:1;c.beginPath();c.moveTo(x,y);c.lineTo(tx,ty);c.stroke();
  // Energy stays on the already-fired segment; no future path or wider hit box.
  const dx=tx-x,dy=ty-y,length=Math.hypot(dx,dy),age=(laser?.32:.12)-life;
  if(length>1){
    const nx=-dy/length,ny=dx/length;
    c.strokeStyle=prism?'#d8aaff':laser?'#8beaff':'#b7ffdf';c.lineWidth=1.5;
    if(laser){
      const count=weak?1:prism?2:band+1;
      for(let i=0;i<count;i++){
        const t=(i/count+age*2.8)%1,px=x+dx*t,py=y+dy*t,r=(prism?9:10+band*3)*(.6+.4*Math.sin(t*Math.PI));
        c.save();c.translate(px,py);c.rotate(Math.atan2(dy,dx));c.beginPath();c.ellipse(0,0,3+band,r,0,0,Math.PI*2);c.stroke();c.restore();
      }
      if(!weak&&!prism&&band===3){
        c.globalAlpha=alpha*.55;
        for(const side of [-1,1]){c.beginPath();for(let i=0;i<=16;i++){const t=i/16,wave=Math.sin(t*Math.PI*5-age*28)*12*side,px=x+dx*t+nx*wave,py=y+dy*t+ny*wave;if(i)c.lineTo(px,py);else c.moveTo(px,py);}c.stroke();}
        c.globalAlpha=alpha;
      }
    }else if(!weak){
      for(let i=0;i<3;i++){
        const t=(i/3+age*4)%1,px=x+dx*t,py=y+dy*t;
        c.beginPath();c.moveTo(px+nx*6,py+ny*6);c.lineTo(px+dx/length*5,py+dy/length*5);c.lineTo(px-nx*6,py-ny*6);c.lineTo(px-dx/length*5,py-dy/length*5);c.closePath();c.stroke();
      }
    }
  }
  // Laser impact crowns are emitted only by real damage/charging contacts.
  if(!laser){c.strokeStyle='#87e8ff';c.lineWidth=2;c.beginPath();c.arc(tx,ty,6+(1-alpha)*12,0,Math.PI*2);c.stroke();}
  c.restore();
}



/** Short, transparent contact crown; shares the normal impact budget. */
export function opticalImpactLight(c:CanvasRenderingContext2D,x:number,y:number,life:number,band:number,weak:boolean,prism=false){
  if(life<=0)return;const t=1-Math.min(1,life/.22),r=14+band*6+t*18;
  c.save();c.translate(x,y);c.globalCompositeOperation='lighter';c.globalAlpha=(1-t)*(weak?.65:.9);
  c.strokeStyle=prism?'#d5aaff':'#85eaff';c.lineWidth=weak?1.5:2.5;c.beginPath();c.ellipse(0,0,r,r*.62,-.2,0,Math.PI*2);c.stroke();
  if(!weak){c.strokeStyle=prism?'#f3d9ff':'#edffff';c.lineWidth=1.4;for(let i=0;i<6;i++){const a=i*Math.PI/3+t*.8;c.beginPath();c.moveTo(Math.cos(a)*(r+4),Math.sin(a)*(r+4));c.lineTo(Math.cos(a)*(r+15),Math.sin(a)*(r+15));c.stroke();}}
  c.restore();
}
/** Shot-driven light over the existing detailed crystal module, never a replacement body. */
export function opticalEmitterLight(c:CanvasRenderingContext2D,x:number,y:number,pulse:number,band:number,weak:boolean){
  if(pulse<=0)return;const r=10+band*4+(1-pulse)*7;
  c.save();c.translate(x,y);c.globalCompositeOperation='lighter';c.globalAlpha=pulse*(weak?.6:.9);
  c.strokeStyle='#8cecff';c.lineWidth=weak?1.5:2.5;
  for(let i=0;i<(weak?1:band);i++){const angle=i*Math.PI*2/band+(1-pulse)*2;c.beginPath();c.ellipse(0,0,r+i*2,(r+i*2)*.5,-.2,angle,angle+Math.PI*1.3);c.stroke();}
  c.strokeStyle='#f2efff';c.lineWidth=2;c.beginPath();c.moveTo(0,4);c.lineTo(0,-18-band*5);c.stroke();c.restore();
}
