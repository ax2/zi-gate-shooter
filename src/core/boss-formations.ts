export interface EscortTroop {kind:'guard'|'charger'|'sniper';x:number;pattern?:'flank'|'lockshot';lane?:number}
export interface BossFormation {
  id:'bulwark'|'pincer'|'crossfire';name:string;hint:string;shieldReduction:number;
  groups:readonly {at:number;troops:readonly EscortTroop[]}[];
}
const formations:readonly BossFormation[]=[
  {id:'bulwark',name:'护卫屏障',hint:'先拆悬停护卫，解除首领45%减伤',shieldReduction:.45,
    groups:[{at:.2,troops:[{kind:'guard',x:220},{kind:'guard',x:500}]}]},
  {id:'pincer',name:'侧翼突袭',hint:'突进分批切入，留意机体蓄能',shieldReduction:0,
    groups:[{at:.4,troops:[{kind:'charger',x:140,pattern:'flank',lane:240}]},{at:2.8,troops:[{kind:'charger',x:580,pattern:'flank',lane:480}]}]},
  {id:'crossfire',name:'追猎双哨',hint:'双哨锁定入场位置 · 抢拆一翼或避过三连再转火',shieldReduction:0,
    groups:[{at:.2,troops:[{kind:'sniper',x:110,pattern:'lockshot'}]},{at:2.6,troops:[{kind:'sniper',x:610,pattern:'lockshot'}]}]},
];
/** Each authored three-boss circuit offsets its escort roster: nine pairings.
 * The first boss stays solo; chapters two and three introduce aim and shields. */
export const bossFormationFor=(round:number)=>{
 const r=Math.max(1,Math.floor(round));if(r===1)return undefined;
 if(r===2)return formations[2];if(r===3)return formations[0];
 return formations[(r-1+Math.floor((r-4)/3))%3];
};
export const ESCORT={charge:15,guardDurability:3,hoverY:480,holdSeconds:12,retry:.5,deadline:3} as const;
