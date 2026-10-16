/** Braced metal feet belong to the existing armor, not a new hit box or aim guide. */
export function batteryMount(c:CanvasRenderingContext2D,warning:number,offline:boolean,weak:boolean){
 c.save();c.lineJoin='round';
 for(const side of [-1,1]){
  c.fillStyle='#263741';c.strokeStyle='#b3bdba';c.lineWidth=2.5;c.beginPath();c.moveTo(side*31,17);c.lineTo(side*53,31);c.lineTo(side*59,54);c.lineTo(side*42,56);c.lineTo(side*40,37);c.lineTo(side*28,30);c.closePath();c.fill();c.stroke();
  c.strokeStyle='#687e89';c.lineWidth=5;c.beginPath();c.moveTo(side*40,55);c.lineTo(side*62,55);c.stroke();
  c.strokeStyle=offline?'#77e7f5':warning>0?'#ffc579':'#ad8a4e';c.lineWidth=weak?2:3;c.beginPath();c.moveTo(side*36,29);c.lineTo(side*47,38);c.lineTo(side*49,48);c.stroke();
 }
 c.restore();
}
