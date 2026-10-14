import { emptyAchievements, parseAchievements, type Achievements } from '../core/achievements';
export interface Settings { effects: 'standard' | 'weak'; shake: boolean; sound: boolean; music: boolean }
export interface Save { version: 1; best: number; achievements: Achievements; settings: Settings }
export const defaults = (): Save => ({ version: 1, best: 0, achievements: emptyAchievements(), settings: { effects: 'standard', shake: true, sound: true, music: false } });
export function loadSave(): Save {
  const result = defaults();
  try {
    const data = JSON.parse(localStorage.getItem('zi-gate-shooter-v1') ?? 'null');
    if (data?.version === 1) {
      result.achievements = parseAchievements(data.achievements);
      if (Number.isFinite(data.best) && data.best >= 0) result.best = Math.floor(data.best);
      if (data.settings?.effects === 'weak') result.settings.effects = 'weak';
      for (const key of ['shake', 'sound', 'music'] as const) if (typeof data.settings?.[key] === 'boolean') result.settings[key] = data.settings[key];
    }
  } catch { /* Corrupt or unavailable local storage falls back to defaults. */ }
  return result;
}
export function writeSave(save: Save) { try { localStorage.setItem('zi-gate-shooter-v1', JSON.stringify(save)); return true; } catch { return false; } }
