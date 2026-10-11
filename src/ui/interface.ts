import type { World } from '../core/world';
import { loadSave, writeSave } from './storage';
import type { Settings } from './storage';

export interface Controls { start: () => void; pause: () => void; resume: () => void; home: () => void; settings: (settings: Settings) => void }
export class Interface {
  readonly save = loadSave();
  private root: HTMLElement;
  private hud: HTMLElement;
  private panel: HTMLElement;
  private toast: HTMLElement;
  private score: HTMLElement;
  private life: HTMLElement;
  private weapon: HTMLElement;
  private power: HTMLElement;
  private meter: HTMLElement;
  private round: HTMLElement;
  private toastUntil = 0;
  private lastAnnouncement = '';
  private mode = 'menu';
  constructor(private controls: Controls) {
    this.root = document.querySelector('#interface')!;
    this.root.innerHTML = `<div class="hud" hidden><div class="hud-top"><div><span class="hud-caption">分数</span><strong id="score">000000</strong></div><div id="life" class="life" aria-label="生命3格">◈ ◈ ◈</div><button class="pause-button" data-action="pause" aria-label="暂停">Ⅱ</button></div><div class="hud-bottom"><span id="weapon">T1 单管</span><span id="power">火力 +0%</span><span id="round">第1轮</span></div><div class="energy-track"><div id="energy-fill"></div></div></div><div class="toast" role="status" aria-live="polite" hidden></div><section class="panel"></section><div class="touch-hint" hidden>‹　左右拖动 · 自动开火　›</div>`;
    this.hud = this.root.querySelector('.hud')!; this.panel = this.root.querySelector('.panel')!;
    this.toast = this.root.querySelector('.toast')!; this.score = this.root.querySelector('#score')!;
    this.life = this.root.querySelector('#life')!; this.weapon = this.root.querySelector('#weapon')!;
    this.power = this.root.querySelector('#power')!; this.meter = this.root.querySelector('#energy-fill')!; this.round = this.root.querySelector('#round')!;
    this.root.addEventListener('click', event => {
      const el = (event.target as HTMLElement).closest<HTMLElement>('[data-action]');
      if (!el) return;
      const action = el.dataset.action;
      if (action === 'start') this.controls.start();
      else if (action === 'pause') this.controls.pause();
      else if (action === 'resume') this.controls.resume();
      else if (action === 'home') this.controls.home();
      else if (action === 'settings') this.settings();
      else if (action === 'back') this.mode === 'menu' ? this.menu() : this.paused();
      else if (action === 'toggle') {
        const key = el.dataset.key as keyof Settings;
        if (key === 'effects') this.save.settings.effects = this.save.settings.effects === 'weak' ? 'standard' : 'weak';
        else this.save.settings[key] = !this.save.settings[key];
        writeSave(this.save); this.controls.settings(this.save.settings); this.settings();
      }
    });
    this.menu();
  }
  private setPanel(html: string, className: string) {
    this.panel.className = `panel ${className}`; this.panel.innerHTML = html; this.panel.hidden = false;
    requestAnimationFrame(() => this.panel.querySelector<HTMLButtonElement>('.primary')?.focus({ preventScroll: true }));
  }
  menu() {
    this.mode = 'menu'; this.hud.hidden = true; this.toast.hidden = true;
    this.root.querySelector<HTMLElement>('.touch-hint')!.hidden = true;
    this.setPanel(`<div class="title-block"><h1>火力突围</h1><p class="latin-title">GATE SHOOTER</p><div class="title-rule"></div><p class="tagline">把奖励打高。把火力打满。</p></div><div class="menu-actions"><p class="best">最高分 <strong>${this.save.best.toLocaleString()}</strong></p><button class="primary" data-action="start">开始突围 <span>›</span></button><button class="secondary" data-action="settings">设置</button><p class="control-copy">拖动左右移动 · 自动开火<br>射击装备，再走位领取强化</p></div>`, 'menu');
  }
  playing() {
    this.mode = 'playing'; this.panel.hidden = true; this.hud.hidden = false;
    this.root.querySelector<HTMLElement>('.touch-hint')!.hidden = false;
  }
  paused(reason = '暂停') {
    this.mode = 'paused';
    this.setPanel(`<div class="dialog"><h2>${reason}</h2><p>准备好了，再继续突围。</p><button class="primary" data-action="resume">继续战斗</button><button class="secondary" data-action="settings">设置</button><button class="quiet" data-action="home">返回主界面</button></div>`, 'modal');
  }
  result(w: World) {
    this.mode = 'result'; this.toast.hidden = true;
    const record = w.score > this.save.best;
    this.save.best = Math.max(this.save.best, w.score); writeSave(this.save);
    this.setPanel(`<div class="dialog result"><p class="result-label">本次突围结束</p><h2>${w.score.toLocaleString()}</h2><p class="record">${record ? '新的最高分' : `最高分 ${this.save.best.toLocaleString()}`}</p><div class="result-stats"><div><span>存活</span><strong>${Math.floor(w.time / 60)}:${Math.floor(w.time % 60).toString().padStart(2, '0')}</strong></div><div><span>武器</span><strong>T${w.maxStage}</strong></div><div><span>轮次</span><strong>${w.round}</strong></div></div><button class="primary" data-action="start">再次突围 <span>↗</span></button><button class="quiet" data-action="home">返回主界面</button></div>`, 'modal');
  }
  private settings() {
    const s = this.save.settings;
    this.setPanel(`<div class="dialog"><h2>设置</h2><p>清楚看到危险，尽情释放火力。</p><div class="setting-list"><button data-action="toggle" data-key="effects"><span>特效</span><strong>${s.effects === 'standard' ? '标准' : '弱化'}</strong></button><button data-action="toggle" data-key="shake"><span>屏幕震动</span><strong>${s.shake ? '开' : '关'}</strong></button><button data-action="toggle" data-key="sound"><span>音效</span><strong>${s.sound ? '开' : '关'}</strong></button></div><p class="privacy-copy">设置与最高分仅保存在本机。</p><button class="primary" data-action="back">返回</button></div>`, 'modal');
  }
  update(w: World) {
    this.score.textContent = Math.floor(w.score).toString().padStart(6, '0');
    this.life.textContent = '◈ '.repeat(w.player.hp) + '◇ '.repeat(3 - w.player.hp);
    this.life.setAttribute('aria-label', `生命${w.player.hp}格`);
    this.weapon.textContent = `T${w.growth.stage} ${['单管', '双管', '重炮'][w.growth.stage - 1]}`;
    this.power.textContent = w.growth.overload > 0 ? `超载 ${w.growth.overload.toFixed(1)}s` : `火力 +${w.growth.bonus}%`;
    this.meter.style.width = `${w.growth.overload > 0 ? w.growth.overload / 6 * 100 : w.growth.energy}%`;
    this.meter.parentElement!.classList.toggle('overloaded', w.growth.overload > 0);
    this.round.textContent = `第${w.round}轮`;
    if (performance.now() > this.toastUntil) this.toast.hidden = true;
  }
  notify(text: string) {
    if (text === this.lastAnnouncement && performance.now() < this.toastUntil) return;
    this.lastAnnouncement = text; this.toast.textContent = text; this.toast.hidden = false; this.toastUntil = performance.now() + 2200;
  }
}
