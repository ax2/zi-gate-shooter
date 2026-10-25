import{comboCertifications,comboCertificationId}from'./combo-certifications';
import type{Part}from'./technology';
export type TrialId='ricochet'|'relay'|'beam';
export const trials:Record<TrialId,{name:string;icon:number;part:Part;goal:number;reward:number;brief:string;detail:string}>={
 ricochet:{name:'借壁猎手',icon:5,part:'alloy',goal:3,reward:4,brief:'反弹击破 3 敌',detail:'装上反弹弹芯，让跳弹造成最后一击；完成投送4弹芯'},
 relay:{name:'电桥接力',icon:6,part:'coil',goal:3,reward:4,brief:'三敌连通 3 次',detail:'一次电弧实际命中至少3敌算一组；完成投送4线圈'},
 beam:{name:'贯线破阵',icon:14,part:'lens',goal:3,reward:4,brief:'激光双穿 3 次',detail:'同一束主激光实际命中至少2敌算一组；完成投送4透镜'},
};
export const starterTrial:Record<string,TrialId>={split:'ricochet',coil:'relay',laser:'beam'};
export interface FlightCareer{version:1;kills:number;bossKills:number;best:number;trials:TrialId[];mastery:string[];badges:string[]}
export const achievements=[
 {id:'hundred',name:'百机突围',icon:0,detail:'累计击破100敌'},
 {id:'thousand',name:'千机王牌',icon:12,detail:'累计击破1000敌'},
 {id:'captain',name:'旗舰终结者',icon:4,detail:'累计击破5艘旗舰'},
 {id:'score',name:'万分航迹',icon:3,detail:'一次出击获得10000分'},
 {id:'trial-ricochet',name:'借壁猎手',icon:5,detail:'完成反弹击破航线'},
 {id:'trial-relay',name:'电桥接力',icon:6,detail:'完成三敌连通航线'},
 {id:'trial-beam',name:'贯线破阵',icon:14,detail:'完成激光双穿航线'},
 {id:'master-arsenal',name:'蜂群认证',icon:4,detail:'以蜂群武库实际击破旗舰'},
 {id:'master-tempest',name:'超导认证',icon:13,detail:'以超导风暴实际击破旗舰'},
 {id:'master-sun',name:'日冕认证',icon:14,detail:'以日冕阵列实际击破旗舰'},
 {id:'tactic-disarm',name:'拆舱先锋',icon:4,detail:'优先拆双舱，主舰半血前完成并取胜'},
 {id:'tactic-core',name:'直取中枢',icon:14,detail:'拆舱前先打掉主舰25%耐久，并取胜'},
 {id:'trinity',name:'三相工程师',icon:15,detail:'不同出击中完成三种终极认证'},
 ...comboCertifications.map(a=>({id:comboCertificationId(a.tech),name:a.name,icon:({starhive:30,thundernet:31,plasmacore:32,aurorawing:33,huntprism:34,bladewave:35}as const)[a.tech],detail:'组合实际伤害旗舰至少5%船体，并击破同一旗舰'})),
 {id:'combo-complete',name:'六系王牌',icon:15,detail:'完成六种组合实战认证；可在不同出击中取得'},
]as const;
const keys=['arsenal','tempest','sun'];
const counter=(v:unknown)=>typeof v==='number'&&Number.isFinite(v)?Math.max(0,Math.min(Number.MAX_SAFE_INTEGER,Math.floor(v))):0;
const unique=(v:unknown,allowed:readonly string[])=>Array.isArray(v)?[...new Set(v.filter((x):x is string=>typeof x==='string'&&allowed.includes(x)))]:[];
export function readFlightCareer(raw:unknown):FlightCareer{const r=raw&&typeof raw==='object'?raw as Record<string,unknown>:{};return{version:1,kills:counter(r.kills),bossKills:counter(r.bossKills),best:counter(r.best),trials:unique(r.trials,Object.keys(trials))as TrialId[],mastery:unique(r.mastery,keys),badges:unique(r.badges,achievements.map(a=>a.id))};}
export function achievementProgress(id:string,c:FlightCareer){if(id==='combo-complete')return{current:comboCertifications.filter(a=>c.badges.includes(comboCertificationId(a.tech))).length,target:6};if(id.startsWith('combo-'))return{current:Number(c.badges.includes(id)),target:1};if(id.startsWith('tactic-'))return{current:Number(c.badges.includes(id)),target:1};if(id==='hundred')return{current:Math.min(c.kills,100),target:100};if(id==='thousand')return{current:Math.min(c.kills,1000),target:1000};if(id==='captain')return{current:Math.min(c.bossKills,5),target:5};if(id==='score')return{current:Math.min(c.best,10000),target:10000};if(id==='trinity')return{current:c.mastery.length,target:3};return{current:id.startsWith('trial-')?Number(c.trials.includes(id.slice(6)as TrialId)):Number(c.mastery.includes(id.slice(7))),target:1};}
export interface CareerFacts{kills:number;bossKills:number;score:number;trialCompleted?:TrialId;keystoneWins:readonly string[];bossTactics?:readonly string[];comboWins?:readonly string[]}
/** Per-run deltas prevent pause/menu/frame polling from counting the run twice. */
export class CareerLedger{
 readonly data:FlightCareer;dirty=false;private seen={kills:0,bossKills:0};
 constructor(raw:unknown){this.data=readFlightCareer(raw);}
 beginRun(){this.seen={kills:0,bossKills:0};}
 sync(f:CareerFacts){const c=this.data,before=JSON.stringify(c),kills=counter(f.kills),boss=counter(f.bossKills);c.kills=counter(c.kills+Math.max(0,kills-this.seen.kills));c.bossKills=counter(c.bossKills+Math.max(0,boss-this.seen.bossKills));c.best=Math.max(c.best,counter(f.score));this.seen={kills:Math.max(this.seen.kills,kills),bossKills:Math.max(this.seen.bossKills,boss)};
  if(f.trialCompleted&&!c.trials.includes(f.trialCompleted))c.trials.push(f.trialCompleted);for(const key of f.keystoneWins)if(keys.includes(key)&&!c.mastery.includes(key))c.mastery.push(key);
  const earned:string[]=[];for(const tech of (boss>0?f.comboWins??[]:[])){const id=comboCertificationId(tech);if(comboCertifications.some(a=>a.tech===tech)&&!c.badges.includes(id)){c.badges.push(id);earned.push(id);}}for(const tactic of (boss>0?f.bossTactics??[]:[])){if(!['disarm','core'].includes(tactic))continue;const id='tactic-'+tactic;if(!c.badges.includes(id)){c.badges.push(id);earned.push(id);}}for(const a of achievements){const p=achievementProgress(a.id,c);if(p.current>=p.target&&!c.badges.includes(a.id)){c.badges.push(a.id);earned.push(a.id);}}this.dirty ||= JSON.stringify(c)!==before;return earned;
 }
 saved(){this.dirty=false;}
}
