/** Hull-local heat plumes: the enemy silhouette and hostile shots remain legible. */
export function burnLight(c:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,time:number,weak:boolean){
  c.save();c.translate(x,y);
  for(const side of [-1,1]){
    const sway=Math.sin(time*19+side)*w*.06;
    c.globalCompositeOperation='lighter';c.globalAlpha=weak?.2:.35;c.fillStyle='#ff943f';
    c.beginPath();c.moveTo(side*w*.32,h*.22);
    c.bezierCurveTo(side*w*.5,h*.03,side*w*.63,-h*.18,side*w*.46+sway,-h*.6);
    c.quadraticCurveTo(side*w*.44,-h*.06,side*w*.32,h*.22);c.closePath();c.fill();
    c.globalAlpha=.9;c.strokeStyle='#fff1d0';c.lineWidth=weak?1.5:2.5;
    c.beginPath();c.moveTo(side*w*.4,h*.12);
    c.bezierCurveTo(side*w*.52,-h*.04,side*w*.38,-h*.18,side*w*.44+sway,-h*.4);c.stroke();
  }
  for(let i=0;i<(weak?3:7);i++){
    const phase=(time*1.9+i*.173)%1,side=i%2?1:-1;
    c.globalAlpha=(1-phase)*.9;c.fillStyle=i%3?'#ffca72':'#fff4dd';
    const ex=side*w*(.25+Math.sin(i*4.7)*.18),ey=h*(.1-phase*.9),r=2+(1-phase)*1.5;
    c.beginPath();c.moveTo(ex,ey-r);c.lineTo(ex+r*.6,ey);c.lineTo(ex,ey+r);c.lineTo(ex-r*.6,ey);c.closePath();c.fill();
  }
  c.restore();
}
