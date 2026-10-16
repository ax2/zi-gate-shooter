import {it,expect} from 'vitest';
import {awardAchievements,emptyAchievements,parseAchievements} from '../src/core/achievements';
import {parseSave} from '../src/game/canvas-runtime';
it('preserves old saves and filters corrupt achievement data',()=>{
 expect(parseSave({version:1,best:42}).achievements).toEqual(emptyAchievements());
 const legacy=parseSave({version:1,best:230,achievements:{kills:123,bosses:2,unlocked:['boss','proof']},settings:{effects:'weak',shake:false,sound:false,music:true}});
 expect(legacy.best).toBe(230);expect(legacy.settings).toEqual({effects:'weak',shake:false,sound:false,music:true});expect(legacy.achievements.unlocked).toEqual(['boss','proof']);expect(legacy.achievements.certifiedBuilds).toEqual([]);
 expect(parseAchievements({kills:-2,bosses:Infinity,unlocked:['boss','boss','fake']})).toEqual({...emptyAchievements(),unlocked:['boss']});
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

it('records fracture engineering only after ten real burst counts and retains it through loading',()=>{
 const s=emptyAchievements(),ranks={ballistic:0,electric:0,optical:0};
 expect(awardAchievements(s,ranks,3,9)).toEqual([]);
 expect(awardAchievements(s,ranks,3,10).map(a=>a.id)).toEqual(['fracture']);
 expect(awardAchievements(s,ranks,3,20)).toEqual([]);
 expect(parseAchievements(s).unlocked).toEqual(['fracture']);
});
it('persists tactical mastery only from a successful recorded tactical victory',()=>{
 const s=emptyAchievements(),ranks={ballistic:0,electric:0,optical:0};
 expect(awardAchievements(s,ranks,1,0,0)).toEqual([]);
 expect(awardAchievements(s,ranks,1,0,1).map(a=>a.id)).toEqual(['tactician']);
 expect(awardAchievements(s,ranks,1,0,2)).toEqual([]);expect(parseAchievements(s).unlocked).toContain('tactician');
});
