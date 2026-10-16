export const SUPPLY_CONVOY={firstRound:4,interval:2,armoryAt:48,guardAt:49,y:550,hold:5.5,lanes:[150,570]} as const;
export const hasSupplyConvoy=(round:number)=>round>=SUPPLY_CONVOY.firstRound&&(round-SUPPLY_CONVOY.firstRound)%SUPPLY_CONVOY.interval===0;
