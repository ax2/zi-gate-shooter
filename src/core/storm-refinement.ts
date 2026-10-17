/** Additive late choices for the existing storm shotgun; candidate tuning. */
export type StormAugment='storm-relay'|'storm-focus';
export const STORM_REFINEMENT={refinements:5,hits:6,damage:1.5,relayRange:340} as const;
export const stormAugments={
 'storm-relay':{name:'串联电桥',detail:'原跳电保留 · 追加340范围第二跳',role:'借前排连电，把火力送往后排敌机'},
 'storm-focus':{name:'聚雷破核',detail:'同敌6次霰弹直击 · 追加150%单体放电',role:'集中同一重装，积攒雷击破核'},
} as const;
export const isStormAugment=(v:unknown):v is StormAugment=>v==='storm-relay'||v==='storm-focus';
