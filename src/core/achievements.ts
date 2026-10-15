import type { Route } from './build-tree';
export const achievements = [
 {id:'hunter',name:'百机破阵',detail:'累计击毁100架敌机'},
 {id:'boss',name:'首领终结者',detail:'首次击毁首领'},
 {id:'specialist',name:'专精工程师',detail:'前三个升级点全部投入同一路线'},
 {id:'hybrid',name:'跨界试验',detail:'前三个升级点分别投入三条路线'},
 {id:'storm',name:'雷暴设计师',detail:'组合导电线圈与雷暴霰射'},
 {id:'fracture',name:'裂甲工程师',detail:'单局触发10次裂甲爆破'},
 {id:'arsenal',name:'移动军械库',detail:'单局同时持有五种武器'},
] as const;
export interface Achievements {kills:number; bosses:number; unlocked:string[]}
export const emptyAchievements=():Achievements=>({kills:0,bosses:0,unlocked:[]});
export function parseAchievements(value:unknown):Achievements {
 const result=emptyAchievements();
 if(!value || typeof value!=='object')return result;
 const data=value as Partial<Achievements>;
 for(const key of ['kills','bosses'] as const)if(Number.isSafeInteger(data[key])&&data[key]!>=0)result[key]=data[key]!;
 if(Array.isArray(data.unlocked))result.unlocked=achievements.filter(a=>data.unlocked!.includes(a.id)).map(a=>a.id);
 return result;
}
export function awardAchievements(state:Achievements,ranks:Record<Route,number>,weapons:number,fractureBursts=0){
 const values=Object.values(ranks),spent=values.reduce((a,b)=>a+b,0);
 const met=[state.kills>=100,state.bosses>=1,spent===3&&values.includes(3),spent===3&&values.every(v=>v===1),ranks.ballistic>=3&&ranks.electric>=1,fractureBursts>=10,weapons>=5];
 const fresh=achievements.filter((a,i)=>met[i]&&!state.unlocked.includes(a.id));
 state.unlocked.push(...fresh.map(a=>a.id));return fresh;
}
