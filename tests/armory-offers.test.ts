import { expect, it } from 'vitest';
import { armoryOffers } from '../src/core/armory-offers';
import type { WeaponKind } from '../src/core/weapons';

const kinds: WeaponKind[]=['pulse','scatter','pierce','blast','arc'];
it('offers missing capabilities first for every possible arsenal, with no duplicate options',()=>{
  for(let mask=0;mask<32;mask++){
    const owned=kinds.filter((_,i)=>mask&(1<<i));
    for(const preferred of [['scatter','pierce'],['blast','arc'],['pulse','blast']] as WeaponKind[][]){
      const offers=armoryOffers(owned,preferred), missing=kinds.filter(k=>!owned.includes(k));
      expect(new Set(offers).size).toBe(2);
      expect(offers.filter(k=>!owned.includes(k))).toHaveLength(Math.min(2,missing.length));
      expect(armoryOffers(owned,preferred)).toEqual(offers);
    }
  }
});
it('a player choosing an unowned option can collect the complete arsenal in four rows',()=>{
  for(let choices=0;choices<16;choices++){
    const owned:WeaponKind[]=['pulse'];
    for(let row=0;row<4;row++){
      const offers=armoryOffers(owned,['scatter','pierce']);
      // With one missing weapon, choosing the owned alternative intentionally delays completion.
      const missing=offers.filter(k=>!owned.includes(k));
      owned.push(missing[(choices>>row)&1]??missing[0]);
    }
    expect(new Set(owned).size).toBe(5);
  }
});
