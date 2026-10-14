import {it,expect} from 'vitest';
import {awardAchievements,emptyAchievements,parseAchievements} from '../src/core/achievements';
import {parseSave} from '../src/game/canvas-runtime';
it('preserves old saves and filters corrupt achievement data',()=>{
 expect(parseSave({version:1,best:42}).achievements).toEqual(emptyAchievements());
 expect(parseAchievements({kills:-2,bosses:Infinity,unlocked:['boss','boss','fake']})).toEqual({kills:0,bosses:0,unlocked:['boss']});
});
it('records deliberate early specialization versus mixed choices without retroactive credit',()=>{
 const s=emptyAchievements();
 expect(awardAchievements(s,{ballistic:0,electric:3,optical:0},1).map(a=>a.id)).toEqual(['specialist']);
 expect(awardAchievements(s,{ballistic:1,electric:3,optical:0},1)).toEqual([]);
 expect(awardAchievements(s,{ballistic:1,electric:1,optical:1},1).map(a=>a.id)).toEqual(['hybrid']);
 expect(awardAchievements(emptyAchievements(),{ballistic:2,electric:1,optical:1},1)).toEqual([]);
});
it('awards persistent combat and combination achievements exactly once',()=>{
 const s=emptyAchievements();s.kills=100;s.bosses=1;
 const ranks={ballistic:3,electric:1,optical:0};
 expect(awardAchievements(s,ranks,5).map(a=>a.id)).toEqual(['hunter','boss','storm','arsenal']);
 expect(awardAchievements(s,ranks,5)).toEqual([]);
 const loaded=parseSave({version:1,achievements:JSON.parse(JSON.stringify(s))});
 expect(loaded.achievements).toEqual(s);
});
