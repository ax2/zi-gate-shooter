import type{Body}from'../core/world';import{RAKE,rakeBarrelAngle}from'../core/rake-gun';
/** Machined swivel cradle on the existing armour sprite. No projected trajectory. */
export function rakeMount(c:CanvasRenderingContext2D,b:Body,weak:boolean){
 const recoil=Math.max(0,1-(b.age-(b.rakeFiredAt??-99))/.12),charge=b.warning>0?Math.max(0,1-b.timer/RAKE.warning):0;
 c.save();c.translate(0,RAKE.pivot);c.fillStyle='#17262e';c.strokeStyle='#a8b8ba';c.lineWidth=2;
 c.beginPath();c.moveTo(-27,-18);c.lineTo(27,-18);c.lineTo(34,9);c.lineTo(22,22);c.lineTo(-22,22);c.lineTo(-34,9);c.closePath();c.fill();c.stroke();
 for(const side of[-1,1]){c.fillStyle='#5e747d';c.fillRect(side*27-4,-8,8,22);c.fillStyle='#182b35';c.fillRect(side*27-2,-4,4,10);}
 c.fillStyle='#415964';c.beginPath();c.arc(0,0,19,0,Math.PI*2);c.fill();c.stroke();
 c.strokeStyle='#c29b68';c.lineWidth=2;c.beginPath();c.arc(0,0,14,.2,Math.PI*1.8);c.stroke();
 c.rotate(-rakeBarrelAngle(b));c.translate(0,-recoil*6);
 for(const x of[-9,0,9]){c.fillStyle='#263d49';c.strokeStyle='#0b1b24';c.lineWidth=2;c.fillRect(x-4,1,8,35);c.strokeRect(x-4,1,8,35);c.fillStyle='#9cb0b6';c.fillRect(x-3,4,2,25);c.fillStyle='#141f28';c.fillRect(x-4,31,8,7);c.fillStyle='#ccac78';c.fillRect(x-3,31,6,2);}
 c.strokeStyle='#788d98';c.lineWidth=2;c.strokeRect(-15,14,30,5);
 if(charge>0){c.fillStyle=`rgba(255,153,91,${.3+charge*.6})`;for(const x of[-9,0,9])c.fillRect(x-2,34,4,3);}
 if(recoil>0){c.globalCompositeOperation='lighter';c.globalAlpha=recoil;for(const x of[-9,0,9]){c.fillStyle='#ffb16c';c.beginPath();c.moveTo(x-4,38);c.lineTo(x,weak?48:56);c.lineTo(x+4,38);c.fill();c.fillStyle='#fff2ce';c.fillRect(x-1,38,2,8);}}
 c.restore();
}
