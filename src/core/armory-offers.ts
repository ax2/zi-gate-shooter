import type { WeaponKind } from './weapons';

/** Chapter flavor breaks ties; missing capabilities always precede duplicates. */
export function armoryOffers(owned: readonly WeaponKind[], preferred: readonly WeaponKind[]): WeaponKind[] {
  const order = [...new Set<WeaponKind>([...preferred, 'pulse', 'scatter', 'pierce', 'blast', 'arc'])];
  return [...order.filter(kind => !owned.includes(kind)), ...order.filter(kind => owned.includes(kind))].slice(0, 2);
}
