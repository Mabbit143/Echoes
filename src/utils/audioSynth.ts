// Browser-native Web Audio synthesizer for ambient soundscapes & notification chimes

class SoundscapeSynth {
  private ctx: AudioContext | null = null;
  private currentSource: AudioNode | null = null;
  private isPlaying: boolean = false;

  private initCtx() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Play proximity alert resonance chime
  public playZoneAlertChime() {
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, now); // C5
      osc1.frequency.exponentialRampToValueAtTime(783.99, now + 0.15); // G5
      osc1.frequency.exponentialRampToValueAtTime(1046.50, now + 0.35); // C6

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(261.63, now); // C4
      osc2.frequency.exponentialRampToValueAtTime(523.25, now + 0.35);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.2, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.85);
      osc2.stop(now + 0.85);
    } catch (e) {
      console.warn('Audio chime playback omitted:', e);
    }
  }

  // Play ambient atmospheric sound based on echo type
  public playAmbient(soundType: string = 'ambient-water') {
    try {
      this.stop();
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const masterGain = this.ctx.createGain();
      masterGain.gain.setValueAtTime(0.001, now);
      masterGain.gain.exponentialRampToValueAtTime(0.12, now + 0.5);

      if (soundType === 'ambient-water') {
        // Low frequency resonant water flow
        const bufferSize = this.ctx.sampleRate * 2;
        const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }
        const whiteNoise = this.ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(240, now);
        filter.Q.setValueAtTime(3.5, now);

        whiteNoise.connect(filter);
        filter.connect(masterGain);
        whiteNoise.start();
        this.currentSource = whiteNoise;
      } else if (soundType === 'vintage-radio') {
        // 1900s radio hum and warm tone
        const osc = this.ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(110, now);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(800, now);
        filter.Q.setValueAtTime(4, now);

        osc.connect(filter);
        filter.connect(masterGain);
        osc.start();
        this.currentSource = osc;
      } else {
        // Shimmering whisper ambient drone
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(220, now); // A3
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(329.63, now); // E4

        osc1.connect(masterGain);
        osc2.connect(masterGain);
        osc1.start();
        osc2.start();
        this.currentSource = osc1;
      }

      masterGain.connect(this.ctx.destination);
      this.isPlaying = true;
    } catch (e) {
      console.warn('Ambient audio play error:', e);
    }
  }

  public stop() {
    try {
      if (this.currentSource) {
        (this.currentSource as any).stop?.();
        this.currentSource.disconnect();
        this.currentSource = null;
      }
      this.isPlaying = false;
    } catch (e) {
      // ignore
    }
  }

  public isCurrentlyPlaying(): boolean {
    return this.isPlaying;
  }
}

export const soundSynth = new SoundscapeSynth();
