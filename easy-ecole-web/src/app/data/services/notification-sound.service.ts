import { Injectable } from '@angular/core';

type NotificationType = 'edt_publie' | 'note' | 'rappel_salle' | 'document' | 'paiement' | 'default';

interface SoundConfig {
  frequency: number;
  duration: number;
  type: OscillatorType;
  description: string;
}

const SOUND_MAP: Record<string, SoundConfig> = {
  edt_publie:     { frequency: 880, duration: 300, type: 'sine', description: 'EDT publié' },
  note:           { frequency: 660, duration: 200, type: 'sine', description: 'Note publiée' },
  rappel_salle:   { frequency: 440, duration: 500, type: 'square', description: 'Rappel salle' },
  document:       { frequency: 523, duration: 250, type: 'triangle', description: 'Document prêt' },
  paiement:       { frequency: 784, duration: 150, type: 'sine', description: 'Paiement reçu' },
  default:        { frequency: 520, duration: 200, type: 'sine', description: 'Notification' },
};

@Injectable({ providedIn: 'root' })
export class NotificationSoundService {
  private enabled: boolean = true;
  private audioCtx: AudioContext | null = null;

  toggle(): boolean {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  get isEnabled(): boolean {
    return this.enabled;
  }

  play(type: string = 'default'): void {
    if (!this.enabled) return;
    try {
      if (!this.audioCtx) {
        this.audioCtx = new AudioContext();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      const config = SOUND_MAP[type] || SOUND_MAP['default'];
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = config.type;
      osc.frequency.value = config.frequency;
      gain.gain.setValueAtTime(0.3, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + config.duration / 1000);
      osc.connect(gain).connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + config.duration / 1000);
    } catch {}
  }
}
