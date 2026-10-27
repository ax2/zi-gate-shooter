export interface WeaponImpact{target:number;source:string;frame:number;x:number;y:number;age:number;life:number;size:number;angle:number;lethal:boolean}
export const impactRules={limit:24,weakLimit:10,repeat:.085,lives:[.28,.3,.32,.3,.4,.34],maxSize:112}as const;
const families:readonly string[][]=[
 ['overload-cannon','guns','hive','bounce','satellites'],
 ['overload-rail','rail','needles','railburst'],
 ['overload-coil','coil','chain','seeker','stormgun','tempest','seekorb','electrodes','thundernet','stormlens','reversefield','emp'],
 ['overload-laser','laser','twin','drill','prism','sun','tracker','aurorawing','huntprism','lightwell'],
 ['flak','starhive','plasmacore','burn','mineblast','novaecho'],
 ['blades','bladewave'],
];
export const impactFrame=(source:string)=>{const frame=families.findIndex(ids=>ids.includes(source));return frame<0?undefined:frame;};
/** Visual-only bounded ledger. No RNG, entity IDs, effects, rewards or physics.
 * A miss and fully absorbed shield never enter this ledger. */
export class ImpactLedger{
 private entries:WeaponImpact[]=[];
 hit(at:{id:number;x:number;y:number},source:string,damage:number,lethal:boolean,angle=0){
  const frame=impactFrame(source);if(frame===undefined||!Number.isFinite(damage)||damage<=0)return false;
  if(this.entries.some(e=>e.target===at.id&&e.frame===frame&&e.age<impactRules.repeat&&!lethal))return false;
  if(this.entries.length>=impactRules.limit)this.entries.shift();
  this.entries.push({target:at.id,source,frame,x:at.x,y:at.y,age:0,life:impactRules.lives[frame],size:Math.min(impactRules.maxSize,46+Math.sqrt(damage)*4+(lethal?20:0)),angle:Number.isFinite(angle)?angle:0,lethal});return true;
 }
 step(dt:number){if(!Number.isFinite(dt)||dt<=0)return;for(const e of this.entries)e.age+=dt;this.entries=this.entries.filter(e=>e.age<e.life);}
 snapshot(){return this.entries.map(e=>({...e}));}
}
/** Expansion and fade use the actual simulation age. Rendering cannot extend
 * a hit, add damage or fill the whole screen, including reduced-effects mode. */
export function impactPoses(entries:readonly WeaponImpact[],weak:boolean){
 // Keep the actual component's material readable when the basic cannon also
 // hits the same hull. One dominant real hit per target, never a stacked blob.
 const chosen=new Map<number,WeaponImpact>(),priority=(e:WeaponImpact)=>(e.source!=='guns'&&e.age/e.life<.8?2:0)+1-e.age/e.life;
 for(const e of entries){if(e.age<0||e.age>=e.life)continue;const previous=chosen.get(e.target);if(!previous||priority(e)>priority(previous))chosen.set(e.target,e);}
 return[...chosen.values()].sort((a,b)=>b.age-a.age).slice(-(weak?impactRules.weakLimit:impactRules.limit)).map(e=>{const t=e.age/e.life,flicker=e.frame===2?.86+.14*Math.sin(e.age*100):1;return{...e,size:e.size*(.6+.5*Math.sqrt(t))*(weak?.75:1),alpha:Math.pow(1-t,e.frame===4?1.1:1.35)*(weak?.65:.9)*flicker,angle:e.angle+(e.frame===5?t*.32:e.frame===4?t*.6:0)};});
}
