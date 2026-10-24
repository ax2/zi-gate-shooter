import{type Assembly}from'./technology';
export type WeaponKind='main'|'side';
export interface HangarWeapon{id:string;name:string;kind:WeaponKind;icon:number;price:number;column:number;steps:string[];techs:string[][];combo?:{weapon:string;tech:string}}
export const hangarRules={version:1,maxCoins:10000000,crateEvery:20,lootLimit:12,maxLevel:5,maxSlots:2,mainSlot:900,sideSlot:750,repair:65,armor:90,skin:300}as const;
export const hangarWeapons:HangarWeapon[]=[
 {id:'cannon',name:'双翼机炮',kind:'main',icon:0,price:140,column:0,steps:['双翼齐射','弹墙反弹','爆裂弹芯','六翼弹幕','蜂群武库'],techs:[['split'],['bounce'],['flak'],['barrage'],['arsenal']]},
 {id:'coil',name:'雷电主炮',kind:'main',icon:1,price:160,column:1,steps:['双目标电弧','四目标连锁','远距索敌','磁暴清弹','双源风暴'],techs:[['coil'],['chain'],['seeker'],['emp'],['tempest']]},
 {id:'laser',name:'激光主炮',kind:'main',icon:2,price:180,column:2,steps:['贯穿光束','三路分光','命中灼烧','棱镜反射','深穿日冕'],techs:[['laser'],['twin'],['burn'],['prism'],['drill','sun']]},
 {id:'rail',name:'磁轨主炮',kind:'main',icon:3,price:220,column:0,steps:['高伤贯穿','强化线圈','重弹贯穿','超载齐射','磁轨突破'],techs:[['rail'],[],[],[],['railburst']]},
 {id:'hive',name:'蜂巢副炮',kind:'side',icon:24,price:120,column:0,steps:['六发扇射','强化炮芯','爆星组合','强化爆弹','精密弹仓'],techs:[['hive'],[],[],[],[]],combo:{weapon:'cannon',tech:'starhive'}},
 {id:'needles',name:'磁钉副炮',kind:'side',icon:25,price:140,column:0,steps:['三路贯穿','强化磁钉','雷网组合','强化雷网','精密磁轨'],techs:[['needles'],[],[],[],[]],combo:{weapon:'coil',tech:'thundernet'}},
 {id:'seekorb',name:'巡航雷球',kind:'side',icon:26,price:150,column:1,steps:['追踪双雷球','强化雷球','星核组合','强化星核','精密制导'],techs:[['seekorb'],[],[],[],[]],combo:{weapon:'laser',tech:'plasmacore'}},
 {id:'electrodes',name:'护航电极',kind:'side',icon:27,price:160,column:1,steps:['近身放电拦弹','强化电极','极光组合','强化极光','精密电场'],techs:[['electrodes'],[],[],[],[]],combo:{weapon:'laser',tech:'aurorawing'}},
 {id:'tracker',name:'追光副镜',kind:'side',icon:28,price:170,column:2,steps:['自动索敌束','强化光镜','猎镜组合','强化猎镜','精密追光'],techs:[['tracker'],[],[],[],[]],combo:{weapon:'coil',tech:'huntprism'}},
 {id:'blades',name:'回旋光刃',kind:'side',icon:29,price:160,column:2,steps:['环身切割','强化光刃','回响组合','强化回响','精密旋刃'],techs:[['blades'],[],[],[],[]],combo:{weapon:'cannon',tech:'bladewave'}},
];
export const hangarById=new Map(hangarWeapons.map(w=>[w.id,w]));
export interface HangarSave{version:1;coins:number;weapons:Record<string,{level:number;paid:number;gift:boolean}>;slots:{main:number;side:number};equipped:{main:string[];side:string[]};skins:string[];skin:string;started:boolean}
const integer=(n:unknown,max:number)=>typeof n==='number'&&Number.isSafeInteger(n)&&n>=0&&n<=max;
const blank=():HangarSave=>({version:1,coins:0,weapons:{},slots:{main:1,side:1},equipped:{main:[],side:[]},skins:['standard'],skin:'standard',started:false});
export class FlightHangar{
 private data:HangarSave=blank();revision=0;deliveries=0;receipt?:{coins:number;weapons:string[];text:string;until:number};
 constructor(raw?:unknown){if(!raw||typeof raw!=='object'||(raw as any).version!==1)return;const r=raw as any,d=blank();d.coins=integer(r.coins,hangarRules.maxCoins)?r.coins:0;
  for(const w of hangarWeapons){const v=r.weapons?.[w.id];if(v&&integer(v.level,5)&&v.level>=1&&integer(v.paid,hangarRules.maxCoins))d.weapons[w.id]={level:v.level,paid:v.paid,gift:v.gift===true};}
  for(const kind of['main','side']as const){if(integer(r.slots?.[kind],2)&&r.slots[kind]>=1)d.slots[kind]=r.slots[kind];if(Array.isArray(r.equipped?.[kind]))d.equipped[kind]=[...new Set<string>(r.equipped[kind].filter((id:unknown)=>typeof id==='string'&&d.weapons[id]&&hangarById.get(id)?.kind===kind))].slice(0,d.slots[kind]);}
  if(!d.equipped.main.length){const first=hangarWeapons.find(w=>w.kind==='main'&&d.weapons[w.id]);if(first)d.equipped.main=[first.id];}
  d.started=d.equipped.main.length>0;if(Array.isArray(r.skins)&&r.skins.includes('ember'))d.skins.push('ember');if(d.skins.includes(r.skin))d.skin=r.skin;this.data=d;
 }
 get coins(){return this.data.coins;}get started(){return this.data.started;}get skin(){return this.data.skin;}
 snapshot():HangarSave{return structuredClone(this.data);}
 level(id:string){return this.data.weapons[id]?.level??0;}
 equipped(kind:WeaponKind){return[...this.data.equipped[kind]];}
 capacity(kind:WeaponKind){return this.data.slots[kind];}
 active(id:string){return this.data.equipped.main.includes(id)||this.data.equipped.side.includes(id);}
 begin(id:string){if(this.started)return false;const key=id==='split'?'cannon':id;if(!['cannon','coil','laser'].includes(key))return false;this.data.weapons[key]={level:1,paid:0,gift:true};this.data.equipped.main=[key];this.data.started=true;this.revision++;return true;}
 credit(amount:number){if(!integer(amount,hangarRules.maxCoins)||amount===0)return false;this.data.coins=Math.min(hangarRules.maxCoins,this.coins+amount);this.revision++;return true;}
 price(id:string){const w=hangarById.get(id);return !w?undefined:this.level(id)?this.level(id)>=5?undefined:Math.ceil(w.price*.8*Math.pow(this.level(id),2.2)):w.price;}
 requirement(id:string){const w=hangarById.get(id);return w?.combo&&this.level(id)===2&&this.level(w.combo.weapon)<2?w.combo.weapon:undefined;}
 sale(id:string){const v=this.data.weapons[id];return v?v.paid?Math.floor(v.paid*.5):v.gift?0:Math.floor(hangarById.get(id)!.price*.35):0;}
 buy(id:string){const price=this.price(id);if(price===undefined||this.coins<price||this.requirement(id))return false;const old=this.data.weapons[id];this.data.coins-=price;this.data.weapons[id]={level:(old?.level??0)+1,paid:(old?.paid??0)+price,gift:old?.gift??false};this.revision++;return true;}
 equip(id:string,slot:number){const w=hangarById.get(id);if(!w||!this.level(id)||!integer(slot,1)||slot>=this.capacity(w.kind))return false;const list=this.data.equipped[w.kind],at=list.indexOf(id);if(at===slot)return false;if(at>=0){const other=list[slot];list[slot]=id;if(other)list[at]=other;else list.splice(at,1);}else list[slot]=id;this.data.equipped[w.kind]=list.filter(Boolean);this.revision++;return true;}
 unequip(kind:WeaponKind,slot:number){const list=this.data.equipped[kind];if(!integer(slot,1)||slot>=list.length||kind==='main'&&list.length===1)return false;list.splice(slot,1);this.revision++;return true;}
 canSell(id:string){return!!this.level(id)&&!(this.data.equipped.main.length===1&&this.data.equipped.main[0]===id);}
 sell(id:string){if(!this.canSell(id))return false;const price=this.sale(id),w=hangarById.get(id)!;this.data.equipped[w.kind]=this.data.equipped[w.kind].filter(key=>key!==id);delete this.data.weapons[id];this.data.coins=Math.min(hangarRules.maxCoins,this.coins+price);this.revision++;return true;}
 unlock(kind:WeaponKind){if(!['main','side'].includes(kind)||this.capacity(kind)>=2)return false;const price=kind==='main'?hangarRules.mainSlot:hangarRules.sideSlot;if(this.coins<price)return false;this.data.coins-=price;this.data.slots[kind]++;this.revision++;return true;}
 buySkin(){if(this.data.skins.includes('ember')||this.coins<hangarRules.skin)return false;this.data.coins-=hangarRules.skin;this.data.skins.push('ember');this.revision++;return true;}
 wear(skin:string){if(!this.data.skins.includes(skin)||skin===this.skin)return false;this.data.skin=skin;this.revision++;return true;}
 supply(id:string,p:{hp:number;maxHp:number;armor:number},live:boolean){const price=id==='repair'?hangarRules.repair:id==='armor'?hangarRules.armor:Infinity;if(!live||this.coins<price||p.hp<=0||id==='repair'&&p.hp>=p.maxHp||id==='armor'&&p.armor>=6)return false;this.data.coins-=price;if(id==='repair')p.hp=Math.min(p.maxHp,p.hp+2);else p.armor=6;this.revision++;return true;}
 delivery(_part:string,amount:number){this.deliveries++;const weapons:Record<string,number>={};let coins=Math.max(1,Math.min(10000,amount))*2;if(this.deliveries%hangarRules.crateEvery===0){const pool=hangarWeapons.filter(w=>w.kind==='side'),id=pool[Math.floor(this.deliveries/hangarRules.crateEvery-1)%pool.length].id;weapons[id]=1;coins=0;}return{coins,weapons};}
 collect(cargo:{coins:number;weapons:Record<string,number>},time:number){let coins=cargo.coins;const added:string[]=[];for(const[id,n]of Object.entries(cargo.weapons)){const w=hangarById.get(id);if(!w||!integer(n,10000))continue;for(let i=0;i<n;i++){if(!this.level(id)){this.data.weapons[id]={level:1,paid:0,gift:false};added.push(id);}else coins+=Math.floor(w.price*.35);}}this.credit(Math.min(hangarRules.maxCoins,coins));this.revision++;this.receipt={coins,weapons:added,text:added.length?'新武器已入仓 · 点机库装备':coins?'金币入账 · 商店可购买强化':'已回收',until:time+3};}
 /** Project active weapons only. Ownership and levels remain in permanent storage. */
 project(a:Assembly){a.installed.clear();for(const key of Object.keys(a.calibrated))delete a.calibrated[key];for(const key of['alloy','coil','lens']as const)a.inventory[key]=0;a.salvage=this.level('cannon')&&this.active('cannon')?(this.level('cannon')-1)*10:0;const components:string[]=[],evolutions:string[]=[];
  for(const id of[...this.data.equipped.main,...this.data.equipped.side]){const w=hangarById.get(id)!,level=this.level(id);for(const set of w.techs.slice(0,level))for(const tech of set)a.installed.add(tech);const root=w.techs[0][0];a.calibrated[root]=(level-1)*2;if(w.kind==='side'){components.push(id);const combo=level>=3&&w.combo&&this.active(w.combo.weapon)&&this.level(w.combo.weapon)>=2?w.combo.tech:undefined;evolutions.push(combo??'');if(combo)a.installed.add(combo);}}
  a.loadout={cannon:this.active('cannon'),components,evolutions};
 }
}
