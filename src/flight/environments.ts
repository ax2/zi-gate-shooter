/** Original aerial art, kept below all physical gameplay. No World, RNG or clock mutation. */
export const environmentSpecs=[
 {file:'fleet-ocean-v1.jpg',name:'舰队海域',speed:100,wash:'#06131f55'},
 {file:'storm-clouds-v1.jpg',name:'磁暴云海',speed:74,wash:'#0c102c66'},
 {file:'orbital-ring-v1.jpg',name:'轨道巨构',speed:60,wash:'#07111e66'},
]as const;
export interface EnvironmentSlice{sy:number;sh:number;y:number;height:number;alpha:number}
/** Cross-fade the last/top144 world pixels in strips. The original raster is
 * untouched; visible bands have no empty gaps at a wrap or tall viewport edge. */
export function environmentSlices(imageWidth:number,imageHeight:number,seconds:number,speed:number,weak=false){
 if(!Number.isFinite(imageWidth)||!Number.isFinite(imageHeight)||imageWidth<=0||imageHeight<=0)return[];
 const scale=744/imageWidth,h=imageHeight*scale,overlap=Math.min(144,h/4),period=h-overlap,time=Number.isFinite(seconds)?Math.max(0,seconds):0,scroll=time*speed%period,steps=weak?16:32,rows:EnvironmentSlice[]=[];
 const add=(sy:number,sh:number,y:number,height:number,alpha=1)=>{if(y+height>0&&y<1280)rows.push({sy,sh,y,height,alpha});};
 for(let y=scroll-period;y<1280;y+=period){add(imageHeight-overlap/scale,overlap/scale,y,overlap);for(let i=0;i<steps;i++)add(i*overlap/steps/scale,overlap/steps/scale,y+i*overlap/steps,overlap/steps,(i+.5)/steps);add(overlap/scale,(h-2*overlap)/scale,y+overlap,h-2*overlap);}
 return rows;
}
export function paintEnvironment(c:CanvasRenderingContext2D,img:HTMLImageElement,family:number,seconds:number,playerX:number,weak:boolean,opacity=1){
 const spec=environmentSpecs[family]??environmentSpecs[0],pan=Math.max(-8,Math.min(8,(playerX-360)*.025));if(opacity<=0)return;c.save();c.beginPath();c.rect(0,0,720,1280);c.clip();for(const r of environmentSlices(img.width,img.height,seconds,spec.speed,weak)){c.globalAlpha=r.alpha*opacity;c.drawImage(img,0,r.sy,img.width,r.sh,-12+pan,r.y,744,r.height);}c.globalAlpha=opacity;c.fillStyle=spec.wash;c.fillRect(0,0,720,1280);
 const edge=c.createLinearGradient(0,0,720,0);edge.addColorStop(0,'#020b1580');edge.addColorStop(.24,'#020b1500');edge.addColorStop(.76,'#020b1500');edge.addColorStop(1,'#020b1580');c.fillStyle=edge;c.fillRect(0,0,720,1280);const depth=c.createLinearGradient(0,0,0,1280);depth.addColorStop(0,'#04122077');depth.addColorStop(.45,'#03101b00');depth.addColorStop(1,'#07121a55');c.fillStyle=depth;c.fillRect(0,0,720,1280);c.restore();
}
