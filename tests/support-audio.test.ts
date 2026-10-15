import { expect, it, vi } from 'vitest';
import { GameAudio } from '../src/game/audio';

it('separates laser and refraction timbres and bounds simultaneous refraction reports',()=>{
  let now=0;const audio=new GameAudio(()=>now);const tone=vi.spyOn(audio,'tone').mockImplementation(()=>{});
  audio.event('laser',3);
  expect(tone.mock.calls).toEqual([[1250,260,.26,.035,'sine'],[210,75,.18,.025,'triangle']]);
  tone.mockClear();
  for(let i=0;i<80;i++)audio.event('refract',3);
  expect(tone).toHaveBeenCalledTimes(1);
  expect(tone).toHaveBeenCalledWith(1550,2300,.075,.018,'sine');
  now=179;audio.event('refract',3);expect(tone).toHaveBeenCalledTimes(1);
  now=180;audio.event('refract',3);expect(tone).toHaveBeenCalledTimes(2);
  tone.mockClear();now=499;audio.event('laser',3);expect(tone).not.toHaveBeenCalled();
  now=500;audio.event('laser',3);expect(tone).toHaveBeenCalledTimes(2);
});

it('electrical detonation has its own bounded sound rather than suppressing fracture',()=>{
 let now=0;const audio=new GameAudio(()=>now),tone=vi.spyOn(audio,'tone').mockImplementation(()=>{});
 for(let i=0;i<30;i++)audio.event('capacitor',2);expect(tone).toHaveBeenCalledTimes(2);expect(tone).toHaveBeenCalledWith(1700,180,.12,.035,'sawtooth');
 audio.event('fracture',2);expect(tone).toHaveBeenCalledTimes(4);now=150;audio.event('capacitor',2);expect(tone).toHaveBeenCalledTimes(6);
});
