/** Two visible refits use the existing real calibration payments.
 * Further calibrations still add family power; firing patterns stay bounded. */
export const refitCounts:Record<string,readonly number[]>={hive:[6,8,10],needles:[3,5,7],seekorb:[2,3,5],electrodes:[2,3,4],tracker:[1,2,3],blades:[3,4,5]};
export const refitUnits:Record<string,string>={hive:'发扇射',needles:'路贯穿',seekorb:'枚雷球',electrodes:'枚电极',tracker:'路索敌',blades:'把光刃'};
export const refitRank=(calibrations=0)=>1+Math.min(2,Math.max(0,Math.floor(calibrations)));
export const refitCount=(id:string,calibrations=0)=>refitCounts[id]?.[refitRank(calibrations)-1]??0;
export const rankMark=(rank:number)=>['I','II','III'][Math.max(0,Math.min(2,rank-1))];
export const hiveOffsets=(side:number,rank=1)=>[-1,0,1,...(rank>1?[side*2]:[]),...(rank>2?[-side*2]:[])];
export const needleOffsets=(rank=1)=>[-18,0,18,...(rank>1?[-36,36]:[]),...(rank>2?[-54,54]:[])];
export const orbPorts=(rank=1)=>[{x:-72,vx:-110},{x:72,vx:110},...(rank>1?[{x:0,vx:0}]:[]),...(rank>2?[{x:-36,vx:-55},{x:36,vx:55}]:[])];
