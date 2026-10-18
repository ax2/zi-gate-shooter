import{it,expect}from'vitest';import{claimBossSalvage,bossSalvageCount}from'../src/core/boss-salvage';
function body(){return{kind:'boss',active:true,hp:100,maxHp:100,bossSalvageMask:undefined as number|undefined};}
it('requires real damage crossings and grants each of four thresholds once per boss',()=>{
 const b=body();for(const hp of[90,80,79,60,40,20,0]){const before=b.hp;b.hp=hp;const expected=[80,60,40,20].includes(hp)?1:0;expect(claimBossSalvage(b,before,4,true)).toHaveLength(expected);}
 expect(bossSalvageCount(b)).toBe(4);expect(claimBossSalvage(b,100,4,true)).toEqual([]);
});
it('coalesces a large hit, keeps the earned mask through serialization and cannot farm healing',()=>{
 const b=body();b.hp=19;expect(claimBossSalvage(b,100,12,true)).toEqual([0,1,2,3]);
 const saved=JSON.parse(JSON.stringify(b));saved.hp=100;expect(claimBossSalvage(saved,19,12,true)).toEqual([]);saved.hp=10;expect(claimBossSalvage(saved,100,12,true)).toEqual([]);
 const fresh=body();fresh.hp=0;expect(claimBossSalvage(fresh,100,4,true)).toHaveLength(4);
});
it('does not grant from entry, death, old rounds, non-boss targets, healing, unchanged or invalid HP',()=>{
 for(const scenario of[{round:3},{live:false},{active:false},{kind:'armor'},{hp:100},{hp:101},{hp:NaN},{maxHp:0}]){
  const b={...body(),hp:10,...scenario};expect(claimBossSalvage(b,100,'round'in scenario?scenario.round!:4,'live'in scenario?scenario.live!:true)).toEqual([]);expect(b.bossSalvageMask).toBeUndefined();
 }
});
