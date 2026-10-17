import type {Body} from '../core/world';
/** Original local hardware over the detailed elite atlas. No future shot paths. */
export function aceRig(c:CanvasRenderingContext2D,b:Body,weak:boolean){
 if(!b.aceRole)return;
 const elapsed=b.age-(b.aceFiredAt??-Infinity),pulse=elapsed>=0?Math.max(0,1-elapsed/.12):0,kick=pulse*5;
 const hot=b.aceEnraged?'#f0784e':'#dfb96c';
 c.save();c.globalCompositeOperation='source-over';c.lineJoin='round';
 const plate=(x:number,y:number,w:number,h:number)=>{
  c.fillStyle='#10202a';c.strokeStyle='#070f16';c.lineWidth=3;c.beginPath();c.moveTo(x+5,y);c.lineTo(x+w-4,y);c.lineTo(x+w,y+5);c.lineTo(x+w,y+h-4);c.lineTo(x+w-5,y+h);c.lineTo(x+4,y+h);c.lineTo(x,y+h-5);c.lineTo(x,y+5);c.closePath();c.fill();c.stroke();
  c.strokeStyle='#8fa1a7';c.lineWidth=1;c.beginPath();c.moveTo(x+5,y+2);c.lineTo(x+w-5,y+2);c.lineTo(x+w-2,y+6);c.stroke();
  c.fillStyle='#bac7c5';for(const px of [x+5,x+w-6])c.fillRect(px,y+5,2,2);
 };
 if(b.aceRole==='fan')for(const side of [-1,1]){
  const x=side*61-17;plate(x,9-kick,34,42);
  for(let i=0;i<3;i++){c.fillStyle='#8b9a9a';c.fillRect(x+5+i*9,30-kick,6,22);c.fillStyle='#111e26';c.fillRect(x+6+i*9,48-kick,4,6);}
  c.fillStyle=hot;for(let i=0;i<(b.aceEnraged?3:1);i++)c.fillRect(x+5+i*9,15-kick,6,3);
 }else{
  plate(-18,13-kick,36,60);c.fillStyle='#728c98';c.fillRect(-8,44-kick,16,39);c.fillStyle='#152630';c.fillRect(-4,47-kick,8,31);c.fillStyle='#bdd1d2';c.fillRect(-10,77-kick,20,6);c.fillStyle='#07131e';c.fillRect(-5,81-kick,10,5);
  for(let i=0;i<(b.aceEnraged?5:3);i++){c.fillStyle=hot;c.fillRect(-11,20+i*7-kick,5,3);c.fillRect(6,20+i*7-kick,5,3);}
 }
 if(b.warning>0){c.globalAlpha=.65;c.fillStyle=hot;c.fillRect(-12,-16,24,4);c.globalAlpha=1;}
 if(pulse>0){c.globalAlpha=pulse*.7;c.strokeStyle=hot;c.lineWidth=weak?1.5:2;const points=b.aceRole==='needle'?[0]:[-61,61];for(const x of points){const y=b.aceRole==='needle'?85:55;for(const side of [-1,1]){c.beginPath();c.moveTo(x+side*3,y-kick);c.lineTo(x+side*(weak?7:11),y+9-kick);c.stroke();}}}
 c.restore();
}
