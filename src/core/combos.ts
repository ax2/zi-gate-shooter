/** Candidate tuning; secondary hits never feed another combination or a reward. */
export const FRACTURE = { hits:3, direct:2, splash:0.75, radius:120, cooldown:0.35 } as const;
export type FractureAugment='fracture-quick'|'fracture-line';
export const FRACTURE_LINE={range:320,width:240,targets:2,damage:.75} as const;
export const fractureAugments={
 'fracture-quick':{name:'双击破核',detail:'同敌3次→2次引爆 · 原爆破与冷却保留',role:'持续瞄准重装与首领，更快破核'},
 'fracture-line':{name:'贯通冲击',detail:'原三击爆破保留 · 向上追加穿震',role:'对准前后敌列，把爆破送向后排'},
} as const;
export const isFractureAugment=(v:unknown):v is FractureAugment=>v==='fracture-quick'||v==='fracture-line';
export const fractureProfile=(augment?:FractureAugment)=>({...FRACTURE,hits:augment==='fracture-quick'?2:3});
