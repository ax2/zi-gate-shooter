/** Small metal plate chips cut from the actual boss atlas, below warnings/projectiles.
 * Three bounded cosmetic slots, no collision or World mutation. */
export class BossArmorFragments{
 readonly pieces:Array<{x:number;y:number;vx:number;vy:number;angle:number;spin:number;age:number;variant:number;crop:number}>=[];
 burst(x:number,y:number,variant:number,weak:boolean){
  const origins=[[-108,-18],[104,-18],[-7,25]]as const;
  this.clear();for(let i=0;i<(weak?2:3);i++){const side=i%2?1:-1;this.pieces.push({x:x+origins[i][0],y:y+origins[i][1],vx:i===2?35:side*(250+i*14),vy:i===2?220:-42+i*30,angle:side*.15,spin:side*(1.7+i*.4),age:0,variant,crop:i});}
 }
 advance(dt:number){for(const p of this.pieces){p.age+=Math.max(0,dt);p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=190*dt;p.angle+=p.spin*dt;}for(let i=this.pieces.length-1;i>=0;i--)if(this.pieces[i].age>=.65)this.pieces.splice(i,1);}
 clear(){this.pieces.length=0;}
 draw(c:CanvasRenderingContext2D,image:(key:string)=>CanvasImageSource|undefined,weak:boolean){
  const cuts=[[.13,.34,.14,.19],[.72,.34,.14,.19],[.40,.52,.16,.14]]as const;
  for(const p of this.pieces){const art=image(p.variant===2?'boss-bastion-v1.png':p.variant===1?'boss-flanker-v1.png':'boss-v1.png')as HTMLImageElement|undefined;if(!art)continue;
   const [x,y,w,h]=cuts[p.crop],frame=art.width/3;c.save();c.translate(p.x,p.y);c.rotate(p.angle);c.globalAlpha=Math.max(0,1-p.age/.65)*(weak?.48:.85);c.drawImage(art,x*frame,y*art.height,w*frame,h*art.height,-w*180,-h*140,w*360,h*280);c.restore();
  }
 }
}
