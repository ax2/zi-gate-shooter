import { CanvasRuntime } from '../../src/game/canvas-runtime.ts';
import { GameAudio } from '../../src/game/audio.ts';
import { LoopMusic, browserMusicHandle } from '../../src/game/music.ts';
import { FrameWindow } from '../../src/game/frame-window.ts';
import { defaults } from '../../src/ui/storage.ts';
import { progressionTarget } from '../../tests/helpers/progression-driver.ts';

const canvas = document.querySelector('canvas'), status = document.querySelector('#status');
const startButton = document.querySelector('#start'), effects = document.querySelector('#effects');
const audio = new GameAudio(), music = new LoopMusic(browserMusicHandle, () => performance.now());
let active = false, held = false, began = 0, nextControl = 0, nextSample = 0, nextHeap = 0;
let samples = [], transitions = [], stopReason = 'not-started', selectedEffects = 'standard';
let peaks = {}, frames = 0, lastPhase = '', workTimes = new FrameWindow();
const point = (x, y) => { const s = Math.min(innerWidth / 720, innerHeight / 1280); return [(innerWidth - 720 * s) / 2 + x * s, (innerHeight - 1280 * s) / 2 + y * s]; };
function control() {
  if (!held || runtime.pointer !== 731) { runtime.touchStart(731, ...point(runtime.world.player.x, 900)); held = true; }
  runtime.touchMove(731, ...point(progressionTarget(runtime.world), 900));
}
function metrics() {
  const state = runtime.diagnostics();
  const track = document.querySelector('audio[data-game-music]');
  return { ...state, wallSeconds: (performance.now() - began) / 1000, frames,
    activeAudioVoices: audio.activeNodes, musicElements: document.querySelectorAll('audio[data-game-music]').length,
    music: track ? { paused: track.paused, ended: track.ended, readyState: track.readyState, currentTime: track.currentTime, error: track.error?.code ?? null } : null,
    pickups: runtime.world.pickups, gates: runtime.world.gatesTaken, kills: runtime.world.kills,
    effects: runtime.save.settings.effects, width: innerWidth, height: innerHeight, dpr: devicePixelRatio,
    fixtureInput: { held, pointer: runtime.pointer, target: runtime.target, nextControl } };
}
function sample(force = false) {
  if (!force && runtime.world.time < nextSample) return;
  nextSample = runtime.world.time + 1;
  const state = metrics();
  if (performance.now() >= nextHeap) {
    nextHeap = performance.now() + 30000;
    state.heap = performance.memory ? { used: performance.memory.usedJSHeapSize, total: performance.memory.totalJSHeapSize } : null;
  }
  samples.push(state);
  status.textContent = `${state.mode} ${state.time.toFixed(1)}s / R${state.round} / 音${state.activeAudioVoices}`;
}
function finish(reason) {
  if (!active) return;
  active = false; held = false; stopReason = reason;
  runtime.cancelTouch(731); runtime.pause(reason === 'completed' ? '自动夹具已完成20分钟' : '夹具停止');
  sample(true); startButton.disabled = false; effects.disabled = false;
  setTimeout(() => sample(true), 1000); // Observe actual voice/music cleanup after pause.
}
function afterFrame(workStarted) {
  if (!active) return;
  frames++; workTimes.add(performance.now() - workStarted);
  // Fixture-only read access avoids sorting the 36000-sample diagnostics window
  // on every frame; full public diagnostics are sampled only once per second.
  const counts = { bodies: runtime.world.bodies.length, bullets: runtime.world.bullets.length,
    particles: runtime.particles.length, blasts: runtime.blasts.length,
    crateFragments: runtime.crateDebris.pieces.length, enemyFragments: runtime.enemyWreck.pieces.length };
  for (const key of Object.keys(counts)) peaks[key] = Math.max(peaks[key] ?? 0, counts[key]);
  peaks.activeAudioVoices = Math.max(peaks.activeAudioVoices ?? 0, audio.activeNodes);
  peaks.musicElements = Math.max(peaks.musicElements ?? 0, document.querySelectorAll('audio[data-game-music]').length);
  if (runtime.world.phase !== lastPhase) {
    lastPhase = runtime.world.phase;
    transitions.push({ phase: lastPhase, time: runtime.world.time, round: runtime.world.round });
  }
  sample();
  if (runtime.mode !== 'playing') finish(`unexpected-${runtime.mode}`);
  else if (runtime.world.time >= 1200) finish('completed');
}
const runtime = new CanvasRuntime({ canvas, width: innerWidth, height: innerHeight, dpr: devicePixelRatio, menuBottom: 0,
  image: src => new Promise((resolve, reject) => { const image = new Image(); image.onload = () => resolve(image); image.onerror = reject; image.src = `/${src}`; }),
  read: defaults, write: () => {}, sound: (type, stage, weapon) => audio.event(type, stage, weapon), silence: () => audio.stop(),
  music: playing => music.setPlaying(playing), now: () => performance.now(),
  requestFrame: fn => requestAnimationFrame(time => {
    const workStarted = performance.now();
    if (active && runtime.mode === 'playing' && runtime.world.time >= nextControl) {
      nextControl = runtime.world.time + .1; control();
    }
    fn(time); afterFrame(workStarted);
  }),
});
startButton.onclick = () => {
  void audio.unlock();
  runtime.save.settings.effects = selectedEffects = effects.value; runtime.save.settings.music = true;
  samples = []; transitions = []; peaks = {}; frames = 0; workTimes = new FrameWindow();
  nextControl = nextSample = nextHeap = 0; held = false; began = performance.now(); stopReason = 'running';
  runtime.start(); active = true; startButton.disabled = true; effects.disabled = true;
};
document.querySelector('#stop').onclick = () => finish('manual-stop');
window.addEventListener('resize', () => { runtime.resize(innerWidth, innerHeight, devicePixelRatio); held = false; });
document.addEventListener('visibilitychange', () => { if (document.hidden) runtime.hide(); else runtime.show(); });
window.addEventListener('blur', () => runtime.hide());
Object.defineProperty(window, '__gateDiagnostics', { value: () => metrics() });
Object.defineProperty(window, '__gateEnduranceEvidence', { value: () => ({ fixture: 'Stage-31 real-clock production CanvasRuntime + GameAudio + LoopMusic',
  scope: 'omniscient pointer driver; desktop browser at mobile viewport; not human/device/performance acceptance',
  active, stopReason, selectedEffects, peaks: { ...peaks }, workTimes: workTimes.snapshot(),
  final: metrics(), samples: [...samples], transitions: [...transitions] }) });
await runtime.load(); startButton.disabled = runtime.mode !== 'menu'; status.textContent = runtime.mode;
