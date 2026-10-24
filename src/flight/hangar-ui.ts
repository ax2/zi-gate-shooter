import{FlightHangar,hangarWeapons,hangarById,hangarRules,type WeaponKind}from'./hangar';
import{Assembly,techById}from'./technology';
import{flightProfile,parameterNumber as n}from'./profile';
export type HangarTab='main'|'side'|'owned'|'goods';
export interface HangarQuote{action:string;price:number;revision:number;title:string;detail:string;sale?:boolean}
export interface HangarPainter{
 good:(id:string,x:number,y:number,size:number)=>void;
 hit:(action:string,label:string,x:number,y:number,w:number,h:number)=>void;
 box:(x:number,y:number,w:number,h:number,color:string,stroke?:string)=>void;
 text:(s:string,x:number,y:number,size?:number,color?:string,align?:CanvasTextAlign,weight?:number)=>void;
 icon:(id:number,x:number,y:number,size:number,locked?:boolean)=>void;
 button:(action:string,label:string,x:number,y:number,w:number,h:number,highlight?:boolean)=>void;
 line:(points:{x:number;y:number}[],color:string,width:number)=>void;
 ship:(x:number,y:number,size:number)=>void;
}
export function hangarStats(g:FlightHangar,id:string,level=Math.max(1,g.level(id))){const w=hangarById.get(id);if(!w)return'';const save=g.snapshot();save.weapons[id]={level,paid:0,gift:false};save.equipped[w.kind]=[id];const preview=new FlightHangar(save),a=new Assembly();preview.project(a);const p=flightProfile(a);
 if(id==='cannon')return`${p.guns.count}路 + 翼炮${p.guns.wingCount}发 · ${n(p.guns.damage)}伤 / ${p.guns.interval}s`;
 if(id==='coil')return`${p.electric.targets}敌 · ${n(p.electric.damage)}伤 / ${p.electric.interval}s`;
 if(id==='laser')return`${p.optical.beams}束 · ${n(p.optical.damage)}伤 / ${p.optical.interval}s`;
 if(id==='rail')return`${n(p.guns.railDamage)}伤 · 穿${p.guns.railPierce+1}敌 / ${p.guns.railInterval}s`;
 return['hive','needles','seekorb','electrodes','tracker','blades'].includes(id)?`强度 ${Math.round(p.powers[w.column]*100)}% · ${w.steps[level-1]}`:'';
}
export function quoteHangar(g:FlightHangar,action:string):HangarQuote|undefined{const[id,key]=action.split(':'),weapon=hangarById.get(key);let price:number|undefined,title='',detail='',sale=false;
 if(id==='buy'&&weapon){price=g.price(key);title=g.level(key)?weapon.name+' → Lv'+(g.level(key)+1):'购买 '+weapon.name;detail=g.requirement(key)?'需先拥有 '+hangarById.get(g.requirement(key)!)!.name+' Lv2':g.level(key)?'永久升级 · 武器留在当前槽位或仓库':'永久入仓 · 购买后自行选择槽位装备';if(g.requirement(key))return;}
 else if(id==='sell'&&weapon&&g.canSell(key)){price=g.sale(key);sale=true;title='出售 '+weapon.name;detail='失去该武器与等级 · 已装备的会卸下';}
 else if(id==='slot'&&['main','side'].includes(key)&&g.capacity(key as WeaponKind)<2){price=key==='main'?hangarRules.mainSlot:hangarRules.sideSlot;title='解锁第2'+(key==='main'?'主':'副')+'武器槽';detail='永久解锁 · 同类槽最多2个';}
 else if(id==='good'&&['repair','armor','ember'].includes(key)){price=key==='repair'?hangarRules.repair:key==='armor'?hangarRules.armor:hangarRules.skin;title=key==='repair'?'回复2点生命':key==='armor'?'光甲6秒':'余烬机体涂装';detail=key==='ember'?'永久外观 · 不增加伤害':'仅本次出击使用 · 金币永久扣除';if(key==='ember'&&g.snapshot().skins.includes('ember'))return;}
 return price===undefined?undefined:{action,price,revision:g.revision,title,detail,sale};
}
export function paintHangar(u:HangarPainter,g:FlightHangar,state:{tab:HangarTab;page:number;selected:string;level:number;quote?:HangarQuote;notice:string;saveError:boolean;live:boolean}){
 const owned=g.snapshot(),gold='#f4d18b',cyan='#a6eee0';u.box(16,16,688,1248,'#071a29fa','#385c6b');u.text('星 港 机 库',36,46,32,'#eff6f1','left',800);u.text('◈ '+g.coins,680,46,31,gold,'right',800);u.text(state.saveError?'本机保存失败 · 正在重试':'金币 / 仓库 / 槽位永久保留',36,82,19,state.saveError?'#ffb393':'#9dbbc8');
 for(const[i,[tab,label]]of(['main','side','owned','goods']as const).map((t,i)=>[i,[t,['主武器','副武器','仓库','补给外观'][i]]]as const)){u.button('hangar-tab:'+tab,label,28+i*174,106,160,49,state.tab===tab);}
 for(const[kind,origin]of[['main',30],['side',380]]as const){u.text(kind==='main'?'主武器':'副武器',origin,181,19,'#abc8d2');for(let slot=0;slot<2;slot++){const id=g.equipped(kind)[slot],w=id?hangarById.get(id):undefined,x=origin+slot*158;u.box(x,199,148,69,'#0f2b39',slot<g.capacity(kind)?'#729b9d':'#3b4f5b');if(w){u.icon(w.icon,x+30,233,37);u.text(w.name.slice(0,4),x+59,222,17,'#d7e6e5');u.text('Lv'+g.level(id),x+59,246,17,gold);u.hit('hangar-slot:'+kind+':'+slot,w.name,x,199,148,69);}else if(slot<g.capacity(kind)){u.button('hangar-slot:'+kind+':'+slot,'空槽 · 选择',x+5,206,138,53);}else{u.button('hangar-quote:slot:'+kind,'解锁 ◈'+(kind==='main'?hangarRules.mainSlot:hangarRules.sideSlot),x+5,206,138,53);}}}
 if(state.tab==='goods'){
  const goods=[['repair','维修包','+2 生命',65,22],['armor','光甲','抵御实弹6秒',90,23],['ember','余烬涂装','永久外观',300,4],['standard','原厂涂装','已拥有',0,0]]as const;
  for(const[i,[id,name,detail,price,_icon]]of goods.entries()){const x=30+i%2*350,y=300+Math.floor(i/2)*171;u.box(x,y,310,150,'#112c39','#517586');u.good(id,x+60,y+60,72);u.text(name,x+112,y+40,25,'#e6eae4');u.text(detail,x+112,y+77,18,'#afc8cf');const acquired=id==='standard'||id==='ember'&&owned.skins.includes('ember');if(acquired)u.button('hangar-wear:'+id,g.skin===id?'已启用':'使用',x+112,y+106,178,34,g.skin===id);else if(state.live||id==='ember')u.button('hangar-quote:good:'+id,'◈ '+price,x+112,y+106,178,34);else u.text('出击时购买',x+200,y+121,19,'#8da9b7','center');}
  u.ship(360,843,195);u.text('机体最多 2主 + 2副',360,1012,26,cyan,'center');u.text('补给仅在出击中可用，交易时战斗暂停',360,1060,21,'#abc3ce','center');
 }else{
  const list=hangarWeapons.filter(w=>state.tab==='owned'?g.level(w.id)>0:w.kind===state.tab),pages=Math.max(1,Math.ceil(list.length/6)),page=Math.min(state.page,pages-1);
  for(const[i,w]of list.slice(page*6,page*6+6).entries()){const x=30+i%2*350,y=293+Math.floor(i/2)*123,level=g.level(w.id),selected=w.id===state.selected;u.box(x,y,310,108,selected?'#19434c':'#102a39',selected?cyan:'#3b6071');u.icon(w.icon,x+54,y+49,64);u.text(w.name,x+107,y+28,24,'#e2eae7');u.text(level?'Lv'+level+' · '+(g.active(w.id)?'已装备':'在仓库'):'未拥有',x+107,y+58,19,level?cyan:'#a2b5c1');u.text('›',x+286,y+71,24,'#c6e4dc','center');u.hit('hangar-select:'+w.id,w.name,x,y,310,108);}
  if(pages>1){u.button('hangar-page:'+Math.max(0,page-1),'‹',30,667,75,33);u.text((page+1)+' / '+pages,360,685,20,'#bcd4dc','center');u.button('hangar-page:'+Math.min(pages-1,page+1),'›',613,667,75,33);}
  const w=hangarById.get(state.selected)??hangarWeapons[0],level=g.level(w.id),view=Math.max(1,Math.min(5,state.level||Math.max(1,level)));u.box(28,719,664,425,'#0b2533','#547a88');u.icon(w.icon,83,763,67);u.text(w.name+'  '+(level?'Lv'+level:'未拥有'),136,750,29,'#edf0df');u.text(g.active(w.id)?'当前已装：'+w.steps[level-1]:'库存可随时换装 · 同一武器只占1槽',136,787,18,'#aecbd3');
  for(let i=0;i<5;i++){const x=91+i*132;if(i<4)u.line([{x:x+32,y:846},{x:x+100,y:846}],i<level-1?cyan:'#365464',3);const tech=i===2&&w.combo?w.combo.tech:w.techs[i].at(-1),icon=tech?techById.get(tech)?.icon??w.icon:w.icon;u.icon(icon,x,846,i===2||i===4?49:38,i>=level);if(i===2||i===4)u.text(i===4?'★':'◆',x+27,820,16,gold,'center');u.text('Lv'+(i+1),x,883,18,i+1===view?gold:'#d2dfe0','center');u.text(w.steps[i],x,912,16,i===2||i===4?gold:'#abc8cc','center');u.hit('hangar-level:'+(i+1),w.steps[i]+' Lv'+(i+1),x-43,813,86,139);}
  u.text('预览 '+hangarStats(g,w.id,view),360,978,20,'#c7e4df','center');const required=g.requirement(w.id);if(w.combo)u.text('Lv3组合：同时装备 '+hangarById.get(w.combo.weapon)!.name+' Lv2',360,1007,18,required?'#f5c78e':'#9dbbc7','center');
  const price=g.price(w.id);if(price!==undefined&&!required)u.button('hangar-quote:buy:'+w.id,(level?'升级 Lv'+(level+1):'购买')+' ◈'+price,44,1033,310,48,g.coins>=price);else u.text(required?'先拥有 '+hangarById.get(required)!.name+' Lv2':'最高等级',197,1056,20,gold,'center');if(level&&g.canSell(w.id))u.button('hangar-quote:sell:'+w.id,'出售 +'+g.sale(w.id),376,1033,300,48);else if(level)u.text('保留至少1个主武器',526,1056,20,'#9ebbc7','center');
  if(level)for(let slot=0;slot<g.capacity(w.kind);slot++){const active=g.equipped(w.kind)[slot]===w.id,removable=active&&(w.kind==='side'||g.equipped('main').length>1);u.button(removable?'hangar-unequip:'+w.kind+':'+slot:'hangar-equip:'+w.id+':'+slot,(removable?'卸下入仓':active?'已装':'装备 / 替换')+' '+(w.kind==='main'?'主':'副')+(slot+1),44+slot*332,1090,310,42,active);}
 }
 if(state.notice)u.text(state.notice,360,1159,19,gold,'center');u.button('hangar-close','返回',30,1190,310,55);u.button('help','操作帮助 ?',380,1190,310,55);
 if(state.quote){const q=state.quote;u.box(35,400,650,430,'#061a28ff',gold);u.text('交易确认',360,451,31,gold,'center',800);u.text(q.title,360,519,31,'#edf3e5','center');u.text(q.detail,360,578,20,'#b3cbd3','center');u.text((q.sale?'获得 ':'支付 ')+'◈ '+q.price,360,636,34,q.sale?cyan:gold,'center',800);u.text(!q.sale&&g.coins<q.price?'还缺 ◈ '+(q.price-g.coins):'金币 '+g.coins+' → '+Math.min(hangarRules.maxCoins,g.coins+(q.sale?q.price:-q.price)),360,684,22,'#bbd7df','center');u.button('hangar-cancel','取消',64,743,270,58);u.button('hangar-confirm','确认',386,743,270,58,true);}
}
export function paintHelp(u:HangarPainter,page:number){u.box(20,25,680,1225,'#081f2dfc','#67818d');u.text('飞 行 手 册',360,78,38,'#f2e9d2','center',800);const pages=[[
 ['移动',0,'拖动任意方向 / WASD','自动开火；机体中心亮点是碰撞核心'],['金币与掉落',3,'金币飞近拾取，配件约20次战利1件','稀有武器进仓库；重复武器折成金币'],['商店与保存',24,'点顶部“商店机库”或按B','金币、武器和槽位保存在本机'],['换装与仓库',27,'点武器图片，再选装备主/副槽','替换不会丢武器；至少保留1个主武器'],['升级与组合',30,'看Lv1→5路线；Lv3/5是强科技','副武器Lv3需对应主武器Lv2组合'],['出售与防护',23,'出售先看确认价格；等级一并失去','维修回2点，光甲6秒不挡激光与撞击'],
 ],[
 ['固定炮台',3,'沿场景推进；朝你当前方向三连射','看实际弹丸，横移绕开，不预画射线'],['防御工事',4,'先打护盾再破装甲；扇形交替弹幕','工事移动慢，击破奖励金币'],['战斗暂停',22,'商店、仓库、帮助和失焦均暂停','返回原页面；战斗寿命不会流逝'],['永久库存',24,'新出击沿用上次武器与槽位','首件赠送只领一次；存档只在此浏览器'],['外观与槽位',0,'金币可解锁第2主槽和第2副槽','最多4件挂载；外观涂装不增加伤害'],['实弹与危险',23,'绿色可拦弹，红弹和激光更难躲','敌弹有有限寿命，光甲不会永久无敌'],
 ]];for(const[i,[title,icon,line1,line2]]of pages[page].entries()){const y=166+i*145;u.box(40,y,640,127,'#112d3a','#3b5c6c');u.icon(Number(icon),86,y+53,52);u.text(String(title),134,y+28,26,'#f0d59f');u.text(String(line1),134,y+66,21,'#c1d9dc');u.text(String(line2),134,y+101,19,'#96b6c1');}u.button('help-page:'+(1-page),page?'‹ 常用操作':'敌人与进阶 ›',45,1080,630,57);u.text((page+1)+' / 2',360,1163,20,'#a4bec9','center');u.button('help-close','返回',190,1190,340,48);}
