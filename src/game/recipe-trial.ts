import type{World}from'../core/world';
import{recipeStatus,type RecipeGoal}from'../core/recipe-goal';
/** Run-local intent. Actual acceptance, waves and rewards remain World rules. */
export function recipeTrialStatus(w:World,goal:RecipeGoal){
 const recipe=recipeStatus(w,goal);
 if(!recipe.ready)return{ready:false,reason:recipe.need};
 if(!w.availableProofs().includes(goal))return{ready:false,reason:goal==='magnetic'?(w.build.ranks.electric<3?'还需雷电3与磁暴精研':'还需选择磁暴精研'):'尚未获得检验资格'};
 if(w.contractReward)return{ready:false,reason:'先领取已有契约奖励'};
 if(w.contract?.status==='active')return{ready:false,reason:'已有挑战进行中，等待下一章'};
 if(w.contract?.round===w.round)return{ready:false,reason:'本章已有契约，等待下一章'};
 if(w.phase!=='running'||w.roundTime>40)return{ready:false,reason:'等待下一章前40秒窗口'};
 return{ready:w.canAcceptContract('research',goal),reason:'成形后暂停展示检验，继续后追加敌阵'};
}
export class RecipeTrialPlan{
 private pending:{goal:RecipeGoal;accepted:number}|null=null;
 get goal(){return this.pending?.goal??null;}
 clear(){this.pending=null;}
 toggle(goal:RecipeGoal,accepted:number){if(this.goal===goal)this.clear();else this.pending={goal,accepted};}
 poll(w:World){
  const p=this.pending;if(!p)return null;
  if(w.contractStats.accepted>p.accepted&&w.contract?.proof?.kind===p.goal){this.clear();return{kind:'manual' as const,goal:p.goal};}
  if(!w.canAcceptContract('research',p.goal)||!w.acceptContract('research',p.goal))return null;
  this.clear();return{kind:'planned' as const,goal:p.goal};
 }
}
