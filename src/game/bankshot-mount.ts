import{BANKSHOT}from'../core/bankshot';
/** Annular launcher fitted to the original detailed armour; no projected paths. */
export function bankshotMount(c:CanvasRenderingContext2D,b:{age:number;warning:number;timer:number;bankFiredAt?:number;empRemaining?:number},weak:boolean){
 const charge=b.warning>0?Math.max(0,Math.min(1,1-b.timer/BANKSHOT.warning)):0,recoil=Math.max(0,1-(b.age-(b.bankFiredAt??-99))/.14);
 c.save();c.translate(0,-recoil*5);c.lineJoin='round';
 for(const side of [-1,1]){c.save();c.scale(side,1);c.fillStyle='#172a33';c.strokeStyle='#a4adab';c.lineWidth=2;c.beginPath();c.moveTo(16,19);c.lineTo(40,11);c.lineTo(55,24);c.lineTo(43,41);c.lineTo(21,45);c.closePath();c.fill();c.stroke();c.strokeStyle='#b68d61';c.lineWidth=3;c.beginPath();c.moveTo(24,24);c.lineTo(39,20);c.lineTo(44,26);c.stroke();if(!weak){c.fillStyle='#617a82';c.fillRect(32,30,12,3);c.fillRect(29,36,10,3);}c.restore();}
 c.fillStyle='#101c26';c.strokeStyle='#a9b5b0';c.lineWidth=3;c.beginPath();c.arc(0,39,18,0,Math.PI*2);c.fill();c.stroke();
 c.strokeStyle='#bd8a52';c.lineWidth=2;c.beginPath();c.arc(0,39,12,0,Math.PI*2);c.stroke();
 for(let i=0;i<(weak?3:6);i++){const a=i*Math.PI*2/(weak?3:6)+b.age*.6;c.fillStyle='#617f88';c.fillRect(Math.cos(a)*15-2,37+Math.sin(a)*15,4,4);}
 c.fillStyle=(b.empRemaining??0)>0?'#80d7e1':charge>0?'#ff9368':'#413a30';c.beginPath();c.arc(0,39,5+charge*3,0,Math.PI*2);c.fill();
 if(recoil>0){c.strokeStyle='#ffcf98';c.lineWidth=2;c.beginPath();c.arc(0,48,8+recoil*4,0,Math.PI);c.stroke();}c.restore();
}
