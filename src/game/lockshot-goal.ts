import {C} from '../core/config';
import {LOCKSHOT} from '../core/lockshot';
import type {World,Body} from '../core/world';

/** Read-only advice from actual source and contact evidence, never a predicted ray. */
export function lockshotGoal(w:World,id:string|null){
  if(id!=='preempt-gun'&&id!=='bait-counter')return null;
  const bait=id==='bait-counter',title=bait?'技巧目标 · 诱射反击':'技巧目标 · 先制拆炮';
  const b=w.bodies.find(b=>b.active&&b.pattern==='lockshot'&&b.y<C.playerY-b.height/2);
  if(!b)return {kind:'move' as const,title,detail:'第二轮起侧翼章 · 留意斜射哨机'};
  let detail:string;
  if(!bait)detail=(b.lockAcceptedShots??0)>0?'已发射 · 下个哨机再试':(b.dropGrace??0)>0?'等待护盖打开，再蓄能抢先拆炮':b.warning>0?'正在蓄能 · 对准炮机抢先击毁':'等待蓄能 · 首发前对准击毁';
  else if(b.lockDamageStart!==w.damageTaken)detail='本次已受伤 · 下个哨机再试';
  else if((b.lockPassed??0)>=LOCKSHOT.shots)detail='已避过3/3 · 现在对准同机反击';
  else if((b.empRemaining??0)>0)detail='停火中 · 旧弹仍危险，等待剩余发射';
  else detail=`已避过${b.lockPassed??0}/3 · 先错开炮机，待实弹通过`;
  return {kind:'enemy' as const,title,detail};
}

/** Replace the existing source label rather than add another overlapping HUD row. */
export function lockshotTargetLabel(w:World,b:Body,id:string|null){
  if(b.pattern!=='lockshot')return null;
  if(id==='bait-counter')return b.lockDamageStart!==w.damageTaken?'诱射 · 受伤失效':(b.lockPassed??0)>=LOCKSHOT.shots?'诱射 3/3 · 可反击':`诱射 · 避弹${b.lockPassed??0}/3`;
  if(id==='preempt-gun')return (b.lockAcceptedShots??0)>0?'先制 · 下机再试':(b.dropGrace??0)>0?'先制 · 等待开盖':b.warning>0?'先制 · 现在拆炮':'先制 · 等待蓄能';
  return null;
}
