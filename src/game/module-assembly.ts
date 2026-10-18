import{C}from'../core/config';import{weaponColors,type WeaponKind}from'../core/weapons';
export const MODULE_ASSEMBLY_DURATION=.85;
/** Self-mounted latches close around the actual owned module, never a danger lane. */
export function moduleAssembly(c:CanvasRenderingContext2D,x:number,y:number,size:number,kind:WeaponKind,age:number,weak:boolean){
 if(age<0||age>=MODULE_ASSEMBLY_DURATION)return;
 const p=age/MODULE_ASSEMBLY_DURATION,outer=Math.min(size*.58,x-6,C.width-x-6);if(outer<12)return;
 const r=Math.min(size*.3,outer-10),travel=Math.min(1,p/.52),lock=travel*travel*(3-2*travel),distance=r+(outer-r-5)*(1-lock),h=size*.22,fade=p<.7?1:(1-p)/.3;
 c.save();c.translate(x,y);c.globalCompositeOperation='source-over';c.globalAlpha=fade;c.lineJoin='round';
 for(const side of[-1,1]){
  const mx=side*distance;
  c.strokeStyle='#091923';c.lineWidth=5;c.beginPath();c.moveTo(side*(r-5),h*.65);c.lineTo(mx,h*.65);c.stroke();c.strokeStyle='#8a9fa8';c.lineWidth=2;c.stroke();
  c.fillStyle='#263d4c';c.strokeStyle='#08141e';c.lineWidth=2;c.beginPath();c.moveTo(mx-4,-h);c.lineTo(mx+4,-h+4);c.lineTo(mx+4,h);c.lineTo(mx-4,h-4);c.closePath();c.fill();c.stroke();
  c.fillStyle='#bacbd0';c.fillRect(mx-3,-h+3,2,h*2-8);c.fillStyle='#14232d';c.fillRect(mx-1,-h+6,3,h*2-14);
  for(let i=0;i<3;i++){const yy=-h+8+i*6;c.fillStyle=weaponColors[kind];c.fillRect(mx-1,yy,3,2);}
  c.fillStyle='#9db3b8';for(const end of[-1,1]){c.beginPath();c.moveTo(mx,end*(h-3));c.lineTo(mx-side*7,end*(h-3));c.lineTo(mx-side*7,end*(h-7));c.lineTo(mx,end*(h-7));c.closePath();c.fill();}
  if(!weak&&p>.4&&p<.72){const heat=1-Math.abs(p-.56)/.16;c.globalAlpha=fade*heat;c.strokeStyle='#ffe4ad';c.lineWidth=1.3;for(const end of[-1,1]){c.beginPath();c.moveTo(mx-side*7,end*(h-5));c.lineTo(mx-side*(10+heat*4),end*(h+heat*5));c.stroke();}c.globalAlpha=fade;}
 }
 c.restore();
}
