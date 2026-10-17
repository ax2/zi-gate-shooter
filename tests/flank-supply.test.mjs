import{withoutPursuit}from'./helpers/without-pursuit';
import{it,expect}from'vitest';import{timeline}from'../src/core/director';import{FLANK_SUPPLY_AT}from'../src/core/chapter-assaults';import{World}from'../src/core/world';import{C}from'../src/core/config';
const old=await import('../build/qa/Stage-218/baseline.mjs');
const wave=(s,start)=>s.drop&&[0,1,2].some(row=>s.kind==='charger'&&s.pattern==='flank'&&s.dropY===330&&Math.abs(s.at-start-row*1.35)<1e-8||s.kind==='drone'&&s.pattern==='weave'&&s.dropY===390&&Math.abs(s.at-start-row*1.35-.45)<1e-8);
it('changes only the nine-unit final flank phrase in 108 schedules, preserving all other enemies and rewards',()=>{
 for(let round=1;round<=12;round++)for(const seed of[1,29,1337])for(const plan of[0,1,2]){
  const before=old.timeline(round,seed,plan),after=withoutPursuit(timeline(round,seed,plan),round,seed,plan);expect(after.length).toBe(before.length);
  if(round%3!==2){expect(after).toEqual(before);continue;}
  const a=before.filter(s=>wave(s,53.5)),b=after.filter(s=>wave(s,FLANK_SUPPLY_AT));expect(a).toHaveLength(9);expect(b).toHaveLength(9);
  expect(after.filter(s=>!wave(s,FLANK_SUPPLY_AT))).toEqual(before.filter(s=>!wave(s,53.5)));
  for(let i=0;i<a.length;i++){
   const{at:atA,lane:laneA,dropLabel:labelA,dropDetail:detailA,...restA}=a[i],{at:atB,lane:laneB,dropLabel:labelB,dropDetail:detailB,...restB}=b[i];
   expect(restB).toEqual(restA);expect(atA-atB).toBeCloseTo(53.5-FLANK_SUPPLY_AT);
   if(b[i].kind==='charger'){expect(laneB).toBe(b[i].x<360?280:440);expect(Math.abs(laneB-b[i].x)).toBe(130);expect(Math.abs(laneA-a[i].x)).toBe(310);}
   else expect(laneB).toBe(laneA);
  }
  expect(b[0].dropLabel).toBe('补给截击');
 }
});
it('keeps fixed enemy health and budgets through twelve rounds',()=>{
 for(let round=1;round<=12;round++){const a=new old.World(1337,round),b=new World(1337,round);for(const kind of Object.keys(C.enemies))expect(b.spawn(kind,360,300).maxHp).toBe(a.spawn(kind,360,300).maxHp);}
 expect(C.limits).toEqual({bullets:80,hostile:48,enemies:26,rewards:6});
});
