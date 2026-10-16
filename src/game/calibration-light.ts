import {weaponColors,type WeaponKind} from '../core/weapons';
import type {CalibrationBand} from '../core/calibration-visual';
const turn=Math.PI*2;
function path(c:CanvasRenderingContext2D,points:number[],width:number,color:string){c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(points[0],points[1]);for(let i=2;i<points.length;i+=2)c.lineTo(points[i],points[i+1]);c.stroke();}
/** Finite jackets follow the real shot axis; the original detailed projectile remains on top. */
export function calibrationShot(c:CanvasRenderingContext2D,x:number,y:number,vx:number,vy:number,kind:WeaponKind,band:CalibrationBand,age:number,weak:boolean){
 if(!band)return;const color=weaponColors[kind],edge=5+band*2;
 c.save();c.translate(x,y);c.rotate(Math.atan2(vx,-vy));c.globalCompositeOperation='screen';c.globalAlpha=weak?.5:.72;c.lineCap='round';
 if(kind==='pulse')for(let i=0;i<(weak?1:band);i++){const yy=8+i*10;path(c,[-edge,yy+5,0,yy,edge,yy+5],weak?1:1.5,color);}
 else if(kind==='scatter')for(const side of [-1,1])path(c,[side*4,3,side*(9+band*2),18,side*5,13],weak?1:1.5,color);
 else if(kind==='pierce')for(const side of [-1,1]){const e=4+band;path(c,[side*3,-13,side*e,-6,side*e,32+band*7,side*3,39+band*7],weak?1:1.6,color);if(!weak&&band>=2){const yy=6+(age*7%1)*26;path(c,[side*e,yy,side*e,yy+7],2,'#f6e6ff');}}
 else if(kind==='blast'){
  c.strokeStyle=color;c.lineWidth=weak?1:1.7;c.beginPath();c.ellipse(0,2,8+band*2,10+band*3,0,0,turn);c.stroke();
  if(!weak){const e=12+band*2;path(c,[0,-13,e,2,0,17,-e,2,0,-13],1.3,'#ffdb9b');}
 }else{
  for(const side of [-1,1]){path(c,[0,-8,side*edge,6,side*(edge-3),20,side*edge,34],weak?1:1.5,color);if(!weak&&band>=2)path(c,[side*edge,26,side*(edge-4),40,0,50],1,'#d6ffb8');}
  if(band>=2){c.strokeStyle='#d6ffb8';c.lineWidth=1;for(let i=0;i<(weak?1:band-1);i++){c.beginPath();c.ellipse(0,10+i*15,edge*.85,2.5,0,0,turn);c.stroke();}}
 }
 if(!weak)path(c,[-2,-12,2,-12],1.4,'#f7fff3');c.restore();
}
/** Metal brackets and etched grade marks stay on the owned module. Light is driven by a real shot impulse. */
export function calibrationMount(c:CanvasRenderingContext2D,x:number,y:number,size:number,kind:WeaponKind,band:CalibrationBand,pulse:number,weak:boolean){
 if(!band)return;const color=weaponColors[kind],e=16+band*2;
 c.save();c.translate(x,y);c.scale(size/100,size/100);c.lineJoin='round';c.lineCap='round';
 const shape=(side:number)=>kind==='scatter'?[side*12,16,side*29,5,side*34,-14]:kind==='pierce'?[side*e,17,side*e,-27,side*(e-6),-32]:kind==='arc'?[side*e,16,side*(e-4),2,side*e,-12,side*(e-4),-22]:kind==='blast'?[side*12,14,side*25,8,side*25,-8,side*12,-14]:[side*e,16,side*e,-9,side*(e-7),-15];
 for(const side of [-1,1]){path(c,shape(side),9,'#101a23');path(c,shape(side),6,'#485d68');path(c,shape(side),1.4,'#d4e1db');}
 c.globalCompositeOperation='screen';c.globalAlpha=(weak?.4:.55)+Math.max(0,Math.min(1,pulse))*.3;
 for(const side of [-1,1])for(let i=0;i<band;i++){const yy=12-i*8;path(c,[side*(e-3),yy+2,side*(e+3),yy-1],weak?1.7:2.2,color);}
 if(!weak&&pulse>0){c.globalAlpha=pulse*.65;for(const side of [-1,1])path(c,[side*(e+4),-5,side*(e+8),-11-band*2],1.4,color);}
 c.restore();
}
