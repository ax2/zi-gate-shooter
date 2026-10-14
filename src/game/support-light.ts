/** Local, short-lived support beams: no full-screen flash or threat occlusion. */
export function supportLight(c:CanvasRenderingContext2D,x:number,y:number,tx:number,ty:number,life:number,laser:boolean,weak:boolean){
  const alpha=Math.min(1,life/.12);
  c.save();c.globalCompositeOperation='lighter';c.globalAlpha=alpha;
  c.lineCap='round';
  if(!weak){c.strokeStyle=laser?'#178de655':'#6aeaff55';c.lineWidth=laser?24:12;c.beginPath();c.moveTo(x,y);c.lineTo(tx,ty);c.stroke();}
  c.strokeStyle=laser?'#62dfff':'#a2f9ed';c.lineWidth=laser?7:3;c.beginPath();c.moveTo(x,y);c.lineTo(tx,ty);c.stroke();
  c.strokeStyle='#efffff';c.lineWidth=laser?2:1;c.beginPath();c.moveTo(x,y);c.lineTo(tx,ty);c.stroke();
  c.strokeStyle='#87e8ff';c.lineWidth=2;c.beginPath();c.arc(tx,ty,(laser?10:6)+(1-alpha)*12,0,Math.PI*2);c.stroke();
  c.restore();
}


