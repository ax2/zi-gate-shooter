import{starRegions,starPlanets,starEdges,planetById,planetKinds,planetReward,unlockedRegion,type NavigationSave}from'./star-routes';
export interface StarMapPainter{ctx:CanvasRenderingContext2D;box:(x:number,y:number,w:number,h:number,fill:string,stroke?:string)=>void;text:(s:string,x:number,y:number,size:number,color:string,align?:CanvasTextAlign,weight?:number)=>void;button:(action:string,label:string,x:number,y:number,w:number,h:number,primary?:boolean)=>void;planet:(art:number,x:number,y:number,size:number,dim?:boolean)=>void;hit:(action:string,label:string,x:number,y:number,w:number,h:number)=>void}
export interface StarMapView{navigation:NavigationSave;scope:'total'|'region';region:number;scroll:number;selected:string;path?:string[];goal?:string;active?:{from:string;to:string;arrived:boolean;progress?:number};canDepart:boolean;shipReady:boolean;notice:string;saveError:boolean}
export const mapScrollMax=(scope:'total'|'region')=>scope==='total'?920:680;
export function paintStarMap(u:StarMapPainter,s:StarMapView){const c=u.ctx,n=s.navigation,at=planetById.get(n.at)!,selected=planetById.get(s.selected)??at,unlocked=unlockedRegion(n),region=starRegions[s.region],path=s.path??[],locked=selected.region>unlocked;
 u.box(0,0,720,1280,'#06111f');
 // Quiet chart stars are deterministic decoration, unrelated to combat RNG.
 for(let i=0;i<90;i++){const x=(i*173+39)%720,y=(i*257+75)%1280;u.box(x,y,i%7===0?2:1,i%7===0?2:1,i%7===0?'#a4bace88':'#8b9fb633');}
 u.text(s.scope==='total'?'远 航 星 图':region.name,30,48,34,'#e7f1ec','left',800);u.button('map-close','返回',598,22,94,54);
 u.text('六大星域 · 42颗星球 · 每一条连线都是实战星路',30,87,18,'#9eb9c9');
 u.button('map-total','总星图',30,116,265,55,s.scope==='total');u.button('map-local','星域图',308,116,265,55,s.scope==='region');u.button('map-locate','定位',590,116,102,55);
 u.text(s.active&&!s.active.arrived?'航行：'+at.name+' → '+planetById.get(s.active.to)!.name:'停泊：'+at.name+'  ·  已抵达 '+n.visited.length+'/42',30,205,21,'#e4d39e');u.button('map-up','↑',574,185,52,41);u.button('map-down','↓',640,185,52,41);
 c.save();c.beginPath();c.rect(20,235,680,695);c.clip();
 if(s.scope==='total'){
  for(let r=0;r<6;r++){const y=340+r*260-s.scroll,x=360,open=r<=unlocked,reg=starRegions[r],seen=n.visited.filter(id=>planetById.get(id)!.region===r).length;
   if(r<5){c.strokeStyle=r<unlocked?'#afd5b7':'#344856';c.lineWidth=3;c.setLineDash([7,9]);c.beginPath();c.moveTo(x,y+95);c.lineTo(x,y+165);c.stroke();c.setLineDash([]);}
   u.box(44,y-94,632,190,open?'#102636ee':'#0e1c2bea',open?reg.color:'#354454');u.planet(reg.art,142,y,144,!open);u.text(reg.name,242,y-39,29,open?reg.color:'#8d9aab','left',750);u.text(open?'可规划航路 · 抵达 '+seen+'/7':'需先打通 '+starRegions[r-1]?.name+' 星门',242,y+6,21,open?'#c6d9dc':'#8796a7');u.text('星港 → 分叉走廊 → 要塞 → 星域之门',242,y+43,17,'#96aebc');
   if(y-94>=235&&y+96<=930)u.hit('map-region:'+r,'查看'+reg.name+(open?'':' · 尚未解锁'),44,y-94,632,190);
  }
 }else{
  const visible=starPlanets.filter(p=>p.region===s.region);for(const[a,b]of starEdges){const p=planetById.get(a)!,q=planetById.get(b)!;if(p.region!==s.region||q.region!==s.region)continue;const planned=path.some((id,i)=>i>0&&((id===a&&path[i-1]===b)||(id===b&&path[i-1]===a))),cleared=n.visited.includes(a)&&n.visited.includes(b);c.strokeStyle=planned?'#f4d28e':cleared?'#88c6b8':'#3e6176';c.lineWidth=planned?5:3;c.setLineDash(planned?[]:[7,8]);c.beginPath();c.moveTo(p.x,p.y-s.scroll);c.lineTo(q.x,q.y-s.scroll);c.stroke();c.setLineDash([]);}
  for(const p of visible){const y=p.y-s.scroll,here=p.id===n.at,chosen=p.id===selected.id,seen=n.visited.includes(p.id),open=p.region<=unlocked;
   if(chosen||here){c.strokeStyle=here?'#ffdf9b':'#bfeaff';c.lineWidth=chosen?4:2;c.beginPath();c.arc(p.x,y,65,0,Math.PI*2);c.stroke();}u.planet(p.art,p.x,y,112,!open);u.text(p.name,p.x,y+82,24,here?'#ffe0a5':open?'#e2edf0':'#8b9aaa','center',750);u.text(here?s.active&&!s.active.arrived?'▲ 出发星球':'◆ 当前停泊':seen?'✓ 已抵达':planetKinds[p.kind].name,p.x,y+108,17,here?'#ffe0a5':seen?'#9ce0bd':'#94b8ce','center');
   if(y-61>=235&&y+122<=930)u.hit('map-planet:'+p.id,'选择星球 '+p.name+' · '+planetKinds[p.kind].name+(seen?' · 已抵达':''),p.x-83,y-61,166,183);
  }
  if(s.active&&!s.active.arrived){const a=planetById.get(s.active.from)!,b=planetById.get(s.active.to)!;if(a.region===s.region&&b.region===s.region){const t=Math.max(.12,Math.min(.88,s.active.progress??0)),x=a.x+(b.x-a.x)*t,y=a.y+(b.y-a.y)*t-s.scroll;c.save();c.translate(x,y);c.rotate(Math.atan2(b.y-a.y,b.x-a.x)+Math.PI/2);c.fillStyle='#ffe5a6';c.beginPath();c.moveTo(0,-15);c.lineTo(10,11);c.lineTo(0,5);c.lineTo(-10,11);c.closePath();c.fill();c.restore();}}
  if(s.region<5)u.text('↑ 打通'+visible[6].name+'，解锁'+starRegions[s.region+1].name,360,259-s.scroll,21,region.color,'center');
 }
 c.restore();u.text('空白处拖动 / 滚轮 / ↑↓ 查看完整星图',360,940,17,'#86a3b8','center');
 u.box(20,958,680,302,'#0d2433fa','#4e7181');u.planet(selected.art,102,1030,112,locked);u.text(selected.name,182,990,29,'#eff0de','left',800);u.text(planetKinds[selected.kind].name+' · '+(selected.rush?'高速星路':'常规星路'),182,1029,21,selected.rush?'#ffd08b':'#a8c9d5');
 u.text((n.visited.includes(selected.id)?'重访':'首次抵达')+' ◈ '+planetReward(selected,!n.visited.includes(selected.id))+(selected.kind==='sanctum'?' · 维修2 + 光甲6秒':selected.kind==='gate'&&selected.region<5?' · 解锁下一星域':''),182,1063,19,'#eed49a');
 const route=path.map(id=>planetById.get(id)!.name);u.text(locked?'需先打通 '+planetById.get(`s${selected.region-1}p6`)!.name+'（'+starRegions[selected.region-1].name+'）':s.active&&!s.active.arrived?'航行中：'+planetById.get(s.active.from)!.name+' → '+planetById.get(s.active.to)!.name:route.length>1?'规划 '+(route.length-1)+' 段星路：'+route.slice(0,3).join(' → ')+(route.length>3?' …':''):'当前停泊星球 · 点击其他星球规划',40,1111,20,locked?'#d7a598':'#b9dce1');
 u.text(s.saveError?'本机保存失败 · 请保留页面等待重试':s.notice||planetKinds[selected.kind].brief,40,1146,18,s.saveError?'#ffb3a0':'#9cb5c4');
 if(!s.shipReady&&!locked&&path.length>1)u.button('map-plan','选此航路，返回选择主炮',35,1184,420,56,true);else if(s.canDepart&&!locked&&path.length>1)u.button('map-depart','前往 '+selected.name+'  ›  '+(path.length-1)+'程',35,1184,420,56,true);else{u.box(35,1184,420,56,'#193241','#3c5564');u.text(s.active&&!s.active.arrived?'抵达后可开启下一程':'先选择可前往的星球',245,1212,22,'#829aa9','center');}
 u.button('hangar-open','机库',474,1184,211,56);
}
