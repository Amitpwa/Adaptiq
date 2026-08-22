'use client';

/**
 * Web Audio API Synthesizer for Playful UI Sound Effects.
 *
 * Generates crisp, zero-latency, programmatic sound effects without external audio asset downloads:
 * - `playSuccess()`: Ascending cheerful major-triad chime (C5 -> E5 -> G5) on correct answer / mastery update
 * - `playWrong()`: Gentle low tone (F3 -> Eb3) on misconception / incorrect attempt
 * - `playClick()`: Subtle crisp pop for buttons and tab selections
 * - `playHint()`: Soft shimmering chime for Socratic hint escalation
 * - `playComplete()`: Joyful fanfare arpeggio on diagnostic / goal completion
 */

class SoundFx {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  playSuccess() {
    const ctx = this.getContext();
    if (!ctx) return;

    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    const startTime = ctx.currentTime;

    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime + index * 0.08);

      gain.gain.setValueAtTime(0.12, startTime + index * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + index * 0.08 + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime + index * 0.08);
      osc.stop(startTime + index * 0.08 + 0.3);
    });
  }

  playWrong() {
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const startTime = ctx.currentTime;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, startTime); // A3
    osc.frequency.exponentialRampToValueAtTime(160, startTime + 0.25);

    gain.gain.setValueAtTime(0.1, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + 0.25);
  }

  playClick() {
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const startTime = ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, startTime);
    osc.frequency.exponentialRampToValueAtTime(400, startTime + 0.04);

    gain.gain.setValueAtTime(0.05, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + 0.04);
  }

  playHint() {
    const ctx = this.getContext();
    if (!ctx) return;

    const notes = [659.25, 880, 1046.5]; // E5, A5, C6
    const startTime = ctx.currentTime;

    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime + index * 0.06);

      gain.gain.setValueAtTime(0.08, startTime + index * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + index * 0.06 + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime + index * 0.06);
      osc.stop(startTime + index * 0.06 + 0.25);
    });
  }

  playComplete() {
    const ctx = this.getContext();
    if (!ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    const startTime = ctx.currentTime;

    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime + index * 0.09);

      gain.gain.setValueAtTime(0.15, startTime + index * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + index * 0.09 + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime + index * 0.09);
      osc.stop(startTime + index * 0.09 + 0.45);
    });
  }
}

export const soundFx = new SoundFx();
