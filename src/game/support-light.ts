const turn=Math.PI*2;
function segment(c:CanvasRenderingContext2D,x:number,y:number,tx:number,ty:number,width:number,color:string){c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(x,y);c.lineTo(tx,ty);c.stroke();}
/** Only the already-fired segment receives light; widths are presentation, not hit boxes. */
export function supportLight(c:CanvasRenderingContext2D,x:number,y:number,tx:number,ty:number,life:number,laser:boolean,weak:boolean,prism=false,powerBand=1){
  if(life<=0)return;
  const dx=tx-x,dy=ty-y,length=Math.hypot(dx,dy);if(length<1)return;
  if(laser){laserPulse(c,x,y,tx,ty,life,weak,prism,Math.max(1,Math.min(3,powerBand)));return;}
  const alpha=Math.min(1,life/.12),nx=-dy/length,ny=dx/length,age=Math.max(0,.12-life);
  c.save();c.globalCompositeOperation='lighter';c.globalAlpha=alpha;c.lineCap='round';
  if(!weak)segment(c,x,y,tx,ty,12,'#6aeaff55');
  segment(c,x,y,tx,ty,3,'#a2f9ed');segment(c,x,y,tx,ty,1,'#efffff');
  if(!weak){c.strokeStyle='#b7ffdf';c.lineWidth=1.5;for(let i=0;i<3;i++){const t=(i/3+age*4)%1,px=x+dx*t,py=y+dy*t;c.beginPath();c.moveTo(px+nx*6,py+ny*6);c.lineTo(px+dx/length*5,py+dy/length*5);c.lineTo(px-nx*6,py-ny*6);c.lineTo(px-dx/length*5,py-dy/length*5);c.closePath();c.stroke();}}
  c.strokeStyle='#87e8ff';c.lineWidth=2;c.beginPath();c.arc(tx,ty,6+(1-alpha)*12,0,turn);c.stroke();c.restore();
}
function laserPulse(c:CanvasRenderingContext2D,x:number,y:number,tx:number,ty:number,life:number,weak:boolean,prism:boolean,band:number){
  const dx=tx-x,dy=ty-y,length=Math.hypot(dx,dy),nx=-dy/length,ny=dx/length,age=Math.max(0,.32-life),alpha=Math.min(1,life/.16),shock=Math.max(0,1-age/.055),tint=prism?'#c89aff':'#62dfff';
  c.save();c.globalCompositeOperation='lighter';c.globalAlpha=alpha*(prism?.78:1);c.lineCap='round';
  if(!weak)segment(c,x,y,tx,ty,prism?18:Math.min(35,20+band*5),prism?'#9549d944':'#1389df44');
  segment(c,x,y,tx,ty,prism?3.5:5+band*2+shock,tint);
  segment(c,x,y,tx,ty,prism?1:1.5+band*.5+shock*.5,prism?'#efdaff':'#efffff');
  // Counterwound filaments taper to the exact endpoints, never into future space.
  const rails=weak?0:prism?1:band>=2?2:0;
  for(let rail=0;rail<rails;rail++){
    const side=rail?1:-1,amplitude=prism?4:3+band*2;
    c.strokeStyle=prism?'#edbbff':rail?'#a99bff':'#a5f8ff';c.lineWidth=prism?1:1.3;c.globalAlpha=alpha*(prism?.5:.66);c.beginPath();
    for(let i=0;i<=20;i++){const t=i/20,wave=Math.sin(t*Math.PI*(band+2)-age*38)*Math.sin(t*Math.PI)*amplitude*side,px=x+dx*t+nx*wave,py=y+dy*t+ny*wave;if(i)c.lineTo(px,py);else c.moveTo(px,py);}c.stroke();
  }
  const count=weak?1:prism?2:band+1;
  for(let i=0;i<count;i++){
    const t=(i/count+age*3.5)%1,px=x+dx*t,py=y+dy*t,r=(prism?8:6+band*3)*(.65+.35*Math.sin(t*Math.PI));
    c.save();c.translate(px,py);c.rotate(Math.atan2(dy,dx));c.globalAlpha=alpha*(.3+.55*Math.sin(t*Math.PI));c.strokeStyle=prism?'#e7b8ff':'#baf7ff';c.lineWidth=weak?1.2:1.8;c.beginPath();
    if(prism){c.moveTo(0,-r);c.lineTo(4,0);c.lineTo(0,r);c.lineTo(-4,0);c.closePath();}else c.ellipse(0,0,2+band,r,0,0,turn);c.stroke();
    if(!weak&&!prism&&band>=2){for(const side of [-1,1]){c.beginPath();c.moveTo(-4,side*r);c.lineTo(0,side*(r+3));c.lineTo(4,side*r);c.stroke();}}c.restore();
  }
  // A prism's origin is an optical vertex, not a fabricated target impact.
  if(prism){c.globalAlpha=alpha*.8;c.strokeStyle='#d5a7ff';c.lineWidth=1.5;c.beginPath();c.moveTo(x,y-11);c.lineTo(x+8,y);c.lineTo(x,y+11);c.lineTo(x-8,y);c.closePath();c.stroke();}
  c.restore();
}
/** Real HP-loss/charging contacts only. Transparent arcs and bounded glass-like fragments. */
export function opticalImpactLight(c:CanvasRenderingContext2D,x:number,y:number,life:number,band:number,weak:boolean,prism=false){
  if(life<=0)return;band=Math.max(1,Math.min(3,band));const t=1-Math.min(1,life/.22),r=14+band*5+t*18;
  c.save();c.translate(x,y);c.globalCompositeOperation='lighter';c.globalAlpha=(1-t)*(weak?.65:.85);c.strokeStyle=prism?'#d5aaff':'#85eaff';c.lineWidth=weak?1.5:2+(1-t)*band*.5;c.beginPath();c.ellipse(0,0,r,r*(.5+t*.14),-.2,0,turn);c.stroke();
  const shards=weak?1:2+band;c.fillStyle=prism?'#ecd3ff':'#ddfcff';c.strokeStyle=prism?'#edc8ff':'#b4f4ff';c.lineWidth=1;
  for(let i=0;i<shards;i++){const a=i*turn/shards+.4+t*.7,ux=Math.cos(a),uy=Math.sin(a),distance=r+5+t*5,px=ux*distance,py=uy*distance,size=weak?4:5+band;c.beginPath();c.moveTo(px+ux*size,py+uy*size);c.lineTo(px-uy*2,py+ux*2);c.lineTo(px-ux*size,py-uy*size);c.closePath();c.fill();}
  c.restore();
}
/** Shot-driven light stays over the existing detailed crystal module. */
export function opticalEmitterLight(c:CanvasRenderingContext2D,x:number,y:number,pulse:number,band:number,weak:boolean){
  if(pulse<=0)return;const r=10+band*4+(1-pulse)*7;
  c.save();c.translate(x,y);c.globalCompositeOperation='lighter';c.globalAlpha=pulse*(weak?.6:.9);c.strokeStyle='#8cecff';c.lineWidth=weak?1.5:2.5;
  for(let i=0;i<(weak?1:band);i++){const angle=i*turn/band+(1-pulse)*2;c.beginPath();c.ellipse(0,0,r+i*2,(r+i*2)*.5,-.2,angle,angle+Math.PI*1.3);c.stroke();}
  c.strokeStyle='#f2efff';c.lineWidth=2;c.beginPath();c.moveTo(0,4);c.lineTo(0,-18-band*5);c.stroke();c.restore();
}
/** Own-weapon capacitor, fed only by the authoritative cooldown fraction. */
export function opticalChargeLight(c:CanvasRenderingContext2D,x:number,y:number,charge:number,band:number,weak:boolean,prism=false){
  charge=Math.max(0,Math.min(1,charge));if(charge<.03)return;band=Math.max(1,Math.min(3,band));
  const r=12+band*3,segments=weak?6:6+band*2,gap=.13,part=turn/segments;
  c.save();c.translate(x,y);c.scale(1,.65);c.globalCompositeOperation='lighter';c.lineCap='round';c.lineWidth=weak?1.5:2;
  for(let i=0;i<segments;i++){
    const a=-Math.PI/2+i*part,amount=Math.max(0,Math.min(1,charge*segments-i));c.globalAlpha=.17;c.strokeStyle=prism?'#a08bc4':'#6fabc2';c.beginPath();c.arc(0,0,r,a,a+part-gap);c.stroke();
    if(amount>0){c.globalAlpha=.35+charge*.5;c.strokeStyle=prism?'#d5b3ff':'#89edff';c.beginPath();c.arc(0,0,r,a,a+(part-gap)*amount);c.stroke();}
  }
  if(!weak&&band>=2&&charge>.7){c.globalAlpha=(charge-.7)*2;c.strokeStyle='#d9fbff';c.lineWidth=1.5;for(const side of [-1,1]){c.beginPath();c.moveTo(side*(r+7),14);c.lineTo(side*(r-2),8);c.stroke();}}
  c.restore();
}
