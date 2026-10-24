/** Later magnetic crossings: finite powered guidance, then ballistic drift.
 * Launchers and drawn pods share this actual muzzle; no projected flight path. */
export const pursuitRules={tracking:1.05,turn:.95,life:3.8,radius:10,speed:1.05,interval:2.2,returnTime:3.2,returnDrop:[0,110,180]}as const;
export function pursuitMount(at:{x:number;y:number;r:number},side:number,target:{x:number;y:number}){const x=at.x+side*at.r*.72,y=at.y+12,angle=Math.atan2(target.y-y,target.x-x)+side*.12;return{x,y,angle,muzzleX:x+Math.cos(angle)*18,muzzleY:y+Math.sin(angle)*18};}
export function pursuitPose(b:{pursuit?:boolean;hostile:boolean;age:number;life:number;vx:number;vy:number}){if(!b.pursuit||!b.hostile||b.age<0||b.age>=b.life)return;return{angle:Math.atan2(b.vy,b.vx)+Math.PI/2,powered:b.age<=pursuitRules.tracking,tail:b.age<=pursuitRules.tracking?28:12};}
