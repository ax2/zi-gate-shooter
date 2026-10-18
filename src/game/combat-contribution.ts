import type {World} from '../core/world';
import {weaponColors,weaponNames} from '../core/weapons';
import type {DamageSource} from '../core/combat-ledger';

export const contributionSources={
 pulse:{name:weaponNames.pulse,color:weaponColors.pulse,role:'直击与弹芯分支 · 原折射保留'},
 scatter:{name:weaponNames.scatter,color:weaponColors.scatter,role:'霰弹与弹芯 · 近距聚弹 / 群敌覆盖'},
 pierce:{name:weaponNames.pierce,color:weaponColors.pierce,role:'穿甲与弹芯分支 · 原高贯穿保留'},
 blast:{name:weaponNames.blast,color:weaponColors.blast,role:'爆炸与弹芯分支 · 纵列 / 群敌'},
 arc:{name:weaponNames.arc,color:weaponColors.arc,role:'电弧直击、跳电与蓄爆 · 连通敌阵'},
 laser:{name:'激光与棱镜',color:'#7fe4ff',role:'主侧束、分光、灼烧与折返 · 实际扣血'},
 storm:{name:'雷暴霰射',color:'#b6ffb3',role:'派生跳电与破核 · 原霰弹另计'},
 ion:{name:'离子风暴',color:'#c8b1ff',role:'放电与精研弹体 · 原电弧另计'},
 fracture:{name:'裂甲爆破',color:'#ffc183',role:'裂甲引爆与穿震 · 原穿甲另计'},
 magnetic:{name:'磁暴电场',color:'#a3ffd0',role:'三拍与精研跳击 · 原爆炸另计'},
 photon:{name:'电光连锁',color:'#a6ecff',role:'光链与单体聚能 · 原激光另计'},
 overdrive:{name:'超载协议',color:'#ffd28a',role:'轨道雷枪或环流电链 · 原武器与激光另计'},
} satisfies Record<DamageSource,{name:string;color:string;role:string}>;

export function combatContribution(w:World){
 const ledger=w.combatContributions(),sources=new Set<DamageSource>([...w.activeWeapons,...ledger.map(r=>r.source)]);
 if(w.supportProfile().laserUnlocked)sources.add('laser');
 const rows=[...sources].map(source=>({...(ledger.find(r=>r.source===source)??{source,damage:0,contacts:0,kills:0}),...contributionSources[source]}))
  .sort((a,b)=>b.damage-a.damage||Object.keys(contributionSources).indexOf(a.source)-Object.keys(contributionSources).indexOf(b.source));
 const total=rows.reduce((sum,row)=>sum+row.damage,0);
 return {total,rows:rows.map(row=>({...row,share:total?row.damage/total:0}))};
}
