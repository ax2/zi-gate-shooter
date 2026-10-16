export const openingWeapons=['scatter','pierce','blast','arc'] as const;
export type OpeningWeapon=typeof openingWeapons[number];
export function isOpeningWeapon(value:unknown):value is OpeningWeapon{return openingWeapons.some(kind=>kind===value);}
export const parseOpeningWeapon=(value:unknown):OpeningWeapon=>isOpeningWeapon(value)?value:'scatter';
export const openingHints:Record<OpeningWeapon,string>={scatter:'弹道路线：贯穿 / 爆破 / 跳弹',pierce:'T2爆裂 → 裂甲爆破',blast:'雷电二阶 → 磁暴榴弹',arc:'光学三阶＋精调 → 电光连锁'};
