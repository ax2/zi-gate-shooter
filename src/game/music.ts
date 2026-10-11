export interface MusicHandle {
  play(): void | Promise<void>;
  pause(): void;
  destroy(): void;
  onError(callback: () => void): void;
}

/** One lazily allocated looping track, independent of the SFX voice pool. */
export class LoopMusic {
  private node?: MusicHandle;
  private requested = false;
  private epoch = 0;
  private retryAt = 0;
  constructor(private create: () => MusicHandle, private now: () => number) {}
  private retire() {
    const node = this.node; this.node = undefined; this.requested = false; this.epoch++;
    this.retryAt = this.now() + 5000;
    if (node) {
      try { node.pause(); } catch { /* Audio is optional. */ }
      try { node.destroy(); } catch { /* Platform failure stays outside the game. */ }
    }
  }
  setPlaying(wanted: boolean) {
    if (!wanted) {
      if (!this.requested) return;
      this.requested = false; this.epoch++;
      try { this.node?.pause(); } catch { this.retire(); }
      return;
    }
    if (this.requested || this.now() < this.retryAt) return;
    try {
      if (!this.node) {
        const node = this.create(); this.node = node;
        node.onError(() => { if (this.node === node) this.retire(); });
      }
      const node = this.node, epoch = ++this.epoch;
      this.requested = true;
      const result = node.play();
      if (result) void result.catch(() => {
        if (this.node === node && this.epoch === epoch) this.retire();
      });
    } catch { this.retire(); }
  }
}

export function browserMusicHandle(): MusicHandle {
  const audio = new Audio();
  try {
    audio.src = 'assets/audio/mechanical-pulse-v1.wav'; audio.loop = true; audio.volume = 0.18;
    audio.preload = 'auto'; audio.hidden = true; audio.dataset.gameMusic = 'original';
    document.body.append(audio);
    return { play: () => audio.play(), pause: () => audio.pause(),
      onError: callback => audio.addEventListener('error', callback),
      destroy: () => { audio.pause(); audio.removeAttribute('src'); audio.load(); audio.remove(); } };
  } catch {
    try { audio.pause(); audio.removeAttribute('src'); audio.load(); audio.remove(); } catch { /* Partial allocation. */ }
    throw new Error('Music unavailable');
  }
}
