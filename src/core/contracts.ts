import {buildProofs,PROOF_WAVES,type ProofTarget} from './build-proof';
export const HUNTER={targets:2,spacing:6,hoverY:500,holdSeconds:20,retry:.5} as const;
export const hunts={
 staggered:{name:'分批悬赏',detail:'两名精英分批入场 · 30秒全破',research:0,durability:1},
 crossfire:{name:'双线王牌',detail:'30秒全破强化扇射双机 · 建议T3火力',research:1,durability:1.6},
} as const;
export type HuntKind=keyof typeof hunts;
export const contracts={
 precision:{name:'无伤猎杀',detail:'30秒内击毁15敌，全程不受伤',charge:100},
 specialist:{name:'专精试炼',detail:'30秒内击毁15敌，不新增武器种类',charge:75},
 hunter:{name:'危险猎手',detail:'30秒内击破2名标记精英 · 允许受伤',charge:150},
 research:{name:'构筑检验',detail:'检验已成形构筑的真实战斗效果',charge:100},
} as const;
export type ContractKind=keyof typeof contracts;
export class Contract {
 reinforcements=0; nextReinforcement=0;
 private killedTargets=new Set<number>();private lostTarget=false;
 get targetKills(){return this.killedTargets.size;}
 targetKilled(id:number,round:number){
  if(this.kind!=='hunter'||this.status!=='active'||round!==this.round||this.killedTargets.has(id))return false;
  this.killedTargets.add(id);return true;
 }
 targetEscaped(round:number){if(this.kind==='hunter'&&this.status==='active'&&round===this.round)this.lostTarget=true;}
 private ricochetGroups=new Set<number>();
 get proofGroupCount(){return this.ricochetGroups.size;}
 recordRicochetGroup(group:number,round:number){
  if(this.kind!=='research'||this.proof?.kind!=='ricochet'||this.status!=='active'||round!==this.round||!Number.isInteger(group)||group<1||group>Math.min(this.reinforcements,PROOF_WAVES.groups))return;
  this.ricochetGroups.add(group);
 }
 proofProgress=0;
 elapsed=0; status:'active'|'won'|'failed'='active';reason='';
 constructor(readonly kind:ContractKind,readonly round:number,readonly startKills:number,readonly weapons:number,readonly damage:number,readonly proof?:ProofTarget,readonly hunt:HuntKind='staggered'){}
 update(dt:number,kills:number,weapons:number,damage:number,alive:boolean,proofTotal=0){
  if(this.status!=='active')return false;
  this.elapsed+=dt;
  const broken=!alive?'机体被摧毁':this.kind==='hunter'&&this.lostTarget?'悬赏目标已脱离':this.kind==='precision'&&damage>this.damage?'受到伤害':this.kind==='specialist'&&weapons>this.weapons?'新增了武器种类':'';
  if(broken){this.status='failed';this.reason=broken;return true;}
  if(this.kind==='hunter'&&this.targetKills>=HUNTER.targets&&this.elapsed<=30+1e-8){this.status='won';this.reason='悬赏目标全破';return true;}
  if(this.kind==='research'){
   if(this.proof)this.proofProgress=Math.max(0,proofTotal-this.proof.start);
   if(this.proof&&this.proofProgress>=buildProofs[this.proof.kind].goal&&(this.proof.kind!=='ricochet'||this.proofGroupCount>=buildProofs.ricochet.groups)&&this.elapsed<=30+1e-8){this.status='won';this.reason=`${buildProofs[this.proof.kind].name}检验通过`;return true;}
   if(this.elapsed+1e-8<30)return false;
   this.status='failed';this.reason=this.proof?.kind==='ricochet'?(this.proofProgress>=buildProofs.ricochet.goal?'验证批次不足':'有效跳弹不足'):'组合有效触发不足';return true;
  }
  if(this.elapsed+1e-8<30)return false;
  this.status=this.kind!=='hunter'&&kills-this.startKills>=15?'won':'failed';this.reason=this.status==='won'?'挑战完成':this.kind==='hunter'?'悬赏目标未全破':'击毁数量不足';return true;
 }
}
