import { ref } from 'vue';

// ── Web Audio Context Helper ──────────────────────────────────────────────
let _audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!_audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    _audioCtx = new AudioContextClass();
  }
  if (_audioCtx && _audioCtx.state === 'suspended') {
    try {
      _audioCtx.resume();
    } catch {}
  }
  return _audioCtx;
}

// ── Synthesis Helpers (Ported from MultiRoblox) ───────────────────────────
function playBuffer(buf: AudioBuffer, vol: number) {
  try {
    const ctx = getAudioContext();
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const g = ctx.createGain();
    g.gain.value = Math.max(0, Math.min(1, vol));
    src.connect(g);
    g.connect(ctx.destination);
    src.start();
    src.stop(ctx.currentTime + buf.duration);
  } catch (err) {
    console.warn('Failed to play audio buffer:', err);
  }
}

function makeBuffer(durationSec: number, fillFn: (data: Float32Array, sampleRate: number, length: number) => void): AudioBuffer {
  const ctx = getAudioContext();
  const sr = ctx.sampleRate;
  const len = Math.ceil(sr * durationSec);
  const buf = ctx.createBuffer(1, len, sr);
  fillFn(buf.getChannelData(0), sr, len);
  return buf;
}

function noise(): number {
  return Math.random() * 2 - 1;
}

function filter(ctx: AudioContext, type: BiquadFilterType, freq: number, Q?: number): BiquadFilterNode {
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  if (Q !== undefined) f.Q.value = Q;
  return f;
}

// ── Sound Profiles ─────────────────────────────────────────────────────────
export interface SoundProfile {
  id: string;
  label: string;
  desc: string;
  icon: string;
  play: (vol: number) => void;
}

export const SOUND_PROFILES: Record<string, SoundProfile> = {
  clicky: {
    id: 'clicky',
    label: 'Clicky',
    desc: 'Cherry MX Blue - sharp tactile snap',
    icon: 'keyboard',
    play(vol: number) {
      if (vol <= 0) return;
      const ctx = getAudioContext();
      const t = ctx.currentTime;

      // 1) Sharp high-freq click transient (leaf spring tick)
      const clickBuf = makeBuffer(0.008, (d, sr) => {
        for (let i = 0; i < d.length; i++) {
          const x = i / sr;
          d[i] = (noise() * 0.7 + Math.sin(2 * Math.PI * 3200 * x) * 0.3) * Math.exp(-x * 1800);
        }
      });
      const clickSrc = ctx.createBufferSource();
      clickSrc.buffer = clickBuf;
      const hp1 = filter(ctx, 'highpass', 3500);
      const g1 = ctx.createGain();
      g1.gain.setValueAtTime(vol * 2.5, t);
      g1.gain.exponentialRampToValueAtTime(0.001, t + 0.008);
      clickSrc.connect(hp1);
      hp1.connect(g1);
      g1.connect(ctx.destination);
      clickSrc.start(t);
      clickSrc.stop(t + 0.01);

      // 2) Mid-range body snap (plastic housing resonance)
      const snapBuf = makeBuffer(0.025, (d, sr) => {
        for (let i = 0; i < d.length; i++) {
          const x = i / sr;
          d[i] = (noise() * 0.5 + Math.sin(2 * Math.PI * 1100 * x) * 0.4 + Math.sin(2 * Math.PI * 2200 * x) * 0.1) * Math.exp(-x * 350);
        }
      });
      const snapSrc = ctx.createBufferSource();
      snapSrc.buffer = snapBuf;
      const bp1 = filter(ctx, 'bandpass', 1400, 1.2);
      const g2 = ctx.createGain();
      g2.gain.setValueAtTime(vol * 1.8, t);
      g2.gain.exponentialRampToValueAtTime(0.001, t + 0.025);
      snapSrc.connect(bp1);
      bp1.connect(g2);
      g2.connect(ctx.destination);
      snapSrc.start(t);
      snapSrc.stop(t + 0.03);

      // 3) Low-end bottom-out thud
      const thudBuf = makeBuffer(0.035, (d, sr) => {
        for (let i = 0; i < d.length; i++) {
          const x = i / sr;
          d[i] = (noise() * 0.3 + Math.sin(2 * Math.PI * 180 * x) * 0.7) * Math.exp(-x * 180);
        }
      });
      const thudSrc = ctx.createBufferSource();
      thudSrc.buffer = thudBuf;
      const lp1 = filter(ctx, 'lowpass', 600);
      const g3 = ctx.createGain();
      g3.gain.setValueAtTime(vol * 0.6, t + 0.004);
      g3.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
      thudSrc.connect(lp1);
      lp1.connect(g3);
      g3.connect(ctx.destination);
      thudSrc.start(t + 0.004);
      thudSrc.stop(t + 0.045);
    },
  },

  thocky: {
    id: 'thocky',
    label: 'Thocky',
    desc: 'NK Cream - deep marbly thud',
    icon: 'piano',
    play(vol: number) {
      if (vol <= 0) return;
      const ctx = getAudioContext();
      const t = ctx.currentTime;

      // 1) Deep pitched thud
      const thudBuf = makeBuffer(0.12, (d, sr) => {
        for (let i = 0; i < d.length; i++) {
          const x = i / sr;
          const freq = 95 + 280 * Math.exp(-x * 60);
          d[i] = (Math.sin(2 * Math.PI * freq * x) * 0.65 + Math.sin(2 * Math.PI * freq * 1.6 * x) * 0.2 + noise() * 0.15) * Math.exp(-x * 65);
        }
      });
      const thudSrc = ctx.createBufferSource();
      thudSrc.buffer = thudBuf;
      const lp2 = filter(ctx, 'lowpass', 700);
      const g1 = ctx.createGain();
      g1.gain.setValueAtTime(vol * 1.8, t);
      g1.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      thudSrc.connect(lp2);
      lp2.connect(g1);
      g1.connect(ctx.destination);
      thudSrc.start(t);
      thudSrc.stop(t + 0.13);

      // 2) Soft high transient
      const transBuf = makeBuffer(0.015, (d, sr) => {
        for (let i = 0; i < d.length; i++) {
          d[i] = noise() * Math.exp(-(i / sr) * 900);
        }
      });
      const transSrc = ctx.createBufferSource();
      transSrc.buffer = transBuf;
      const bp2 = filter(ctx, 'bandpass', 900, 0.7);
      const g2 = ctx.createGain();
      g2.gain.setValueAtTime(vol * 0.7, t);
      g2.gain.exponentialRampToValueAtTime(0.001, t + 0.015);
      transSrc.connect(bp2);
      bp2.connect(g2);
      g2.connect(ctx.destination);
      transSrc.start(t);
      transSrc.stop(t + 0.02);

      // 3) Low frequency body resonance (marble feel)
      const resBuf = makeBuffer(0.08, (d, sr) => {
        for (let i = 0; i < d.length; i++) {
          const x = i / sr;
          d[i] = Math.sin(2 * Math.PI * 55 * x) * Math.exp(-x * 90) * 0.9;
        }
      });
      const resSrc = ctx.createBufferSource();
      resSrc.buffer = resBuf;
      const lp3 = filter(ctx, 'lowpass', 200);
      const g3 = ctx.createGain();
      g3.gain.setValueAtTime(vol * 0.9, t);
      g3.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
      resSrc.connect(lp3);
      lp3.connect(g3);
      g3.connect(ctx.destination);
      resSrc.start(t);
      resSrc.stop(t + 0.09);
    },
  },

  creamy: {
    id: 'creamy',
    label: 'Creamy',
    desc: 'Gateron Yellow - buttery smooth glide',
    icon: 'water_drop',
    play(vol: number) {
      if (vol <= 0) return;
      const ctx = getAudioContext();
      const t = ctx.currentTime;

      // 1) Very soft initial contact
      const softBuf = makeBuffer(0.07, (d, sr) => {
        for (let i = 0; i < d.length; i++) {
          const x = i / sr;
          const freq = 130 + 100 * Math.exp(-x * 40);
          d[i] = (Math.sin(2 * Math.PI * freq * x) * 0.55 + Math.sin(2 * Math.PI * freq * 2.1 * x) * 0.25 + Math.sin(2 * Math.PI * freq * 3.3 * x) * 0.12 + noise() * 0.08) * Math.exp(-x * 110);
        }
      });
      const softSrc = ctx.createBufferSource();
      softSrc.buffer = softBuf;
      const bp3 = filter(ctx, 'bandpass', 280, 0.6);
      const g1 = ctx.createGain();
      g1.gain.setValueAtTime(vol * 1.6, t);
      g1.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
      softSrc.connect(bp3);
      bp3.connect(g1);
      g1.connect(ctx.destination);
      softSrc.start(t);
      softSrc.stop(t + 0.075);

      // 2) Subtle air/brush noise
      const brushBuf = makeBuffer(0.05, (d, sr) => {
        for (let i = 0; i < d.length; i++) {
          d[i] = noise() * Math.exp(-(i / sr) * 200) * 0.5;
        }
      });
      const brushSrc = ctx.createBufferSource();
      brushSrc.buffer = brushBuf;
      const bp4 = filter(ctx, 'bandpass', 500, 1.5);
      const g2 = ctx.createGain();
      g2.gain.setValueAtTime(vol * 0.3, t);
      g2.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
      brushSrc.connect(bp4);
      bp4.connect(g2);
      g2.connect(ctx.destination);
      brushSrc.start(t);
      brushSrc.stop(t + 0.06);

      // 3) Warm low-end resonance
      const warmBuf = makeBuffer(0.06, (d, sr) => {
        for (let i = 0; i < d.length; i++) {
          const x = i / sr;
          d[i] = (Math.sin(2 * Math.PI * 70 * x) * 0.6 + Math.sin(2 * Math.PI * 140 * x) * 0.4) * Math.exp(-x * 140);
        }
      });
      const warmSrc = ctx.createBufferSource();
      warmSrc.buffer = warmBuf;
      const lp4 = filter(ctx, 'lowpass', 350);
      const g3 = ctx.createGain();
      g3.gain.setValueAtTime(vol * 1.0, t);
      g3.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
      warmSrc.connect(lp4);
      lp4.connect(g3);
      g3.connect(ctx.destination);
      warmSrc.start(t);
      warmSrc.stop(t + 0.07);
    },
  },

  poppy: {
    id: 'poppy',
    label: 'Poppy',
    desc: 'Light airy pop',
    icon: 'bubble_chart',
    play(vol: number) {
      if (vol <= 0) return;
      const ctx = getAudioContext();
      const t = ctx.currentTime;
      const buf = makeBuffer(0.025, (d, sr) => {
        for (let i = 0; i < d.length; i++) {
          const x = i / sr;
          d[i] = noise() * Math.exp(-x * 1100);
        }
      });
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const bp = filter(ctx, 'bandpass', 1800, 1.2);
      const g = ctx.createGain();
      g.gain.setValueAtTime(vol * 1.8, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.025);
      src.connect(bp);
      bp.connect(g);
      g.connect(ctx.destination);
      src.start(t);
      src.stop(t + 0.025);
    },
  },

  typewriter: {
    id: 'typewriter',
    label: 'Typewriter',
    desc: 'Vintage key rattle',
    icon: 'article',
    play(vol: number) {
      if (vol <= 0) return;
      const ctx = getAudioContext();
      const t = ctx.currentTime;
      // Main strike
      const buf = makeBuffer(0.035, (d, sr) => {
        for (let i = 0; i < d.length; i++) {
          const x = i / sr;
          d[i] = noise() * Math.exp(-x * 350) + Math.sin(2 * Math.PI * 280 * x) * Math.exp(-x * 500) * 0.5;
        }
      });
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const hp = filter(ctx, 'highpass', 1500);
      const g = ctx.createGain();
      g.gain.setValueAtTime(vol * 1.6, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.035);
      src.connect(hp);
      hp.connect(g);
      g.connect(ctx.destination);
      src.start(t);
      src.stop(t + 0.035);

      // Rattle tail
      const buf2 = makeBuffer(0.02, (d, sr) => {
        for (let i = 0; i < d.length; i++) {
          d[i] = noise() * Math.exp(-(i / sr) * 500);
        }
      });
      const src2 = ctx.createBufferSource();
      src2.buffer = buf2;
      const hp2 = filter(ctx, 'highpass', 2500);
      const g2 = ctx.createGain();
      g2.gain.setValueAtTime(vol * 0.5, t + 0.018);
      g2.gain.exponentialRampToValueAtTime(0.001, t + 0.038);
      src2.connect(hp2);
      hp2.connect(g2);
      g2.connect(ctx.destination);
      src2.start(t + 0.018);
      src2.stop(t + 0.04);
    },
  },

  off: {
    id: 'off',
    label: 'Off',
    desc: 'No sound',
    icon: 'volume_off',
    play() {},
  },
};

// ── Custom Sounds Type ────────────────────────────────────────────────────
export interface CustomSound {
  id: string;
  name: string;
  buffer: AudioBuffer;
}

// ── IndexedDB for Persisting Custom Audio ─────────────────────────────────
const DB_NAME = 'dqc_sound_db';
const STORE_NAME = 'custom_sounds';

function openSoundDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function saveCustomSoundToDb(id: string, name: string, arrayBuffer: ArrayBuffer) {
  try {
    const db = await openSoundDb();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put({ id, name, arrayBuffer });
  } catch (e) {
    console.warn('Failed to save custom sound to DB:', e);
  }
}

async function removeCustomSoundFromDb(id: string) {
  try {
    const db = await openSoundDb();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
  } catch (e) {
    console.warn('Failed to remove custom sound from DB:', e);
  }
}

async function loadCustomSoundsFromDb(): Promise<CustomSound[]> {
  try {
    const db = await openSoundDb();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();
    return new Promise((resolve) => {
      req.onsuccess = async () => {
        const records: Array<{ id: string; name: string; arrayBuffer: ArrayBuffer }> = req.result || [];
        const loaded: CustomSound[] = [];
        const ctx = getAudioContext();
        for (const item of records) {
          try {
            // decodeAudioData consumes the buffer, slice it
            const copy = item.arrayBuffer.slice(0);
            const buffer = await ctx.decodeAudioData(copy);
            loaded.push({ id: item.id, name: item.name, buffer });
          } catch (err) {
            console.warn('Failed to decode saved audio:', err);
          }
        }
        resolve(loaded);
      };
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

// ── Shared Reactive State ─────────────────────────────────────────────────
const savedProfile = localStorage.getItem('dqc_sound_profile') || 'clicky';
const currentProfile = ref<string>(savedProfile);

const savedVolume = localStorage.getItem('dqc_sound_volume');
const volume = ref<number>(savedVolume !== null ? parseFloat(savedVolume) : 0.35);

const customSounds = ref<CustomSound[]>([]);
let isInitialized = false;

// ── Core Play Function ────────────────────────────────────────────────────
export function playClickSound() {
  const vol = volume.value;
  if (vol <= 0) return;

  const prof = currentProfile.value;
  if (prof.startsWith('__custom__')) {
    const cid = prof.slice('__custom__'.length);
    const s = customSounds.value.find((x) => x.id === cid);
    if (s) {
      playBuffer(s.buffer, vol);
      return;
    }
  }

  const profileObj = SOUND_PROFILES[prof];
  if (profileObj) {
    profileObj.play(vol);
  }
}

// ── Composable Hook ───────────────────────────────────────────────────────
export function useSound() {
  if (!isInitialized && typeof window !== 'undefined') {
    isInitialized = true;
    loadCustomSoundsFromDb().then((sounds) => {
      customSounds.value = sounds;
      // If current profile was custom but missing, reset to clicky
      if (currentProfile.value.startsWith('__custom__')) {
        const cid = currentProfile.value.slice('__custom__'.length);
        if (!sounds.some((s) => s.id === cid)) {
          setProfile('clicky');
        }
      }
    });

    // Attach global click listener on interactive elements
    const INTERACTIVE_SELECTOR = [
      'button',
      'a',
      'input',
      '[role="button"]',
      '.cursor-pointer',
      '.sound-card',
      'select',
      '.nav-item',
      '.tb-btn',
      '.btn',
    ].join(',');

    window.addEventListener(
      'click',
      (e) => {
        const target = e.target as HTMLElement | null;
        if (target && target.closest(INTERACTIVE_SELECTOR)) {
          playClickSound();
        }
      },
      true
    );
  }

  function setProfile(newProfile: string) {
    currentProfile.value = newProfile;
    localStorage.setItem('dqc_sound_profile', newProfile);
  }

  function setVolume(newVol: number) {
    const clamped = Math.max(0, Math.min(1, newVol));
    volume.value = clamped;
    localStorage.setItem('dqc_sound_volume', String(clamped));
  }

  function previewSound(profileId: string) {
    const prof = SOUND_PROFILES[profileId];
    if (prof) {
      prof.play(volume.value);
    }
  }

  function previewCustom(soundId: string) {
    const s = customSounds.value.find((x) => x.id === soundId);
    if (s) {
      playBuffer(s.buffer, volume.value);
    }
  }

  async function uploadCustomSound(file: File): Promise<boolean> {
    try {
      const name = file.name.replace(/\.[^/.]+$/, '');
      const arrayBuffer = await file.arrayBuffer();
      const ctx = getAudioContext();
      const buffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
      const id = 'c_' + Date.now();

      await saveCustomSoundToDb(id, name, arrayBuffer);
      customSounds.value.push({ id, name, buffer });
      setProfile('__custom__' + id);
      playBuffer(buffer, volume.value);
      return true;
    } catch (err) {
      console.error('Failed to decode uploaded audio:', err);
      return false;
    }
  }

  async function deleteCustomSound(soundId: string) {
    const idx = customSounds.value.findIndex((s) => s.id === soundId);
    if (idx !== -1) {
      customSounds.value.splice(idx, 1);
      await removeCustomSoundFromDb(soundId);
      if (currentProfile.value === '__custom__' + soundId) {
        setProfile('clicky');
      }
    }
  }

  return {
    currentProfile,
    volume,
    customSounds,
    SOUND_PROFILES,
    setProfile,
    setVolume,
    previewSound,
    previewCustom,
    uploadCustomSound,
    deleteCustomSound,
    playClickSound,
  };
}
