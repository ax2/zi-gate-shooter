export interface EscortTroop {kind:'guard'|'charger'|'sniper';x:number;pattern?:'flank';lane?:number}
export interface BossFormation {
  id:'bulwark'|'pincer'|'crossfire';name:string;hint:string;shieldReduction:number;
  groups:readonly {at:number;troops:readonly EscortTroop[]}[];
}
const formations:readonly BossFormation[]=[
  {id:'bulwark',name:'护卫屏障',hint:'先拆悬停护卫，解除首领45%减伤',shieldReduction:.45,
    groups:[{at:.2,troops:[{kind:'guard',x:220},{kind:'guard',x:500}]}]},
  {id:'pincer',name:'侧翼突袭',hint:'突进分批切入，留意机体蓄能',shieldReduction:0,
    groups:[{at:.4,troops:[{kind:'charger',x:140,pattern:'flank',lane:240}]},{at:2.8,troops:[{kind:'charger',x:580,pattern:'flank',lane:480}]}]},
  {id:'crossfire',name:'狙击交叉',hint:'左右哨机交错入场，可先击破侧翼',shieldReduction:0,
    groups:[{at:.2,troops:[{kind:'sniper',x:180}]},{at:2.6,troops:[{kind:'sniper',x:540}]}]},
];
/** Fixed round content, never selected from the player's DPS or input. */
export const bossFormationFor=(round:number)=>round<4?undefined:formations[(Math.max(1,Math.floor(round))-1)%3];
export const ESCORT={charge:15,guardDurability:3,hoverY:440,holdSeconds:12,retry:.5,deadline:3} as const;
