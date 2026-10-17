import{MIRROR_LASER,type MirrorSegment}from'../core/mirror-laser';
/** Actual resolved beam only: no future trajectory. Finite steel wall reflector. */
export function mirrorLight(c:CanvasRenderingContext2D,segments:readonly MirrorSegment[],life:number,bounced:boolean,weak:boolean){
 if(life<=0||!segments.length)return;const fade=Math.min(1,life/MIRROR_LASER.life);
 c.save();c.globalAlpha=fade;c.globalCompositeOperation='lighter';
 for(const s of segments){
  c.beginPath();c.moveTo(s.x,s.y);c.lineTo(s.tx,s.ty);c.lineWidth=weak?5:12;c.strokeStyle=weak?'#8eacde35':'#939fff26';c.stroke();
  c.lineWidth=weak?1.5:3;c.strokeStyle='#a4baff';c.stroke();
  if(!weak){c.lineWidth=1;c.strokeStyle='#f2eeff';c.stroke();}
 }
 if(bounced&&segments.length>1){
  const x=segments[0].tx,y=segments[0].ty,side=x<360?1:-1;
  c.globalCompositeOperation='source-over';c.translate(x,y);
  c.fillStyle='#14242f';c.strokeStyle='#91a5b0';c.lineWidth=1.5;
  c.beginPath();c.moveTo(-7*side,-15);c.lineTo(8*side,-8);c.lineTo(8*side,13);c.lineTo(-7*side,18);c.closePath();c.fill();c.stroke();
  c.strokeStyle='#c6d2d7';c.lineWidth=2;c.beginPath();c.moveTo(5*side,-9);c.lineTo(-3*side,10);c.stroke();
  c.globalCompositeOperation='lighter';c.strokeStyle='#d3ccff';c.lineWidth=weak?1:2;
  for(let i=0;i<(weak?2:4);i++){const dy=(i-1.5)*7;c.beginPath();c.moveTo(1,0);c.lineTo(side*(10+i*2),dy);c.stroke();}
 }
 c.restore();
}
/** Two mechanical facets around the existing optical lens; old housing retained. */
export function mirrorMount(c:CanvasRenderingContext2D,x:number,y:number,pulse:number){
 c.save();c.translate(x,y);c.lineWidth=1.2;
 for(const side of[-1,1]){c.fillStyle='#182b38';c.strokeStyle='#9aadb9';c.beginPath();c.moveTo(side*16,-20);c.lineTo(side*29,-13);c.lineTo(side*24,3);c.lineTo(side*15,-4);c.closePath();c.fill();c.stroke();c.strokeStyle=pulse>.2?'#d4c5ff':'#617db0';c.lineWidth=2;c.beginPath();c.moveTo(side*20,-15);c.lineTo(side*24,-11);c.lineTo(side*21,-1);c.stroke();}
 c.restore();
}
