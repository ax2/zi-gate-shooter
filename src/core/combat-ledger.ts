import type {WeaponKind} from './weapons';

export type DamageSource=WeaponKind|'laser'|'storm'|'ion'|'fracture'|'magnetic'|'photon'|'overdrive';
export interface DamageContribution {source:DamageSource;damage:number;contacts:number;kills:number}

/** Bounded, run-local accounting of enemy HP actually removed. No combat decisions. */
export class CombatLedger {
  readonly #rows=new Map<DamageSource,DamageContribution>();
  record(source:DamageSource,before:number,after:number){
    if(!Number.isFinite(before)||!Number.isFinite(after)||before<=0)return;
    const damage=Math.max(0,before-Math.max(0,after));if(damage<=0)return;
    let row=this.#rows.get(source);
    if(!row){row={source,damage:0,contacts:0,kills:0};this.#rows.set(source,row);}
    row.damage+=damage;row.contacts++;if(after<=0)row.kills++;
  }
  snapshot(){return [...this.#rows.values()].map(row=>({...row}));}
}
