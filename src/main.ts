import Phaser from 'phaser';
import { BattleScene } from './game/scene';
import './style.css';

const scene = new BattleScene();
document.addEventListener('game-failure', event => {
  const detail = (event as CustomEvent<string>).detail;
  const root = document.querySelector('#interface')!;
  const error = document.createElement('div'); error.className = 'error-box';
  const message = document.createElement('p'); message.textContent = detail;
  const button = document.createElement('button'); button.textContent = '重新加载'; button.onclick = () => location.reload();
  error.append(message, button); root.append(error);
});
window.addEventListener('error', () => { if (scene.running) scene.pauseRun('运行异常，已暂停'); });
new Phaser.Game({
  type: Phaser.AUTO, parent: 'game', width: 720, height: 1280, backgroundColor: '#141b22',
  antialias: true, roundPixels: false, scene: [scene],
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  input: { activePointers: 2 }, audio: { noAudio: true },
  render: { transparent: false, powerPreference: 'high-performance' },
});
// Read-only diagnostics, deliberately opt-in and absent from standard play.
if (new URLSearchParams(location.search).has('diagnostics')) {
  Object.defineProperty(window, '__gateDiagnostics', { value: () => scene.diagnostics() });
}
