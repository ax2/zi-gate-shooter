/** A late run milestone adds a protocol; all old weapons and overload boosts remain. */
export const OVERDRIVE={mastery:16,interval:1.5,lineDamage:90,lineTargets:3,lineHalfWidth:12,arcDamage:60,range:640,chainRange:260,arcTargets:3,falloff:.8}as const;
export type OverdriveForm='lance'|'circuit';
export const overdriveForms={
 lance:{name:'轨道雷枪',role:'对齐纵列 · 集中破重装',detail:'直线贯穿3敌 · 箱门、闭盾截断',damage:OVERDRIVE.lineDamage},
 circuit:{name:'环流电链',role:'靠近敌阵 · 覆盖分散目标',detail:'最多3敌 · 后跳80% · 不打箱门',damage:OVERDRIVE.arcDamage},
}as const;
export const isOverdriveForm=(v:unknown):v is OverdriveForm=>v==='lance'||v==='circuit';
