/** Defensive hull segments, never a future enemy shot path. No opaque screen fill. */
export function formationShield(c:CanvasRenderingContext2D,x:number,y:number,time:number,breakAge:number,weak:boolean){
  const breaking=breakAge>0,r=214+breakAge*90,alpha=breaking?1-breakAge:.52;
  c.save();c.translate(x,y);c.scale(1,.62);c.globalCompositeOperation='lighter';
  c.strokeStyle='#8ce8ff';c.globalAlpha=alpha*(weak?.55:1);c.lineWidth=breaking?2:3;
  for(let i=0;i<12;i++){
    const a=i*Math.PI/6+Math.sin(time*.8)*.04;
    c.beginPath();c.arc(0,0,r,a,a+Math.PI/8);c.stroke();
    if(!weak&&!breaking){
      c.globalAlpha=alpha*.25;c.lineWidth=8;c.beginPath();c.arc(0,0,r+5,a,a+Math.PI/8);c.stroke();
      c.globalAlpha=alpha;c.lineWidth=3;
    }
  }
  c.restore();
}
