/** Local, short-lived support beams: no full-screen flash or threat occlusion. */
export function supportLight(c:CanvasRenderingContext2D,x:number,y:number,tx:number,ty:number,life:number,laser:boolean,weak:boolean){
  const alpha=Math.min(1,life/.12);
  c.save();c.globalCompositeOperation='lighter';c.globalAlpha=alpha;
  c.lineCap='round';
  if(!weak){c.strokeStyle=laser?'#178de655':'#6aeaff55';c.lineWidth=laser?24:12;c.beginPath();c.moveTo(x,y);c.lineTo(tx,ty);c.stroke();}
  c.strokeStyle=laser?'#62dfff':'#a2f9ed';c.lineWidth=laser?7:3;c.beginPath();c.moveTo(x,y);c.lineTo(tx,ty);c.stroke();
  c.strokeStyle='#efffff';c.lineWidth=laser?2:1;c.beginPath();c.moveTo(x,y);c.lineTo(tx,ty);c.stroke();
  // Motion follows the actual hit segment; particles never imply a wider hit box.
  const dx=tx-x,dy=ty-y,length=Math.hypot(dx,dy);
  if(length>1 && !weak){
    const nx=-dy/length,ny=dx/length,age=(laser?.32:.12)-life;
    const count=laser?6:3;
    c.strokeStyle=laser?'#8beaff':'#b7ffdf';c.lineWidth=1.5;
    for(let i=0;i<count;i++){
      const t=(i/count+age*(laser?2:4))%1;
      const px=x+dx*t,py=y+dy*t;
      if(laser){
        const radius=7+Math.sin(t*Math.PI)*3;
        c.beginPath();c.moveTo(px+nx*radius-dx/length*5,py+ny*radius-dy/length*5);
        c.lineTo(px+nx*3,py+ny*3);c.lineTo(px-nx*radius-dx/length*5,py-ny*radius-dy/length*5);c.stroke();
      }else{
        c.beginPath();c.moveTo(px+nx*6,py+ny*6);c.lineTo(px+dx/length*5,py+dy/length*5);
        c.lineTo(px-nx*6,py-ny*6);c.lineTo(px-dx/length*5,py-dy/length*5);c.closePath();c.stroke();
      }
    }
    // Short radial discharge at the real impact point, separate from enemy debris.
    for(let i=0;i<6;i++){
      const angle=i*Math.PI/3+age*3,r=9+age*45;
      c.beginPath();c.moveTo(tx+Math.cos(angle)*r,ty+Math.sin(angle)*r);
      c.lineTo(tx+Math.cos(angle)*(r+7),ty+Math.sin(angle)*(r+7));c.stroke();
    }
  }
  c.strokeStyle='#87e8ff';c.lineWidth=2;c.beginPath();c.arc(tx,ty,(laser?10:6)+(1-alpha)*12,0,Math.PI*2);c.stroke();
  c.restore();
}


