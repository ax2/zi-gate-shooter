/** Candidate combo tuning. A field follows the floor, not its original victim. */
export const MAGNETIC={radius:150,life:1.2,pulses:[.1,.5,.9],damage:.35,cooldown:.55,limit:3} as const;
export const MAGNETIC_REFINEMENT={wideRadius:240,wideDamage:.5,linkRange:420} as const;
export interface MagneticField {id:number;x:number;y:number;age:number;damage:number;pulses:number;radius?:number;link?:boolean;}
