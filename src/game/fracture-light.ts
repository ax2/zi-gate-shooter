/** Short local cracks communicate progress without predicting enemy shots. */
export function fractureMarks(c:CanvasRenderingContext2D,x:number,y:number,width:number,hits:number){
  c.save();c.translate(x,y);c.strokeStyle='#ffdc9d';c.lineWidth=2.5;
  for(let i=0;i<Math.min(2,hits);i++){
    const side=i?1:-1;c.beginPath();c.moveTo(side*width*.25,-12);c.lineTo(side*5,-2);
    c.lineTo(side*width*.2,5);c.lineTo(side*3,16);c.stroke();
  }
  for(let i=0;i<3;i++){c.fillStyle=i<hits?'#ffdc9d':'#314a58';c.fillRect(-15+i*12,-width*.55,8,5);}
  c.restore();
}

/** Segmented pressure ring and metal fragments accompany the original explosion atlas. */
export function fractureLight(c:CanvasRenderingContext2D,x:number,y:number,size:number,age:number,weak:boolean){
  if(age<0||age>=1)return;
  const fade=1-age,r=size*(.18+age*.82);
  c.save();c.translate(x,y);c.globalAlpha=fade*(weak?.65:.95);
  c.strokeStyle='#ffd9a0';c.lineWidth=weak?2:3;
  for(let i=0;i<6;i++){
    const angle=i*Math.PI/3+age*.3;c.beginPath();c.arc(0,0,r,angle,angle+Math.PI/5);c.stroke();
  }
  c.strokeStyle='#a2d7e8';c.lineWidth=2;
  for(let i=0;i<(weak?3:6);i++){
    const a=i*Math.PI/3+.4,travel=size*(.2+age*.8);
    c.save();c.translate(Math.cos(a)*travel,Math.sin(a)*travel);c.rotate(a+age*2);
    c.fillStyle='#526d7c';c.beginPath();c.moveTo(-8,-3);c.lineTo(4,-5);c.lineTo(9,3);c.lineTo(-4,5);c.closePath();c.fill();c.stroke();c.restore();
  }
  c.restore();
}
