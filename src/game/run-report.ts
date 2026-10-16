import type {World} from '../core/world';
import {achievements} from '../core/achievements';
import {routes} from '../core/build-tree';
import {weaponNames} from '../core/weapons';
export function nextRunGoal(w:World,unlocked:readonly string[],tracked?:string|null){
 const target=achievements.find(a=>a.id===tracked);if(target)return unlocked.includes(target.id)?`已达成${target.name}，到成就页选择新目标`:`目标：${target.name} · ${target.detail}`;
 if(w.pickups===0)return '先击碎并拾取装备箱，取得首次研发点';
 if(!unlocked.includes('boss'))return '强化构筑并击破首领，挑战首领终结者';
 if(!unlocked.includes('fracture')&&w.fractureUnlocked())return '单局触发10次裂甲爆破，挑战裂甲工程师';
 if(!unlocked.includes('hybrid'))return '前三点分投三路线，挑战跨界试验';
 if(!unlocked.includes('specialist'))return '前三点投入雷电或光学，挑战专精工程师';
 if(!unlocked.includes('storm'))return '组合弹道与雷电，完成雷暴霰射';
 if(!unlocked.includes('proof')&&w.availableProofs().length)return '接取构筑检验，用实际组合效果挑战实战工程师';
 if(!unlocked.includes('ace')&&w.activeWeapons.some(k=>w.weaponStage(k)>=2))return '接取双线王牌并全破，挑战王牌猎手';
 if(!unlocked.includes('flawless-ace')&&unlocked.includes('ace'))return '接取后无伤全破双线王牌，挑战交火零伤';
 if(!unlocked.includes('versatile')&&unlocked.includes('proof'))return '换一种构筑完成检验，挑战构筑全才';
 if(!unlocked.includes('disruptor'))return '一次中继爆破中断两台蓄能敌机，挑战断电时机';
 if(!unlocked.includes('tactician'))return '全破首领编队并无伤获胜，挑战战术拆解';
 return '推进更高轮次，挑战本机最高分';
}
/** Read-only presentation from authoritative per-run state; no inferred rewards. */
export function runReport(w:World,fresh:readonly string[],unlocked:readonly string[],tracked?:string|null){
 const ballistic=w.build.ballisticBranch==='ricochet'?`跳弹 ${w.scatterRicochets}`:`贯穿 ${w.scatterPierces}`;
 const electric=w.build.electricBranch==='seeker'?`猎隼 ${w.seekerLinks}`:`链伤 ${w.arcLinks}`;
 const names=achievements.filter(a=>fresh.includes(a.id)).map(a=>a.name);
 return {
  growth:`充能突破 ${w.growth.mastery??0}次 · 专属精校 ${w.activeWeapons.reduce((n,k)=>n+w.weaponCalibration(k),0)}次 · 研发 ${w.researchPoints}点${w.refitsClaimed?' · 改装'+w.refitsClaimed+'次':''}`,
  weapons:w.activeWeapons.map(k=>`${weaponNames[k]} T${w.weaponStage(k)}`),
  routes:routes.map((r,i)=>`${['弹道','雷电','光学'][i]} ${w.build.ranks[r]}/3 · ${w.build.ranks[r]?w.build.node(r,Math.min(1,w.build.ranks[r]-1)).name:'未投入'}${w.build.refinements[r]?' · 精调'+w.build.refinements[r]:''}`),
  combat:`首领 ${w.bossWins} · 战利品 ${w.bossLootStats.claimed} · 击破 ${w.kills} · 门 ${w.gatesTaken}`,
  contracts:w.contractStats.accepted?`契约成功 ${w.contractStats.won}/${w.contractStats.accepted} · 领奖 ${w.contractStats.claimed} · 失败 ${w.contractStats.failed}${w.proofWins?` · 构筑认证${w.proofWins}`:''}`:'本局未接取契约 · 每轮可自选一次',
  mechanics:w.magneticHits+w.scatterRicochets+w.scatterPierces+w.scatterSplashHits+w.fractureBursts+w.capacitorBursts+w.burnHits+w.relayHits+w.arcLinks+w.empTargets+w.ionBursts+w.laserArcHits+w.laserFocusHits===0?(w.build.electricBranch==='seeker'?['猎隼尚未有效命中','借前排目标，首跳远距打击后排射手']:['尚未触发派生能力','研发分支与配件组合可强化火力']):w.laserArcHits+w.laserFocusHits+w.magneticHits>0?[`${ballistic} · 溅射 ${w.scatterSplashHits} · 裂甲 ${w.fractureBursts}${w.magneticHits?` · 磁暴${w.magneticHits}`:''}`,`${electric} · 蓄爆 ${w.capacitorBursts} · 风暴 ${w.ionBursts} · 停火 ${w.empTargets}`,`灼烧 ${w.burnHits} · 分光 ${w.relayHits} · 光链 ${w.laserArcHits} · 聚能 ${w.laserFocusHits}`]:[`${ballistic} · 溅射 ${w.scatterSplashHits} · 裂甲 ${w.fractureBursts} · 停火 ${w.empTargets}`,`${electric} · 蓄爆 ${w.capacitorBursts} · 灼烧 ${w.burnHits} · 分光 ${w.relayHits}${w.ionBursts?` · 风暴${w.ionBursts}`:''}${w.magneticHits?` · 磁暴${w.magneticHits}`:''}`],
  fresh:names.length?`新成就 ${names.length} · ${names.slice(0,2).join(' / ')}${names.length>2?'…':''}`:`本局无新成就 · 累计 ${unlocked.length}/${achievements.length}`,
  next:nextRunGoal(w,unlocked,tracked),
 };
}
