/** Authored hull textures are cosmetic. Existing real tactical badges unlock them once. */
export const achievementLiveries=[
 {id:'vanguard',name:'断舰先锋',badge:'tactic-disarm',achievement:'拆舱先锋',brief:'先拆双舱再击破旗舰',file:'flight-vanguard-v1.png',accent:'#b5cef3'},
 {id:'spear',name:'赤矛突击',badge:'tactic-core',achievement:'直取中枢',brief:'先压核心再击破旗舰',file:'flight-spear-v1.png',accent:'#f1b7bc'},
]as const;
export const liveryForBadge=(id:string)=>achievementLiveries.find(s=>s.badge===id);
export const liveryById=(id:string)=>achievementLiveries.find(s=>s.id===id);
export const liveryFile=(id:string)=>liveryById(id)?.file??'flight-player-v1.png';
