import {expect,it} from 'vitest';
import {encounterIndex,timeline} from '../src/core/director';

it.each([1,2,3])('chapter %s has three tactically distinct authored pressure sections',chapter=>{
 const signatures=[];
 for(const round of [chapter,chapter+3,chapter+6]){
  const wave=timeline(round,1).filter(s=>s.at>=31&&s.at<=45);
  signatures.push(JSON.stringify(wave.map(s=>[s.at,s.kind,s.pattern,s.lane])));
  expect(wave.length).toBeGreaterThanOrEqual(5);
  expect(wave.filter(s=>!s.drop).length).toBeLessThanOrEqual(18);
  expect(new Set(wave.map(s=>s.kind)).size).toBeGreaterThanOrEqual(3);
 }
 expect(new Set(signatures).size).toBe(3);
});

it('retains growth windows and pre-boss breathing room across all nine combinations',()=>{
 const isReward=(s:ReturnType<typeof timeline>[number])=>['crate','armory','gates'].includes(s.kind);
 const expected=timeline(1,1).filter(isReward);
 for(let round=1;round<=18;round++){
  const wave=timeline(round,1);
  expect(wave.filter(isReward)).toEqual(expected);
  expect(wave.every(s=>s.at<69)).toBe(true);
  expect(wave).toEqual(timeline(round,1));
  expect(encounterIndex(round)).toBe(encounterIndex(round+9));
  const sector=(round-1)%3+1;
  const roster=(items:ReturnType<typeof timeline>)=>items.filter(s=>s.at>=60).map(({drop,dropY,...s})=>s);
  expect(roster(wave)).toEqual(roster(timeline(sector,1)));
  expect(wave.filter(s=>s.at>=60).every(s=>!!s.drop===(round>1))).toBe(true);
 }
});
