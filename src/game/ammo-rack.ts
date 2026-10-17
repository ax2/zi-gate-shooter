import type{BallisticBranch}from'../core/build-tree';
/** Physical two-cartridge carrier; all marks are local, with no aim/path preview. */
export function ammoRack(c:CanvasRenderingContext2D,x:number,y:number,base:BallisticBranch,extra:BallisticBranch,flash:number){
 c.save();c.translate(x,y);c.globalCompositeOperation='source-over';c.lineJoin='round';
 c.fillStyle='#091119';c.strokeStyle='#6b7e87';c.lineWidth=2;c.beginPath();c.moveTo(-30,-18);c.lineTo(25,-18);c.lineTo(31,-10);c.lineTo(31,17);c.lineTo(-25,17);c.lineTo(-30,10);c.closePath();c.fill();c.stroke();
 for(const [i,kind]of[base,extra].entries()){
  const px=-15+i*29;c.fillStyle='#293c47';c.fillRect(px-11,-13,22,24);c.fillStyle='#93a4aa';c.fillRect(px-10,-13,20,3);c.fillStyle='#13212c';c.fillRect(px-8,-7,16,15);
  c.strokeStyle=kind==='penetrator'?'#a9dcf0':kind==='fragment'?'#d9a65f':'#eacb79';c.lineWidth=2.5;c.beginPath();
  if(kind==='penetrator'){c.moveTo(px,6);c.lineTo(px,-6);c.lineTo(px-3,-2);c.moveTo(px,-6);c.lineTo(px+3,-2);}
  else if(kind==='fragment'){c.moveTo(px-5,-2);c.lineTo(px-2,-2);c.moveTo(px+2,-2);c.lineTo(px+5,-2);c.moveTo(px,1);c.lineTo(px,6);c.moveTo(px,-5);c.lineTo(px,-8);}
  else{c.moveTo(px-5,5);c.lineTo(px+4,-1);c.lineTo(px-3,-7);}c.stroke();
  if(flash>0){c.globalAlpha=Math.min(.65,flash);c.fillStyle=c.strokeStyle;c.fillRect(px-8,8,16,2);c.globalAlpha=1;}
 }
 c.fillStyle='#b1bec1';for(const px of[-25,26]){c.fillRect(px-1,-13,2,2);c.fillRect(px-1,11,2,2);}c.restore();
}
