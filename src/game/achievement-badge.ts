/** Run-earned UI stamp. Local metal geometry only; never creates combat particles. */
export function achievementBadge(c:CanvasRenderingContext2D,names:string,elapsed:number,weak:boolean){
 const t=Math.min(1,Math.max(0,elapsed/.18)),stamp=1+.18*(1-t)*(1-t);c.save();c.globalCompositeOperation='source-over';c.fillStyle='#102330';c.fillRect(40,1150,640,106);c.strokeStyle='#8d784d';c.lineWidth=1;c.strokeRect(41,1151,638,104);c.fillStyle='#b49b63';c.fillRect(41,1167,3,72);
 c.save();c.translate(94,1203);c.scale(stamp,stamp);c.fillStyle='#0a151e';c.beginPath();for(let i=0;i<16;i++){const a=i*Math.PI/8,r=i%2?27:31;if(i)c.lineTo(Math.cos(a)*r,Math.sin(a)*r);else c.moveTo(Math.cos(a)*r,Math.sin(a)*r);}c.closePath();c.fill();c.strokeStyle='#b29a68';c.lineWidth=2;c.stroke();
 c.fillStyle='#5b5140';c.beginPath();c.arc(0,0,24,0,Math.PI*2);c.fill();c.strokeStyle='#e5d09d';c.lineWidth=2;c.stroke();c.strokeStyle='#897b60';c.lineWidth=1;c.beginPath();c.arc(0,0,20,0,Math.PI*2);c.stroke();
 c.strokeStyle='#e5d7b3';c.lineWidth=3;c.lineJoin='round';c.beginPath();c.moveTo(-10,-5);c.lineTo(-3,1);c.lineTo(11,-9);c.moveTo(-10,4);c.lineTo(-3,10);c.lineTo(11,0);c.stroke();c.fillStyle='#c3b18d';for(const side of[-1,1]){c.fillRect(side*17-1,-12,2,3);c.fillRect(side*17-1,10,2,3);}
 if(!weak&&elapsed<.4){c.globalAlpha=(1-elapsed/.4)*.45;c.strokeStyle='#d6ba7d';c.lineWidth=1.5;c.beginPath();c.arc(0,0,29+elapsed*22,-Math.PI*.8,Math.PI*.25);c.stroke();}c.restore();
 c.textAlign='left';c.textBaseline='middle';c.font='700 26px "Microsoft YaHei",sans-serif';c.fillStyle='#ffdc8a';c.fillText('成就达成 · '+names,146,1187,514);c.font='20px "Microsoft YaHei",sans-serif';c.fillStyle='#b6cbd5';c.fillText('记录已保存 · 成就页可选择新目标',146,1226,514);c.restore();
}
