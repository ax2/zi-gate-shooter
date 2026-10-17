import type{Body}from'../core/world';import{CONTROL_SHUTTER,shutterClosed}from'../core/control-shutter';
/** Narrow steel leaves retain the detailed machine core and move on visible guides. */
export function controlShutter(c:CanvasRenderingContext2D,b:Body){if(!b.controlShutter)return;const closed=shutterClosed(b),shotAge=CONTROL_SHUTTER.openSeconds-((b.controlOpenUntil??0)-b.age),slide=closed?0:16*Math.min(1,Math.max(0,shotAge/.1));c.save();c.globalCompositeOperation='source-over';c.lineJoin='round';
 for(const side of[-1,1]){c.save();c.scale(side,1);
 c.fillStyle='#0a131b';c.fillRect(38,-43,9,80);c.fillStyle='#71858d';c.fillRect(39,-41,6,3);c.fillRect(39,31,6,3);c.fillStyle='#c0cace';c.fillRect(40,-38,2,67);
 c.translate(slide,0);c.fillStyle='#3c515e';c.strokeStyle='#93a5ad';c.lineWidth=1.5;c.beginPath();c.moveTo(18,-35);c.lineTo(30,-40);c.lineTo(42,-25);c.lineTo(42,29);c.lineTo(30,36);c.lineTo(18,28);c.closePath();c.fill();c.stroke();
 c.fillStyle='#778b93';c.beginPath();c.moveTo(19,-33);c.lineTo(30,-38);c.lineTo(38,-28);c.lineTo(30,-31);c.closePath();c.fill();c.fillStyle='#182b38';c.fillRect(23,-20,13,38);c.fillStyle='#526c79';for(let i=0;i<4;i++)c.fillRect(25,-17+i*8,9,2);
 c.strokeStyle=closed?'#76bdc9':'#d9ad69';c.lineWidth=1.5;c.beginPath();c.moveTo(23,23);c.lineTo(32,23);c.stroke();c.strokeStyle='#9aa8ac';c.lineWidth=.7;c.beginPath();c.moveTo(19,-25);c.lineTo(21,-18);c.moveTo(38,9);c.lineTo(37,16);c.stroke();
 c.fillStyle='#c7d2d5';for(const y of[-29,26]){c.beginPath();c.arc(38,y,1.8,0,Math.PI*2);c.fill();}c.restore();}
 if(!closed){c.strokeStyle='#f0bb72';c.lineWidth=2;c.beginPath();c.moveTo(-5,-18);c.lineTo(5,-18);c.moveTo(-5,20);c.lineTo(5,20);c.stroke();}c.restore();}
