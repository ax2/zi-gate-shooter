/** Current permanent combinations, not purchases or simulated card demonstrations. */
export const comboCertificationRules={bossFraction:.05}as const;
export const comboCertifications=[
 {tech:'starhive',side:'hive',name:'爆星认证'},
 {tech:'thundernet',side:'needles',name:'雷网认证'},
 {tech:'plasmacore',side:'seekorb',name:'星核认证'},
 {tech:'aurorawing',side:'electrodes',name:'极光认证'},
 {tech:'huntprism',side:'tracker',name:'猎镜认证'},
 {tech:'bladewave',side:'blades',name:'回响认证'},
]as const;
export type ComboCertification=typeof comboCertifications[number]['tech'];
export const comboCertificationId=(tech:string)=>'combo-'+tech;
export const comboCertification=(id:string)=>comboCertifications.find(s=>comboCertificationId(s.tech)===id);
export const comboCertificationGoal=(hp:number)=>hp*comboCertificationRules.bossFraction;
