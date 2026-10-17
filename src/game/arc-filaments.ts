export const ARC_FILAMENT={segments:14,offset:10,forks:2,forkReach:26}as const;
export type ArcStyle='electric'|'seeker'|'photon';
const noise=(n:number)=>{const v=Math.sin(n*12.9898)*43758.5453;return(v-Math.floor(v))*2-1;};

/** Presentation geometry for a settled hit. No randomness or combat state. */
export function arcFilaments(x:number,y:number,tx:number,ty:number,life:number,duration:number,weak:boolean,style:ArcStyle='electric'){
 if(![x,y,tx,ty,life,duration].every(Number.isFinite)||life<=0||duration<=0)return null;
 const dx=tx-x,dy=ty-y,length=Math.hypot(dx,dy);if(length<1||!Number.isFinite(length))return null;
 const ux=dx/length,uy=dy/length,nx=-uy,ny=ux,age=1-Math.min(1,life/duration),phase=Math.floor(age*6);
 const count=Math.min(weak?7:ARC_FILAMENT.segments,Math.max(4,Math.ceil(length/26)));
 const seed=(x%997)*.17+(y%991)*.11+(tx%983)*.07+(ty%977)*.13;
 const amplitude=Math.min(style==='seeker'?4:style==='photon'?6:ARC_FILAMENT.offset,length*.075),main=[x,y],forks:number[][]=[];
 for(let i=1;i<count;i++){
  const t=i/count,wave=style==='photon'?Math.sin(t*Math.PI*4-age*12):noise(seed+i*3+phase*17)*.75+Math.sin(i*2.3+phase)*.25,bend=wave*amplitude*Math.sin(t*Math.PI);
  main.push(x+dx*t+nx*bend,y+dy*t+ny*bend);
 }
 main.push(tx,ty);
 if(!weak&&length>=80)for(let j=0;j<(style==='photon'?0:style==='seeker'?1:ARC_FILAMENT.forks);j++){
  const i=Math.floor(count*(j?.68:.32)),px=main[i*2],py=main[i*2+1],side=noise(seed+j*5+phase)>=0?1:-1;
  forks.push([px,py,px+ux*6+nx*side*8,py+uy*6+ny*side*8,px+ux*9+nx*side*5,py+uy*9+ny*side*5,px+ux*12+nx*side*ARC_FILAMENT.forkReach,py+uy*12+ny*side*ARC_FILAMENT.forkReach]);
 }
 const rail=style==='photon'&&!weak?main.map((v,i)=>{
  const t=Math.floor(i/2)/count,offset=4*Math.sin(t*Math.PI)*Math.sin(t*Math.PI*4+age*12);return i%2?v+ny*offset:v+nx*offset;
 }):null;
 return{main,forks,rail,age,alpha:Math.min(1,life/duration)};
}
