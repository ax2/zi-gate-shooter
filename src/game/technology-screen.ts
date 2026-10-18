import type{World}from'../core/world';
import{routes,type Route}from'../core/build-tree';
import{recipeStatus}from'../core/recipe-goal';
import{buildPreview}from'./build-preview';
import{technologyArt,technologies,nextTechnology,technologyOptions,routeColors,routeIcons,type Technology,type TechRequirement}from'./technology';
import type{CanvasControl}from'./canvas-runtime';
import type{EquipmentChange}from'./equipment-receipt';
import{weaponIcons}from'./technology';
export type TechTab='base'|'combos'|'advanced';
export interface TechView{tab:TechTab;selected:string}
/** Canvas-native controls and diagrams, raster device illustrations, real World predicates. */
function painter(c:CanvasRenderingContext2D,img?:HTMLImageElement){
 const buttons:CanvasControl[]=[];
 const rect=(x:number,y:number,w:number,h:number,color:string)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};
 const text=(s:string,x:number,y:number,size=24,color='#e4f4ff',align:CanvasTextAlign='center')=>{c.fillStyle=color;c.font=`600 ${size}px system-ui`;c.textAlign=align;c.textBaseline='middle';c.fillText(s,x,y);};
 const border=(x:number,y:number,w:number,h:number,color:string,width=2)=>{c.strokeStyle=color;c.lineWidth=width;c.strokeRect(x,y,w,h);};
 const art=(icon:number,x:number,y:number,size:number,locked=false)=>technologyArt(c,img,icon,x,y,size,locked);
 const button=(x:number,y:number,w:number,h:number,label:string,action:string,color='#214555')=>{rect(x,y,w,h,color);border(x,y,w,h,'#4f859d');text(label,x+w/2,y+h/2,25);buttons.push({x,y,w,h,label,action});};
 const line=(x:number,y:number,tx:number,ty:number,color:string)=>{c.strokeStyle=color;c.lineWidth=3;c.beginPath();c.moveTo(x,y);c.lineTo(x,(y+ty)/2);c.lineTo(tx,(y+ty)/2);c.lineTo(tx,ty);c.stroke();c.beginPath();c.moveTo(tx-5,ty-8);c.lineTo(tx,ty);c.lineTo(tx+5,ty-8);c.stroke();};
 const check=(x:number,y:number,ready:boolean)=>{rect(x-10,y-10,20,20,ready?'#285854':'#182a38');text(ready?'✓':'○',x,y,20,ready?'#baffd9':'#8395a2');};
 const wrap=(s:string,x:number,y:number,width:number,size=22)=>{let part='',row=0;c.font=`600 ${size}px system-ui`;for(const ch of s){if(c.measureText(part+ch).width>width){text(part,x,y+row*29,size,'#bdd4df','left');part='';row++;if(row===2)break;}part+=ch;}if(part&&row<2)text(part,x,y+row*29,size,'#bdd4df','left');};
 const prerequisite=(r:TechRequirement,x:number,y:number)=>{art(r.icon,x,y,56,!r.ready);check(x+24,y+20,r.ready);text(r.label,x,y+40,19,r.ready?'#baffd9':'#9bafbc');if(r.node)buttons.push({x:x-43,y:y-29,w:86,h:87,label:'查看前驱：'+r.label,action:'tech-jump:'+r.node+'|'+r.label});};
 return{buttons,rect,text,border,art,button,line,check,wrap,prerequisite};
}
export function advancedTechnologies(w:World):Technology[]{
 const rows:[Route,string,number,number,boolean][]=[['ballistic','雷暴精研',12,5,!!w.build.stormAugment],['electric','离子精研',13,2,!!w.build.ionAugment],['optical','双镜复合',11,6,!!w.build.opticalFusion],['ballistic','复合弹芯',5,10,!!w.build.ammoFusion],['electric','磁暴精研',15,0,!!w.build.magneticAugment],['optical','光链精研',6,1,!!w.build.photonAugment],['ballistic','裂甲精研',4,0,!!w.build.fractureAugment]];
 return rows.map(([route,name,icon,count,owned],i)=>{const requirements:TechRequirement[]=[{icon:route==='ballistic'?12:route==='electric'?13:14,label:({ballistic:'弹道',electric:'雷电',optical:'光学'})[route]+' 3',ready:w.build.ranks[route]>=3,node:route+':2'}];
  if(count)requirements.push({icon:routeIcons[route],label:`精调 ${Math.min(count,w.build.refinements[route])}/${count}`,ready:w.build.refinements[route]>=count,node:route+(w.build.ranks[route]>=3?':refine':':2')});
  if(i===0)requirements.push({icon:0,label:'霰射 T3',ready:w.activeWeapons.includes('scatter')&&w.weaponStage('scatter')>=3});
  if(i===1)requirements.push({icon:1,label:'电弧 T3',ready:w.activeWeapons.includes('arc')&&w.weaponStage('arc')>=3});
  if(i===3)requirements.push({icon:3,label:'弹道 T3',ready:w.activeWeapons.some(k=>k!=='arc'&&w.weaponStage(k)>=3)});
  if(i===4)requirements.push({icon:15,label:'磁暴榴弹',ready:recipeStatus(w,'magnetic').ready,node:'recipe:magnetic'});
  if(i===5)requirements.push({icon:6,label:'电光连锁',ready:recipeStatus(w,'photon').ready,node:'recipe:photon'});
  if(i===6)requirements.push({icon:4,label:'裂甲爆破',ready:recipeStatus(w,'fracture').ready,node:'recipe:fracture'});
  if(i===0)requirements.push({icon:1,label:'导电线圈',ready:w.build.ranks.electric>=1,node:'electric:0'});
  const ready=[w.canRefineStorm(),w.canRefineIon(),w.canFuseOptics(),w.canFuseAmmo(),w.canRefineMagnetic(),w.canRefinePhoton(),w.canRefineFracture()][i];
  // Existing late-tech ordering is a real conditional predecessor, not a hidden
  // failure after all visible checks turn green. No new gameplay gate is added.
  if(!owned&&!ready){
   if((i===0||i===3)&&w.canRefineFracture())requirements.push({icon:4,label:'先裂甲精研',ready:false,node:'advanced:6'});
   if(i===1&&w.canRefineMagnetic())requirements.push({icon:15,label:'先磁暴精研',ready:false,node:'advanced:4'});
   if(i===2&&w.canRefinePhoton())requirements.push({icon:6,label:'先光链精研',ready:false,node:'advanced:5'});
   if(i===3&&w.canRefineStorm())requirements.push({icon:12,label:'先雷暴精研',ready:false,node:'advanced:0'});
  }
  return{id:'advanced:'+i,name,icon,route,owned,ready,requirements,milestone:true,effect:i===0?'串联电桥 / 聚雷破核':i===1?'风暴电核 / 离子长矛':i===2?'保留原透镜，再叠加一种光路':i===3?'保留原弹芯，再叠加一种弹道':i===4?'广域磁场 / 分流电桥':i===6?'双击破核 / 贯通冲击':'远链矩阵 / 聚焦增幅'};
 });
}
export function drawTechnologyTree(c:CanvasRenderingContext2D,img:HTMLImageElement|undefined,w:World,view:TechView,back:string,goal?:string){
 const p=painter(c,img),all=[...technologies(w),...advancedTechnologies(w),...routes.filter(r=>w.build.ranks[r]>=3).map(r=>nextTechnology(w,r))],selected=all.find(n=>n.id===view.selected)??all[0];
 p.rect(35,70,650,1170,'#0b1b28');p.border(35,70,650,1170,'#36576d');p.text('科技树',175,120,38);p.text(`◈ ${w.buildPoints-w.build.spent}`,(w.growth.mastery??0)>=16?405:575,120,30,'#85e9ff');
 for(const[i,tab]of(['base','combos','advanced']as const).entries())p.button(58+i*205,170,195,56,['基础路线','组合科技','进阶科技'][i],'tech-tab:'+tab,view.tab===tab?'#235570':'#142c3c');
 const tile=(n:Technology,x:number,y:number,size=86)=>{const color=routeColors[n.route],active=n.id===selected.id;p.rect(x-82,y-66,164,139,active?'#224050':'#102532');p.border(x-82,y-66,164,139,active?'#b4f4ff':n.owned?color:n.ready?'#66d9e9':'#345063',active?3:2);if(n.index===1&&!n.owned){for(const[i,icon]of(n.route==='ballistic'?[3,4,5]:n.route==='electric'?[6,7,8]:[9,10,11]).entries())p.art(icon,x-48+i*48,y-16,45,!n.ready);p.text('三选一',x,y+21,17,'#acc9da');}else p.art(n.icon,x,y-13,size,!n.owned&&!n.ready);p.text(n.name.split(' · ')[0],x,y+51,22,n.milestone?'#ffe1a0':'#e3f1fa');p.check(x+66,y-48,n.owned);p.buttons.push({x:x-84,y:y-69,w:168,h:145,label:`${n.owned?'已学':n.ready?'可研究':'查看未来科技'}：${n.name}`,action:'tech-node:'+n.id});};
 if(view.tab==='base'){
  for(const[i,route]of routes.entries()){const x=155+i*205;p.text(['弹道','雷电','光学'][i],x,245,22,routeColors[route]);for(let j=0;j<2;j++)p.line(x,399+j*185,x,439+j*185,w.build.ranks[route]>j?routeColors[route]:'#3b5061');}
  // A second, genuine AND predecessor, kept clear of cards and labels.
  p.line(360,375,257,599,w.build.ranks.electric>0?'#c9a2ff':'#3b5061');p.line(257,599,155,603,w.build.ranks.electric>0?'#c9a2ff':'#3b5061');
  for(const n of all.filter(n=>n.index!==undefined))tile(n,155+routes.indexOf(n.route)*205,326+n.index!*185,n.milestone?104:86);
  p.text('点图片查看 · ✓ 已学 · ○ 未学',360,788,20,'#9eb7c5');
 }else{
  const list=view.tab==='combos'?all.filter(n=>n.recipe):all.filter(n=>n.id.startsWith('advanced:'));
  list.forEach((n,i)=>{const columns=view.tab==='advanced'?3:2,x=columns===3?155+(i%3)*205:205+(i%2)*310,y=318+Math.floor(i/columns)*160;tile(n,x,y,90);});
  p.text(view.tab==='combos'?'前驱全部达成 → 自动组合':'沿精调路线 → 解锁强力科技',360,771,20,'#9eb7c5');
 }
 p.rect(57,808,606,346,'#142d3c');p.border(57,808,606,346,'#487287');p.text(selected.name,360,839,28,selected.milestone?'#ffe1a0':'#e5f6ff');p.art(selected.icon,135,925,102);p.wrap(selected.ready&&!selected.owned&&!selected.recipe&&w.buildPoints>w.build.spent?buildPreview(w,selected.route).gain:selected.effect,226,884,405);p.text(selected.owned?'✓ 已生效':selected.ready?'前驱已达成':'先完成下方前驱',226,947,23,selected.owned?'#baffd9':selected.ready?'#9bf4ff':'#f0cc94','left');
 const req=selected.requirements;if(req.length)for(const[i,r]of req.entries()){const spacing=480/Math.max(1,req.length-1),x=120+i*spacing;p.prerequisite(r,req.length===1?360:x,1005);if(i<req.length-1)p.text('+',x+spacing/2,1005,25,'#7ca3bb');}else p.text('起点科技 · 消耗 ◈ 1',360,1010,22,'#a5dfee');
 if(selected.recipe){if(!selected.owned)p.button(185,1080,350,56,goal===selected.recipe?'✓ 已追踪此科技':'设为构筑目标','tech-goal:'+selected.recipe);else p.text('全部前驱已完成 · 自动生效',360,1107,23,'#baffd9');}
 else if(selected.ready&&!selected.owned&&w.buildPoints>w.build.spent&&w.player.hp>0&&w.phase!=='dead')p.button(185,1080,350,56,'研究 ◈ 1','tech-unlock:'+selected.id);
 else p.text(selected.owned?'原能力保留 · 可继续精调':selected.ready?'需要 ◈ 1':'前驱缺项已用 ○ 标记',360,1107,23,'#b8ccda');
 p.button(185,1170,350,58,back,'tree-back');if((w.growth.mastery??0)>=16)p.button(505,91,150,50,'超载协议','overdrive-open');return p.buttons;
}
export function drawTechnologyChoices(c:CanvasRenderingContext2D,img:HTMLImageElement|undefined,w:World,pickup?:EquipmentChange){
 const p=painter(c,img);p.rect(35,140,650,1020,'#0b1b28');p.text('选择新科技',360,203,38);p.text(`◈ ${w.buildPoints-w.build.spent}`,pickup?566:360,263,28,'#87eaff');
 if(pickup){p.art(weaponIcons[pickup.kind],120,268,58);p.text(pickup.before?pickup.before.stage!==pickup.after.stage?`T${pickup.before.stage} → T${pickup.after.stage}`:`精校 ${pickup.before.calibration} → ${pickup.after.calibration}`:`+ T${pickup.after.stage}`,235,268,26,'#baffd9');}
 for(const[i,route]of routes.entries()){const n=nextTechnology(w,route),y=320+i*222,enabled=w.build.available(w.buildPoints).includes(route);p.rect(65,y,590,200,enabled?'#17384b':'#15232e');p.border(65,y,590,200,enabled?routeColors[route]:'#344856');p.art(n.icon,157,y+89,142,!enabled);p.text(n.name,435,y+40,30,routeColors[route]);
  const rank=w.build.ranks[route];for(let j=0;j<3;j++){p.art(j===0?routeIcons[route]:j===1?(route==='ballistic'?3:route==='electric'?6:10):route==='ballistic'?12:route==='electric'?13:14,324+j*103,y+105,56,j>rank);if(j<2)p.line(360+j*103,y+105,383+j*103,y+105,'#8baabd');p.check(344+j*103,y+128,j<rank);}
  p.text(rank>=3?`精调 ${w.build.refinements[route]} → ${w.build.refinements[route]+1}`:enabled?'查看 / 研究':'需要导电线圈',435,y+172,22,enabled?'#b5eaff':'#9eacb6');
  if(enabled)p.buttons.push({x:65,y,w:590,h:200,label:n.name,action:'tech-choice:'+route});
 }
 p.button(185,1030,350,70,'查看完整科技树','tree');if((w.growth.mastery??0)>=16)p.button(225,1110,270,50,'超载协议','overdrive-open');return p.buttons;
}
export function drawTechnologyBranches(c:CanvasRenderingContext2D,img:HTMLImageElement|undefined,w:World,route:Route){
 const p=painter(c,img),options=technologyOptions(w,route);p.rect(35,120,650,1080,'#0b1b28');p.text('选择改造',360,188,38);p.text(`◈ 1  ·  ${options.length} 选 1`,360,246,25,'#9de7ff');
 options.forEach((n,i)=>{const y=305+i*222;p.rect(65,y,590,201,'#17384b');p.border(65,y,590,201,routeColors[route]);p.art(n.icon,164,y+98,164);p.text(n.name,445,y+42,30,routeColors[route]);if(n.lines)n.lines.forEach((line,j)=>p.text(line,285,y+94+j*34,25,'#d3e8f4','left'));else p.wrap(n.detail,285,y+91,350,23);p.text('选择',592,y+168,24,'#a3edff');p.buttons.push({x:65,y,w:590,h:201,label:n.name,action:'branch:'+n.branch});});
 p.text('原武器保留 · 本局选择不可改选',360,1018,22,'#c3dac7');
 if(w.canFuseAmmo()&&route==='ballistic')p.button(75,1070,278,70,'只做常规精调','fusion-defer');
 else if(w.canFuseOptics()&&route==='optical')p.button(75,1070,278,70,'只做常规精调','optic-defer');
 else p.button(75,1070,278,70,'查看升级路径','branch-tree');
 p.button(367,1070,278,70,'返回','branch-back');return p.buttons;
}
