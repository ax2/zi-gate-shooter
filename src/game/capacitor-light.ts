/** Local charge cells describe actual hits, never future hostile trajectories. */
export function capacitorMarks(c:CanvasRenderingContext2D,x:number,y:number,width:number,hits:number,time:number){
 c.save();c.translate(x,y);c.lineWidth=2;c.strokeStyle='#b6a0ee';
 for(let i=0;i<3;i++){c.fillStyle=i<hits?'#c6b5ff':'#243d48';c.fillRect(-19+i*14,width*.45,10,7);c.strokeRect(-19+i*14,width*.45,10,7);}
 c.globalAlpha=.6+.2*Math.sin(time*14);c.strokeStyle='#a5ffe4';
 for(let i=0;i<Math.min(2,hits);i++){const side=i?1:-1;c.beginPath();c.moveTo(side*width*.3,-15);c.lineTo(side*width*.22,-4);c.lineTo(side*width*.35,4);c.lineTo(side*width*.26,15);c.stroke();}c.restore();
}
/** Finite, layered electrical corona; no opaque fill over the machine or HUD. */
export function capacitorLight(c:CanvasRenderingContext2D,x:number,y:number,size:number,age:number,weak:boolean){
 if(age<0||age>=1)return;
 c.save();c.translate(x,y);c.globalAlpha=(1-age)*(weak?.7:.95);c.globalCompositeOperation='lighter';
 const radius=size*(.2+age*.8);
 for(let pass=0;pass<(weak?1:2);pass++){
  c.strokeStyle=pass?'#edfff8':'#a99aff';c.lineWidth=pass?1.5:5;c.beginPath();
  for(let j=0;j<=24;j++){const a=j*Math.PI/12,r=radius*(j%2?1:.75),px=Math.cos(a)*r,py=Math.sin(a)*r;if(j===0)c.moveTo(px,py);else c.lineTo(px,py);}c.stroke();
 }
 c.strokeStyle='#9bffda';c.lineWidth=2;
 for(let j=0;j<(weak?4:8);j++){const a=j*Math.PI/4+age*.8;c.save();c.rotate(a);c.beginPath();c.moveTo(radius*.35,0);c.lineTo(radius*.7,-5);c.lineTo(radius*.6,5);c.lineTo(radius*1.2,0);c.stroke();c.restore();}c.restore();
}
