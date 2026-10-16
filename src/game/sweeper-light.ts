/** Short jets stay beside the current machine; no future flight/shooting path. */
export function sweeperLight(c:CanvasRenderingContext2D,direction:number,age:number,weak:boolean,edge=25){
 if(!direction)return;
 c.save();c.globalCompositeOperation='lighter';
 for(const y of [-20,0,20]){
  const length=(weak?12:20)+Math.sin(age*35+y)**2*8;
  c.globalAlpha=weak?.45:.75;c.fillStyle='#61cfff';c.beginPath();c.moveTo(-direction*edge,y-4);c.lineTo(-direction*(edge+9+length),y+Math.sin(age*40)*2);c.lineTo(-direction*edge,y+4);c.fill();
  c.globalAlpha=weak?.7:1;c.strokeStyle='#e8fdff';c.lineWidth=2;c.beginPath();c.moveTo(-direction*edge,y);c.lineTo(-direction*(edge+13),y);c.stroke();
 }c.restore();
}
