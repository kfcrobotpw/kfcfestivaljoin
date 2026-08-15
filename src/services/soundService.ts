/**
 * Sound Service using Web Audio API
 * Generates instant, clear sound effects without external audio assets.
 */

class SoundService {
  private audioCtx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    try {
      if (!this.audioCtx) {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.audioCtx = new AudioContextClass();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      return this.audioCtx;
    } catch {
      return null;
    }
  }

  // Success stamp sound (cheerful 2-tone arpeggio)
  playSuccess() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, now); // C5
      osc1.frequency.exponentialRampToValueAtTime(659.25, now + 0.1); // E5
      gain1.gain.setValueAtTime(0.2, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.25);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(783.99, now + 0.12); // G5
      osc2.frequency.exponentialRampToValueAtTime(1046.5, now + 0.3); // C6
      gain2.gain.setValueAtTime(0.25, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.45);

      if (navigator.vibrate) {
        navigator.vibrate([60, 40, 80]);
      }
    } catch (e) {
      console.debug('Audio playback error', e);
    }
  }

  // Already completed sound (gentle double chime)
  playInfo() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.2);
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    } catch (e) {
      console.debug('Audio error', e);
    }
  }

  // Error buzz sound
  playError() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.setValueAtTime(180, now + 0.1);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }
    } catch (e) {
      console.debug('Audio error', e);
    }
  }

  // Grand Fanfare for 100% completion
  playFanfare() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const notes = [
        { f: 523.25, d: 0.12, t: 0 },    // C5
        { f: 659.25, d: 0.12, t: 0.12 }, // E5
        { f: 783.99, d: 0.12, t: 0.24 }, // G5
        { f: 1046.5, d: 0.4,  t: 0.36 }, // C6
      ];
      const now = ctx.currentTime;
      notes.forEach(({ f, d, t }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, now + t);
        gain.gain.setValueAtTime(0.25, now + t);
        gain.gain.exponentialRampToValueAtTime(0.01, now + t + d);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + t);
        osc.stop(now + t + d);
      });
      if (navigator.vibrate) {
        navigator.vibrate([100, 80, 100, 80, 250]);
      }
    } catch (e) {
      console.debug('Fanfare audio error', e);
    }
  }
}

export const soundService = new SoundService();
