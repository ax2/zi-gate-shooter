/** Third electric node: finite impact discharge, never a recursive chain. */
export const ION_STORM={hits:6,radius:140,damage:1.2,cooldown:.8} as const;
export type IonAugment='ion-orb'|'ion-spear';
export const ionAugments={
 'ion-orb':{name:'巡航雷核',detail:'前移雷核 · 三拍100范围 · 每拍2敌各35%',role:'沿纵向来敌持续放电'},
 'ion-spear':{name:'分岔雷矛',detail:'双翼寻敌雷矛 · 每矛贯穿2敌各75%',role:'侧翼优先 · 无侧敌时单矛回击原目标'},
} as const;
export const isIonAugment=(v:unknown):v is IonAugment=>v==='ion-orb'||v==='ion-spear';
export const ION_ORB={speed:260,life:1,pulses:[.1,.45,.8],radius:100,targets:2,damage:.35,limit:2} as const;
export const ION_SPEAR={speed:1000,aimRange:400,life:.65,targets:2,damage:.75,limit:4} as const;
export interface IonProjectile {
 id:number;x:number;y:number;px:number;py:number;age:number;damage:number;active:boolean;originId:number;
}
export interface IonOrb extends IonProjectile {pulses:number}
export interface IonSpear extends IonProjectile {vx:number;vy:number;remaining:number;hitBodies:number[]}
