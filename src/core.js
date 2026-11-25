/*
 * AO trailer — core: math, easing, percussive envelopes, deterministic shake,
 * seeded PRNG, beat-map helpers and the 13-cut timing table snapped to the song.
 * Everything is a pure function of time t (seconds) — no accumulated state.
 */
(function () {
  'use strict';
  const AO = (window.AO = window.AO || {});

  // ---------------------------------------------------------------- math
  const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const invLerp = (a, b, v) => (a === b ? 0 : clamp((v - a) / (b - a)));
  const smoothstep = (a, b, v) => {
    const t = invLerp(a, b, v);
    return t * t * (3 - 2 * t);
  };
  const smoother = (t) => {
    t = clamp(t);
    return t * t * t * (t * (t * 6 - 15) + 10);
  };
  const DEG = Math.PI / 180;

  // ---------------------------------------------------------------- easing
  const E = {
    linear: (t) => clamp(t),
    outCubic: (t) => 1 - Math.pow(1 - clamp(t), 3),
    inCubic: (t) => Math.pow(clamp(t), 3),
    inOutCubic: (t) => {
      t = clamp(t);
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    },
    outQuint: (t) => 1 - Math.pow(1 - clamp(t), 5),
    inQuint: (t) => Math.pow(clamp(t), 5),
    inOutQuart: (t) => {
      t = clamp(t);
      return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
    },
    outExpo: (t) => {
      t = clamp(t);
      return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    },
    inExpo: (t) => {
      t = clamp(t);
      return t === 0 ? 0 : Math.pow(2, 10 * (t - 1));
    },
    inOutExpo: (t) => {
      t = clamp(t);
      if (t === 0 || t === 1) return t;
      return t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2;
    },
    outBack: (t, s = 1.70158) => {
      t = clamp(t);
      const c3 = s + 1;
      return 1 + c3 * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2);
    },
    outElastic: (t, freq = 10, decay = 6.5) => {
      t = clamp(t);
      if (t === 0 || t === 1) return t;
      return 1 - Math.exp(-decay * t) * Math.cos(freq * t * Math.PI * 0.5);
    },
  };

  // Ease applied over an absolute time window [a,b].
  const win = (ease, a, b, t) => ease(invLerp(a, b, t));

  // ---------------------------------------------------------------- envelopes
  // Sharp percussive spike at eventTime decaying exponentially.
  function impactPulse(t, e, decay = 0.14) {
    const dt = t - e;
    if (dt < 0 || dt > decay * 4) return 0;
    return Math.exp(-dt / Math.max(0.001, decay * 0.35));
  }
  // Damped spring impulse response (rebounds).
  function dampedSpring(dt, w = 28, z = 6.5) {
    if (dt <= 0) return 0;
    return Math.exp(-z * dt) * Math.sin(w * dt);
  }
  // Seeded PRNG (Mulberry32) — never Math.random.
  function prng(seed = 1337) {
    let a = seed >>> 0;
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const hash = (n) => {
    const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return s - Math.floor(s);
  };
  // Incommensurate sines → organic yet scrub-deterministic shake.
  function shake(t, amt, freq = 62) {
    if (amt <= 0.0001) return { x: 0, y: 0, r: 0 };
    return {
      x: Math.sin(t * freq * 1.13 + 0.7) * Math.cos(t * freq * 0.57 + 1.9) * amt,
      y: Math.cos(t * freq * 1.37 + 2.3) * Math.sin(t * freq * 0.71 + 0.4) * amt,
      r: Math.sin(t * freq * 0.89 + 4.1) * amt * 0.65,
    };
  }

  // ---------------------------------------------------------------- beat map
  const BM = window.BEATMAP;
  const B = BM.beats;
  const b = (i) => B[Math.max(0, Math.min(B.length - 1, i))];
  const DURATION = BM.duration;

  function lastIndexLE(list, t, key) {
    let lo = 0,
      hi = list.length - 1,
      ans = -1;
    while (lo <= hi) {
      const m = (lo + hi) >> 1;
      const v = key ? list[m][0] : list[m];
      if (v <= t) {
        ans = m;
        lo = m + 1;
      } else hi = m - 1;
    }
    return ans;
  }
  // Pulse from the most recent beat.
  function beatPulse(t, decay = 0.12) {
    const i = lastIndexLE(B, t);
    return i < 0 ? 0 : impactPulse(t, B[i], decay);
  }
  // Pulse from most recent detected onset whose strength >= minS (scaled by strength).
  function onsetPulse(t, minS = 0.2, decay = 0.1) {
    const O = BM.onsets;
    let i = lastIndexLE(O, t, true);
    while (i >= 0 && O[i][1] < minS) i--;
    return i < 0 ? 0 : impactPulse(t, O[i][0], decay) * Math.min(1, O[i][1] * 1.6);
  }
  function hatPulse(t, decay = 0.05) {
    const i = lastIndexLE(BM.hats, t, true);
    return i < 0 ? 0 : impactPulse(t, BM.hats[i][0], decay);
  }
  function curveAt(arr, t) {
    const f = clamp(t * BM.envFps, 0, arr.length - 1);
    const i = Math.floor(f);
    const j = Math.min(arr.length - 1, i + 1);
    return lerp(arr[i], arr[j], f - i);
  }
  const energyAt = (t) => curveAt(BM.energy, t);
  const lowAt = (t) => curveAt(BM.low, t);
  const beatIndex = (t) => lastIndexLE(B, t);

  // ---------------------------------------------------------------- cut table
  // Boundaries snapped to detected beats of the song (172 BPM):
  //  intro 0–3.4 · breakdown 3.5–6.0 · riser 6.0–7.5 · DROP 7.53 · peak ~10.5 · outro fade 15.5–17.2
  const edges = [0, b(4), b(8), b(11), b(16), b(18), b(20), b(22), b(26), b(29), b(32), b(36), b(44), DURATION];
  const NAMES = [
    'IMPACT REVEAL', 'OPTIC PORTHOLE', 'AO SLIDE', 'FULL SPEED', 'NO BRAKES', 'JUMP VAULT', 'GHOST FLIP',
    'TYPE BARRAGE', 'TARGET LOCK', 'GLASS SHATTER', 'POSTER MONTAGE', 'HERO SHOCKWAVE', 'AO IDENTITY',
  ];
  const CUTS = NAMES.map((name, i) => ({ id: i + 1, name, start: edges[i], end: edges[i + 1] }));
  function cutAt(t) {
    for (let i = CUTS.length - 1; i >= 0; i--) if (t >= CUTS[i].start) return CUTS[i];
    return CUTS[0];
  }

  Object.assign(AO, {
    clamp, lerp, invLerp, smoothstep, smoother, DEG, E, win,
    impactPulse, dampedSpring, prng, hash, shake,
    BM, B, b, DURATION, beatPulse, onsetPulse, hatPulse, energyAt, lowAt, beatIndex,
    CUTS, cutAt,
    W: 1920, H: 1080,
    COL: {
      ice: '#7EE8FA', iceSoft: '#BFF3FF', cobalt: '#0047FF', cobaltDeep: '#0026A8',
      white: '#F5F8FC', paper: '#FFFFFF', silver: '#A7B2C3', black: '#05070B', ink: '#0B1226',
    },
  });
})();
