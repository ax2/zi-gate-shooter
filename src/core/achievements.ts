import type { Route } from './build-tree';
import {buildProofs,type BuildProof} from './build-proof';
export const achievements = [
 {id:'hunter',name:'百机破阵',detail:'累计击毁100架敌机'},
 {id:'boss',name:'首领终结者',detail:'首次击毁首领'},
 {id:'specialist',name:'专精工程师',detail:'前三个升级点全部投入同一路线'},
 {id:'hybrid',name:'跨界试验',detail:'前三个升级点分别投入三条路线'},
 {id:'storm',name:'雷暴设计师',detail:'组合导电线圈与雷暴霰射'},
 {id:'fracture',name:'裂甲工程师',detail:'单局触发10次裂甲爆破'},
 {id:'arsenal',name:'移动军械库',detail:'单局同时持有五种武器'},
 {id:'tactician',name:'战术拆解',detail:'编队全破且无伤击败首领'},
 {id:'disruptor',name:'断电时机',detail:'一次中继爆破中断两台正在蓄能的敌机'},
 {id:'proof',name:'实战工程师',detail:'主动接取并完成一次构筑检验'},
 {id:'ace',name:'王牌猎手',detail:'主动接取双线王牌并击破两名目标'},
 {id:'flawless-ace',name:'交火零伤',detail:'接取后不受伤，完成双线王牌'},
 {id:'versatile',name:'构筑全才',detail:'完成3种不同构筑检验，可跨局'},
 {id:'bank-shot',name:'折弹高手',detail:'主动通过跳弹侧击检验：12次跳弹、命中2批精英'},
 {id:'core-breaker',name:'断核者',detail:'翼炮发射后、核心连射前击毁截击精英'},
] as const;
export const achievementGroups={growth:{name:'成长',ids:['hunter','boss','arsenal','fracture']},build:{name:'构筑',ids:['specialist','hybrid','storm','proof','versatile']},tactics:{name:'战术',ids:['tactician','disruptor','ace','flawless-ace','bank-shot','core-breaker']}} as const;
export type AchievementGroup=keyof typeof achievementGroups;
export const achievementGroup=(id:string):AchievementGroup=>(Object.keys(achievementGroups) as AchievementGroup[]).find(g=>(achievementGroups[g].ids as readonly string[]).includes(id))??'growth';
export interface Achievements {kills:number; bosses:number; unlocked:string[];certifiedBuilds:BuildProof[];tracked:string|null}
export const emptyAchievements=():Achievements=>({kills:0,bosses:0,unlocked:[],certifiedBuilds:[],tracked:null});
export function parseAchievements(value:unknown):Achievements {
 const result=emptyAchievements();
 if(!value || typeof value!=='object')return result;
 const data=value as Partial<Achievements>;
 for(const key of ['kills','bosses'] as const)if(Number.isSafeInteger(data[key])&&data[key]!>=0)result[key]=data[key]!;
 if(Array.isArray(data.unlocked))result.unlocked=achievements.filter(a=>data.unlocked!.includes(a.id)).map(a=>a.id);
 if(Array.isArray(data.certifiedBuilds))result.certifiedBuilds=(Object.keys(buildProofs) as BuildProof[]).filter(k=>data.certifiedBuilds!.includes(k));
 if(typeof data.tracked==='string'&&achievements.some(a=>a.id===data.tracked))result.tracked=data.tracked;
 return result;
}
export function trackAchievement(state:Achievements,id:string){if(!achievements.some(a=>a.id===id)||state.unlocked.includes(id))return false;state.tracked=id;return true;}
export function achievementProgress(id:string,state:Achievements){
 if(id==='hunter')return `${Math.min(state.kills,100)}/100架敌机`;
 if(id==='versatile')return !state.certifiedBuilds.length&&state.unlocked.includes('proof')?'0/3种 · 旧记录未分类型，请重新认证':`${Math.min(state.certifiedBuilds.length,3)}/3种 · 已认证：${state.certifiedBuilds.slice(0,2).map(k=>buildProofs[k].name).join(' / ')||'暂无'}${state.certifiedBuilds.length>2?'…':''}`;
 return state.unlocked.includes(id)?'挑战记录已保存在本机':'选择并完成对应挑战，自动记录';
}
export interface AchievementEvidence {aceWins?:number;flawlessAceWins?:number;certifiedBuilds?:readonly BuildProof[];interceptorBreaks?:number}
export function awardAchievements(state:Achievements,ranks:Record<Route,number>,weapons:number,fractureBursts=0,tacticalWins=0,conduitTacticalWins=0,proofWins=0,evidence:AchievementEvidence={}){
 for(const kind of Object.keys(buildProofs) as BuildProof[])if(evidence.certifiedBuilds?.includes(kind)&&!state.certifiedBuilds.includes(kind))state.certifiedBuilds.push(kind);
 const values=Object.values(ranks),spent=values.reduce((a,b)=>a+b,0);
 const met=[state.kills>=100,state.bosses>=1,spent===3&&values.includes(3),spent===3&&values.every(v=>v===1),ranks.ballistic>=3&&ranks.electric>=1,fractureBursts>=10,weapons>=5,tacticalWins>0,conduitTacticalWins>0,proofWins>0,(evidence.aceWins??0)>0,(evidence.flawlessAceWins??0)>0,state.certifiedBuilds.length>=3,state.certifiedBuilds.includes('ricochet'),(evidence.interceptorBreaks??0)>0];
 const fresh=achievements.filter((a,i)=>met[i]&&!state.unlocked.includes(a.id));
 state.unlocked.push(...fresh.map(a=>a.id));return fresh;
}
