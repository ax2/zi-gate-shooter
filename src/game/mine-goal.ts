import{C}from'../core/config';
import{MINE_TACTIC,mineTactic}from'../core/minelayer';
import type{World,Body}from'../core/world';

/** Advice follows accepted ordnance/contact evidence, never a future flight path. */
export function mineTargetLabel(w:World,b:Body,id:string|null){
 if(b.pattern!=='minelayer')return null;
 if(id==='mine-preempt')return (b.mineShots??0)>0?'抢拆 · 下机再试':b.warning>0?'抢拆 +20 · 现在击毁':'抢拆 · 等待蓄能';
 if(id==='mine-counter')return b.mineTouched||b.mineDamageStart!==w.damageTaken?'穿雷 · 本次失效':mineTactic(b,w.damageTaken)==='counter'?'穿雷 2/2 · 反击+40':`穿雷 · 避雷${b.minePassed??0}/${MINE_TACTIC.shots}`;
 return null;
}
export function mineGoal(w:World,id:string|null){
 if(id!=='mine-preempt'&&id!=='mine-counter')return null;
 const counter=id==='mine-counter',title=counter?'技巧目标 · 穿雷反击 +40':'技巧目标 · 拆雷先手 +20';
 const b=w.bodies.find(b=>b.active&&b.pattern==='minelayer'&&b.y<C.playerY-b.height/2);
 if(!b){const pending=counter?w.pendingMineCounter:null;return{kind:pending?'enemy' as const:'move' as const,title,detail:pending?`载具已破 · 已避${pending.passed}/2，实雷仍危险`:'第4轮起每章一机 · 在成就页可切换目标'};}
 const detail=!counter?(b.mineShots??0)>0?'已经发雷 · 下章再试，不追回奖励':b.warning>0?'对准蓄能载具 · 首发前击毁':'等待蓄能，再对准载具抢拆':b.mineTouched||b.mineDamageStart!==w.damageTaken?'本次失效 · 受伤或碰雷不算避过':mineTactic(b,w.damageTaken)==='counter'?'双雷已通过 · 击毁同机领取奖励':`已避${b.minePassed??0}/2 · 发雷后可拆炮 · 仍需避完双雷`;
 return{kind:'enemy' as const,title,detail};
}
