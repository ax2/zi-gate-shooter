export const contracts={
 precision:{name:'无伤猎杀',detail:'30秒内击毁15敌，全程不受伤',charge:100},
 specialist:{name:'专精试炼',detail:'30秒内击毁15敌，不新增武器种类',charge:75},
} as const;
export type ContractKind=keyof typeof contracts;
export class Contract {
 elapsed=0; status:'active'|'won'|'failed'='active';reason='';
 constructor(readonly kind:ContractKind,readonly round:number,readonly startKills:number,readonly weapons:number,readonly damage:number){}
 update(dt:number,kills:number,weapons:number,damage:number,alive:boolean){
  if(this.status!=='active')return false;
  this.elapsed+=dt;
  const broken=!alive?'机体被摧毁':this.kind==='precision'&&damage>this.damage?'受到伤害':this.kind==='specialist'&&weapons>this.weapons?'新增了武器种类':'';
  if(broken){this.status='failed';this.reason=broken;return true;}
  if(this.elapsed<30)return false;
  this.status=kills-this.startKills>=15?'won':'failed';this.reason=this.status==='won'?'挑战完成':'击毁数量不足';return true;
 }
}
