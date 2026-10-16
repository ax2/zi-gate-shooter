import {canLaserChain} from '../core/laser-chain';
import {BuildTree,isMagneticAugment,magneticAugments,type Route,type BuildBranch} from '../core/build-tree';
import {builtWeapon,builtSupport} from '../core/build-profile';
import {permanentPower} from '../core/rewards';
import type {World} from '../core/world';

const number=(value:number)=>String(+value.toFixed(1));
function combinationPlan(build:BuildTree,route:Route,was:BuildTree,arcStage:number){
  const linked=canLaserChain(build,arcStage),wasLinked=canLaserChain(was,arcStage);
  if(linked&&!wasLinked)return '本次组合：电光连锁 · 群敌跳链 / 单体聚能';
  if(route==='optical'&&build.refinements.optical>=1)return linked?'电光连锁已生效 · 跳链与聚能自动切换 · 原火力保留':'电光还需：电弧炮T2';
  const r=build.ranks;
  if(r.optical>=3&&r.ballistic>=1&&!(was.ranks.optical>=3&&was.ranks.ballistic>=1))return '本次组合：棱镜激光 · 两侧各追加45%';
  if(r.ballistic>=3&&r.electric>=1&&was.ranks.ballistic<3)return '本次组合：雷暴霰射 · 霰弹追加跳电';
  if(route==='optical'){
    if(r.optical>=3&&r.ballistic>=1)return '棱镜激光已生效 · 主束与双侧束保留';
    return `棱镜还需：${[r.optical<3?`光学${3-r.optical}点`:'',r.ballistic<1?'弹道1点':''].filter(Boolean).join(' ＋ ')}`;
  }
  if(r.ballistic>=3&&r.electric>=1)return '雷暴霰射已生效 · 已有跳电保留';
  return `雷暴还需：${[r.ballistic<3?`弹道${3-r.ballistic}点`:'',r.electric<1?'雷电1点':''].filter(Boolean).join(' ＋ ')}`;
}

/** No World clone, stepping, rewards or mutation. Unchosen forks show only common gains. */
export function buildPreview(world:World,route:Route,branch?:BuildBranch){
  const current=world.build,projected=new BuildTree();
  Object.assign(projected.ranks,current.ranks);Object.assign(projected.refinements,current.refinements);
  projected.magneticAugment=current.magneticAugment;projected.ballisticBranch=current.ballisticBranch;projected.electricBranch=current.electricBranch;projected.opticalBranch=current.opticalBranch;
  const valid=(!isMagneticAugment(branch)||world.canRefineMagnetic())&&projected.choose(route,world.buildPoints,branch);
  const rank=current.ranks[route],kind=route==='ballistic'?'scatter':'arc';
  const owned=world.activeWeapons.includes(kind),stage=owned?world.weaponStage(kind):1,calibration=owned?world.weaponCalibration(kind):0;
  const before=builtWeapon(kind,stage,calibration,current),after=builtWeapon(kind,stage,calibration,projected);
  const laserBefore=builtSupport(world.growth.mastery,current),laserAfter=builtSupport(world.growth.mastery,projected);
  const power=1+permanentPower(world.growth)/100;
  const volley=(p:typeof before)=>number(p.damage.reduce((sum,d)=>sum+d,0)*power);
  let gain='';
  if(!valid)gain='前置未满足 · 当前火力保持';
  else if(route==='ballistic'){
    gain=rank>=3?`弹道伤害系数 ${100+current.refinements.ballistic*10}% → ${110+current.refinements.ballistic*10}%`
      :rank===2?'霰弹命中后追加1次跳电'
      :!owned?`新增T1霰射 · 每轮${after.offsets.length}发 · 直伤${volley(after)}`
      :`霰射每轮直伤 ${volley(before)} → ${volley(after)}`;
  }else if(route==='electric'){
    gain=rank>=3?`电弧直击伤害 ${volley(before)} → ${volley(after)}`
      :rank===2?'跳伤65%→80% · 6次电击引发140范围放电'
      :rank===1?branch==='seeker'?'常规跳距220 · 首跳340 · 优先蓄能射手':'跳电范围 160 → 220 · 选扩散/蓄爆/猎隼'
      :!owned?`新增T1电弧 · 直伤${volley(after)} · 跳电${after.chainHops}次`
      :`电弧追加跳电 ${before.chainHops} → ${after.chainHops}次`;
  }else{
    gain=rank>=3||rank===0&&laserBefore.laserUnlocked?`激光单束直伤 ${number(laserBefore.laserDamage*power)} → ${number(laserAfter.laserDamage*power)}`
      :rank===0?`新增激光 · ${laserAfter.laserInterval}秒/束 · 直伤${number(laserAfter.laserDamage*power)}`
      :rank===1?`激光间隔 ${laserBefore.laserInterval} → ${laserAfter.laserInterval}秒`
      :`激光贯穿 ${laserBefore.laserTargets} → ${laserAfter.laserTargets}敌`;
  }
  if(valid&&isMagneticAugment(branch))gain=`电弧直击 ${volley(before)} → ${volley(after)} · ${magneticAugments[branch].name}`;
  return {gain,plan:valid&&!branch&&route==='electric'&&world.canRefineMagnetic()?'精研二选一：广域覆盖 / 场外分流 · 原三拍保留':valid&&isMagneticAugment(branch)?magneticAugments[branch].detail:valid?combinationPlan(projected,route,current,world.activeWeapons.includes('arc')?world.weaponStage('arc'):0):'先选导电线圈，再解锁雷暴霰射',
    valid,stage,before,after,laserBefore,laserAfter};
}
